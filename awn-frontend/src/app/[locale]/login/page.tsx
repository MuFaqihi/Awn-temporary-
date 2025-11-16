import { use } from 'react';
import LoginPage from '@/components/login';
import type { Locale } from '@/lib/i18n';

export default function Page({ params }: { params: { locale: Locale } }) {
  const locale = params.locale;
  return <LoginPage locale={locale} />;
}