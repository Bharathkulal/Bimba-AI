import React from 'react';
import { ResponsiveComponent } from '../components/ResponsiveComponent';
import { DashboardDesktop } from './dashboard/DashboardDesktop';
import { DashboardMobile } from './dashboard/DashboardMobile';

export const Dashboard: React.FC = () => {
  return (
    <ResponsiveComponent
      desktop={<DashboardDesktop />}
      mobile={<DashboardMobile />}
    />
  );
};

export default Dashboard;
