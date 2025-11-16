import { use } from 'react';
import ClientForgotPasswordPage from '@/components/client-forgot-password';
import type { Locale } from '@/lib/i18n';

export default function Page({ params }: { params: { locale: Locale } }) {
  const locale = params.locale;
  
  return <ClientForgotPasswordPage locale={locale} />;
}