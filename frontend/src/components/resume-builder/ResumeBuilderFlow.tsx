import React from 'react';
import { useResumeBuilderContext, ResumeBuilderProvider } from './ResumeBuilderContext';
import { WelcomeStep } from './steps/WelcomeStep';
import { DocumentIngestionStep } from './steps/DocumentIngestionStep';
import { ParsingProgressStep } from './steps/ParsingProgressStep';
import { SnapshotEditorStep } from './steps/SnapshotEditorStep';
import { TemplateSelectionStep } from './steps/TemplateSelectionStep';
import { CoachInterviewStep } from './steps/CoachInterviewStep';
import { GenerationCompleteStep } from './steps/GenerationCompleteStep';
import { AtsScoreStep } from './steps/AtsScoreStep';
import { AiPolishStep } from './steps/AiPolishStep';
import { StructuralAuditStep } from './steps/StructuralAuditStep';
import { ExportStep } from './steps/ExportStep';
import { JobMatchesStep } from './steps/JobMatchesStep';
import { ApplicationTrackerStep } from './steps/ApplicationTrackerStep';
import { ResumeBuilderShell } from './ResumeBuilderShell';

const ResumeBuilderStepRouter: React.FC = () => {
  const { currentStep } = useResumeBuilderContext();

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <WelcomeStep />;
      case 2: return <DocumentIngestionStep />;
      case 3: return <ParsingProgressStep />;
      case 4: return <SnapshotEditorStep />;
      case 5: return <TemplateSelectionStep />;
      case 6: return <CoachInterviewStep />;
      case 7: return <GenerationCompleteStep />;
      case 8: return <AtsScoreStep />;
      case 9: return <AiPolishStep />;
      case 10: return <StructuralAuditStep />;
      case 11: return <ExportStep />;
      case 12: return <JobMatchesStep />;
      case 13: return <ApplicationTrackerStep />;
      default: return <WelcomeStep />;
    }
  };

  return (
    <ResumeBuilderShell>
      {renderStep()}
    </ResumeBuilderShell>
  );
};

export const ResumeBuilderFlow: React.FC = () => {
  return (
    <ResumeBuilderProvider>
      <ResumeBuilderStepRouter />
    </ResumeBuilderProvider>
  );
};
export default ResumeBuilderFlow;
