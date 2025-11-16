"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, User, Shield, Calendar, Printer } from 'lucide-react';
import type { Locale } from '@/lib/i18n';
import { useMedicalHistory } from '@/hooks/use-medical-history';
import { toastManager } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// Import section components
import SectionNavigation from '@/components/medical-history/SectionNavigation';
import SnapshotSection from '@/components/medical-history/SnapshotSection';
import ConditionsSection from '@/components/medical-history/ConditionsSection';
import MedicationsSection from '@/components/medical-history/MedicationsSection';
import AllergiesSection from '@/components/medical-history/AllergiesSection';
import VitalsSection from '@/components/medical-history/VitalsSection';
import ConsentSection from '@/components/medical-history/ConsentSection';
import MedicalHistorySetup from '@/components/medical-history/MedicalHistorySetup';

interface Props {
  locale: Locale;
}

export default function MedicalHistoryClient({ locale }: Props) {
  const { history, isLoading, isSetupComplete, updateHistory, saveNow } = useMedicalHistory();
  const [showSetup, setShowSetup] = useState(false);
  const [activeSection, setActiveSection] = useState('snapshot');
  const router = useRouter();
  const ar = locale === 'ar';

  const handleExport = () => {
    if (!history?.consent?.consentToTreatment) {
      toastManager.add({
        title: ar ? "الموافقة مطلوبة" : "Consent required",
        description: ar ? "يرجى تقديم الموافقة على العلاج قبل التصدير" : "Please provide consent to treatment before exporting",
        type: "error"
      });
      return;
    }

    // Trigger browser print for now
    window.print();
    
    toastManager.add({
      title: ar ? "تم التصدير" : "Export Complete",
      description: ar ? "تم فتح نافذة الطباعة" : "Print dialog opened",
      type: "success"
    });
  };

  const handleSetupComplete = () => {
    setShowSetup(false);

    // Show success toast
    toastManager.add({
      title: ar ? "تم إعداد التاريخ الطبي" : "Medical History Setup Complete",
      description: ar ? "يمكنك الآن عرض وتعديل معلوماتك الطبية" : "You can now view and edit your medical information",
      type: "success"
    });

    // Navigate to summary page after a short delay to allow toast to show
    setTimeout(() => {
      router.push(`/${locale}/dashboard/medical-history/summary`);
    }, 1000);
  };

  const handleSaveFromSetup = async (data: any) => {
    // Build the full MedicalHistory shape from step data
    const historyPayload = {
      snapshot: data.snapshot || {},
      conditions: data.conditions || [],
      surgeries: [],
      medications: data.medications || [],
      allergies: data.allergies || [],
      imaging: [],
      vitals: {},
      lifestyle: {},
      womensHealth: { show: false },
      goals: data.goals || { shortTerm: [], longTerm: [], functionalGoals: [] },
      contraindications: { absolute: [], relative: [] },
      consent: data.consent || { consentToTreatment: false, informedOfRisks: false, shareWithAssignedTherapist: false },
      attachments: [],
      timeline: [],
      isComplete: true,
      lastUpdated: new Date().toISOString()
    };

    try {
      // Update local hook state
      updateHistory(historyPayload as any);
      // Persist to server
      await saveNow();
      toastManager.add({ title: ar ? 'تم الحفظ' : 'Saved', description: ar ? 'تم حفظ التاريخ الطبي بنجاح' : 'Medical history saved', type: 'success' });
    } catch (err) {
      console.error('Failed to save medical history from setup', err);
      toastManager.add({ title: ar ? 'فشل في الحفظ' : 'Save failed', description: ar ? 'تعذر حفظ التاريخ الطبي' : 'Unable to save medical history', type: 'error' });
    }
  };

  const getWarnings = () => {
    if (!history) return [];
    
    const warnings = [];
    
    // Check for anticoagulant medications
    if (history.medications) {
      const anticoagulants = history.medications.filter(med => med.anticoagulant);
      if (anticoagulants.length > 0) {
        warnings.push({
          type: 'medication',
          message: ar ? `المريض يتناول أدوية مضادة للتخثر: ${anticoagulants.map(m => m.name).join(', ')}` 
                      : `Patient on anticoagulants: ${anticoagulants.map(m => m.name).join(', ')}`,
          severity: 'high'
        });
      }
    }

    // Check for absolute contraindications
    if (history.contraindications?.absolute?.length > 0) {
      warnings.push({
        type: 'contraindication',
        message: ar ? `موانع استعمال مطلقة: ${history.contraindications.absolute.join(', ')}`
                    : `Absolute contraindications: ${history.contraindications.absolute.join(', ')}`,
        severity: 'critical'
      });
    }

    // Check for severe allergies
    if (history.allergies) {
      const severeAllergies = history.allergies.filter(allergy => allergy.severity === 'severe');
      if (severeAllergies.length > 0) {
        warnings.push({
          type: 'allergy',
          message: ar ? `حساسية شديدة: ${severeAllergies.map(a => a.name).join(', ')}`
                      : `Severe allergies: ${severeAllergies.map(a => a.name).join(', ')}`,
          severity: 'high'
        });
      }
    }

    return warnings;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6">
        <div className="animate-pulse space-y-4 sm:space-y-6">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 sm:w-64"></div>
          <div className="h-64 sm:h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!isSetupComplete || showSetup) {
    return (
      <MedicalHistorySetup 
        locale={locale} 
        onComplete={handleSetupComplete}
        onSave={handleSaveFromSetup}
      />
    );
  }

  if (!history) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 text-center">
        <p className="text-gray-500">{ar ? "خطأ في تحميل البيانات" : "Error loading data"}</p>
      </div>
    );
  }

  const warnings = getWarnings();
  const lastUpdated = history.lastUpdated || new Date().toISOString();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6" dir={ar ? 'rtl' : 'ltr'}>
      {/* Header - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-teal-600 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
              {ar ? "التاريخ الطبي" : "Medical History"}
            </h1>
          </div>
          <p className="text-sm sm:text-base text-gray-600 break-words">
            {ar ? "راجع وحدث معلوماتك الطبية للحصول على رعاية مخصصة" : "Review and update your medical information for personalized care"}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            onClick={() => setShowSetup(true)}
            variant="outline"
            size="sm"
            className="transition-all duration-200 hover:scale-105 active:scale-95 border-teal-200 text-teal-700 hover:bg-teal-50 w-full sm:w-auto"
          >
            <FileText className="h-4 w-4 mr-2" />
            {ar ? "إعداد جديد" : "New Setup"}
          </Button>
          
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            disabled={!history?.consent?.consentToTreatment}
            className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 w-full sm:w-auto"
          >
            <Printer className="h-4 w-4 mr-2" />
            {ar ? "تصدير" : "Export"}
          </Button>
        </div>
      </div>

      {/* Status and Warnings - Mobile responsive */}
      <div className="space-y-3 sm:space-y-4">
        {/* Completion Status */}
        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-semibold text-green-800 text-sm sm:text-base">
                    {ar ? "التاريخ الطبي مكتمل" : "Medical History Complete"}
                  </h3>
                  <p className="text-xs sm:text-sm text-green-700 break-words">
                    {ar ? "آخر تحديث:" : "Last updated:"} {' '}
                    {new Date(lastUpdated).toLocaleDateString(ar ? 'ar-SA' : 'en-US')}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 whitespace-nowrap">
                {ar ? "مكتمل" : "Complete"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Card className="border-l-4 border-l-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-amber-800 mb-3 text-sm sm:text-base">
                    {ar ? "تنبيهات طبية مهمة" : "Important Medical Alerts"}
                  </h3>
                  <div className="space-y-2">
                    {warnings.map((warning, index) => (
                      <div key={index} className="text-xs sm:text-sm text-amber-700 break-words">
                        • {warning.message}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Navigation and Content - Mobile responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Navigation - Full width on mobile, sidebar on desktop */}
        <div className="lg:col-span-1">
          <SectionNavigation
            currentSection={activeSection}
            onNavigate={setActiveSection}
            locale={locale}
          />
        </div>

        {/* Content - Full width on mobile, main area on desktop */}
        <div className="lg:col-span-3">
          <Card className="min-h-[400px] sm:min-h-[500px]">
            <CardContent className="p-4 sm:p-6">
              {activeSection === 'snapshot' && (
                <SnapshotSection 
                  snapshot={history.snapshot}
                  locale={locale}
                  onUpdate={(snapshot) => updateHistory({ snapshot })}
                />
              )}
              {activeSection === 'conditions' && (
                <ConditionsSection 
                  conditions={history.conditions || []}
                  locale={locale}
                  onUpdate={(conditions) => updateHistory({ conditions })}
                />
              )}
              {activeSection === 'medications' && (
                <MedicationsSection 
                  medications={history.medications || []}
                  locale={locale}
                  onUpdate={(medications) => updateHistory({ medications })}
                />
              )}
              {activeSection === 'allergies' && (
                <AllergiesSection 
                  allergies={history.allergies || []}
                  locale={locale}
                  onUpdate={(allergies) => updateHistory({ allergies })}
                />
              )}
              {activeSection === 'vitals' && (
                <VitalsSection 
                  vitals={history.vitals}
                  locale={locale}
                  onUpdate={(vitals) => updateHistory({ vitals })}
                />
              )}
              {activeSection === 'consent' && (
                <ConsentSection 
                  consent={history.consent}
                  locale={locale}
                  onUpdate={(consent) => updateHistory({ consent })}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Auto-save indicator - Mobile responsive */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-xs sm:text-sm shadow-lg">
          {ar ? "حفظ تلقائي" : "Auto-saving..."}
        </div>
      </div>
    </div>
  );
}