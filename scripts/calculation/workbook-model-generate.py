"""Offline compiler: extract only calculation rules, never ship the source workbook.

Uses Python's standard library. Run from web with the audited workbook in its parent.
The generated JavaScript has no spreadsheet dependency or runtime formula parser.
"""
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
q = lambda x: json.dumps(x, ensure_ascii=False, separators=(',', ':'))

def colnum(s):
    n = 0
    for c in s: n = n * 26 + ord(c) - 64
    return n

def colname(n):
    s = ''
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s

def translate(formula, source, target):
    a = re.fullmatch(r'([A-Z]+)(\d+)', source)
    b = re.fullmatch(r'([A-Z]+)(\d+)', target)
    dc, dr = colnum(b[1]) - colnum(a[1]), int(b[2]) - int(a[2])
    def move(m):
        return (m[1] + (m[2] if m[1] else colname(colnum(m[2]) + dc))
                + m[3] + (m[4] if m[3] else str(int(m[4]) + dr)))
    # References never occur inside string literals in the audited formulas.
    return re.sub(r'(\$?)([A-Z]{1,3})(\$?)(\d+)', move, formula)

def read_source():
    result = {}
    with zipfile.ZipFile(ROOT.parent / '动态成本分析模型.xlsx') as z:
        strings = [''.join(x.itertext()) for x in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        sheets = ET.fromstring(z.read('xl/workbook.xml')).find('s:sheets', NS)
        for index, sheet in enumerate(sheets, 1):
            name = sheet.attrib['name']
            shared = {}
            cells = ET.fromstring(z.read(f'xl/worksheets/sheet{index}.xml')).findall('.//s:c', NS)
            for c in cells:
                f = c.find('s:f', NS)
                if f is not None and f.text and f.attrib.get('t') == 'shared':
                    shared[f.attrib['si']] = (c.attrib['r'], f.text)
            for c in cells:
                address = c.attrib['r']; v = c.find('s:v', NS); f = c.find('s:f', NS)
                value = None
                if v is not None and v.text:
                    value = strings[int(v.text)] if c.attrib.get('t') == 's' else v.text if c.attrib.get('t') == 'str' else float(v.text)
                formula = None
                if f is not None:
                    formula = f.text
                    if not formula:
                        origin, formula = shared[f.attrib['si']]
                        formula = translate(formula, origin, address)
                result[name + '!' + address] = {'value': value, 'formula': formula}
    return result

cells = read_source()
for cell in cells.values():
    if cell['formula']:
        cell['formula'] = re.sub(r'(\d+(?:\.\d+)?)%', lambda m: str(float(m[1])/100), cell['formula'])
def val(sheet, cell): return cells.get(sheet + '!' + cell, {}).get('value')
PRICE_SHEET = '分级单价保洁、绿化 '
locations = {}
for key in cells:
    m = re.fullmatch(re.escape(PRICE_SHEET) + r'!B(\d+)', key)
    if not m or cells[key]['value'] != '广东': continue
    row = m[1]; city = val(PRICE_SHEET, 'C' + row); district = val(PRICE_SHEET, 'D' + row)
    grade = {'紫荆花':'A','金百合':'B','郁金香':'C','向日葵':'D'}.get(val(PRICE_SHEET, 'E'+row))
    if not grade: continue
    item = locations.setdefault((city, district), {'region':'广东', 'city':city, 'district':district, 'cleaningMonthly':{}, 'greeningMonthly':{}})
    item['cleaningMonthly'][grade] = val(PRICE_SHEET, 'G'+row)
    item['greeningMonthly'][grade] = val(PRICE_SHEET, 'Q'+row)
locations = list(locations.values())

# A small, audited expression compiler. It fails closed on unsupported syntax.
TOKEN = re.compile(r'\s*("(?:[^"]|"")*"|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|(?:\'[^\']+\'|[^\s()+*/^&=<>!,:]+)!\$?[A-Z]+\$?\d*(?::\$?[A-Z]+\$?\d*)?|\$?[A-Z]+\$?\d+(?::\$?[A-Z]+\$?\d+)?|[A-Z]+\(|TRUE|FALSE|<>|<=|>=|[-+*/^&=<>(),])')
PRECEDENCE = {'=':1,'<>':1,'<':1,'>':1,'<=':1,'>=':1,'&':2,'+':3,'-':3,'*':4,'/':4,'^':5}
dependencies = {}

class Parser:
    def __init__(self, formula, sheet, key):
        self.tokens = []; self.i = 0; self.sheet = sheet; self.key = key
        position = 0
        while position < len(formula):
            m = TOKEN.match(formula, position)
            if not m: raise ValueError((key, formula[position:], formula))
            self.tokens.append(m[1]); position = m.end()
    def take(self):
        token = self.tokens[self.i]; self.i += 1; return token
    def peek(self): return self.tokens[self.i] if self.i < len(self.tokens) else None
    def expr(self, minimum=0):
        token = self.take()
        if token in ('+', '-'):
            left = '('+token+'n('+self.expr(6)+'))'
        elif token == '(':
            left = self.expr(); assert self.take() == ')'
        elif token.endswith('('):
            name = token[:-1]; args = []
            while self.peek() != ')':
                args.append(self.expr())
                if self.peek() != ',': break
                self.take()
            assert self.take() == ')'
            if name == 'IF': left = '('+args[0]+'?'+args[1]+':'+args[2]+')'
            elif name == 'SUM': left = 'sum(['+','.join(args)+'])'
            elif name == 'SUBTOTAL':
                assert args[0] == '9'; left = 'sum(['+','.join(args[1:])+'])'
            elif name == 'ROUNDUP': left = 'roundup('+','.join(args)+')'
            else: raise ValueError(('unsupported function', name, self.key))
        elif token.startswith('"'): left = q(token[1:-1].replace('""','"'))
        elif token in ('TRUE','FALSE'): left = token.lower()
        elif re.match(r'^\d|^\.\d', token): left = token
        else:
            sheet, address = token.rsplit('!', 1) if '!' in token else (self.sheet, token)
            sheet = sheet.strip("'"); address = address.replace('$', '')
            refs = [address]
            if ':' in address:
                a,b = address.split(':'); ma = re.fullmatch(r'([A-Z]+)(\d+)',a); mb = re.fullmatch(r'([A-Z]+)(\d+)',b)
                if not ma or not mb: raise ValueError(('unbounded range', token))
                refs = [colname(col)+str(row) for row in range(int(ma[2]),int(mb[2])+1) for col in range(colnum(ma[1]),colnum(mb[1])+1)]
            keys = [sheet+'!'+ref for ref in refs]
            dependencies.setdefault(self.key,set()).update(keys)
            left = 'r('+q(keys[0])+')' if len(keys)==1 else '['+','.join('r('+q(k)+')' for k in keys)+']'
        while self.peek() in PRECEDENCE and PRECEDENCE[self.peek()] >= minimum:
            op = self.take(); right = self.expr(PRECEDENCE[op]+1)
            if op == '=': left = 'eq('+left+','+right+')'
            elif op == '<>': left = '!eq('+left+','+right+')'
            elif op == '&': left = '(String('+left+'??"")+String('+right+'??""))'
            elif op in ('<','>','<=','>='): left = '(n('+left+')'+op+'n('+right+'))'
            else: left = '(n('+left+')'+('**' if op=='^' else op)+'n('+right+'))'
        return left

inputs = []
def add(sheet, address, label, unit='', group=None, **extra):
    inputs.append({'key':sheet+'!'+address,'label':label,'unit':unit,'group':group or sheet,'type':'number','min':0,**extra})
for row in range(4,8):
    name = val('管理模块',f'A{row}')
    for col,label,unit in [('B','月工资福利','元/月'),('C','基础配置人数','人'),('D','增加人数','人')]: add('管理模块',f'{col}{row}',name+' · '+label,unit)
for row in range(4,11):
    name = val('客助',f'A{row}')
    if row < 9: add('客助',f'C{row}',name+' · 点位/面积','平方米' if row==8 else '个')
    add('客助',f'N{row}',name+' · 配置标准','平方米/人' if row==8 else '人/替班' if row==9 else '人/班长' if row==10 else '人/岗', exclusiveMin=row>=8)
add('客助','P12','客助人员月工资福利','元/月')
for sheet, last, cols in [
    ('服务',21,[('E','标准工时','小时'),('F','在途工时','小时'),('P','年作业频次','次/年')]),
    ('清洁',52,[('E','作业数量',None),('F','测算工时基数','小时'),('G','标准工时','小时'),('I','在途工时','小时'),('X','年作业频次','次/年')]),
    ('绿化',55,[('C','作业数量',None),('D','测算工时基数','小时'),('E','标准工时','分钟'),('G','在途工时','分钟'),('U','年作业频次','次/年')]),
    ('工程委外',99,[('D','作业数量',None),('E','标准工时','小时'),('G','在途工时','小时'),('L','每周期次数','次'),('M','年周期数','周期/年'),('P','人员月工资','元/月')]),
    ('工程常规',232,[('D','作业数量',None),('E','标准工时','小时'),('G','在途工时','小时'),('L','每周期次数','次'),('M','年周期数','周期/年')]),
    ('四害消杀',5,[('C','消杀总面积','平方米'),('D','标准工时','小时'),('F','在途工时','小时'),('K','年作业频次','次/年')]),
]:
    for row in range(5,last+1):
        name = val(sheet,('C' if sheet=='清洁' else 'A')+str(row)) or sheet
        if sheet=='清洁':
            # Repeated action names need their carried surface/location context.
            surface = next((val(sheet,'A'+str(r)) for r in range(row,4,-1) if val(sheet,'A'+str(r))), '')
            location = next((val(sheet,'B'+str(r)) for r in range(row,4,-1) if val(sheet,'B'+str(r))), '')
            name = surface+' / '+location+' / '+name
        for col,label,unit in cols:
            unit = unit if unit is not None else val(sheet,('D' if sheet=='清洁' else 'B' if sheet=='绿化' else 'C')+str(row)) or '个'
            add(sheet,f'{col}{row}',name+' · '+label,unit)
for sheet,address,label,unit in [('服务','T23','管家工时单价','元/小时'),('清洁','Z3','清洁人员工日单价','元/日'),('绿化','W3','绿化人员工日单价','元/日'),('四害消杀','O17','消杀工日单价（含药物）','元/日'),('工程委外','T105','工程委外预算月工资','元/月'),('工程常规','P3','工程常规人员月工资','元/月')]:
    add(sheet,address,label,unit,exclusiveMin=sheet in ('清洁','绿化','四害消杀','工程常规'))
add('服务','N8','邮包快递外卖代收','',type='select',options=['是','否'])

# Service probabilities are embedded literals; expose only the literals that multiply demand.
for row in range(5,22):
    key = f'服务!P{row}'; formula = cells[key]['formula']; count = [0]
    if not formula: continue
    def probability(m):
        count[0] += 1; address = f'P{row}.probability{count[0]}'
        value = float(m[1]); cells['服务!'+address] = {'value':value,'formula':None}
        add('服务',address,(val('服务',f'A{row}') or '')+f' · 发生系数{count[0]}','次/户·年')
        return '*PROB'+str(count[0])+'X'
    replaced = re.sub(r'\*([0-9]+(?:\.[0-9]+)?)(?![0-9.])',probability,formula)
    cells[key]['probabilities'] = count[0]
    cells[key]['formula'] = replaced

roots = set(i['key'] for i in inputs)
for sheet, ranges in {'总-汇总表':['B7','B8'],'服务':['T22','T26','T27'], '清洁':['AB56','AB58','AA60'],'绿化':['Z58','Z59','Z61'],'四害消杀':['O14','O18'],'工程委外':['T103','T104','T106'],'工程常规':['S236','S237','S239'],'客助':['P11','P13'],'管理模块':['E8','G8']}.items():
    roots.update(sheet+'!'+a for a in ranges)
for sheet,last,cols in [('服务',21,['G','M','P','Q','S','T']),('清洁',52,['E','K','V','X','Y','AA']),('绿化',55,['C','I','S','U','V','Y']),('工程委外',99,['D','I','K','N','O','S']),('工程常规',232,['D','I','K','N','O','R']),('四害消杀',5,['C','H','J','K','L','N']),('客助',10,['C','N','O','P'])]:
    roots.update(sheet+'!'+col+str(row) for row in range(4 if sheet=='客助' else 5,last+1) for col in cols)
roots.update('管理模块!'+col+str(row) for row in range(4,8) for col in ('B','C','D','E'))

compiled = {}; values = {}; visited = set()
def compile_key(key):
    if key in visited: return
    visited.add(key)
    cell = cells.get(key, {'value':None,'formula':None}); formula = cell['formula']
    if key in ('清洁!Z3','绿化!W3'):
        compiled[key] = 'price('+q('cleaning' if key.startswith('清洁') else 'greening')+')'; return
    if not formula:
        values[key] = cell['value']; return
    # Turn synthetic probability references into legal placeholder references before parsing.
    for i in range(1,cell.get('probabilities',0)+1):
        formula = formula.replace('PROB'+str(i)+'X', 'ZZ'+str(i))
    parser = Parser(formula,key.split('!')[0],key); expression = parser.expr()
    assert parser.i == len(parser.tokens), (key,formula,parser.tokens[parser.i:])
    for i in range(1,cell.get('probabilities',0)+1):
        placeholder = '服务!ZZ'+str(i); actual = key+'.probability'+str(i)
        expression = expression.replace(q(placeholder),q(actual)); dependencies[key].discard(placeholder); dependencies[key].add(actual)
    compiled[key] = expression
    for dependency in dependencies.get(key,[]): compile_key(dependency)
for key in sorted(roots): compile_key(key)
# Project-specific original physical data must never be retained as model defaults.
for key in values:
    if key.startswith('总-汇总表!'):
        values[key] = '否' if key=='总-汇总表!C12' else None
output = ROOT/'scripts/calculation/workbook-data.mjs'
output.write_text('// Generated offline from audited calculation rules; no workbook is needed at runtime.\n'
    +'export const GUANGDONG_LOCATIONS = '+q(locations)+';\n'
    +'export const INPUT_DEFINITIONS = '+q(inputs)+';\n'
    +'export const MODEL_DEFAULTS = '+q(dict(sorted(values.items())))+';\n'
    +'export function createModelRules({r,n,eq,sum,roundup,price}) { return {\n'
    +',\n'.join(q(key)+':()=>'+expression for key,expression in sorted(compiled.items()))
    +'\n}; }\n',encoding='utf-8')
(ROOT/'src/data/workbook-guangdong.json').write_text(json.dumps(locations,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(q({'formulas':len(compiled),'inputs':len(inputs),'defaults':len(values),'districts':len(locations),'unsupported':0}))
