export const SITE_CONFIG = {
  name: 'MoleculeOS',
  platformUrl: 'https://mos.moleculemind.com/',
  companyUrl: 'https://moleculemind.com/',
  nav: [
    { key: 'platform', href: '/platform' },
    { key: 'validation', href: '/validation' },
    { key: 'pricing', href: '/pricing' },
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
    models: [['neworigin', 'neworigin'], ['mmfold', 'mmfold'], ['mmdesign', 'mmdesign']],
  },
  footer: {
    product: [['models', '/platform#models'], ['validation', '/validation'], ['pricing', '/pricing'], ['platform', '/platform']],
    resources: [['manual', '/help/manual'], ['blog', '/community'], ['research', '/validation'], ['whitepaper', '/help'], ['forum', '/community#forum'], ['webinar', '/community#webinar'], ['academic', '/community#academic']],
    company: [['about', 'https://moleculemind.com/'], ['careers', '/community'], ['contact', '/contact']],
    legal: [['privacy', '/help'], ['terms', '/help'], ['security', '/help']],
  },
} as const;

export type PlatformSlug = (typeof SITE_CONFIG.platformMenu.tasks)[number][1];

export type Locale = 'zh' | 'en';

export function localizeHref(href: string, locale: Locale) {
  if (href.startsWith('http')) return href;
  return locale === 'en' ? `/en${href}` : href;
}
