import type { Locale } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import PlansClient from "./PlansClient";

export default function Page({ params }: { params: { locale: Locale } }) {
  const { locale } = params;
  
  return (
    <DashboardLayout locale={locale}>
      <PlansClient locale={locale} />
    </DashboardLayout>
  );
}