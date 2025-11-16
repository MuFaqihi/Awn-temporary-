"use client";
import * as React from "react";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Video, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTherapistById } from "@/lib/therapists";
import type { Appointment } from "@/lib/types";

interface RescheduleDialogProps {
  appointment: Appointment;
  locale: Locale;
  trigger: React.ReactNode;
  onReschedule: (newDate: Date, newTime: string, mode: string, note?: string) => Promise<void>;
}

export function RescheduleDialog({ appointment, locale, trigger, onReschedule }: RescheduleDialogProps) {
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [mode, setMode] = useState<string>(appointment.kind);
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const therapist = getTherapistById(appointment.therapistId);
  // Prefer therapist data returned by API when present on the appointment
  const apiTherapist = (appointment as any).therapists || null;
  const therapistResolved = apiTherapist ? {
    name: { en: apiTherapist.name_en || apiTherapist.name || '', ar: apiTherapist.name_ar || '' },
    image: apiTherapist.avatar_url || apiTherapist.avatar || apiTherapist.image || therapist?.image,
    specialties: apiTherapist.specialties || therapist?.specialties || []
  } : {
    name: { en: therapist?.name?.en || therapist?.name || '', ar: therapist?.name?.ar || '' },
    image: therapist?.image,
    specialties: therapist?.specialties || []
  };

  // Mock available time slots
  const availableSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
  ];

  // Generate available dates including all of 2026 (Sunday to Thursday)
  const generateAvailableDates = (): string[] => {
    const dates: string[] = [];
    const today = new Date();
    
    // Add remaining days from current month and year
    for (let i = 1; i <= 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip Fridays (5) and Saturdays (6)
      if (date.getDay() !== 5 && date.getDay() !== 6) {
        dates.push(toLocalISODate(date));
      }
    }
    
    // Add all working days for 2026 (Sunday to Thursday)
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(2026, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(2026, month, day);
        const dayOfWeek = date.getDay();
        
        // Include Sunday (0), Monday (1), Tuesday (2), Wednesday (3), Thursday (4)
        // Exclude Friday (5) and Saturday (6)
        if (dayOfWeek >= 0 && dayOfWeek <= 4) {
          dates.push(toLocalISODate(date));
        }
      }
    }
    
    return dates.sort();
  };

  // Convert a Date to a local YYYY-MM-DD string (avoid UTC offset issues)
  function toLocalISODate(d: Date) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const availableDates = generateAvailableDates();

  const formatCurrentDate = () => {
    const date = new Date(appointment.date);
    return date.toLocaleDateString(ar ? 'ar-SA' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNewDate = () => {
    if (!selectedDate) return "";
    const date = new Date(selectedDate);
    return date.toLocaleDateString(ar ? 'ar-SA' : 'en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isWithinCutoff = () => {
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    const now = new Date();
    const hoursDiff = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff < 24;
  };

  // Remove the cutoff restriction for now
  const canReschedule = true; // Changed from !isWithinCutoff()

  const handleDateSelect = (dateStr: string) => {
    // dateStr is expected in YYYY-MM-DD (local) format
    setSelectedDate(dateStr);
    setSelectedTime(""); // Reset time when date changes
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;
    
    setIsSubmitting(true);
    try {
      const newDate = new Date(selectedDate);
      await onReschedule(newDate, selectedTime, mode, note);
      setOpen(false);
      // Reset form
      setSelectedDate("");
      setSelectedTime("");
      setNote("");
      setMode(appointment.kind); // Reset to original mode
    } catch (error) {
      console.error("Failed to reschedule:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fix form validation - make sure all required fields are filled
  const isFormValid = Boolean(selectedDate && selectedTime && mode);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {ar ? "إعادة جدولة الموعد" : "Reschedule Appointment"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Appointment Context */}
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center gap-3 mb-2">
              <img 
                src={therapistResolved.image || "/avatar-placeholder.jpg"} 
                className="h-10 w-10 rounded-full object-cover" 
                alt={therapistResolved.name?.en || "Therapist"} 
              />
              <div>
                <div className="font-medium">
                  {ar ? therapist?.name.ar : therapist?.name.en}
                </div>
                <div className="text-sm text-muted-foreground">
                  {(ar ? therapistResolved.specialties?.[0] : therapistResolved.specialties?.[0]) || ''}
                </div>
              </div>
            </div>
            <div className="text-sm">
              <span className="font-medium">
                {ar ? "الموعد الحالي:" : "Currently:"}
              </span>{" "}
              {formatCurrentDate()} • {appointment.time} • {" "}
              {appointment.kind === "online" ? (
                <Badge variant="secondary" className="text-xs">
                  <Video className="h-3 w-3 mr-1" />
                  {ar ? "أونلاين" : "Online"}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  {ar ? "زيارة منزلية" : "Home visit"}
                </Badge>
              )}
            </div>
          </Card>

          {/* Step A: Date & Time Selection */}
          <div className="space-y-4">
            <h3 className="font-semibold">
              {ar ? "اختر تاريخ ووقت جديد" : "Pick new date & time"}
            </h3>
            
            {/* Calendar */}
            <div className="flex justify-center">
              <Calendar
                selected={selectedDate ? new Date(selectedDate) : undefined}
                onSelect={(date) => {
                  if (date) {
                    handleDateSelect(toLocalISODate(date));
                  }
                }}
                disabled={(date) => {
                  const dateStr = toLocalISODate(date);
                  return !availableDates.includes(dateStr);
                }}
                initialFocus
              />
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm">
                  {ar ? "الأوقات المتاحة:" : "Available times:"}
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot}
                      variant={selectedTime === slot ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTime(slot)}
                      className={cn(
                        "text-xs",
                        selectedTime === slot && "bg-primary text-primary-foreground"
                      )}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step B: Options */}
          {selectedDate && selectedTime && (
            <div className="space-y-4">
              <h3 className="font-semibold">
                {ar ? "خيارات الجلسة" : "Session options"}
              </h3>
              
              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {ar ? "نوع الجلسة:" : "Session type:"}
                </label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className="bg-white border border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300 shadow-lg">
                    <SelectItem value="online" className="bg-white hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        {ar ? "جلسة أونلاين" : "Online session"}
                      </div>
                    </SelectItem>
                    <SelectItem value="home" className="bg-white hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {ar ? "زيارة منزلية" : "Home visit"}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Optional Note */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {ar ? "ملاحظة للمعالج (اختيارية):" : "Note to therapist (optional):"}
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={ar ? "مثل: أفضل المواعيد المسائية" : "e.g., Need afternoon please"}
                  className="text-sm bg-white"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Confirmation Summary */}
          {isFormValid && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <h4 className="font-semibold mb-2">
                {ar ? "ملخص الموعد الجديد:" : "New appointment summary:"}
              </h4>
              <div className="text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{ar ? therapistResolved.name.ar : therapistResolved.name.en}</span>
                  <span>•</span>
                  <span>{formatNewDate()}</span>
                  <span>•</span>
                  <span>{selectedTime}</span>
                  <span>•</span>
                  {mode === "online" ? (
                    <Badge variant="secondary" className="text-xs">
                      <Video className="h-3 w-3 mr-1" />
                      {ar ? "أونلاين" : "Online"}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {ar ? "زيارة منزلية" : "Home visit"}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          )}

          

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t mt-6">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100 bg-teal-600 hover:bg-teal-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {ar ? "جاري التحديث..." : "Updating..."}
                </div>
              ) : (
                ar ? "تأكيد إعادة الجدولة" : "Confirm Reschedule"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}