import { SiteShell } from '@/components/layout/site-shell';

export default function ZhLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell locale="zh">{children}</SiteShell>;
}
