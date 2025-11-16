import SignUpPage from '@/components/sign-up';
import type { Locale } from '@/lib/i18n';

export default function Page({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  return <SignUpPage locale={locale} />;
}