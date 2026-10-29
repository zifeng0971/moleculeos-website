export const SITE_CONFIG = {
  name: 'MoleculeOS',
  platformUrl: 'https://mos.moleculemind.com/',
  companyUrl: 'https://moleculemind.com/',
  nav: [
    { key: 'validation', href: '/validation' },
    { key: 'pricing', href: '/pricing' },
    { key: 'platform', href: '/platform' },
    { key: 'docs', href: '/help' },
    { key: 'community', href: '/community' },
  ],
  platformMenu: {
    tasks: [
      ['structurePrediction', 'structure-prediction'],
      ['affinityOptimization', 'affinity-optimization'],
      ['stabilityEngineering', 'stability-engineering'],
      ['deNovoDesign', 'de-novo-design'],
    ],
    models: [['mmfold', 'mmfold'], ['mmdesign', 'mmdesign'], ['moleculeos', 'models']],
  },
  footer: {
    product: [['platformModels', '/platform'], ['pricing', '/pricing']],
    resources: [['manual', '/help/manual'], ['blog', '/community'], ['academic', '/community#academic']],
    company: [['about', 'https://moleculemind.com/'], ['careers', 'https://moleculemind.com/about-us/careers'], ['contact', '/contact']],
    legal: [
      ['privacy', 'https://mos.moleculemind.com/legal/privacy?audience=enterprise&lang={lang}'],
      ['terms', 'https://mos.moleculemind.com/legal/terms?audience=enterprise&lang={lang}'],
    ],
  },
} as const;

export type PlatformSlug = (typeof SITE_CONFIG.platformMenu.tasks)[number][1];

export type Locale = 'zh' | 'en';

export function localizeHref(href: string, locale: Locale) {
  if (href.startsWith('http')) return href;
  return locale === 'en' ? `/en${href}` : href;
}
