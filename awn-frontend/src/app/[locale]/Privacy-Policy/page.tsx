import type { Locale } from '@/lib/i18n'

export default function PrivacyPage({ params }: { params: { locale: Locale } }) {
  const { locale } = params
  const isArabic = locale === 'ar'

  const content = isArabic ? {
    title: "سياسة الخصوصية",
    lastUpdated: "آخر تحديث: 30 أكتوبر 2024",
  } : {
    title: "Privacy Policy",
    lastUpdated: "Last updated: October 30, 2024",
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
          
          <div className="prose dark:prose-invert max-w-none">
            <h2>{isArabic ? "1. جمع المعلومات" : "1. Information Collection"}</h2>
            <p>
              {isArabic 
                ? "نقوم بجمع المعلومات التي تقدمها لنا مباشرة..."
                : "We collect information you provide directly to us..."
              }
            </p>
            
            {/* Add more privacy sections */}
          </div>
        </div>
      </div>
    </div>
  )
}