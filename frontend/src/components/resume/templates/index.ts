import React from 'react';
import { ClassicSerifTemplate } from './ClassicSerifTemplate';

export const TemplateRegistry: Record<string, React.FC<any>> = {
  harvard: ClassicSerifTemplate,
  jakes: ClassicSerifTemplate,
  stanford: ClassicSerifTemplate,
  microsoft: ClassicSerifTemplate,
  reactive: ClassicSerifTemplate,
  novoresume: ClassicSerifTemplate,
  flowcv: ClassicSerifTemplate,
  indeed: ClassicSerifTemplate,
  'minimalist-modern': ClassicSerifTemplate,
};

export const templateMetadata = [
  { id: 'harvard', name: 'Classic Serif Template', audience: 'All Candidates, 100% ATS Compliant', popular: true },
];
