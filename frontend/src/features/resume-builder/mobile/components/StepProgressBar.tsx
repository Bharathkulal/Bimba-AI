import React from 'react';

interface StepProgressBarProps {
  currentStep: number; // 1-indexed
  totalSteps: number;
  completedSteps: number[]; // 1-indexed steps that are completed
  onStepClick?: (step: number) => void;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  totalSteps,
  completedSteps,
  onStepClick
}) => {
  return (
    <div className="w-full py-3 px-1 flex gap-1.5 shrink-0">
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const stepNum = idx + 1;
        const isCompleted = completedSteps.includes(stepNum);
        const isActive = stepNum === currentStep;
        const canClick = isCompleted || stepNum < currentStep;

        return (
          <div
            key={idx}
            onClick={() => {
              if (canClick && onStepClick) {
                onStepClick(stepNum);
              }
            }}
            className={`h-1.5 rounded-full flex-grow transition-all duration-300 ${
              isActive
                ? 'bg-[#173404] dark:bg-emerald-500/80 ring-1 ring-[#173404]/30'
                : isCompleted || stepNum < currentStep
                ? 'bg-[#6C7E3D] dark:bg-emerald-600/60 cursor-pointer'
                : 'bg-slate-200 dark:bg-white/10'
            }`}
            title={`Step ${stepNum}`}
          />
        );
      })}
    </div>
  );
};
