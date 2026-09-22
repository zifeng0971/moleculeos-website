import type { Locale } from '@/lib/site-config';
import { HeroSection } from '@/components/sections/hero-section';
import { TasksSection } from '@/components/sections/tasks-section';
import { TrustSection } from '@/components/sections/trust-section';
import { ResultsSection } from '@/components/sections/results-section';
import { ModelBand } from '@/components/sections/model-band';
import { ValidationSection } from '@/components/sections/validation-section';
import { FinalCTASection } from '@/components/sections/final-cta-section';
import { HomePosition } from '@/components/layout/home-position';
import { availableCapabilityMedia } from '@/lib/capability-media';

export function HomePage({ locale }: { locale: Locale }) {
  const sections = [<HeroSection key="hero" locale={locale}/>, <ResultsSection key="results" locale={locale}/>, <TasksSection key="tasks" locale={locale} availableMedia={availableCapabilityMedia()}/>, <section key="models"><div className="site-container"><ModelBand locale={locale}/></div></section>, <ValidationSection key="validation" locale={locale}/>, <TrustSection key="trust"/>, <FinalCTASection key="cta" locale={locale}/>];
  return <>{sections.map((section, i) => <div key={i} id={`home-section-${i}`} data-home-section={i}>{section}</div>)}<HomePosition/></>;
}
