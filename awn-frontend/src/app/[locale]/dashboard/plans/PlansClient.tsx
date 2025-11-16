"use client";
import * as React from "react";
import type { Locale } from "@/lib/i18n";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { GradientSlideButton } from "@/components/ui/gradient-slide-button";
import { getTherapistById } from "@/lib/therapists";
import { apiService } from '@/lib/api';
import type { TreatmentPlan } from "@/lib/types";
import { toastManager } from "@/hooks/use-toast";
import { Calendar, CheckCircle, Clock, User, FileText, Activity, BarChart3, MessageCircle, ChevronDown, ChevronUp, Filter, Lightbulb, Users } from "lucide-react";
import { Shield, Info, AlertTriangle } from 'lucide-react';
import { useMedicalHistoryStatus, getMedicalHistoryLabels } from '@/hooks/use-medical-history-status';

export default function PlansClient({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const [activeFilter, setActiveFilter] = useState<'all' | 'proposed' | 'active' | 'completed'>('all');
  const [expandedSessions, setExpandedSessions] = React.useState<Record<string, boolean>>({});
  
  // Medical History integration
  const medicalHistory = useMedicalHistoryStatus();
  const labels = getMedicalHistoryLabels(locale);

  function normalizeImage(src?: string) {
    if (!src) return '';
    try {
      if (src.startsWith('/therapists/')) {
        const parts = src.split('/');
        const base = parts[parts.length - 1];
        return base ? `/${base}` : src;
      }
    } catch (e) {}
    return src;
  }
  
  const [plans, setPlans] = React.useState<TreatmentPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        const user = raw ? JSON.parse(raw || '{}') : null;
        const patientId = user?.id || user?.userId || null;
        if (!patientId) {
          setPlans([]);
          return;
        }

        const res: any = await apiService.getTreatmentPlans(patientId);
        if (cancelled) return;
        if (res && res.success && res.data && Array.isArray(res.data.plans)) {
          const serverPlans = res.data.plans.map((p: any) => ({
            id: p.id || p.plan_id || String(Math.random()),
            therapistId: p.therapist_id || p.therapistId || (p.therapists && p.therapists.id) || '',
            title: p.title || p.name || '',
            steps: Array.isArray(p.steps) ? p.steps : (p.steps ? [p.steps] : []),
            status: p.status || 'proposed',
            completedSteps: p.completed_steps || p.completedSteps || 0,
            createdAt: p.created_at || p.createdAt,
            therapist: p.therapists || p.therapist || null
          }));
          setPlans(serverPlans);
        } else {
          setPlans([]);
        }
      } catch (err) {
        console.error('Failed to load treatment plans', err);
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    })();

    return () => { cancelled = true };
  }, [locale]);

  const handleAcceptPlan = (planId: string) => {
    // Check medical history before accepting plan
    if (!medicalHistory.isComplete) {
      toastManager.add({
        type: 'warning',
        title: ar ? "يرجى إكمال التاريخ الطبي" : "Please Complete Medical History",
        description: labels.safetyPrompt,
      });
      setTimeout(() => {
        window.location.href = `/${locale}/dashboard/medical-history`;
      }, 2000);
      return;
    }

    setPlans(prevPlans => 
      prevPlans.map(plan => 
        plan.id === planId 
          ? { ...plan, status: "accepted" as const, completedSteps: 0 }
          : plan
      )
    );
    
    // Auto-switch to Active tab after accepting
    setActiveFilter('active');
    
    // FIXED: Better toast positioning and mobile-friendly content
    toastManager.add({
      type: 'success',
      title: ar ? "تم قبول الخطة!" : "Plan Accepted!",
      description: ar ? "ستجد الخطة في قسم الخطط النشطة" : "Plan moved to Active section",
    });
    
    console.log(`Accepting plan ${planId}`);
  };

  const handleContactTherapist = (therapistId: string) => {
    const therapist = getTherapistById(therapistId);
    
    if (therapist) {
      // Show contact options dialog
      const message = ar 
        ? `تواصل مع ${therapist.name.ar}\n\nيمكنك التواصل عبر:\n• الرسائل المباشرة\n• المكالمات الصوتية\n• رسائل WhatsApp`
        : `Contact ${therapist.name.en}\n\nYou can reach out via:\n• Direct messaging\n• Voice calls\n• WhatsApp messages`;
      
      if (confirm(message + (ar ? "\n\nهل تريد بدء محادثة الآن؟" : "\n\nWould you like to start a conversation now?"))) {
        // Show contact toast
        toastManager.add({
          type: 'info',
          title: ar ? "جاري فتح المحادثة..." : "Opening Chat...",
          description: ar ? "سيتم توصيلك بالمعالج قريباً" : "Connecting you with the therapist",
        });
        
        // You could redirect to a chat page:
        // window.location.href = `/${locale}/chat/${therapistId}`;
      }
    } else {
      toastManager.add({
        type: 'error',
        title: ar ? "خطأ" : "Error",
        description: ar ? "لم نتمكن من العثور على معلومات المعالج" : "Couldn't find therapist information",
      });
    }
    
    console.log(`Contacting therapist ${therapistId}`);
  };

  const handleNewPlan = () => {
    // Check medical history before creating new plans
    if (!medicalHistory.isComplete) {
      toastManager.add({
        type: 'warning',
        title: ar ? "يرجى إكمال التاريخ الطبي" : "Please Complete Medical History",
        description: labels.safetyPrompt,
      });
      setTimeout(() => {
        window.location.href = `/${locale}/dashboard/medical-history`;
      }, 2000);
      return;
    }
    window.location.href = `/${locale}/therapists`;
  };

  const toggleSessions = (planId: string) => {
    setExpandedSessions(prev => ({
      ...prev,
      [planId]: !prev[planId]
    }));
  };

  const getStatusBadge = (status: TreatmentPlan['status']) => {
    const statusConfig: Record<TreatmentPlan['status'], { label: string; className: string }> = {
      proposed: {
        label: ar ? "مقترحة" : "Proposed",
        className: "bg-yellow-50 text-yellow-700 border-yellow-200"
      },
      pending: {
        label: ar ? "في الانتظار" : "Pending",
        className: "bg-blue-50 text-blue-700 border-blue-200"
      },
      accepted: {
        label: ar ? "نشطة" : "Active", 
        className: "bg-green-50 text-green-700 border-green-200"
      },
      declined: {
        label: ar ? "مرفوضة" : "Declined",
        className: "bg-red-50 text-red-700 border-red-200"
      },
      'in-progress': {
        label: ar ? "قيد التنفيذ" : "In Progress",
        className: "bg-purple-50 text-purple-700 border-purple-200"
      },
      completed: {
        label: ar ? "مكتملة" : "Completed",
        className: "bg-gray-50 text-gray-700 border-gray-200"
      },
      cancelled: {
        label: ar ? "ملغية" : "Cancelled",
        className: "bg-red-50 text-red-700 border-red-200"
      }
    };

    const config = statusConfig[status];
    return (
      <Badge variant="outline" className={`${config.className} font-medium text-xs`}>
        {config.label}
      </Badge>
    );
  };

  // Check if plan has special considerations based on medical history
  const hasSpecialConsiderations = (plan: TreatmentPlan) => {
    // Mock logic: Check if plan involves high-intensity and user has precautions
    const isHighIntensity = plan.title.toLowerCase().includes('shoulder') || 
                           plan.title.toLowerCase().includes('كتف') ||
                           plan.title.toLowerCase().includes('knee') ||
                           plan.title.toLowerCase().includes('ركبة');
    
    return isHighIntensity && medicalHistory.summary.hasRiskFactors;
  };

  // Filter plans by status
  const allPlans = plans;
  const proposedPlans = plans.filter(p => p.status === 'proposed');
  const activePlans = plans.filter(p => p.status === 'accepted');
  const completedPlans = plans.filter(p => p.status === 'completed');

  const getCurrentPlans = () => {
    switch (activeFilter) {
      case 'all':
        return allPlans;
      case 'proposed':
        return proposedPlans;
      case 'active':
        return activePlans;
      case 'completed':
        return completedPlans;
      default:
        return allPlans;
    }
  };

  const currentPlans = getCurrentPlans();

  const planTips = [
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      text: ar ? "راجع تفاصيل الخطة قبل القبول" : "Review plan details before accepting"
    },
    {
      icon: <MessageCircle className="h-5 w-5 text-blue-500" />,
      text: ar ? "تواصل مع المعالج لأي استفسارات" : "Contact therapist for any questions"
    },
    {
      icon: <Activity className="h-5 w-5 text-purple-500" />,
      text: ar ? "اتبع الخطة بانتظام للحصول على أفضل النتائج" : "Follow the plan regularly for best results"
    }
  ];

  const renderPlanCard = (plan: TreatmentPlan) => {
    // therapist may be provided by server (plan.therapist) or fallback to local data
    const therapist = (plan as any).therapist || getTherapistById(plan.therapistId);
    const progressPercentage = plan.completedSteps ? Math.round((plan.completedSteps / plan.steps.length) * 100) : 0;
    const isExpanded = expandedSessions[plan.id];
    const showToggle = plan.steps.length > 3 && plan.status !== 'proposed';
    const hasSpecialCons = hasSpecialConsiderations(plan);
    
    return (
      <Card key={plan.id} className="relative overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
        <div className="p-4 sm:p-6">
          {/* Medical History Context Bar */}
          {medicalHistory.isComplete && medicalHistory.summary.conditions.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm min-w-0">
                  <span className="font-medium text-blue-800 break-words">{labels.basedOnHistory}</span>
                  <span className="text-blue-700 ml-1 break-words">
                    {medicalHistory.summary.conditions.slice(0, 2).join(', ')}
                    {medicalHistory.summary.precautions.length > 0 && 
                      `, ${medicalHistory.summary.precautions[0]}`
                    }
                  </span>
                  <button 
                    onClick={() => window.location.href = `/${locale}/dashboard/medical-history`}
                    className="text-blue-600 hover:text-blue-800 underline ml-2 text-sm"
                  >
                    {labels.viewBackground}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Special Medical Considerations Alert */}
          {hasSpecialCons && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm min-w-0">
                  <span className="font-medium text-amber-800 break-words">
                    {ar ? "تتطلب اعتبارات طبية خاصة" : "Requires special medical considerations"}
                  </span>
                  <p className="text-amber-700 text-xs mt-1 break-words">
                    {ar 
                      ? "هذه الخطة تأخذ في الاعتبار حالتك الطبية وعوامل الخطر" 
                      : "This plan takes into account your medical condition and risk factors"
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Header with therapist info */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img 
                src={normalizeImage((therapist as any)?.avatar_url || (therapist as any)?.image || ((therapist as any)?.avatar)) || "/avatar-placeholder.jpg"} 
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all duration-300 flex-shrink-0" 
                alt={(therapist as any)?.name?.en || (therapist as any)?.name_en || "Therapist"} 
              />
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                  {ar ? (therapist as any)?.name?.ar || (therapist as any)?.name_ar : (therapist as any)?.name?.en || (therapist as any)?.name_en}
                </div>
                <div className="text-xs sm:text-sm text-gray-500 break-words">
                  {ar ? (therapist as any)?.specialty_ar || ((therapist as any)?.specialties && (therapist as any).specialties[1]) : (therapist as any)?.specialty_en || ((therapist as any)?.specialties && (therapist as any).specialties[0])}
                </div>
                {/* Therapist reviewed medical history indicator */}
                {medicalHistory.isComplete && (plan.status === 'accepted' || plan.status === 'completed') && (
                  <div className="flex items-center gap-1 mt-1">
                    <Shield className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-700">
                      {ar ? "راجع التاريخ الطبي" : "Reviewed medical history"}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              {getStatusBadge(plan.status)}
            </div>
          </div>

          {/* Plan title */}
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 break-words">{plan.title}</h3>

          {/* Progress for active and completed plans */}
          {(plan.status === 'accepted' || plan.status === 'completed') && plan.completedSteps !== undefined && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {ar ? "تقدم العلاج" : "Treatment Progress"}
                </span>
                <span className="text-sm text-gray-500">
                  {plan.completedSteps}/{plan.steps.length} {ar ? "جلسات" : "sessions"} ({progressPercentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    plan.status === 'completed' 
                      ? 'bg-gradient-to-r from-gray-500 to-gray-600' 
                      : 'bg-gradient-to-r from-green-500 to-green-600'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Sessions preview */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                {ar ? "جلسات العلاج" : "Treatment Sessions"}
              </span>
            </div>
            <div className="space-y-2">
              {/* For proposed cards, show ALL sessions */}
              {plan.status === 'proposed' ? (
                plan.steps.map((session: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium bg-gray-200 text-gray-600 flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-gray-600 break-words">{session}</span>
                  </div>
                ))
              ) : (
                /* For active/completed cards, show first 3 with expand option */
                <>
                  {(isExpanded ? plan.steps : plan.steps.slice(0, 3)).map((session: string, i: number) => {
                    const isCompleted = plan.completedSteps && i < plan.completedSteps;
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                          isCompleted 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {isCompleted ? '✓' : i + 1}
                        </div>
                        <span className={`break-words ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                          {session}
                        </span>
                      </div>
                    );
                  })}
                  
                  {/* Toggle button for more sessions */}
                  {showToggle && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSessions(plan.id);
                      }}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline ml-7 transition-colors duration-200"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          {ar ? "عرض أقل" : "Show less"}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          +{plan.steps.length - 3} {ar ? "جلسات إضافية" : "more sessions"}
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Last medical review timestamp for active plans */}
          {medicalHistory.isComplete && (plan.status === 'accepted' || plan.status === 'completed') && (
            <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-xs text-green-700">
                <Shield className="h-3 w-3 inline mr-1" />
                {ar ? "آخر مراجعة طبية:" : "Last medical review:"} {new Date(medicalHistory.lastUpdated!).toLocaleDateString(ar ? 'ar-SA' : 'en-US')}
              </div>
            </div>
          )}

          {/* Status message for active plans */}
          {plan.status === 'accepted' && (
            <div className={`p-3 rounded-lg border mb-4 ${
              plan.completedSteps === 0 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-green-50 border-green-200'
            }`}>
              <div className={`flex items-center gap-2 ${
                plan.completedSteps === 0 ? 'text-blue-700' : 'text-green-700'
              }`}>
                {plan.completedSteps === 0 ? (
                  <MessageCircle className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <Activity className="h-4 w-4 flex-shrink-0" />
                )}
                <span className="font-medium text-sm break-words">
                  {plan.completedSteps === 0 
                    ? (ar ? "سيتواصل معك المعالج قريباً" : "Your therapist will contact you soon")
                    : (ar ? "العلاج يسير وفقاً للخطة" : "Treatment progressing as planned")
                  }
                </span>
              </div>
            </div>
          )}

          {/* Completion message for completed plans */}
          {plan.status === 'completed' && (
            <div className="p-3 rounded-lg border mb-4 bg-gray-50 border-gray-200">
              <div className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-sm break-words">
                  {ar ? "تمت الخطة بنجاح" : "Plan completed successfully"}
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-3 mt-auto">
            {plan.status === 'proposed' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      className="transition-all duration-200 hover:scale-105 active:scale-95 bg-green-600 text-white hover:bg-green-700 hover:shadow-lg w-full"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {ar ? "قبول" : "Accept"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-center">
                        {ar ? "تأكيد قبول الخطة" : "Confirm Plan Acceptance"}
                      </AlertDialogTitle>
                    </AlertDialogHeader>
                    <div className="py-4">
                      <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                        {ar 
                          ? "هل تريد قبول هذه الخطة العلاجية؟ سيتم إشعار المعالج وبدء العلاج."
                          : "Do you want to accept this treatment plan? The therapist will be notified and treatment will begin."
                        }
                      </p>
                      
                      {/* Medical History Reminder */}
                      {medicalHistory.isComplete && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <div className="flex items-start gap-2">
                            <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm min-w-0">
                              <p className="text-blue-800 font-medium">
                                {ar ? "ملاحظة طبية" : "Medical Note"}
                              </p>
                              <p className="text-blue-700 text-xs break-words">
                                {ar 
                                  ? "تم إنشاء هذه الخطة بناءً على تاريخك الطبي الحالي" 
                                  : "This plan was created based on your current medical history"
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="font-medium mb-2 text-sm break-words">{plan.title}</h4>
                        <div className="text-sm text-gray-600">
                          {plan.steps.length} {ar ? "جلسة علاجية" : "treatment sessions"}
                        </div>
                      </div>
                    </div>
                    <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-3">
                      <AlertDialogCancel className="transition-all duration-200 hover:scale-105 active:scale-95 w-full sm:w-auto">
                        {ar ? "إلغاء" : "Cancel"}
                      </AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => handleAcceptPlan(plan.id)}
                        className="transition-all duration-200 hover:scale-105 active:scale-95 bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                      >
                        {ar ? "تأكيد القبول" : "Confirm Accept"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                      </div>
              ) : null}

          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-4 sm:py-8" dir={ar ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{ar ? "خطط العلاج" : "Treatment Plans"}</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          {ar ? "راجع وأدِر خطط العلاج المقترحة من معالجيك" : "Review and manage treatment plans proposed by your therapists"}
        </p>
      </div>

      {/* Medical History Status Banner */}
      {!medicalHistory.isComplete && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-amber-800 font-medium break-words">
                {ar ? "يرجى إكمال تاريخك الطبي" : "Please complete your medical history"}
              </p>
              <p className="text-sm text-amber-700 mt-1 break-words">
                {ar 
                  ? "لضمان خطط علاج آمنة ومخصصة لحالتك" 
                  : "To ensure safe and personalized treatment plans"
                }
              </p>
            </div>
            <Button
              onClick={() => window.location.href = `/${locale}/dashboard/medical-history`}
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto"
            >
              {ar ? "إكمال الآن" : "Complete Now"}
            </Button>
          </div>
        </div>
      )}

      {/* FIXED: Mobile-First Filter Tabs Section */}
      <div className="mb-6 sm:mb-8 space-y-4">
        {/* Main Filter Tabs - Mobile responsive */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Tab Buttons - Mobile-first design */}
          <div className="w-full lg:w-auto">
            {/* Mobile: Grid layout, Desktop: Segmented control */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:bg-gray-100 lg:p-1 lg:rounded-xl lg:shadow-inner gap-1 lg:gap-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter('all')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 lg:px-6 lg:py-2 transition-all duration-200 text-sm font-medium ${
                  activeFilter === 'all' 
                    ? 'bg-white shadow-sm text-gray-900 lg:shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">{ar ? "الكل" : "All"}</span>
                <span className="sm:hidden">{ar ? "الكل" : "All"}</span>
                {allPlans.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs bg-blue-100 text-blue-700 lg:bg-blue-100 lg:text-blue-700">
                    {allPlans.length}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter('proposed')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 lg:px-6 lg:py-2 transition-all duration-200 text-sm font-medium ${
                  activeFilter === 'proposed' 
                    ? 'bg-white shadow-sm text-gray-900 lg:shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">{ar ? "مقترحة" : "Proposed"}</span>
                <span className="sm:hidden">{ar ? "مقترح" : "Proposed"}</span>
                {proposedPlans.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs bg-yellow-100 text-yellow-700">
                    {proposedPlans.length}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter('active')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 lg:px-6 lg:py-2 transition-all duration-200 text-sm font-medium ${
                  activeFilter === 'active' 
                    ? 'bg-white shadow-sm text-gray-900 lg:shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">{ar ? "نشطة" : "Active"}</span>
                <span className="sm:hidden">{ar ? "نشط" : "Active"}</span>
                {activePlans.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-700">
                    {activePlans.length}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter('completed')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 lg:px-6 lg:py-2 transition-all duration-200 text-sm font-medium ${
                  activeFilter === 'completed' 
                    ? 'bg-white shadow-sm text-gray-900 lg:shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">{ar ? "مكتملة" : "Completed"}</span>
                <span className="sm:hidden">{ar ? "تم" : "Done"}</span>
                {completedPlans.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs bg-gray-100 text-gray-700">
                    {completedPlans.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* FIXED: Book New Appointment Button - Full width on mobile */}
          <div className="w-full lg:w-auto">
            <GradientSlideButton 
              onClick={handleNewPlan}
              className="transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl w-full lg:w-auto"
            >
              {ar ? "احجز موعد جديد" : "Book New Appointment"}
            </GradientSlideButton>
          </div>
        </div>
      </div>

      {/* Treatment Plan Tips - Already mobile responsive */}
      <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            {ar ? "نصائح لخطط العلاج" : "Treatment Plan Tips"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {planTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 text-sm text-gray-700">
                <div className="flex-shrink-0 mt-0.5">{tip.icon}</div>
                <span className="break-words">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Content */}
      <div>
        {currentPlans.length === 0 ? (
          <Card className="text-center py-12 sm:py-16 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-md mx-auto px-4">
              <Calendar className="mx-auto h-16 sm:h-24 w-16 sm:w-24 text-gray-300 mb-6" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                {activeFilter === 'all' 
                  ? (ar ? "لا توجد خطط علاج" : "No treatment plans")
                  : activeFilter === 'proposed' 
                  ? (ar ? "لا توجد خطط مقترحة" : "No proposed plans")
                  : activeFilter === 'active'
                  ? (ar ? "لا توجد خطط نشطة" : "No active plans")
                  : (ar ? "لا توجد خطط مكتملة" : "No completed plans")
                }
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base break-words">
                {activeFilter === 'all' 
                  ? (ar ? "ستظهر جميع خطط العلاج هنا" : "All your treatment plans will appear here")
                  : activeFilter === 'proposed' 
                  ? (ar ? "ستظهر خطط العلاج المقترحة من معالجيك هنا" : "Treatment plans proposed by your therapists will appear here")
                  : activeFilter === 'active'
                  ? (ar ? "خططك النشطة ستظهر هنا" : "Your active treatment plans will appear here")
                  : (ar ? "خططك المكتملة ستظهر هنا" : "Your completed treatment plans will appear here")
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {activeFilter === 'all' 
                  ? (ar ? "جميع الخطط" : "All Plans")
                  : activeFilter === 'proposed' 
                  ? (ar ? "الخطط المقترحة" : "Proposed Plans")
                  : activeFilter === 'active'
                  ? (ar ? "الخطط النشطة" : "Active Plans")
                  : (ar ? "الخطط المكتملة" : "Completed Plans")
                }
              </h2>
              <Badge variant="outline" className="text-sm font-medium w-fit">
                {currentPlans.length} {ar ? "خطة" : "plans"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {currentPlans.map(plan => renderPlanCard(plan))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}