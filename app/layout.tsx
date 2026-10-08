import type { Metadata } from 'next';
import './globals.css';
import './visual.css';

export const metadata: Metadata = {
  title: { default: 'MoleculeOS — 生命科学研发的操作系统', template: '%s | MoleculeOS' },
  description: '从药物设计到酶设计，MOS 把蛋白设计所需的模型、算力与数据整合进一个平台，为科研与产业团队提供完整的蛋白设计解决方案。',
  icons: {
    icon: [
      { url: '/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon-64.png', sizes: '64x64', type: 'image/png' },
    ],
    apple: '/brand/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
