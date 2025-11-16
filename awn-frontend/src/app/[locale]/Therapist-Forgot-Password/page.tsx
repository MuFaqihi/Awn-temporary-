import { use } from 'react';
import TherapistForgotPasswordPage from '@/components/therapist-forgot-password';
import type { Locale } from '@/lib/i18n';

export default function Page({ params }: { params: { locale: Locale } }) {
  const locale = params.locale;
  
  return <TherapistForgotPasswordPage locale={locale} />;
}