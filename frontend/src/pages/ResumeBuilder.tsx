import React from 'react';
import { ResponsiveComponent } from '../components/ResponsiveComponent';
import { ResumeBuilderDesktop } from './resume/ResumeBuilderDesktop';
import { ResumeBuilderMobile } from './resume/ResumeBuilderMobile';

export const ResumeBuilder: React.FC = () => {
  return (
    <ResponsiveComponent
      desktop={<ResumeBuilderDesktop />}
      mobile={<ResumeBuilderMobile />}
    />
  );
};

export default ResumeBuilder;
