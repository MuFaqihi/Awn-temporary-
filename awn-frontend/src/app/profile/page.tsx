import React from "react";
import Login from "@/components/login";
import type { Locale } from "@/lib/i18n";

export default function LoginPage({ params }: { params: { locale: Locale } }) {
  const locale = params.locale;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">
          {locale === "ar" ? "تسجيل الدخول" : "Login"}
        </h1>
        <React.Suspense fallback={<div />}>
          <Login locale={locale} />
        </React.Suspense>
      </div>
    </div>
  );
}
