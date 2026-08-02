import React from 'react';
import { ResponsiveComponent } from '../../components/ResponsiveComponent';
import { ApplicationsDesktop } from './ApplicationsDesktop';
import { ApplicationsMobile } from './ApplicationsMobile';

export const Applications: React.FC = () => {
  return (
    <ResponsiveComponent
      desktop={<ApplicationsDesktop />}
      mobile={<ApplicationsMobile />}
    />
  );
};

export default Applications;
