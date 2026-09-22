"""Offline audit source; the app never opens or requires the original workbook."""
import hashlib
import json
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT.parent / '珠江/珠江数据/分级标准（待完善）.xlsx'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

def column(value):
    result = 0
    for char in value:
        result = result * 26 + ord(char) - 64
    return result

def address(col, row):
    result = ''
    while col:
        col, rest = divmod(col - 1, 26)
        result = chr(65 + rest) + result
    return result + str(row)

cells, aliases = {}, {}
with zipfile.ZipFile(SOURCE) as archive:
    strings = [''.join(item.itertext()) for item in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
    for index, sheet in enumerate(ET.fromstring(archive.read('xl/workbook.xml')).find('s:sheets', NS), 1):
        name = sheet.attrib['name']
        if name == '案场':
            continue  # Sales-office services are outside residential operations.
        root = ET.fromstring(archive.read(f'xl/worksheets/sheet{index}.xml'))
        for item in root.findall('.//s:c', NS):
            value = item.find('s:v', NS)
            if value is not None and value.text:
                cells[name + '!' + item.attrib['r']] = strings[int(value.text)] if item.attrib.get('t') == 's' else value.text
        for merge in root.findall('.//s:mergeCell', NS):
            start, end = merge.attrib['ref'].split(':')
            left, top = re.fullmatch(r'([A-Z]+)(\d+)', start).groups()
            right, bottom = re.fullmatch(r'([A-Z]+)(\d+)', end).groups()
            # A blank outside a merge is NOT inherited from the preceding grade.
            for col in range(column(left), column(right) + 1):
                for row in range(int(top), int(bottom) + 1):
                    aliases[name + '!' + address(col, row)] = name + '!' + start

payload = {'file': SOURCE.name, 'sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(), 'cells': cells, 'aliases': aliases}
(ROOT / 'scripts/calculation/zhujiang-source.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Extracted {len(cells)} source cells, {len(aliases)} exact merged-cell references')
