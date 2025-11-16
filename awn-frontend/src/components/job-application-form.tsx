"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, Check, ChevronLeft, ChevronRight, User, GraduationCap, Calendar, FileText, Send } from "lucide-react"
import { format } from "date-fns"
import { toastManager } from "@/hooks/use-toast"
import type { Locale } from "@/lib/i18n"

interface UploadsFilesProps {
  label: string;
  required?: boolean;
}

const UploadsFiles = ({ label, required }: UploadsFilesProps) => {
  const [uploaded, setUploaded] = useState(false);
  
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors">
        <Upload className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mb-2" />
        <div className="text-sm text-gray-600">
          <p className="mb-1">Click to upload or drag and drop</p>
          <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
        </div>
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          className="mt-3"
          onClick={() => setUploaded(!uploaded)}
        >
          {uploaded ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Uploaded
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

interface JobApplicationFormProps {
  locale: Locale
  onBack: () => void
}

export default function JobApplicationForm({ locale, onBack }: JobApplicationFormProps) {
  const isArabic = locale === "ar"
  const [currentStep, setCurrentStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nationalId: "",
    dateOfBirth: "",
    gender: "",
    workRights: "",
    scfhsLicense: "",
    licenseStatus: "",
    licenseExpiry: "",
    experience: "",
    primarySpecialty: "",
    sessionTypes: [] as string[],
    startDate: "",
    hourlyRate: "",
    preferredDays: [] as string[],
    preferredHours: ""
  })
  
  const totalSteps = 5

  const stepTitles = isArabic ? [
    "المعلومات الأساسية",
    "المؤهلات المهنية", 
    "التوفر والتفضيلات",
    "المرفقات",
    "المراجعة والإرسال"
  ] : [
    "Basic Information",
    "Professional Qualifications",
    "Availability & Preferences", 
    "Documents",
    "Review & Submit"
  ]

  const stepIcons = [User, GraduationCap, Calendar, FileText, Send]

  const updateFormData = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        const step1Required = ['firstName', 'lastName', 'email', 'phone', 'nationalId', 'dateOfBirth', 'gender', 'workRights']
        return step1Required.every(field => formData[field as keyof typeof formData] && 
          String(formData[field as keyof typeof formData]).trim() !== '')
      case 2:
        const step2Required = ['scfhsLicense', 'licenseStatus', 'licenseExpiry', 'experience', 'primarySpecialty']
        return step2Required.every(field => formData[field as keyof typeof formData] && 
          String(formData[field as keyof typeof formData]).trim() !== '')
      case 3:
        return formData.sessionTypes.length > 0 && !!formData.startDate && !!formData.hourlyRate
      case 4:
        return true // Document uploads are optional in this demo
      default:
        return true
    }
  }

  const showValidationError = () => {
    const errorMessage = isArabic 
      ? "يرجى ملء جميع الحقول المطلوبة قبل المتابعة"
      : "Please fill all required fields before continuing"
    
    toastManager.add({
      title: isArabic ? "معلومات مفقودة" : "Missing Information",
      description: errorMessage,
    })
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1)
      }
    } else {
      showValidationError()
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateStep(currentStep)) {
      setSubmitted(true)
    } else {
      showValidationError()
    }
  }

  const handleBackToHome = () => {
    window.location.href = `/${locale}`
  }

 const handleSessionTypeChange = (type: string, checked: boolean | 'indeterminate') => {
  const isChecked = checked === true;
  if (isChecked) {
    updateFormData('sessionTypes', [...formData.sessionTypes, type])
  } else {
    updateFormData('sessionTypes', formData.sessionTypes.filter(t => t !== type))
  }
}

const handlePreferredDayChange = (day: string, checked: boolean | 'indeterminate') => {
  const isChecked = checked === true;
  if (isChecked) {
    updateFormData('preferredDays', [...formData.preferredDays, day])
  } else {
    updateFormData('preferredDays', formData.preferredDays.filter(d => d !== day))
  }
}

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
            <Check className="text-green-600 dark:text-green-400" size={32} />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {isArabic ? "تم تقديم الطلب بنجاح" : "Application Submitted Successfully"}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm sm:text-base">
            {isArabic 
              ? "سنراجع طلبك ونتواصل معك خلال 3-5 أيام عمل."
              : "We'll review your application and contact you within 3-5 business days."
            }
          </p>
          <Button 
            onClick={handleBackToHome} 
            className="bg-emerald-600 text-white hover:bg-emerald-700 w-full sm:w-auto"
          >
            {isArabic ? "العودة للرئيسية" : "Back to Home"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 mb-6">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              onClick={onBack} 
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft size={16} />
              {isArabic ? "العودة" : "Back"}
            </Button>
            <h1 className="flex-1 text-center text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {isArabic ? "طلب التقديم للوظيفة" : "Job Application"}
            </h1>
            <div className="w-16 sm:w-20"></div>
          </div>

          {/* Progress Steps - Responsive */}
          <div className="flex items-center justify-between overflow-x-auto pb-2">
            {stepTitles.map((title, index) => {
              const Icon = stepIcons[index]
              return (
                <div key={index} className="flex flex-col items-center flex-shrink-0 min-w-0 px-1 sm:px-2">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold mb-2 transition-colors ${
                    index + 1 <= currentStep 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500'
                  }`}>
                    <Icon size={16} className="sm:w-5 sm:h-5" />
                  </div>
                  <span className={`text-xs text-center max-w-[80px] sm:max-w-none leading-tight ${
                    index + 1 <= currentStep 
                      ? 'text-emerald-600 font-medium' 
                      : 'text-gray-500'
                  }`}>
                    {title}
                  </span>
                  {index < stepTitles.length - 1 && (
                    <div className={`hidden sm:block w-8 lg:w-16 h-0.5 mt-2 ${
                      index + 1 < currentStep ? 'bg-emerald-600' : 'bg-gray-200 dark:bg-gray-600'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
          
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-emerald-700 mb-4">
                {isArabic ? "المعلومات الأساسية" : "Basic Information"}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    {isArabic ? "الاسم الأول *" : "First Name *"}
                  </Label>
                  <Input 
                    id="firstName" 
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    required 
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    {isArabic ? "اسم العائلة *" : "Last Name *"}
                  </Label>
                  <Input 
                    id="lastName" 
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    required 
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    {isArabic ? "البريد الإلكتروني *" : "Email Address *"}
                  </Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    required 
                    className="w-full"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    {isArabic ? "رقم الهاتف *" : "Phone Number *"}
                  </Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder={isArabic ? "05xxxxxxxx" : "05xxxxxxxx"}
                    required 
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationalId" className="text-sm font-medium">
                    {isArabic ? "رقم الهوية/الإقامة *" : "National ID/Iqama *"}
                  </Label>
                  <Input 
                    id="nationalId" 
                    value={formData.nationalId}
                    onChange={(e) => updateFormData('nationalId', e.target.value)}
                    required 
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                    {isArabic ? "تاريخ الميلاد *" : "Date of Birth *"}
                  </Label>
                  <Input 
                    id="dateOfBirth" 
                    type="date" 
                    value={formData.dateOfBirth}
                    onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                    required 
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {isArabic ? "الجنس *" : "Gender *"}
                  </Label>
                  <Select value={formData.gender} onValueChange={(value) => updateFormData('gender', value)}>
                    <SelectTrigger className="w-full bg-white border border-gray-300">
                      <SelectValue placeholder={isArabic ? "اختر الجنس" : "Select Gender"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                      <SelectItem value="male" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "ذكر" : "Male"}
                      </SelectItem>
                      <SelectItem value="female" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "أنثى" : "Female"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {isArabic ? "حق العمل في السعودية *" : "Right to Work in Saudi Arabia *"}
                  </Label>
                  <Select value={formData.workRights} onValueChange={(value) => updateFormData('workRights', value)}>
                    <SelectTrigger className="w-full bg-white border border-gray-300">
                      <SelectValue placeholder={isArabic ? "اختر الحالة" : "Select Status"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                      <SelectItem value="citizen" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "مواطن سعودي" : "Saudi Citizen"}
                      </SelectItem>
                      <SelectItem value="resident" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "مقيم" : "Resident"}
                      </SelectItem>
                      <SelectItem value="visa" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "حامل فيزا عمل" : "Work Visa Holder"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Professional Qualifications */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-emerald-700 mb-4">
                {isArabic ? "المؤهلات المهنية" : "Professional Qualifications"}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scfhsLicense" className="text-sm font-medium">
                    {isArabic ? "رقم الترخيص SCFHS *" : "SCFHS License Number *"}
                  </Label>
                  <Input 
                    id="scfhsLicense" 
                    value={formData.scfhsLicense}
                    onChange={(e) => updateFormData('scfhsLicense', e.target.value)}
                    required 
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {isArabic ? "حالة الترخيص *" : "License Status *"}
                  </Label>
                  <Select value={formData.licenseStatus} onValueChange={(value) => updateFormData('licenseStatus', value)}>
                    <SelectTrigger className="w-full bg-white border border-gray-300">
                      <SelectValue placeholder={isArabic ? "اختر الحالة" : "Select Status"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                      <SelectItem value="active" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "نشط" : "Active"}
                      </SelectItem>
                      <SelectItem value="pending" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "قيد التجديد" : "Pending Renewal"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseExpiry" className="text-sm font-medium">
                    {isArabic ? "تاريخ انتهاء الترخيص *" : "License Expiry Date *"}
                  </Label>
                  <Input 
                    id="licenseExpiry" 
                    type="date" 
                    value={formData.licenseExpiry}
                    onChange={(e) => updateFormData('licenseExpiry', e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required 
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {isArabic ? "سنوات الخبرة *" : "Years of Experience *"}
                  </Label>
                  <Select value={formData.experience} onValueChange={(value) => updateFormData('experience', value)}>
                    <SelectTrigger className="w-full bg-white border border-gray-300">
                      <SelectValue placeholder={isArabic ? "اختر سنوات الخبرة" : "Select Experience"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                      <SelectItem value="1-2" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "1-2 سنة" : "1-2 years"}
                      </SelectItem>
                      <SelectItem value="3-5" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "3-5 سنوات" : "3-5 years"}
                      </SelectItem>
                      <SelectItem value="6-10" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "6-10 سنوات" : "6-10 years"}
                      </SelectItem>
                      <SelectItem value="10+" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "أكثر من 10 سنوات" : "10+ years"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-sm font-medium">
                    {isArabic ? "التخصص الأساسي *" : "Primary Specialty *"}
                  </Label>
                  <Select value={formData.primarySpecialty} onValueChange={(value) => updateFormData('primarySpecialty', value)}>
                    <SelectTrigger className="w-full bg-white border border-gray-300">
                      <SelectValue placeholder={isArabic ? "اختر التخصص" : "Select Specialty"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                      <SelectItem value="orthopedic" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "العلاج الطبيعي العظمي" : "Orthopedic Physiotherapy"}
                      </SelectItem>
                      <SelectItem value="neurological" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "العلاج الطبيعي العصبي" : "Neurological Physiotherapy"}
                      </SelectItem>
                      <SelectItem value="sports" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "علاج طبيعي رياضي" : "Sports Physiotherapy"}
                      </SelectItem>
                      <SelectItem value="pediatric" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "علاج طبيعي أطفال" : "Pediatric Physiotherapy"}
                      </SelectItem>
                      <SelectItem value="cardiopulmonary" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "علاج طبيعي قلبي رئوي" : "Cardiopulmonary Physiotherapy"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Availability & Preferences */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-emerald-700 mb-4">
                {isArabic ? "التوفر والتفضيلات" : "Availability & Preferences"}
              </h2>
              
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {isArabic ? "أنواع الجلسات المفضلة *" : "Preferred Session Types *"}
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { value: 'home', label: isArabic ? 'زيارات منزلية' : 'Home Visits' },
                      { value: 'online', label: isArabic ? 'جلسات عن بُعد' : 'Online Sessions' },
                    ].map((type) => (
                      <div key={type.value} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={type.value}
                          checked={formData.sessionTypes.includes(type.value)}
                          onCheckedChange={(checked) => handleSessionTypeChange(type.value, checked)}
                        />
                        <Label htmlFor={type.value} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                          {type.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-medium">
                      {isArabic ? "تاريخ البدء المفضل *" : "Preferred Start Date *"}
                    </Label>
                    <Input 
                      id="startDate" 
                      type="date" 
                      value={formData.startDate}
                      onChange={(e) => updateFormData('startDate', e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      required 
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate" className="text-sm font-medium">
                      {isArabic ? "السعر المطلوب بالساعة (ريال) *" : "Desired Hourly Rate (SAR) *"}
                    </Label>
                    <Input 
                      id="hourlyRate" 
                      type="number" 
                      value={formData.hourlyRate}
                      onChange={(e) => updateFormData('hourlyRate', e.target.value)}
                      placeholder={isArabic ? "مثال: 200" : "e.g., 200"}
                      required 
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    {isArabic ? "الأيام المفضلة للعمل" : "Preferred Working Days"}
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { value: 'sunday', label: isArabic ? 'الأحد' : 'Sunday' },
                      { value: 'monday', label: isArabic ? 'الاثنين' : 'Monday' },
                      { value: 'tuesday', label: isArabic ? 'الثلاثاء' : 'Tuesday' },
                      { value: 'wednesday', label: isArabic ? 'الأربعاء' : 'Wednesday' },
                      { value: 'thursday', label: isArabic ? 'الخميس' : 'Thursday' },
                      { value: 'friday', label: isArabic ? 'الجمعة' : 'Friday' },
                      { value: 'saturday', label: isArabic ? 'السبت' : 'Saturday' },
                    ].map((day) => (
                      <div key={day.value} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={day.value}
                          checked={formData.preferredDays.includes(day.value)}
                          onCheckedChange={(checked) => handlePreferredDayChange(day.value, checked)}
                        />
                        <Label htmlFor={day.value} className="text-sm font-medium leading-none">
                          {day.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {isArabic ? "الساعات المفضلة للعمل" : "Preferred Working Hours"}
                  </Label>
                  <Select value={formData.preferredHours} onValueChange={(value) => updateFormData('preferredHours', value)}>
                    <SelectTrigger className="w-full bg-white border border-gray-300">
                      <SelectValue placeholder={isArabic ? "اختر الساعات المفضلة" : "Select Preferred Hours"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg rounded-md">
                      <SelectItem value="morning" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "صباحي (8ص - 12ظ)" : "Morning (8 AM - 12 PM)"}
                      </SelectItem>
                      <SelectItem value="afternoon" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "بعد الظهر (12ظ - 6م)" : "Afternoon (12 PM - 6 PM)"}
                      </SelectItem>
                      <SelectItem value="evening" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "مسائي (6م - 10م)" : "Evening (6 PM - 10 PM)"}
                      </SelectItem>
                      <SelectItem value="flexible" className="bg-white hover:bg-gray-50 cursor-pointer">
                        {isArabic ? "مرن" : "Flexible"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Documents */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-emerald-700 mb-4">
                {isArabic ? "المرفقات" : "Documents"}
              </h2>
              
              <div className="space-y-4">
                <UploadsFiles label={isArabic ? "السيرة الذاتية *" : "CV / Resume *"} required />
                <UploadsFiles label={isArabic ? "بطاقة ترخيص SCFHS *" : "SCFHS License Card *"} required />
                <UploadsFiles label={isArabic ? "شهادة التخرج *" : "Degree Certificate *"} required />
                <UploadsFiles label={isArabic ? "صورة الهوية/الإقامة" : "National ID/Iqama Copy"} />
                <UploadsFiles label={isArabic ? "شهادات إضافية (اختياري)" : "Additional Certifications (Optional)"} />
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-emerald-700 mb-4">
                {isArabic ? "المراجعة والإرسال" : "Review & Submit"}
              </h2>
              
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{isArabic ? "ملخص الطلب" : "Application Summary"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">{isArabic ? "الاسم:" : "Name:"}</span> {formData.firstName} {formData.lastName}
                      </div>
                      <div>
                        <span className="font-medium">{isArabic ? "البريد:" : "Email:"}</span> {formData.email}
                      </div>
                      <div>
                        <span className="font-medium">{isArabic ? "الهاتف:" : "Phone:"}</span> {formData.phone}
                      </div>
                      <div>
                        <span className="font-medium">{isArabic ? "الترخيص:" : "License:"}</span> {formData.scfhsLicense}
                      </div>
                      <div>
                        <span className="font-medium">{isArabic ? "الخبرة:" : "Experience:"}</span> {formData.experience}
                      </div>
                      <div>
                        <span className="font-medium">{isArabic ? "السعر المطلوب:" : "Hourly Rate:"}</span> {formData.hourlyRate} {isArabic ? "ريال" : "SAR"}
                      </div>
                    </div>
                    {formData.sessionTypes.length > 0 && (
                      <div>
                        <span className="font-medium text-sm">{isArabic ? "أنواع الجلسات:" : "Session Types:"}</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {formData.sessionTypes.map((type) => (
                            <Badge key={type} variant="secondary" className="text-xs">
                              {type === 'home' ? (isArabic ? 'زيارات منزلية' : 'Home Visits') : (isArabic ? 'جلسات عن بُعد' : 'Online Sessions')}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    {isArabic ? "اتفاقية الشروط والأحكام" : "Terms and Conditions Agreement"}
                  </h4>
                  <div className="flex items-start space-x-3 space-x-reverse">
                    <Checkbox id="terms" required />
                    <Label htmlFor="terms" className="text-sm text-blue-800 leading-relaxed">
                      {isArabic 
                        ? "أوافق على الشروط والأحكام وسياسة الخصوصية لمنصة عَون، وأؤكد صحة جميع المعلومات المقدمة."
                        : "I agree to Awn's Terms and Conditions and Privacy Policy, and confirm that all provided information is accurate."
                      }
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handlePrev}
              disabled={currentStep === 1}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              <ChevronLeft size={16} className="mr-2" />
              {isArabic ? "السابق" : "Previous"}
            </Button>
            
            {currentStep < totalSteps ? (
              <Button 
                type="button" 
                onClick={handleNext}
                className="bg-emerald-600 text-white hover:bg-emerald-700 w-full sm:w-auto order-1 sm:order-2"
              >
                {isArabic ? "التالي" : "Next"}
                <ChevronRight size={16} className="ml-2" />
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="bg-emerald-600 text-white hover:bg-emerald-700 w-full sm:w-auto order-1 sm:order-2"
              >
                <Send size={16} className="mr-2" />
                {isArabic ? "إرسال الطلب" : "Submit Application"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}