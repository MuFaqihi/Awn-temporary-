import { use } from 'react'
import type { Locale } from '@/lib/i18n'

export default function TermsPage({ params }: { params: { locale: Locale } }) {
  const locale = params.locale
  const isArabic = locale === 'ar'

  const content = isArabic ? {
    title: "الشروط والأحكام",
    lastUpdated: "آخر تحديث: 30 أكتوبر 2024",
    // Arabic terms content...
  } : {
    title: "Terms and Conditions",
    lastUpdated: "Last updated: October 30, 2024",
    // English terms content...
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {content.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {content.lastUpdated}
          </p>
          
          {/* Terms content */}
          <div className="prose dark:prose-invert max-w-none">
            <h2>{isArabic ? "1. قبول الشروط" : "1. Acceptance of Terms"}</h2>
            <p>
              {isArabic 
                ? "باستخدامك لمنصة عون، فإنك توافق على الالتزام بهذه الشروط والأحكام..."
                : "By using the Awn platform, you agree to be bound by these terms and conditions..."
              }
            </p>
            
            {/* Add more terms sections */}
          </div>
        </div>
      </div>
    </div>
  )
}