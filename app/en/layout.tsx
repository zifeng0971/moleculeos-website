import { SiteShell } from '@/components/layout/site-shell';

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <div lang="en"><SiteShell locale="en">{children}</SiteShell></div>;
}
