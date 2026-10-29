import type { Locale } from './site-config';

export interface ManualAnchor { id: string; title: string; level: number }
export interface ManualAsset {
  filteredReason?: string;
  id: string; type: 'image' | 'video' | 'external-video' | 'missing-video';
  src: string; original?: string; webm?: string; mp4?: string; poster?: string;
  originalFilename?: string; frames?: number; duration?: number; originalBytes?: number; convertedBytes?: number; md5?: string; fallbackReason?: string;
  originalWidth?: number; originalHeight?: number; convertedWidth?: number; convertedHeight?: number;
  width?: number; height?: number; paragraph: number; context: string;
  pageId?: string; groupSlug?: string; caption?: string;
  occurrences?: number[];
  references?: {pageId?:string;groupSlug:string;context:string}[];
}
export interface ManualPage {
  id: string; title: string; groupTitle: string; groupSlug: string; slug: string;
  file: string; href: string; order: number; anchors: ManualAnchor[];
  assets: string[]; counterpart?: string; text: string;
  bookmarks?: string[];
}
export interface ManualGroup {
  title: string; slug: string; overviewFile: string; overviewAnchors: ManualAnchor[];
  assets: string[]; pages: ManualPage[]; text?: string; bookmarks?: string[];
}
export interface ManualManifest {
  version: number; languages: Record<Locale, { source: string; title: string; groups: ManualGroup[]; assets: ManualAsset[]; pageCount: number }>;
  warnings: string[];
}

export type ManualNavigationPage = Pick<ManualPage,'id'|'title'|'href'|'groupSlug'|'anchors'|'counterpart'>;
export type ManualNavigationGroup = Pick<ManualGroup,'title'|'slug'|'overviewAnchors'> & {pages:ManualNavigationPage[]};
export interface ManualNavigation {
  languages: Record<Locale,{groups:ManualNavigationGroup[];anchorCounterparts:Record<string,string>}>;
}
