import React from 'react';
import { ResponsiveComponent } from '../components/ResponsiveComponent';
import { ProfileDesktop } from './profile/ProfileDesktop';
import { ProfileMobile } from './profile/ProfileMobile';

export const Profile: React.FC = () => {
  return (
    <ResponsiveComponent
      desktop={<ProfileDesktop />}
      mobile={<ProfileMobile />}
    />
  );
};

export default Profile;
