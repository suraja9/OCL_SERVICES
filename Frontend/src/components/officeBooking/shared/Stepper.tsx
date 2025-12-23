/**
 * Stepper Component
 * Multi-step progress indicator
 */

import React from 'react';
import { Check } from 'lucide-react';

export interface StepperProps {
  currentStep: number;
  steps: string[];
  completedSteps: boolean[];
  isDarkMode?: boolean;
}

const Stepper: React.FC<StepperProps> = ({ currentStep, steps, completedSteps, isDarkMode = false }) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                    transition-all duration-300
                    ${completedSteps[index] 
                      ? 'bg-green-500 text-white' 
                      : currentStep === index 
                        ? isDarkMode
                          ? 'bg-blue-500 text-white ring-2 ring-blue-500/20'
                          : 'bg-[#406ab9] text-white ring-2 ring-[#4ec0f7]/20'
                        : isDarkMode
                          ? 'bg-slate-700 text-slate-400'
                          : 'bg-gray-300 text-[#64748b]'
                    }
                  `}
                >
                  {completedSteps[index] ? <Check className="w-3 h-3" /> : index + 1}
                </div>
                <span
                  className={`
                    mt-1 text-xs font-medium text-center max-w-16
                    ${currentStep === index 
                      ? isDarkMode 
                        ? 'text-blue-400 font-semibold' 
                        : 'text-[#406ab9] font-semibold'
                      : isDarkMode
                        ? 'text-slate-400'
                        : 'text-[#64748b]'
                    }
                  `}
                  style={{ fontFamily: 'Calibri, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                >
                  {step}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`
                    w-8 h-0.5 rounded-full transition-all duration-300
                    ${completedSteps[index] 
                      ? 'bg-green-500' 
                      : isDarkMode
                        ? 'bg-slate-700'
                        : 'bg-gray-300'
                    }
                  `}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Stepper;

