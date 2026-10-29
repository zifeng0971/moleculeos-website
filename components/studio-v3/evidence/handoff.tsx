'use client';
// PLACEHOLDER (owner: C).
import type { Candidate } from '../contracts';
import type { FtoVerdict } from './types';
export interface HandoffData { goal: string; candidates: Candidate[]; ledgerVersion: string; demoItems: string[]; fto: FtoVerdict[]; realOnly: boolean }
export function buildHandoff(_data: HandoffData): string { return ''; }
export function HandoffDoc(_props: { data: HandoffData }) { return null; }
