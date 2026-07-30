import React from 'react';
import { HarvardTemplate } from './HarvardTemplate';
import { JakesTemplate } from './JakesTemplate';
import { StanfordTemplate } from './StanfordTemplate';
import { MicrosoftTemplate } from './MicrosoftTemplate';
import { ReactiveTemplate } from './ReactiveTemplate';
import { NovoresumeTemplate } from './NovoresumeTemplate';
import { FlowCVTemplate } from './FlowCVTemplate';
import { IndeedTemplate } from './IndeedTemplate';

export const TemplateRegistry: Record<string, React.FC<any>> = {
  harvard: HarvardTemplate,
  jakes: JakesTemplate,
  stanford: StanfordTemplate,
  microsoft: MicrosoftTemplate,
  reactive: ReactiveTemplate,
  novoresume: NovoresumeTemplate,
  flowcv: FlowCVTemplate,
  indeed: IndeedTemplate,
};

export const templateMetadata = [
  { id: 'harvard', name: 'Harvard ATS', audience: 'Academic, Finance, Consulting', popular: true },
  { id: 'jakes', name: "Jake's Resume", audience: 'Tech, Software Engineering', popular: true },
  { id: 'stanford', name: 'Stanford Resume', audience: 'Academic, Research, Science', popular: false },
  { id: 'microsoft', name: 'Microsoft ATS', audience: 'Corporate, Operations, HR', popular: false },
  { id: 'reactive', name: 'Reactive Resume', audience: 'Design, Product, Startup', popular: true },
  { id: 'novoresume', name: 'Novoresume ATS', audience: 'Entry Level, Professional', popular: false },
  { id: 'flowcv', name: 'FlowCV ATS', audience: 'Modern Creative, Geometric', popular: true },
  { id: 'indeed', name: 'Indeed ATS', audience: 'High Density, Quick Applications', popular: false },
];
