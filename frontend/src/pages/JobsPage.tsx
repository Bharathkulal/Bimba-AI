import React from 'react';
import { ResponsiveComponent } from '../components/ResponsiveComponent';
import { JobsPageDesktop } from './jobs/JobsPageDesktop';
import { JobsPageMobile } from './jobs/JobsPageMobile';

export const JobsPage: React.FC = () => {
  return (
    <ResponsiveComponent
      desktop={<JobsPageDesktop />}
      mobile={<JobsPageMobile />}
    />
  );
};

export default JobsPage;
