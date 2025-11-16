import { Locale } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import SettingsClient from "./SettingsClient";

interface SettingsPageProps {
  params: {
    locale: Locale;
  };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  // `params` is provided synchronously by Next.js; don't await it
  const locale = params.locale;

  return (
    <DashboardLayout locale={locale}>
      <SettingsClient locale={locale} />
    </DashboardLayout>
  );
}