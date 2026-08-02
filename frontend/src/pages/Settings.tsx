import React from 'react';
import { ResponsiveComponent } from '../components/ResponsiveComponent';
import { SettingsDesktop } from './settings/SettingsDesktop';
import { SettingsMobile } from './settings/SettingsMobile';

export const Settings: React.FC = () => {
  return (
    <ResponsiveComponent
      desktop={<SettingsDesktop />}
      mobile={<SettingsMobile />}
    />
  );
};

export default Settings;
