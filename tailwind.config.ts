import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
    extend: {
      colors: {
        background: 'var(--bg-base)',
        foreground: 'var(--text-primary)',
        muted: 'var(--bg-elevated)',
        'muted-foreground': 'var(--text-secondary)',
        border: 'var(--glass-border)',
        brand: 'var(--accent-text)',
        'brand-foreground': 'var(--text-primary)',
        accent: 'var(--accent)',
        'accent-foreground': 'var(--text-primary)',
        surface: 'var(--bg-elevated)',
      },
      borderRadius: { lg: '0.75rem', md: '0.5rem', sm: '0.5rem' },
      boxShadow: { soft: '0 8px 32px rgba(0, 0, 0, 0.4)' },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'PingFang SC', 'Inter', 'Noto Sans SC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
