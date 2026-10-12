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

// Narrative: product → evidence → what it does → why it is explainable → how it works → how it learns → proof → enterprise → act.
export function HomePage({ locale }: { locale: Locale }) {
  const sections = [
    <HeroSection key="hero" locale={locale}/>,
    <TrustSection key="evidence"/>,
    <TasksSection key="tasks" locale={locale} availableMedia={availableCapabilityMedia()}/>,
    <ResultsSection key="results" locale={locale}/>,
    <ModelStackSection key="models" locale={locale}/>,
    <FlywheelSection key="flywheel"/>,
    <ValidationSection key="validation" locale={locale}/>,
    <EnterpriseSection key="enterprise" locale={locale}/>,
    <FinalCTASection key="cta" locale={locale}/>,
  ];
  return <>{sections.map((section, i) => <div key={i} id={`home-section-${i}`} data-home-section={i}>{section}</div>)}<HomePosition/></>;
}
