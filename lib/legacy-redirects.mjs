// Hosting and development redirects; destinations preserve locale and section anchors.
export const legacyRedirects = [
  ...['', '/en'].flatMap(prefix => ['', '/manual', '/getting-started', '/faq', '/changelog', '/api'].map(suffix => ({source:prefix+'/docs'+suffix,destination:prefix+'/help'+suffix}))),
  {
    "source": "/platform/structure-prediction",
    "destination": "/platform#structure-prediction"
  },
  {
    "source": "/platform/affinity-optimization",
    "destination": "/platform#affinity-optimization"
  },
  {
    "source": "/platform/stability-engineering",
    "destination": "/platform#stability-engineering"
  },
  {
    "source": "/platform/de-novo-design",
    "destination": "/platform#de-novo-design"
  },
  {
    "source": "/models/mmfold",
    "destination": "/platform#mmfold"
  },
  {
    "source": "/models/mmdesign",
    "destination": "/platform#mmdesign"
  },
  {
    "source": "/models",
    "destination": "/platform#models"
  },
  {
    "source": "/en/platform/structure-prediction",
    "destination": "/en/platform#structure-prediction"
  },
  {
    "source": "/en/platform/affinity-optimization",
    "destination": "/en/platform#affinity-optimization"
  },
  {
    "source": "/en/platform/stability-engineering",
    "destination": "/en/platform#stability-engineering"
  },
  {
    "source": "/en/platform/de-novo-design",
    "destination": "/en/platform#de-novo-design"
  },
  {
    "source": "/en/models/mmfold",
    "destination": "/en/platform#mmfold"
  },
  {
    "source": "/en/models/mmdesign",
    "destination": "/en/platform#mmdesign"
  },
  {
    "source": "/en/models",
    "destination": "/en/platform#models"
  }
];
