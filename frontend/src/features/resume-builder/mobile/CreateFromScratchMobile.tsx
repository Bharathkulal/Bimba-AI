import React from 'react';
import { UploadResumeMobile } from './UploadResumeMobile';

interface CreateFromScratchMobileProps {
  onBackToUpload: () => void;
}

export const CreateFromScratchMobile: React.FC<CreateFromScratchMobileProps> = () => {
  return (
    <UploadResumeMobile onSwitchToScratch={() => {}} />
  );
};

export default CreateFromScratchMobile;
