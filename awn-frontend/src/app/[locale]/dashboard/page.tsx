import { use } from "react";
import type { Locale } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardClient from "./DashboardClient";

export default function Page({ params }: { params: { locale: Locale } }) {
  const locale = params.locale;
  
  return (
    <DashboardLayout locale={locale}>
      <DashboardClient locale={locale} />
    </DashboardLayout>
  );
}