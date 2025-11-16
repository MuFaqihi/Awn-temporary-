import * as React from "react";
import type { Locale } from "@/lib/i18n";
import DashboardTherapistsLayout from "@/components/DashboardTherapistsLayout";
import PatientsTherapists from "./PatientsTherapists";

//   هذا هو الملف السيرفري الذي يفك الـ params باستخدام React.use()
export default function PatientsPage({
  params,
}: {
    params: { locale: Locale };
}) {
    const { locale } = params; 
  return (
    <DashboardTherapistsLayout locale={locale}>
      <PatientsTherapists locale={locale} />
    </DashboardTherapistsLayout>
  );
}
