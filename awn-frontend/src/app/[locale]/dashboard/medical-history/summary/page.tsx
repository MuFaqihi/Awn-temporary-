"use client";
import React from 'react';
import type { Locale } from '@/lib/types';
import DashboardLayout from '@/components/DashboardLayout';
import MedicalHistorySummary from '@/components/medical-history/MedicalHistorySummary';

interface Props {
  params: {
    locale: Locale;
  };
}

export default function MedicalHistorySummaryPage({ params }: Props) {
  const locale = params.locale;
  
  return (
    <DashboardLayout locale={locale}>
      <MedicalHistorySummary locale={locale} />
    </DashboardLayout>
  );
}