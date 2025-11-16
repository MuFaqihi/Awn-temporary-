"use client"

import { useState } from "react"
import Link from "next/link"
import { Share2, MapPin, Clock, Users, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import JobApplicationForm from "@/components/job-application-form"
import type { Locale } from "@/lib/i18n"

export default function JobListingPage({
  params,
}: {
  params: { locale: Locale }
}) {
  const { locale } = params
  const isArabic = locale === "ar"

  const [showApplication, setShowApplication] = useState(false)

  const content = isArabic ? {
    // Arabic content
    jobTitle: "أخصائي علاج طبيعي (مرخص)",
    location: "الرياض، المملكة العربية السعودية",
    contract: "دوام كامل / دوام جزئي / عمل حر",
    compensation: "راتب تنافسي",
    department: "شبكة الرعاية",
    posted: "نُشر منذ 3 أيام",
    shareJob: "مشاركة الوظيفة",
    aboutTitle: "عن عَون",
    about: "نحن منصة رقمية تهدف لجعل العلاج الطبيعي متاحًا للجميع في المملكة. نؤمن بالثقة والأمان في الرعاية الصحية، ونسعى لتحقيق أفضل النتائج للمرضى من خلال شبكة أخصائيين مرخصين ومعتمدين.",
    jobDescTitle: "وصف الوظيفة",
    responsibilities: [
      "تقييم حالة المرضى ووضع خطط العلاج المناسبة",
      "تنفيذ جلسات العلاج الطبيعي وفقاً للمعايير المهنية",
      "توثيق التقدم وكتابة التقارير الطبية",
      "متابعة المرضى وتقييم النتائج",
      "تقديم الاستشارات عبر المنصات الرقمية",
      "تثقيف المرضى حول التمارين المنزلية",
      "الالتزام بمعايير الخصوصية والسرية الطبية"
    ],
    requirements: [
      "ترخيص ساري من هيئة التخصصات الصحية (SCFHS)",
      "بكالوريوس في العلاج الطبيعي أو أعلى",
      "خبرة لا تقل عن سنة واحدة",
      "إجادة اللغة العربية أو الإنجليزية أو كليهما",
      "حق العمل في المملكة العربية السعودية"
    ],
    benefits: [
      "مرونة في تحديد مواعيد العمل",
      "دعم في جذب المرضى من خلال المنصة",
      "أدوات تقنية متطورة لإدارة الجلسات",
      "دفعات شهرية منتظمة",
      "دعم فني ومراجعة جودة مستمرة"
    ],
    process: [
      "مراجعة الملف الشخصي",
      "التحقق من الوثائق والتراخيص",
      "مكالمة توجيهية وتدريبية",
      "البدء في استقبال المرضى"
    ],
    applyNow: "أريد التقديم",
    contactUs: "أسئلة؟ تواصل معنا"
  } : {
    // English content
    jobTitle: "Physiotherapist (Licensed)",
    location: "Riyadh, Saudi Arabia",
    contract: "Full-time / Part-time / Freelance",
    compensation: "Competitive Salary",
    department: "Care Network",
    posted: "Posted 3 days ago",
    shareJob: "Share Job",
    aboutTitle: "About Awn",
    about: "We are a digital platform making physiotherapy accessible to everyone in Saudi Arabia. We believe in trust and safety in healthcare, striving for the best patient outcomes through a network of licensed and certified specialists.",
    jobDescTitle: "Job Description",
    responsibilities: [
      "Assess patient conditions and develop appropriate treatment plans",
      "Deliver physiotherapy sessions according to professional standards",
      "Document progress and write medical reports",
      "Follow up with patients and evaluate outcomes",
      "Provide consultations through digital platforms",
      "Educate patients on home exercises",
      "Adhere to privacy and medical confidentiality standards"
    ],
    requirements: [
      "Active SCFHS license",
      "Bachelor's degree in Physiotherapy or higher",
      "Minimum 1 year of experience",
      "Fluency in Arabic or English or both",
      "Right to work in Saudi Arabia"
    ],
    benefits: [
      "Flexible scheduling",
      "Patient acquisition support through platform",
      "Advanced technical tools for session management",
      "Regular monthly payments",
      "Technical support and continuous quality review"
    ],
    process: [
      "Profile review",
      "Document and license verification",
      "Onboarding and training call",
      "Start receiving patients"
    ],
    applyNow: "I'm Interested",
    contactUs: "Questions? Contact Us"
  }

  const handleShare = async () => {
    const shareData = {
      title: content.jobTitle,
      text: `${content.jobTitle} - ${content.location}`,
      url: window.location.href,
    }

    try {
      if (navigator.share) {
        // Use native sharing if available (works on mobile)
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url)
        alert(isArabic ? "تم نسخ الرابط!" : "Link copied!")
      }
    } catch (err) {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareData.url)
        alert(isArabic ? "تم نسخ الرابط!" : "Link copied!")
      } catch (clipboardErr) {
        console.error('Sharing failed:', clipboardErr)
      }
    }
  }

  if (showApplication) {
    return <JobApplicationForm locale={locale} onBack={() => setShowApplication(false)} />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto p-6">
        
        {/* Job Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {content.jobTitle}
              </h1>
              
              <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-300 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{content.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={16} />
                  <span>{content.contract}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} />
                  <span>{content.department}</span>
                </div>
              </div>

              <div className="text-lg font-semibold text-emerald-600 mb-2">
                {content.compensation}
              </div>

              <div className="text-sm text-gray-500">
                <span>{content.posted}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => setShowApplication(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {content.applyNow}
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 size={16} className="mr-1" />
                {content.shareJob}
              </Button>
            </div>
          </div>
        </div>

        {/* About Company */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {content.aboutTitle}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            {content.about}
          </p>
        </div>

        {/* Job Description */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            {content.jobDescTitle}
          </h2>

          {/* Responsibilities */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {isArabic ? "المسؤوليات" : "Responsibilities"}
            </h3>
            <ul className="space-y-3">
              {content.responsibilities.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-emerald-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {isArabic ? "المتطلبات" : "Requirements"}
            </h3>
            <ul className="space-y-3">
              {content.requirements.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-emerald-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {isArabic ? "ما ستحصل عليه" : "What You Get"}
            </h3>
            <ul className="space-y-3">
              {content.benefits.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle size={16} className="text-emerald-600 mt-1 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Process */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {isArabic ? "عملية التقديم" : "Application Process"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {content.process.map((step, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-2 text-sm font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {isArabic ? "مستعد للانضمام؟" : "Ready to Join?"}
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setShowApplication(true)}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {content.applyNow}
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href={`/${locale}/contact`}>
                {content.contactUs}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}