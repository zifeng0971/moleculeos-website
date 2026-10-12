import type { Locale } from '@/lib/site-config';
import { HeroSection } from '@/components/sections/hero-section';
import { TrustSection } from '@/components/sections/trust-section';
import { TasksSection } from '@/components/sections/tasks-section';
import { ResultsSection } from '@/components/sections/results-section';
import { ModelStackSection } from '@/components/sections/model-stack-section';
import { FlywheelSection } from '@/components/sections/flywheel-section';
import { ValidationSection } from '@/components/sections/validation-section';
import { EnterpriseSection } from '@/components/sections/enterprise-section';
import { FinalCTASection } from '@/components/sections/final-cta-section';
import { HomePosition } from '@/components/layout/home-position';
import { availableCapabilityMedia } from '@/lib/capability-media';

// Narrative: product → explainable results → what it does → how it works → how it learns → cases → enterprise → evidence → act.
export function HomePage({ locale }: { locale: Locale }) {
  const sections = [
    <HeroSection key="hero" locale={locale}/>,
    <ResultsSection key="results" locale={locale}/>,
    <TasksSection key="tasks" locale={locale} availableMedia={availableCapabilityMedia()}/>,
    <ModelStackSection key="models" locale={locale}/>,
    <FlywheelSection key="flywheel"/>,
    <ValidationSection key="validation" locale={locale}/>,
    <EnterpriseSection key="enterprise" locale={locale}/>,
    <TrustSection key="evidence"/>,
    <FinalCTASection key="cta" locale={locale}/>,
  ];
  return <>{sections.map((section, i) => <div key={i} id={`home-section-${i}`} data-home-section={i}>{section}</div>)}<HomePosition/></>;
}
