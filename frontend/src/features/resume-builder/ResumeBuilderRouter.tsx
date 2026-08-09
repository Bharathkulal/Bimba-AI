import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIsMobileViewport } from './hooks/useIsMobileViewport';
import { ResumeBuilderFlow } from '../../components/resume-builder/ResumeBuilderFlow';
import { UploadResumeMobile } from './mobile/UploadResumeMobile';
import { CreateFromScratchMobile } from './mobile/CreateFromScratchMobile';

import { ResumeBuilderProvider } from '../../components/resume-builder/ResumeBuilderContext';

export const ResumeBuilderRouter: React.FC = () => {
  const isMobile = useIsMobileViewport();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Decide mobile journey: 'upload' or 'scratch'
  const [mobileMode, setMobileMode] = useState<'upload' | 'scratch'>(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'scratch') return 'scratch';
    return 'upload';
  });

  if (!isMobile) {
    return <ResumeBuilderFlow />;
  }

  return (
    <ResumeBuilderProvider>
      <UploadResumeMobile onSwitchToScratch={() => {}} />
    </ResumeBuilderProvider>
  );
};

export default ResumeBuilderRouter;
