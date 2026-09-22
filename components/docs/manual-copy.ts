import zh from '@/messages/zh.json';
import en from '@/messages/en.json';
import type { Locale } from '@/lib/site-config';
export function getManualCopy(locale:Locale){return (locale==='zh'?zh:en).manualUI;}
