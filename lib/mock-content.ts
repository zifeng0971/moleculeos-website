import trust from '@/content/mock/trust-bar.json';
import capabilities from '@/content/mock/capabilities.json';
import validation from '@/content/mock/validation.json';
import models from '@/content/mock/models.json';
import pricing from '@/content/mock/pricing.json';
import footer from '@/content/mock/footer.json';
import type { Locale } from './site-config';
import en from '@/messages/en.json';

export const mockContent = { trust, capabilities, validation, models, pricing, footer };
export type CapabilityTask = (typeof capabilities.tasks)[number];

export function getMockContent(locale: Locale): typeof mockContent {
  return locale === 'zh' ? mockContent : en.mockContent as typeof mockContent;
}

// The six JSON files are the Chinese source of truth. English wording lives in
// messages/en.json; keep translated business fields aligned when replacing data.
export function presentationMessages<T>(source: T, locale: Locale): T {
  const clean = presentationContent(source, locale) as T & typeof en & {
    home: { tasks: { selectorTasks: CapabilityTask[]; selectorDescription: string; mediaMissing: string }; models: { foundationLimitation: string } };
  };
  const data = getMockContent(locale);
  clean.home.tasks.selectorTasks = data.capabilities.tasks;
  clean.home.models.foundationLimitation = data.models.models[0].limitation;
  clean.home.models.items = clean.home.models.items.map((item, i) => ({ ...item, limitation: data.models.models[i + 1].limitation }));
  clean.home.validation.successCondition = data.validation.headline.text;
  clean.home.validation.cases = data.validation.cases.map(item => ({ title: item.category, background: '', strategy: '', challenge: item.difficulty, result: item.result, molecule: item.molecule, duration: item.cycle }));
  clean.pricingPage.plans = data.pricing.plans.map((plan, i) => ({ name: plan.name, price: plan.price, audience: plan.note, features: clean.pricingPage.plans[i].features }));
  clean.pricingPage.rows = data.pricing.creditTable.map(row => [row.task, row.credit, row.time]);
  clean.footer.filing = (locale === 'zh' ? '备案号：' : 'ICP: ') + data.footer.icp;
  return clean;
}

// Undetermined fields remain neutral empty states, never fabricated scientific values.
// Source TODOs stay in messages/content for the business replacement checklist.
export function presentationContent<T>(value: T, locale: Locale): T {
  if (typeof value === 'string') return value.replace(/\{\{TODO(?::[^}]+)?\}\}/g, locale === 'zh' ? '内容待补充' : 'Content coming soon') as T;
  if (Array.isArray(value)) return value.map(item => presentationContent(item, locale)) as T;
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, presentationContent(item, locale)])) as T;
  return value;
}
