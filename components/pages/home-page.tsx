import type { Locale } from '@/lib/site-config';
import { HeroSection } from '@/components/sections/hero-section';
import { TrustSection } from '@/components/sections/trust-section';
import { OneProteinSection } from '@/components/sections/one-protein-section';
import { ModelStackSection } from '@/components/sections/model-stack-section';
import { ValidationSection } from '@/components/sections/validation-section';
import { EnterpriseSection } from '@/components/sections/enterprise-section';
import { FinalCTASection } from '@/components/sections/final-cta-section';
import { HomePosition } from '@/components/layout/home-position';

// The data flywheel section is parked (FlywheelSection stays in components/sections); re-add it between the models and the cases to bring it back.
// Narrative: product → what it does, with explainable results as the closing frame → how it works → how it learns → cases → enterprise → evidence → act.
export function HomePage({ locale }: { locale: Locale }) {
  const sections = [
    <HeroSection key="hero" locale={locale}/>,
    <OneProteinSection key="capabilities" locale={locale}/>,
    <ModelStackSection key="models" locale={locale}/>,
    <ValidationSection key="validation" locale={locale}/>,
    <EnterpriseSection key="enterprise" locale={locale}/>,
    <TrustSection key="evidence"/>,
    <FinalCTASection key="cta" locale={locale}/>,
  ];
  return <>{sections.map((section, i) => <div key={i} id={`home-section-${i}`} data-home-section={i}>{section}</div>)}<HomePosition/></>;
}
