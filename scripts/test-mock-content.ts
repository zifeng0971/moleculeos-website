import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { mockContent, presentationMessages } from '../lib/mock-content';
import zh from '../messages/zh.json';
import en from '../messages/en.json';

const verified = '在 12 个靶点上，每个靶点仅测试不超过 50 个候选分子的低通量条件下，靶点成功率超过 90%';
assert.equal(mockContent.validation.headline.text, verified);
assert.equal(mockContent.validation.headline.isReal, true);
assert.deepEqual(mockContent.trust.items.map(item => item.value), ['12', '90%+', '37']);
assert.deepEqual(mockContent.trust.items.map(item => item.isReal), [true, true, false]);
assert.equal(mockContent.validation.cases.length, 6);
assert.equal(mockContent.pricing.plans.length, 3);
assert.equal(mockContent.pricing.creditTable.length, 6);
assert.equal(mockContent.models.models.length, 3);
assert.deepEqual(mockContent.capabilities.tasks.map(task => task.id), ['affinity', 'stability', 'denovo', 'structure']);
for (const filename of fs.readdirSync('content/mock').filter(name => name.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join('content/mock', filename), 'utf8'));
  assert.equal(data._demo, true, filename);
  assert.equal(data._note, '演示数据,上线前必须替换', filename);
}
for (const locale of ['zh', 'en'] as const) {
  const messages = presentationMessages(locale === 'zh' ? zh : en, locale);
  assert(!JSON.stringify(messages).includes('{{TODO'), locale);
  assert.equal(messages.home.validation.cases.length, 6);
  assert.equal(messages.pricingPage.rows.length, 6);
  const translated = en.mockContent;
  assert.deepEqual(translated.capabilities.tasks.map(item => item.media), mockContent.capabilities.tasks.map(item => item.media));
  assert.deepEqual(translated.trust.items.map(item => item.value), mockContent.trust.items.map(item => item.value));
}
console.log('Mock content: metadata, verified conditions, localization and 4/6/3 task/case/plan counts passed.');
