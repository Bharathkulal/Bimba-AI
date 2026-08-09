import React from 'react';
import { SingleColumnMarketingTemplate } from './SingleColumnMarketingTemplate';

export const TemplateRegistry: Record<string, React.FC<any>> = {
  harvard: SingleColumnMarketingTemplate,
  jakes: SingleColumnMarketingTemplate,
  stanford: SingleColumnMarketingTemplate,
  microsoft: SingleColumnMarketingTemplate,
  reactive: SingleColumnMarketingTemplate,
  novoresume: SingleColumnMarketingTemplate,
  flowcv: SingleColumnMarketingTemplate,
  indeed: SingleColumnMarketingTemplate,
  'minimalist-modern': SingleColumnMarketingTemplate,
};

export const templateMetadata = [
  { id: 'harvard', name: 'High-Converting ATS Marketing Template', audience: 'All Candidates, 100% ATS Compliant', popular: true },
];
