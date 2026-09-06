import React from 'react';
import { HarvardTemplate } from './HarvardTemplate';
import { ClassicSerifTemplate } from './ClassicSerifTemplate';
import { JakesTemplate } from './JakesTemplate';
import { StanfordTemplate } from './StanfordTemplate';
import { MicrosoftTemplate } from './MicrosoftTemplate';
import { ReactiveTemplate } from './ReactiveTemplate';
import { NovoresumeTemplate } from './NovoresumeTemplate';
import { FlowCVTemplate } from './FlowCVTemplate';
import { IndeedTemplate } from './IndeedTemplate';
import { MinimalistModernTemplate } from './MinimalistModernTemplate';

export const TemplateRegistry: Record<string, React.FC<any>> = {
  harvard: HarvardTemplate,
  jakes: JakesTemplate,
  stanford: StanfordTemplate,
  microsoft: MicrosoftTemplate,
  reactive: ReactiveTemplate,
  novoresume: NovoresumeTemplate,
  flowcv: FlowCVTemplate,
  indeed: IndeedTemplate,
  'minimalist-modern': MinimalistModernTemplate,
  ats_classic: ClassicSerifTemplate,
  ats_dynamic: HarvardTemplate,
};

export const templateMetadata = [
  { id: 'harvard', name: 'Harvard Classic', audience: 'All Candidates, 100% ATS Compliant', popular: true },
  { id: 'jakes', name: 'Jake\'s Resume', audience: 'Software Engineers, Tech, New Grads', popular: true },
  { id: 'stanford', name: 'Stanford Academic', audience: 'Researchers, Grad Students, Academics', popular: false },
  { id: 'microsoft', name: 'Microsoft Standard', audience: 'Corporate, Engineering, Management', popular: true },
  { id: 'reactive', name: 'Reactive Modern', audience: 'Developers, Tech Professionals', popular: false },
  { id: 'novoresume', name: 'Novo Professional', audience: 'Early Career, Mid-Level Professionals', popular: true },
  { id: 'flowcv', name: 'Flow Clean', audience: 'Minimalist, Multi-Industry Format', popular: false },
  { id: 'indeed', name: 'Indeed Direct', audience: 'Fast Review, Universal ATS Format', popular: false },
  { id: 'minimalist-modern', name: 'Minimalist Modern', audience: 'Clean Structured Layout', popular: false },
  { id: 'ats_classic', name: 'Classic Serif', audience: 'Traditional & Executive Roles', popular: false },
];
