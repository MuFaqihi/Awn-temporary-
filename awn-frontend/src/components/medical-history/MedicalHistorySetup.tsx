'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/base-button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { GradientSlideButton } from '@/components/ui/gradient-slide-button';
import { toastManager } from '@/hooks/use-toast';
import type { Locale } from '@/lib/types';

// Import step components
import SetupSnapshot from './setup/SetupSnapshot';
import SetupConditionsAllergies from './setup/SetupConditionsAllergies';
import SetupRisksMedications from './setup/SetupRisksMedications';
import SetupGoalsConsent from './setup/SetupGoalsConsent';

interface Props {
  locale: Locale;
  onComplete: () => void;
  onSave?: (data: StepData) => Promise<void> | void;
}

interface StepData {
  snapshot?: any;
  conditions?: any[];
  allergies?: any[];
  noAllergies?: boolean;
  medications?: any[];
  goals?: any;
  consent?: any;
  sessionPreference?: string;
}

export default function MedicalHistorySetup({ locale, onComplete, onSave }: Props) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<StepData>({});
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const ar = locale === 'ar';

  const steps = [
    { 
      id: 1, 
      title: ar ? 'المعلومات الأساسية' : 'Basic Information',
      description: ar ? 'الشكوى الأساسية ومستوى الألم' : 'Primary complaint and pain level',
      component: SetupSnapshot,
      required: true
    },
    { 
      id: 2, 
      title: ar ? 'الحالات والحساسية' : 'Conditions & Allergies',
      description: ar ? 'الحالات الطبية والحساسية' : 'Medical conditions and allergies',
      component: SetupConditionsAllergies,
      required: false
    },
    { 
      id: 3, 
      title: ar ? 'المخاطر والأدوية' : 'Risks & Medications',
      description: ar ? 'عوامل الخطر والأدوية الحالية' : 'Risk factors and current medications',
      component: SetupRisksMedications,
      required: false
    },
    { 
      id: 4, 
      title: ar ? 'الأهداف والموافقة' : 'Goals & Consent',
      description: ar ? 'أهداف التأهيل والموافقة على العلاج' : 'Rehabilitation goals and treatment consent',
      component: SetupGoalsConsent,
      required: true
    }
  ];

  const showToast = useCallback((title: string, description: string, type: 'error' | 'success' = 'error') => {
    toastManager.add({ title, description, type });
  }, []);

  const validateStep = useCallback((stepId: number, data: any) => {
    const currentYear = new Date().getFullYear();
    
    switch (stepId) {
      case 1:
        // Primary concern must be at least 100 characters
        if (!data.primaryConcern || data.primaryConcern.length < 100) {
          showToast(
            ar ? "يحتاج المزيد من التفاصيل" : "More detail needed",
            ar ? "يرجى تقديم وصف أكثر تفصيلاً للمشكلة (100 حرف على الأقل)." : "Please provide a more detailed description of your concern (minimum 100 characters)."
          );
          return false;
        }
        
        // Onset date required
        if (!data.onsetDate) {
          showToast(
            ar ? "تاريخ البداية مطلوب" : "Onset date required",
            ar ? "يرجى تحديد تاريخ بداية المشكلة." : "Please specify when the problem started."
          );
          return false;
        }
        
        // Validate onset year if provided
        if (data.onsetDate) {
          const onsetYear = new Date(data.onsetDate).getFullYear();
          if (onsetYear < 1900 || onsetYear > currentYear) {
            showToast(
              ar ? "تاريخ غير صحيح" : "Invalid date",
              ar ? "يرجى إدخال تاريخ بداية صحيح." : "Please enter a valid onset date."
            );
            return false;
          }
        }
        
        // Onset type required
        if (!data.onsetType) {
          showToast(
            ar ? "نوع البداية مطلوب" : "Onset type required",
            ar ? "يرجى تحديد نوع بداية المشكلة." : "Please specify the onset type."
          );
          return false;
        }
        
        return true;
      
      case 2:
        // Must have at least one allergy OR check "None"
        const hasAllergies = data.allergies && data.allergies.length > 0;
        const hasNoneChecked = data.noAllergies;
        if (!hasAllergies && !hasNoneChecked) {
          showToast(
            ar ? "الحساسية مطلوبة" : "Allergies required",
            ar ? "أكد أنه ليس لديك حساسية أو أضف واحدة على الأقل." : "Confirm you have no allergies or add at least one."
          );
          return false;
        }
        return true;
      
      case 3:
        // No required fields
        return true;
      
      case 4:
        // Consent required
        if (!data.consent || !data.consent.consentToTreatment) {
          showToast(
            ar ? "الموافقة مطلوبة" : "Consent required",
            ar ? "يرجى مراجعة والموافقة على الموافقة للمتابعة." : "Please review and agree to consent to continue."
          );
          return false;
        }
        return true;
      
      default:
        return true;
    }
  }, [ar, showToast]);

  // Memoized function to prevent recreation on every render
  const handleStepDataUpdate = useCallback((data: any) => {
    setStepData(prev => {
      const updatedStepData = { ...prev };
      
      switch (currentStep) {
        case 1:
          updatedStepData.snapshot = data;
          break;
        case 2:
          updatedStepData.conditions = data.conditions;
          updatedStepData.allergies = data.allergies;
          updatedStepData.noAllergies = data.noAllergies;
          break;
        case 3:
          updatedStepData.medications = data.medications;
          break;
        case 4:
          updatedStepData.goals = data.goals;
          updatedStepData.consent = data.consent;
          updatedStepData.sessionPreference = data.sessionPreference;
          break;
      }

      return updatedStepData;
    });
  }, [currentStep]);

  const handleNext = useCallback(() => {
    const currentStepData = getCurrentStepData();
    
    if (validateStep(currentStep, currentStepData)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  }, [currentStep, stepData, completedSteps, validateStep]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleFinish = useCallback(() => {
    const currentStepData = getCurrentStepData();
    
    if (validateStep(currentStep, currentStepData)) {
      if (!completedSteps.includes(currentStep)) {
        setCompletedSteps(prev => [...prev, currentStep]);
      }
      
      (async () => {
        try {
          if (typeof (onSave) === 'function') {
            await onSave(stepData as StepData);
          }
        } catch (e) {
          console.error('Failed to save medical history in setup:', e);
          showToast(ar ? 'فشل في الحفظ' : 'Save failed', ar ? 'تعذر حفظ التاريخ الطبي. حاول مجدداً.' : 'Unable to save medical history. Please try again.', 'error');
        } finally {
          console.log('Medical history setup completed:', stepData);
          onComplete();
        }
      })();
    }
  }, [currentStep, stepData, completedSteps, validateStep, onComplete]);

  const getCurrentStepData = useCallback(() => {
    switch (currentStep) {
      case 1: return stepData.snapshot || {};
      case 2: return { 
        conditions: stepData.conditions || [], 
        allergies: stepData.allergies || [], 
        noAllergies: stepData.noAllergies || false 
      };
      case 3: return { medications: stepData.medications || [] };
      case 4: return { 
        goals: stepData.goals || {}, 
        consent: stepData.consent || {},
        sessionPreference: stepData.sessionPreference || ''
      };
      default: return {};
    }
  }, [currentStep, stepData]);

  // Memoize current step data to prevent unnecessary re-renders
  const currentStepData = useMemo(() => getCurrentStepData(), [getCurrentStepData]);

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6" dir={ar ? 'rtl' : 'ltr'}>
      {/* Header - Mobile responsive */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {ar ? 'إعداد التاريخ الطبي' : 'Medical History Setup'}
        </h1>
        <p className="text-gray-600 mt-2 text-base sm:text-lg">
          {ar ? 'إعداد سريع في 4 خطوات للحصول على رعاية أفضل' : 'Quick 4-step setup for better care'}
        </p>
      </div>

      {/* Progress Steps - Mobile responsive */}
      <Card className="overflow-hidden shadow-lg sm:shadow-xl border-0 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50">
        <CardContent className="p-4 sm:p-8">
          {/* Mobile Progress - Stack vertically on very small screens */}
          <div className="hidden sm:flex items-center justify-between gap-3">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => completedSteps.includes(step.id) && setCurrentStep(step.id)}
                      disabled={!completedSteps.includes(step.id) && step.id !== currentStep}
                      className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 transform hover:scale-110 ${
                        completedSteps.includes(step.id)
                          ? 'bg-green-500 border-green-500 text-white shadow-lg'
                          : currentStep === step.id
                          ? 'bg-teal-600 border-teal-600 text-white shadow-lg scale-110'
                          : 'border-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {completedSteps.includes(step.id) ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-bold">{step.id}</span>
                      )}
                    </button>
                  </div>
                  <div className="mt-3 text-center">
                    <div className={`text-sm font-medium max-w-[100px] text-center ${
                      currentStep === step.id ? 'text-teal-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 max-w-[100px] text-center">
                      {step.description}
                    </div>
                  </div>
                  {step.required && (
                    <Badge variant="outline" className="text-xs mt-2 bg-red-50 text-red-600 border-red-200">
                      {ar ? 'مطلوب' : 'Required'}
                    </Badge>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-20 h-1 mx-4 rounded-full transition-colors duration-300 ${
                    completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Mobile Progress - Horizontal scroll on small screens */}
          <div className="sm:hidden">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center min-w-0">
                  <div className="flex flex-col items-center min-w-[60px]">
                    <button
                      onClick={() => completedSteps.includes(step.id) && setCurrentStep(step.id)}
                      disabled={!completedSteps.includes(step.id) && step.id !== currentStep}
                      className={`h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                        completedSteps.includes(step.id)
                          ? 'bg-green-500 border-green-500 text-white shadow-lg'
                          : currentStep === step.id
                          ? 'bg-teal-600 border-teal-600 text-white shadow-lg'
                          : 'border-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {completedSteps.includes(step.id) ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-bold">{step.id}</span>
                      )}
                    </button>
                    <div className="mt-2 text-center">
                      <div className={`text-xs font-medium ${
                        currentStep === step.id ? 'text-teal-600' : 'text-gray-500'
                      }`}>
                        {step.title.split(' ')[0]}
                      </div>
                      {step.required && (
                        <Badge variant="outline" className="text-xs mt-1 bg-red-50 text-red-600 border-red-200">
                          *
                        </Badge>
                      )}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-8 h-1 mx-2 rounded-full transition-colors duration-300 ${
                      completedSteps.includes(step.id) ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content - Mobile responsive */}
      <Card className="shadow-lg sm:shadow-xl border-0">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b p-4 sm:p-6">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {ar ? `الخطوة ${currentStep} من ${steps.length}` : `Step ${currentStep} of ${steps.length}`}
              </h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                {steps[currentStep - 1].title}
              </p>
            </div>
            <Badge variant="outline" className="text-sm w-fit">
              {ar ? `${currentStep}/${steps.length}` : `${currentStep}/${steps.length}`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-8">
          <div className="min-h-[400px] sm:min-h-[500px]">
            <CurrentStepComponent 
              locale={locale} 
              onStepDataUpdate={handleStepDataUpdate}
              stepData={currentStepData}
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation - Mobile responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6">
        <Button 
          variant="outline" 
          onClick={handleBack}
          disabled={currentStep === 1}
          className="w-full sm:w-auto px-4 sm:px-6 py-3 hover:bg-gray-50 transition-all duration-200"
        >
          {ar ? 'رجوع' : 'Back'}
        </Button>
        
        <div className="text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full order-first sm:order-none">
          {ar ? `الخطوة ${currentStep} من ${steps.length}` : `Step ${currentStep} of ${steps.length}`}
        </div>
        
        {currentStep < steps.length ? (
          <Button 
            onClick={handleNext}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-teal-600 hover:bg-teal-700 transition-all duration-200"
          >
            {ar ? 'التالي' : 'Next'}
          </Button>
        ) : (
          <GradientSlideButton 
            onClick={handleFinish}
            className="w-full sm:w-auto px-4 sm:px-6 py-3 text-base sm:text-lg font-semibold transition-all duration-200"
          >
            {ar ? 'إنهاء ومراجعة' : 'Finish & Review'}
          </GradientSlideButton>
        )}
      </div>
    </div>
  );
}