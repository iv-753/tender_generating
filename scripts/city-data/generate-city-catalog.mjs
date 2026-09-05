import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const revision = 'c49d495b40ac73eb1a66f6eeae5f8fd10696f035';

const HIGH = new Set(['北京市', '上海市', '广州市', '深圳市']);
const UPPER = new Set([
  '天津市', '重庆市', '杭州市', '南京市', '苏州市', '无锡市', '宁波市', '厦门市', '福州市', '青岛市',
  '济南市', '珠海市', '佛山市', '东莞市', '成都市', '武汉市', '长沙市', '郑州市', '西安市', '合肥市',
]);
const STANDARD = new Set([
  '石家庄市', '太原市', '呼和浩特市', '沈阳市', '大连市', '长春市', '哈尔滨市', '南昌市', '南宁市',
  '海口市', '三亚市', '贵阳市', '昆明市', '拉萨市', '兰州市', '西宁市', '银川市', '乌鲁木齐市',
  '常州市', '南通市', '扬州市', '镇江市', '泰州市', '嘉兴市', '湖州市', '绍兴市', '温州市', '金华市',
  '泉州市', '漳州市', '烟台市', '潍坊市', '威海市', '临沂市', '洛阳市', '宜昌市', '襄阳市',
  '株洲市', '岳阳市', '中山市', '惠州市', '江门市', '湛江市', '绵阳市', '德阳市', '宜宾市', '遵义市',
]);

const excludedCodes = new Set(['4190', '4290', '4690', '5002', '6590']);
const municipalityNames = new Map([
  ['1101', '北京市'], ['1201', '天津市'], ['3101', '上海市'], ['5001', '重庆市'],
]);

function bandFor(name) {
  if (HIGH.has(name)) return 'high';
  if (UPPER.has(name)) return 'upper';
  if (STANDARD.has(name)) return 'standard';
  return 'base';
}

const readSource = async (name) => JSON.parse(await readFile(new URL(`./source/${name}.json`, import.meta.url), 'utf8'));
const provinces = await readSource('provinces');
const rawCities = await readSource('cities');
const cities = rawCities
  .filter((city) => !excludedCodes.has(city.code))
  .map((city) => ({ ...city, name: municipalityNames.get(city.code) ?? city.name }))
  .map((city) => ({ code: city.code, name: city.name, recommendedBand: bandFor(city.name) }));

const catalog = {
  version: '2025-wage-2026-09',
  updatedAt: '2026-09-05',
  sources: [
    'https://www.stats.gov.cn/sj/zxfb/202605/t20260515_1963707.html',
    'https://www.stats.gov.cn/sj/zxfbhjd/202607/t20260715_1964129.html',
    `https://github.com/modood/Administrative-divisions-of-China/tree/${revision}`,
  ],
  provinces: provinces.map((province) => ({
    code: province.code,
    name: province.name,
    cities: cities.filter((city) => city.code.startsWith(province.code)),
  })),
};

const dataDirectory = fileURLToPath(new URL('../../src/data', import.meta.url));
const target = fileURLToPath(new URL('../../src/data/city-cost-bands.json', import.meta.url));
await mkdir(dataDirectory, { recursive: true });
await writeFile(target, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
console.log(`Wrote ${cities.length} city records to ${target}`);
