import Link from 'next/link';
import Image from 'next/image';
import type { Locale } from '@/lib/site-config';

export function Logo({ locale, size = 'header', href }: { locale: Locale; size?: 'header' | 'footer'; href?: string }) {
  const markSize = size === 'header' ? 32 : 28;
  return (
    <Link href={href ?? (locale === 'en' ? '/en' : '/')} target={href?.startsWith('http') ? '_blank' : undefined} rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined} className="flex min-h-11 items-center gap-2.5" aria-label="MoleculeOS">
      {/* White negative space is baked into this approved dark-background asset. Never filter or recolor it. */}
      <Image src="/brand/logo-mark-dark-256.png" alt="MoleculeMind" width={markSize} height={markSize} priority={size === 'header'} className="shrink-0" />
      <span className="text-[19px] tracking-tight"><span className="font-normal">Molecule</span><span className="font-bold">OS</span></span>
    </Link>
  );
}
