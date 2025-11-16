// Therapist type
export interface Therapist {
  id: string;
  name: string;
  nameAr: string;
  specialty: string;
  specialtyAr: string;
  avatar: string;
  rating: number;
  experience: number;
  location: string;
  locationAr: string;
  bio: string;
  bioAr: string;
  price: number;
  currency: string;
  isOnline: boolean;
  isClinic: boolean;
  languages: string[];
  education: string[];
  certifications: string[];
}

// Appointment type (for patients)
export interface Appointment {
  id: string;
  therapistId: string;
  date: string;
  time: string;
  kind: 'online' | 'home';
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending';

  place?: string;
  meetLink?: string;
  cancelReason?: string;
}

export type TherapistAppointment = Omit<Appointment, "therapistId"> & {
  patientName?: string;
  patientNameEn?: string;
}

// Treatment plan type
export interface TreatmentPlan {
  id: string;
  therapistId: string;
  title: string;
  steps: string[];
  createdAt: string;
  status:
    | "proposed"
    | "pending"
    | "accepted"
    | "declined"
    | "in-progress"
    | "completed"
    | "cancelled";
  completedSteps?: number;
}

export type Locale = 'ar' | 'en';
export type AuthoredBy = 'user' | 'therapist';


export * from '@/lib/medical-history';
