// src/components/contact-section.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { API_BASE_URL } from '@/lib/api'

type Locale = "ar" | "en";

const BRAND = "#013D5B";

export default function ContactSection({ locale = "ar" }: { locale?: Locale }) {
  const isAr = locale === "ar";
  const dir = isAr ? "rtl" : "ltr";

  // controlled selects
  const [role, setRole] = React.useState<string>("");
  const [city, setCity] = React.useState<string>("");
  const [topic, setTopic] = React.useState<string>("");

  // form state
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData(e.currentTarget);
      
      // تحضير البيانات للإرسال
      const contactData = {
        first_name: formData.get("firstName") as string,
        last_name: formData.get("lastName") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string || "",
        role: role,
        city: city,
        topic: topic,
        message: formData.get("message") as string,
        locale: locale
      };
//هنا الاتصال مع الباك عبر الرابط
      const response = await fetch(`${API_BASE_URL}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData)
      });

      const result = await response.json();

      if (result.success) {
        setSent(true);
        // إعادة تعيين الحقول
        setRole("");
        setCity("");
        setTopic("");
        e.currentTarget.reset();
      } else {
        setError(isAr ? "فشل في إرسال الرسالة، يرجى المحاولة مرة أخرى" : "Failed to send message, please try again");
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(isAr ? "حدث خطأ في الإرسال" : "An error occurred while sending");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section dir={dir} className="pb-24">
      {/* Page hero */}
      <div className="relative bg-gradient-to-b from-transparent to-zinc-50 dark:to-transparent">
        <div className="mx-auto max-w-6xl px-6 pt-14 sm:pt-16 md:pt-20">
          <h1 className="text-3xl font-semibold sm:text-4xl md:text-5xl">
            {isAr ? "تواصل معنا" : "Contact Us"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            {isAr
              ? "سنساعدك في اختيار الخطة المناسبة والإجابة عن استفساراتك حول عون."
              : "We'll help you choose the right plan and answer any questions about Awn."}
          </p>
        </div>
      </div>

      {/* Main grid */}
      <div className="mx-auto mt-10 max-w-6xl px-6 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
        {/* Left: Form (larger, breathable) */}
        <Card className="p-6 sm:p-8 md:p-10 shadow-md">
          <form onSubmit={onSubmit} className="space-y-6">
            {/* Name */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm">
                  {isAr ? "الاسم الأول" : "First name"}
                </Label>
                <Input 
                  id="name" 
                  name="firstName" 
                  required 
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last" className="text-sm">
                  {isAr ? "اسم العائلة" : "Last name"}
                </Label>
                <Input 
                  id="last" 
                  name="lastName" 
                  required 
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Email / Phone */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm">
                  {isAr ? "البريد الإلكتروني" : "Email"}
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm">
                  {isAr ? "رقم الجوال (اختياري)" : "Phone (optional)"}
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  inputMode="tel"
                  placeholder={isAr ? "05xxxxxxxx" : "+966 5x xxx xxxx"}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* 3 selects in two rows */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Role */}
              <div className="space-y-2">
                <Label className="text-sm">
                  {isAr ? "أنت" : "You are a"}
                </Label>
                <Select value={role} onValueChange={setRole} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={isAr ? "اختر دورك" : "Select your role"}
                    />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={6}
                    className="z-[60] w-[var(--radix-select-trigger-width)]"
                  >
                    <SelectItem value="patient">
                      {isAr ? "مريض/مستفيد" : "Patient / Client"}
                    </SelectItem>
                    <SelectItem value="therapist">
                      {isAr ? "أخصائي علاج طبيعي" : "Physiotherapist"}
                    </SelectItem>
                    <SelectItem value="other">
                      {isAr ? "أخرى" : "Other"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div className="space-y-2">
                <Label className="text-sm">
                  {isAr ? "المدينة/المنطقة" : "City / Region"}
                </Label>
                <Select value={city} onValueChange={setCity} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={isAr ? "اختر المدينة" : "Select city"}
                    />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={6}
                    className="z-[60] w-[var(--radix-select-trigger-width)]"
                  >
                    <SelectItem value="riyadh">
                      {isAr ? "الرياض" : "Riyadh"}
                    </SelectItem>
                    <SelectItem value="jeddah">
                      {isAr ? "جدة" : "Jeddah"}
                    </SelectItem>
                    <SelectItem value="dammam">
                      {isAr ? "الدمام" : "Dammam"}
                    </SelectItem>
                    <SelectItem value="khobar">
                      {isAr ? "الخبر" : "Khobar"}
                    </SelectItem>
                    <SelectItem value="makkah">
                      {isAr ? "مكة" : "Makkah"}
                    </SelectItem>
                    <SelectItem value="madinah">
                      {isAr ? "المدينة المنورة" : "Madinah"}
                    </SelectItem>
                    <SelectItem value="qassim">
                      {isAr ? "القصيم" : "Qassim"}
                    </SelectItem>
                    <SelectItem value="abha">
                      {isAr ? "أبها" : "Abha"}
                    </SelectItem>
                    <SelectItem value="tabuk">
                      {isAr ? "تبوك" : "Tabuk"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Topic (full width on next row) */}
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-sm">
                  {isAr ? "نوع الاستفسار" : "Inquiry type"}
                </Label>
                <Select value={topic} onValueChange={setTopic} disabled={submitting}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={isAr ? "اختر نوع الاستفسار" : "Select a topic"}
                    />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    sideOffset={6}
                    className="z-[60] w-[var(--radix-select-trigger-width)]"
                  >
                    <SelectItem value="booking">
                      {isAr ? "مشكلة في الحجز" : "Booking issue"}
                    </SelectItem>
                    <SelectItem value="verification">
                      {isAr ? "توثيق الأخصائيين" : "Therapist verification"}
                    </SelectItem>
                    <SelectItem value="pricing">
                      {isAr ? "الأسعار والباقات" : "Pricing & plans"}
                    </SelectItem>
                    <SelectItem value="other">
                      {isAr ? "أخرى" : "Other"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Message – bigger */}
            <div className="space-y-2">
              <Label htmlFor="msg" className="text-sm">
                {isAr ? "الرسالة" : "Message"}
              </Label>
              <Textarea
                id="msg"
                name="message"
                rows={8}
                className="min-h-40"
                placeholder={
                  isAr
                    ? "اكتب تفاصيل الاستفسار أو المشكلة باختصار..."
                    : "Briefly describe your question or issue…"
                }
                disabled={submitting}
                required
              />
            </div>

            {/* Submit */}
            <div className={cn("flex justify-end")}>
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 px-6 text-base font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99]"
                style={{ backgroundColor: BRAND }}
              >
                {submitting
                  ? isAr
                    ? "جارٍ الإرسال…"
                    : "Sending…"
                  : isAr
                  ? "إرسال"
                  : "Submit"}
              </Button>
            </div>

            {/* رسائل النتيجة */}
            {sent && (
              <p className="text-sm text-green-600">
                {isAr
                  ? "تم استلام رسالتك وسنعاود التواصل معك قريبًا."
                  : "Your message has been sent. We'll get back to you soon."}
              </p>
            )}

            {error && (
              <p className="text-sm text-red-600">
                {error}
              </p>
            )}
          </form>
        </Card>

        {/* Right: Helpful info / contact details */}
        <div className="space-y-6">
          <Card className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold">
              {isAr ? "معلومات التواصل" : "Contact details"}
            </h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li>
                <span className="text-muted-foreground">
                  {isAr ? "البريد:" : "Email:"}
                </span>{" "}
                customerserviceawn@gmail.com
              </li>
              <li>
                <span className="text-muted-foreground">
                  {isAr ? "أوقات العمل:" : "Hours:"}
                </span>{" "}
                {isAr ? "الأحد - الخميس، 9ص–6م" : "Sun–Thu, 9am–6pm"}
              </li>
            </ul>

            <hr className="my-6 border-dashed" />

            <div className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                {isAr
                  ? "إذا كان استفسارك عاجلًا، يُفضّل التواصل عبر البريد الإلكتروني."
                  : "For urgent inquiries, please email us directly."}
              </p>
            </div>
          </Card>

          <Card className="p-6 sm:p-8 min-h-[400px] flex flex-col">
            <h3 className="text-base font-semibold mb-8">
              {isAr ? "الأسئلة الشائعة" : "Quick help"}
            </h3>
            
            <div className="flex-1 flex flex-col justify-between">
              <ul className="list-disc ps-5 text-sm text-muted-foreground space-y-6">
                <li className="leading-relaxed">{isAr ? "كيفية حجز موعد مع أخصائي" : "How to book therapist appointments"}</li>
                <li className="leading-relaxed">{isAr ? "أنواع العلاج الطبيعي المتوفرة" : "Available physiotherapy types"}</li>
                <li className="leading-relaxed">{isAr ? "الجلسات المنزلية والأونلاين" : "Home visits and online sessions"}</li>
                <li className="leading-relaxed">{isAr ? "طرق الدفع والتكاليف" : "Payment methods and costs"}</li>
                <li className="leading-relaxed">{isAr ? "إلغاء وتأجيل المواعيد" : "Canceling and rescheduling"}</li>
              </ul>
              
              <Button asChild className="mt-8 w-full" style={{ backgroundColor: BRAND }}>
                <a href={`/${locale}/faq`}>{isAr ? "استكشف المساعدة" : "Explore help"}</a>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}