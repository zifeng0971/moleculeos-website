import type {Metadata} from 'next';
export const metadata:Metadata={title:'MoleculeOS User Guide',description:'Learn to use MoleculeOS with step-by-step instructions and operation videos.'};
import { ManualIndex } from '@/components/docs/manual-article';
export default function Page(){return <ManualIndex locale="en"/>}
