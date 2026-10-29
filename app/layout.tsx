import type { Metadata } from 'next';
import './globals.css';
import './visual.css';
import './calm.css';

export const metadata: Metadata = {
  title: { default: 'MoleculeOS — 分子之心蛋白质设计平台', template: '%s | MoleculeOS' },
  description: '结构预测、亲和力优化、稳定性改造、从头设计，都在同一个工作台里完成。MoleculeOS 帮你挑出下一轮值得测的候选，并写清楚为什么。',
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
