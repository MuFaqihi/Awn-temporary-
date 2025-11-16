"use client";
import * as React from "react";
import type { Locale } from "@/lib/i18n";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { GradientSlideButton } from "@/components/ui/gradient-slide-button";
import { RescheduleDialog } from "@/components/RescheduleDialog";
import { Rating } from "@/components/ui/rating";
import { getTherapistById } from "@/lib/therapists";
import { therapists as dataTherapists } from '@/data/therapists';
import type { Appointment } from "@/lib/types";
import { CalendarDays, Clock, MapPin, Star, Video, Home, Filter, Lightbulb, Calendar, Users, MessageSquare, X } from "lucide-react";
import { Shield, AlertTriangle } from 'lucide-react';
import { useMedicalHistoryStatus, getMedicalHistoryLabels } from '@/hooks/use-medical-history-status';
import { createPortal } from 'react-dom';
import { apiService } from '@/lib/api';

type Props = { locale: Locale };

type FeedbackRatings = {
  booking: number;
  communication: number;
  service: number;
  professionalism: number;
  overall: number;
};

export default function ApptsClient({ locale }: Props) {
  const ar = locale === "ar";
  const [activeFilter, setActiveFilter] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [typeFilter, setTypeFilter] = useState<'all' | 'online' | 'home'>('all');
  const [ratings, setRatings] = React.useState<Record<string, number>>({});
  const [feedbackTexts, setFeedbackTexts] = React.useState<Record<string, string>>({});
  const [feedbackRatings, setFeedbackRatings] = React.useState<Record<string, FeedbackRatings>>({});
  const [showFeedback, setShowFeedback] = React.useState<Record<string, boolean>>({});
  
  const [activeFeedbackId, setActiveFeedbackId] = React.useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = React.useState<Record<string, boolean>>({});
  const [submittingFeedback, setSubmittingFeedback] = React.useState<Record<string, boolean>>({});
  const [mounted, setMounted] = React.useState(false);

  // Medical History integration
  const medicalHistory = useMedicalHistoryStatus();
  const labels = getMedicalHistoryLabels(locale);

  // State for appointments - now with cancelled appointments
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([
    {
      id: "thamer-alshahrani",
      therapistId: "thamer-alshahrani",
      date: "2025-11-15",
      time: "10:30",
      status: "upcoming",
      kind: "home",
    },
    {
      id: "alaa-ahmed",
      therapistId: "alaa-ahmed",
      date: "2025-11-20",
      time: "14:00",
      kind: "online",
      status: "upcoming",
      meetLink: "https://meet.google.com/abc-def-ghi",
    },
    {
      id: "khaled-habib",
      therapistId: "khaled-habib",
      date: "2025-11-25",
      time: "16:00",
      kind: "home",
      status: "upcoming",
    },
  ]);

  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([
    {
      id: "abdullah-alshahrani",
      therapistId: "abdullah-alshahrani",
      date: "2025-10-20",
      time: "15:00",
      status: "completed",
      kind: "home",
    },
    {
      id: "thamer-alshahrani",
      therapistId: "thamer-alshahrani",
      date: "2025-10-15",
      time: "11:30",
      kind: "online",
      status: "completed",
    },
    {
      id: "alaa-ahmed",
      therapistId: "alaa-ahmed",
      date: "2025-10-10",
      time: "09:00",
      kind: "home",
      status: "completed",
    },
  ]);

  // New state for cancelled appointments
  const [cancelledAppointments, setCancelledAppointments] = useState<Appointment[]>([]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch appointments from backend and apply a simple auth-guard
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        // Redirect to locale-aware login page when not authenticated
        window.location.href = `/${locale}/login`;
        return;
      }
    }

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const res: any = await apiService.getAppointments();

        const items = Array.isArray(res) ? res : (res?.data || []);

        const mapped: Appointment[] = (items || []).map((it: any) => {
          const therapistFromApi = it.therapists || it.therapist || null;
          // try to resolve a therapist object from local data when only an id/slug is present
          const resolvedLocal = dataTherapists.find(t => String(t.id) === String(it.therapist_id) || String(t.slug) === String(it.therapist_id)) || null;
          return ({
            id: String(it.id),
            therapistId: it.therapist_id || it.therapistId || (therapistFromApi?.id) || '',
            date: it.date || it.booking_date || (it.created_at ? it.created_at.split("T")[0] : ''),
            time: it.time || it.booking_time || '',
            kind: (it.kind || it.session_type || 'home') as 'online' | 'home',
            status: (it.status || 'upcoming') as Appointment['status'],
            meetLink: it.meet_link || it.meetLink || undefined,
            // preserve nested therapist info when present (bookings/joins)
            therapists: therapistFromApi || null,
            // helper to resolve therapist later in render
            __resolvedTherapist: therapistFromApi || resolvedLocal
          });
        });

        if (cancelled) return;

        setUpcomingAppointments(mapped.filter(m => m.status === 'upcoming' || m.status === 'pending'));
        setPastAppointments(mapped.filter(m => m.status === 'completed'));
        setCancelledAppointments(mapped.filter(m => m.status === 'cancelled'));
      } catch (error) {
        console.error('Failed to load appointments', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => { cancelled = true; };
  }, [locale]);

  const handleReschedule = async (appointmentId: string, newDate: Date, newTime: string, mode: string, note?: string) => {
    console.log("Rescheduling appointment:", appointmentId, { newDate, newTime, mode, note });
    // Optimistic UI update
    setUpcomingAppointments(prev => prev.map(apt => 
      apt.id === appointmentId 
        ? { 
            ...apt, 
            date: newDate.toISOString().split('T')[0], 
            time: newTime, 
            kind: mode as "online" | "home" 
          }
        : apt
    ));

    try {
      const payload = {
        date: newDate.toISOString().split('T')[0],
        time: newTime,
        kind: mode,
        note: note || ''
      };

      await apiService.rescheduleAppointment(appointmentId, payload);
      console.log(ar ? "تمت إعادة الجدولة بنجاح" : "Rescheduled successfully");
    } catch (err) {
      console.error('Reschedule failed, reverting UI', err);
      // On failure, refetch appointments or revert optimistic update. For simplicity, remove optimistic change by refetching.
      try {
        const res: any = await apiService.getAppointments();
        const items = Array.isArray(res) ? res : (res?.data || []);
        const mapped: Appointment[] = (items || []).map((it: any) => ({
          id: String(it.id),
          therapistId: it.therapist_id || it.therapistId || (it.therapists?.id) || '',
          date: it.date || it.booking_date || (it.created_at ? it.created_at.split('T')[0] : ''),
          time: it.time || it.booking_time || '',
          kind: (it.kind || it.session_type || 'home') as 'online' | 'home',
          status: (it.status || 'upcoming') as Appointment['status'],
          meetLink: it.meet_link || it.meetLink || undefined,
        }));

        setUpcomingAppointments(mapped.filter(m => m.status === 'upcoming' || m.status === 'pending'));
      } catch (e) {
        console.error('Failed to reload appointments after reschedule error', e);
      }
    }
  };

  const handleCancel = (appointmentId: string) => {
    console.log("Cancelling appointment:", appointmentId);
    // Optimistic UI update: move to cancelled
    const appointmentToCancel = upcomingAppointments.find(apt => apt.id === appointmentId);
    if (appointmentToCancel) {
      setCancelledAppointments(prev => [...prev, { ...appointmentToCancel, status: 'cancelled' }]);
      setUpcomingAppointments(prev => prev.filter(apt => apt.id !== appointmentId));
    }

    (async () => {
      try {
        await apiService.cancelAppointment(appointmentId);
        console.log(ar ? 'تم إلغاء الموعد' : 'Appointment cancelled');
      } catch (err) {
        console.error('Cancel failed, reverting UI', err);
        // Re-fetch appointments to restore correct state
        try {
          const res: any = await apiService.getAppointments();
          const items = Array.isArray(res) ? res : (res?.data || []);
          const mapped: Appointment[] = (items || []).map((it: any) => ({
            id: String(it.id),
            therapistId: it.therapist_id || it.therapistId || (it.therapists?.id) || '',
            date: it.date || it.booking_date || (it.created_at ? it.created_at.split('T')[0] : ''),
            time: it.time || it.booking_time || '',
            kind: (it.kind || it.session_type || 'home') as 'online' | 'home',
            status: (it.status || 'upcoming') as Appointment['status'],
            meetLink: it.meet_link || it.meetLink || undefined,
          }));

          setUpcomingAppointments(mapped.filter(m => m.status === 'upcoming' || m.status === 'pending'));
          setPastAppointments(mapped.filter(m => m.status === 'completed'));
          setCancelledAppointments(mapped.filter(m => m.status === 'cancelled'));
        } catch (e) {
          console.error('Failed to reload appointments after cancel error', e);
        }
      }
    })();
  };

  const handleNewAppointment = () => {
    // Check medical history status before booking
    if (!medicalHistory.isComplete) {
      alert(labels.safetyPrompt);
      window.location.href = `/${locale}/dashboard/medical-history`;
      return;
    }
    window.location.href = `/${locale}/therapists`;
  };

  const handleRate = (appointmentId: string, rating: number) => {
    setRatings(prev => ({ ...prev, [appointmentId]: rating }));
    
    // Show feedback button for all ratings (1-5 stars)
    if (rating > 0) {
      setShowFeedback(prev => ({ ...prev, [appointmentId]: true }));
    } else {
      setShowFeedback(prev => ({ ...prev, [appointmentId]: false }));
      setActiveFeedbackId(null);
    }
    
    console.log("Rating appointment:", appointmentId, rating);
  };

  const handleFeedbackSubmit = async (appointmentId: string) => {
    setSubmittingFeedback(prev => ({ ...prev, [appointmentId]: true }));

    try {
      const payload = {
        ratings: feedbackRatings[appointmentId] || {},
        text: feedbackTexts[appointmentId] || ''
      };

      await apiService.submitFeedback(appointmentId, payload);

      setSubmittingFeedback(prev => ({ ...prev, [appointmentId]: false }));
      setFeedbackSuccess(prev => ({ ...prev, [appointmentId]: true }));

      // Close feedback form after 2 seconds
      setTimeout(() => {
        setActiveFeedbackId(null);
        setFeedbackSuccess(prev => ({ ...prev, [appointmentId]: false }));
      }, 2000);
    } catch (err) {
      console.error('Submit feedback failed', err);
      setSubmittingFeedback(prev => ({ ...prev, [appointmentId]: false }));
    }
  };

  const handleRebook = (appointment: Appointment) => {
    // Check medical history before rebooking
    if (!medicalHistory.isComplete) {
      alert(labels.safetyPrompt);
      window.location.href = `/${locale}/dashboard/medical-history`;
      return;
    }
    // Redirect to therapist's profile page
    // Start booking flow on therapist profile (match FavoritesClient behavior)
    // The profile page sources therapists from `src/data/therapists` which may have different id casing.
    // Try to find the canonical id there (case-insensitive match) and use it if found.
    const matched = dataTherapists.find(t => t.id === appointment.therapistId) || dataTherapists.find(t => t.id.toLowerCase() === appointment.therapistId.toLowerCase());
    const profileId = matched ? matched.id : appointment.therapistId;
    window.location.href = `/${locale}/therapists/${profileId}?book=true`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(ar ? 'ar-SA' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: Appointment['status']) => {
    const statusConfig = {
      upcoming: {
        label: ar ? "قادم" : "Upcoming",
        className: "bg-blue-50 text-blue-700 border-blue-200"
      },
      completed: {
        label: ar ? "مكتمل" : "Completed", 
        className: "bg-green-50 text-green-700 border-green-200"
      },
      cancelled: {
        label: ar ? "ملغى" : "Cancelled",
        className: "bg-red-50 text-red-700 border-red-200"
      }
    } as const;

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-gray-50 text-gray-700 border-gray-200"
    };

    return (
      <Badge variant="outline" className={`${config.className} font-medium text-xs`}>
        {config.label}
      </Badge>
    );
  };

  const getTypeIcon = (kind?: string) => {
    switch (kind) {
      case 'online':
        return <Video className="h-4 w-4" />;
      case 'home':
        return <Home className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (kind?: string) => {
    switch (kind) {
      case 'online':
        return ar ? "أونلاين" : "Online";
      case 'home':
        return ar ? "في المنزل" : "At home";
      default:
        return ar ? "في المنزل" : "At home";
    }
  };

  // Filter appointments by type
  const filterByType = (appointments: Appointment[]) => {
    if (typeFilter === 'all') return appointments;
    return appointments.filter(apt => apt.kind === typeFilter);
  };

  const filteredUpcoming = filterByType(upcomingAppointments);
  const filteredPast = filterByType(pastAppointments);
  const filteredCancelled = filterByType(cancelledAppointments);
  
  const currentAppointments = activeFilter === 'upcoming' 
    ? filteredUpcoming 
    : activeFilter === 'past' 
    ? filteredPast 
    : filteredCancelled;

  const appointmentTips = [
    {
      icon: <Clock className="h-5 w-5 text-blue-500" />,
      text: ar ? "انضم للجلسة الأونلاين قبل 5 دقائق" : "Join online sessions 5 minutes early"
    },
    {
      icon: <Lightbulb className="h-5 w-5 text-amber-500" />,
      text: ar ? "حضر أسئلتك مسبقاً" : "Prepare your questions beforehand"
    },
    {
      icon: <Calendar className="h-5 w-5 text-green-500" />,
      text: ar ? "ألغِ أو أعد الجدولة قبل 24 ساعة على الأقل" : "Cancel or reschedule at least 24 hours in advance"
    }
  ];

  const feedbackQuestions = [
    {
      key: 'booking' as keyof FeedbackRatings,
      label: ar ? "سهولة الحجز" : "Booking Experience",
      description: ar ? "كان الحجز سهلاً ومباشراً" : "Was the booking process easy?",
      icon: " "
    },
    {
      key: 'communication' as keyof FeedbackRatings,
      label: ar ? "التواصل" : "Communication",
      description: ar ? "التواصل مع المعالج كان واضحاً" : "Was communication clear?",
      icon: "💬"
    },
    {
      key: 'service' as keyof FeedbackRatings,
      label: ar ? "جودة الخدمة" : "Service Quality",
      description: ar ? "جودة العلاج كانت ممتازة" : "Was the treatment effective?",
      icon: " "
    },
    {
      key: 'professionalism' as keyof FeedbackRatings,
      label: ar ? "الاحترافية" : "Professionalism",
      description: ar ? "المعالج كان محترفاً ومتخصصاً" : "Was the therapist professional?",
      icon: "👨‍⚕️"
    },
    {
      key: 'overall' as keyof FeedbackRatings,
      label: ar ? "التقييم العام" : "Overall Experience",
      description: ar ? "التجربة العامة كانت مرضية" : "Overall satisfaction?",
      icon: "🌟"
    }
  ];

  // FIXED: Single stable feedback modal component with better mobile layout
  const FeedbackModal = React.useMemo(() => {
    if (!activeFeedbackId || !mounted) return null;

    const appointment = [...upcomingAppointments, ...pastAppointments, ...cancelledAppointments].find(apt => apt.id === activeFeedbackId);
    if (!appointment) return null;

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setFeedbackTexts(prev => ({ ...prev, [activeFeedbackId]: value }));
    };

    const handleRatingChange = (questionKey: keyof FeedbackRatings, value: number) => {
      setFeedbackRatings(prev => ({
        ...prev,
        [activeFeedbackId]: {
          ...prev[activeFeedbackId],
          [questionKey]: value
        }
      }));
    };

    const handleClose = () => {
      setActiveFeedbackId(null);
    };

    return createPortal(
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <div 
          className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl"> </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-800">
                    {ar ? "شاركنا تجربتك" : "Share Your Experience"}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {ar ? "ساعدنا في تحسين خدماتنا" : "Help us improve our services"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
              >
                ×
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[60vh]">
            {feedbackSuccess[activeFeedbackId] ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3"> </div>
                <h4 className="font-bold text-lg text-green-700 mb-2">
                  {ar ? "شكراً لك!" : "Thank you!"}
                </h4>
                <p className="text-sm text-green-600 max-w-xs mx-auto leading-relaxed">
                  {ar ? "تم إرسال ملاحظاتك بنجاح وسنعمل على تحسين خدماتنا" : "Your feedback helps us improve our services"}
                </p>
              </div>
            ) : (
              <>
                {/* Rating Questions */}
                <div className="space-y-4">
                  {feedbackQuestions.map((question) => (
                    <div key={question.key} className="bg-gray-50 rounded-lg p-3 border">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="text-lg flex-shrink-0">{question.icon}</div>
                          <div className="min-w-0">
                            <h5 className="font-semibold text-sm text-gray-800">{question.label}</h5>
                            <p className="text-xs text-gray-600 mt-1 break-words">{question.description}</p>
                          </div>
                        </div>
                        <div className="flex-shrink-0 self-center">
                          <Rating
                            value={feedbackRatings[activeFeedbackId]?.[question.key] || 0}
                            onChange={(value) => handleRatingChange(question.key, value)}
                            size="sm"
                            className="justify-center sm:justify-end"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Optional Text Feedback */}
                <div className="bg-gray-50 rounded-lg p-3 border">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="text-lg">💭</div>
                    <h5 className="font-semibold text-sm text-gray-800">
                      {ar ? "ملاحظات إضافية" : "Additional Comments"}
                    </h5>
                    <span className="text-xs text-gray-500">({ar ? "اختيارية" : "Optional"})</span>
                  </div>
                  <Textarea
                    value={feedbackTexts[activeFeedbackId] || ""}
                    onChange={handleTextChange}
                    placeholder={ar ? "شاركنا أي ملاحظات إضافية..." : "Share any additional thoughts..."}
                    className="text-sm resize-none min-h-[60px] border-gray-200 focus:border-blue-400"
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!feedbackSuccess[activeFeedbackId] && (
            <div className="p-4 sm:p-6 border-t bg-gray-50 flex flex-col sm:flex-row gap-3 sm:justify-between">
              <Button
                onClick={handleClose}
                variant="outline"
                className="transition-all duration-200 hover:scale-105 w-full sm:w-auto order-2 sm:order-1"
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <button
                onClick={() => handleFeedbackSubmit(activeFeedbackId)}
                disabled={submittingFeedback[activeFeedbackId]}
                className="flex h-10 px-6 items-center justify-center rounded-lg text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 w-full sm:w-auto order-1 sm:order-2"
                style={{
                  backgroundColor: '#30846D'
                }}
                onMouseEnter={(e) => {
                  if (!submittingFeedback[activeFeedbackId]) {
                    e.currentTarget.style.backgroundColor = '#2a7460';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!submittingFeedback[activeFeedbackId]) {
                    e.currentTarget.style.backgroundColor = '#30846D';
                  }
                }}
              >
                {submittingFeedback[activeFeedbackId] ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span className="text-sm font-medium">{ar ? "جاري الإرسال..." : "Submitting..."}</span>
                  </div>
                ) : (
                  <span className="text-sm font-semibold">{ar ? "إرسال التقييم" : "Submit Feedback"}</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }, [activeFeedbackId, feedbackRatings, feedbackTexts, feedbackSuccess, submittingFeedback, mounted, ar]);

  const renderAppointmentCard = (appointment: Appointment, showActions: boolean = false) => {
    // prefer API-provided therapist object (appointment.therapists or __resolvedTherapist)
    const apiTher = (appointment as any).therapists || (appointment as any).__resolvedTherapist || null;
    const therapist = apiTher ? {
      name: { en: apiTher.name_en || apiTher.name || '', ar: apiTher.name_ar || apiTher.name_ar || '' },
      specialties: apiTher.specialties || [],
      image: apiTher.avatar_url || apiTher.avatar || apiTher.image || apiTher.image_url || undefined
    } : getTherapistById(appointment.therapistId);
    const hasRating = ratings[appointment.id] > 0;
    const showFeedbackButton = showFeedback[appointment.id] && hasRating;
    
    return (
      <Card key={appointment.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:shadow-2xl hover:-translate-y-1 overflow-hidden">
        <div className="p-4 sm:p-6">
          {/* Mobile-first layout: Stack everything vertically on small screens */}
          <div className="flex flex-col space-y-4">
            
            {/* Therapist Info Section */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <img
                  src={therapist?.image || "/avatar-placeholder.jpg"}
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded-full object-cover transition-transform duration-300 group-hover:scale-110 ring-2 ring-gray-100"
                  alt={therapist?.name.en || "Therapist"}
                />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                  {getTypeIcon(appointment.kind)}
                </div>
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                  <h3 className="text-base sm:text-lg font-semibold truncate text-gray-900">
                    {ar ? therapist?.name.ar : therapist?.name.en || (ar ? "المعالج" : "Therapist")}
                  </h3>
                  {getStatusBadge(appointment.status)}
                </div>
                <p className="text-sm text-gray-600 font-medium break-words">
                  {ar ? therapist?.specialties[1] : therapist?.specialties[0]}
                </p>
              </div>
            </div>

            {/* Appointment Details */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4">
              <span className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full text-sm text-gray-600">
                <CalendarDays className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{formatDate(appointment.date)}</span>
              </span>
              <span className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full text-sm text-gray-600">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>{appointment.time}</span>
              </span>
              <span className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full text-sm text-gray-600">
                {getTypeIcon(appointment.kind)}
                <span>{getTypeLabel(appointment.kind)}</span>
              </span>
            </div>

            {/* Rating Section for completed appointments */}
            {appointment.status === 'completed' && (
              <div className="border-t pt-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-3">
                    {ar ? "قيم التجربة:" : "Rate experience:"}
                  </div>
                  <div className="flex justify-center mb-3">
                    <Rating
                      value={ratings[appointment.id] || 0}
                      onChange={(value) => handleRate(appointment.id, value)}
                      size="md"
                      readonly={false}
                      className="justify-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons Section */}
            <div className="border-t pt-4">
              {/* Upcoming appointment actions */}
              {showActions && appointment.status === 'upcoming' && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <RescheduleDialog
                    appointment={appointment}
                    locale={locale}
                    onReschedule={(newDate, newTime, mode, note) => 
                      handleReschedule(appointment.id, newDate, newTime, mode, note)
                    }
                    trigger={
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="transition-all duration-200 hover:scale-105 active:scale-95 border-[#35757F] text-[#35757F] hover:bg-[#35757F] hover:text-white hover:shadow-md w-full sm:w-auto"
                      >
                        {ar ? "إعادة الجدولة" : "Reschedule"}
                      </Button>
                    }
                  />

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="transition-all duration-200 hover:scale-105 active:scale-95 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 hover:shadow-md w-full sm:w-auto"
                      >
                        {ar ? "إلغاء" : "Cancel"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-center">
                          {ar ? "تأكيد إلغاء الموعد؟" : "Confirm cancellation?"}
                        </AlertDialogTitle>
                      </AlertDialogHeader>
                      <div className="py-4">
                        <p className="text-sm text-gray-600 text-center leading-relaxed">
                          {ar 
                            ? "هل أنت متأكد من إلغاء هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء."
                            : "Are you sure you want to cancel this appointment? This action cannot be undone."
                          }
                        </p>
                      </div>
                      <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-3">
                        <AlertDialogCancel className="w-full sm:w-auto">
                          {ar ? "رجوع" : "Back"}
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleCancel(appointment.id)} 
                          className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                        >
                          {ar ? "نعم، إلغاء" : "Yes, cancel"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {/* Completed appointment actions */}
              {appointment.status === 'completed' && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center sm:justify-end">
                  {showFeedbackButton && (
                    <Button 
                      onClick={() => setActiveFeedbackId(appointment.id)}
                      variant="outline"
                      size="sm"
                      className="transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 w-full sm:w-auto"
                    >
                      {ar ? "ملاحظات" : "Feedback"}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={() => handleRebook(appointment)}
                    variant="outline"
                    size="sm"
                    className="transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-green-50 hover:border-green-200 hover:text-green-700 w-full sm:w-auto"
                  >
                    {ar ? "احجز مرة أخرى" : "Book Again"}
                  </Button>
                </div>
              )}

              {/* Cancelled appointment actions */}
              {appointment.status === 'cancelled' && (
                <div className="flex justify-center">
                  <Button 
                    onClick={() => handleRebook(appointment)}
                    variant="outline"
                    size="sm"
                    className="transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-green-50 hover:border-green-200 hover:text-green-700 w-full sm:w-auto"
                  >
                    {ar ? "احجز مرة أخرى" : "Book Again"}
                  </Button>
                </div>
              )}

              {/* Join Session Button for upcoming online appointments */}
              {appointment.status === 'upcoming' && appointment.kind === 'online' && appointment.meetLink && (
                <div className="mt-3 pt-3 border-t">
                  <Button 
                    onClick={() => window.open(appointment.meetLink, '_blank')}
                    className="transition-all duration-200 hover:scale-105 active:scale-95 text-white hover:shadow-lg w-full"
                    size="sm"
                    style={{
                      backgroundColor: '#30846D'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a7460';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#30846D';
                    }}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    {ar ? "انضم للجلسة" : "Join Session"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-4 sm:py-8" dir={ar ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{ar ? "المواعيد" : "Appointments"}</h1>
        <p className="text-gray-600 mt-2 text-sm sm:text-base">
          {ar ? "إدارة مواعيدك مع المعالجين" : "Manage your appointments with therapists"}
        </p>
      </div>

      {/* FIXED: Mobile-First Filter Section */}
      <div className="mb-6 sm:mb-8 space-y-4">
        {/* Main Filter Tabs - Mobile-first design */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Tab Buttons - Full width on mobile, segmented control on desktop */}
          <div className="w-full lg:w-auto">
            <div className="grid grid-cols-3 lg:flex lg:bg-gray-100 lg:p-1 lg:rounded-xl lg:shadow-inner gap-1 lg:gap-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter('upcoming')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 lg:px-6 lg:py-2 transition-all duration-200 text-sm font-medium ${
                  activeFilter === 'upcoming' 
                    ? 'bg-white shadow-sm text-gray-900 lg:shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                <span className="hidden sm:inline">{ar ? "قادمة" : "Upcoming"}</span>
                <span className="sm:hidden">{ar ? "قادمة" : "Up"}</span>
                {filteredUpcoming.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs bg-blue-100 text-blue-700 lg:bg-blue-100 lg:text-blue-700">
                    {filteredUpcoming.length}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter('past')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 lg:px-6 lg:py-2 transition-all duration-200 text-sm font-medium ${
                  activeFilter === 'past' 
                    ? 'bg-white shadow-sm text-gray-900 lg:shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">{ar ? "سابقة" : "Past"}</span>
                <span className="sm:hidden">{ar ? "سابقة" : "Past"}</span>
                {filteredPast.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs bg-green-100 text-green-700">
                    {filteredPast.length}
                  </Badge>
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter('cancelled')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 lg:px-6 lg:py-2 transition-all duration-200 text-sm font-medium ${
                  activeFilter === 'cancelled' 
                    ? 'bg-white shadow-sm text-gray-900 lg:shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">{ar ? "ملغية" : "Cancelled"}</span>
                <span className="sm:hidden">{ar ? "ملغية" : "Cancel"}</span>
                {filteredCancelled.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs bg-red-100 text-red-700">
                    {filteredCancelled.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* FIXED: Book New Appointment Button - Full width on mobile, auto on desktop */}
          <div className="w-full lg:w-auto">
            <GradientSlideButton 
              onClick={handleNewAppointment}
              className="transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl w-full lg:w-auto"
            >
              {ar ? "احجز موعد جديد" : "Book New Appointment"}
            </GradientSlideButton>
          </div>
        </div>

        {/* Type Filter - Mobile responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="h-4 w-4" />
            <span>{ar ? "تصفية حسب النوع:" : "Filter by type:"}</span>
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: ar ? 'الكل' : 'All', icon: Users },
              { key: 'online', label: ar ? 'أونلاين' : 'Online', icon: Video },
              { key: 'home', label: ar ? 'المنزل' : 'Home', icon: Home }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={typeFilter === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTypeFilter(key as any)}
                className={`transition-all duration-200 hover:scale-105 active:scale-95 flex-1 sm:flex-none ${
                  typeFilter === key 
                    ? 'bg-teal-600 text-white hover:bg-teal-700' 
                    : 'hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200'
                }`}
              >
                <Icon className="h-4 w-4 mr-1" />
                <span className="text-xs sm:text-sm">{label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Medical History Reminder - Stack nicely on mobile */}
      {medicalHistory.isComplete && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-start gap-3 flex-1">
              <Shield className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm text-teal-700 font-medium break-words">
                  {labels.therapistReviews}
                </p>
                <p className="text-sm text-teal-600 mt-1 break-words">
                  {labels.anyChanges}
                </p>
              </div>
            </div>
            <Button
              onClick={() => window.location.href = `/${locale}/dashboard/medical-history`}
              size="sm"
              variant="outline"
              className="border-teal-300 text-teal-700 hover:bg-teal-100 w-full sm:w-auto"
            >
              {labels.updateHistory}
            </Button>
          </div>
        </div>
      )}

      {/* Appointment Tips - Mobile responsive grid */}
      <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="p-4 sm:p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            {ar ? "نصائح للمواعيد" : "Appointment Tips"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {appointmentTips.map((tip, index) => (
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
        {loading ? (
          <Card className="text-center py-12 sm:py-16 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-md mx-auto px-4">
              <div className="mx-auto h-12 w-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">{ar ? 'جاري جلب المواعيد...' : 'Loading appointments...'}</h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-sm sm:text-base">{ar ? 'الرجاء الانتظار بينما نصل ببيانات مواعيدك' : 'Please wait while we fetch your appointments'}</p>
            </div>
          </Card>
        ) : currentAppointments.length === 0 ? (
          <Card className="text-center py-12 sm:py-16 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-md mx-auto px-4">
              {activeFilter === 'upcoming' ? (
                <CalendarDays className="mx-auto h-16 sm:h-24 w-16 sm:w-24 text-gray-300 mb-6" />
              ) : activeFilter === 'past' ? (
                <Clock className="mx-auto h-16 sm:h-24 w-16 sm:w-24 text-gray-300 mb-6" />
              ) : (
                <X className="mx-auto h-16 sm:h-24 w-16 sm:w-24 text-gray-300 mb-6" />
              )}
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                {activeFilter === 'upcoming' 
                  ? (ar ? "لا توجد مواعيد قادمة" : "No upcoming appointments")
                  : activeFilter === 'past'
                  ? (ar ? "لا توجد مواعيد سابقة" : "No past appointments")
                  : (ar ? "لا توجد مواعيد ملغية" : "No cancelled appointments")
                }
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-sm sm:text-base">
                {activeFilter === 'upcoming' 
                  ? (ar ? "ابدأ رحلة العلاج الطبيعي مع أفضل المعالجين" : "Start your physiotherapy journey with the best therapists")
                  : activeFilter === 'past'
                  ? (ar ? "ستظهر مواعيدك المكتملة هنا مع إمكانية التقييم" : "Your completed appointments will appear here with rating options")
                  : (ar ? "ستظهر المواعيد الملغية هنا" : "Cancelled appointments will appear here")
                }
              </p>
              {activeFilter === 'upcoming' && (
                <GradientSlideButton 
                  onClick={handleNewAppointment}
                  className="transition-all duration-200 hover:scale-105 active:scale-95 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg hover:shadow-xl w-full sm:w-auto"
                >
                  {ar ? "احجز أول موعد" : "Book Your First Appointment"}
                </GradientSlideButton>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {activeFilter === 'upcoming' 
                  ? (ar ? "المواعيد القادمة" : "Upcoming Appointments")
                  : activeFilter === 'past'
                  ? (ar ? "المواعيد السابقة" : "Past Appointments")
                  : (ar ? "المواعيد الملغية" : "Cancelled Appointments")
                }
              </h2>
              <Badge variant="outline" className="text-sm font-medium w-fit">
                {currentAppointments.length} {ar ? "موعد" : "appointments"}
              </Badge>
            </div>
            <div className="grid gap-4 sm:gap-6">
              {currentAppointments.map(appointment => 
                renderAppointmentCard(appointment, activeFilter === 'upcoming')
              )}
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {FeedbackModal}
    </div>
  );
}