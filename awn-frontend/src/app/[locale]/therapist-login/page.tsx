import { use } from 'react';
import TherapistLoginPage from '@/components/therapist-login';
import type { Locale } from '@/lib/i18n';

export default function Page({ params }: { params: { locale: Locale } }) {
  const locale = params.locale;
  return <TherapistLoginPage locale={locale} />;
}