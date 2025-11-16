import { use } from "react";
import type { Locale } from "@/lib/i18n";
import DashboardTherapistsLayout from "@/components/DashboardTherapistsLayout";
import Apptherapist from "./Apptherapist";

export default function Page({ params }: { params: { locale: Locale } }) {
  const locale = params.locale;

  return (
    <DashboardTherapistsLayout locale={locale}>
      <Apptherapist locale={locale} />
    </DashboardTherapistsLayout>
  );
}
