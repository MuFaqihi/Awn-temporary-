"use client"

import { useState, useEffect, use, useMemo } from "react"
import { Search, Filter, Star, MapPin, Clock, Shield, Award, Globe, Users, ChevronDown, Calendar, Heart, Video, Home } from "lucide-react"
import { Button } from "@/components/ui/base-button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import type { Locale } from "@/lib/i18n"
import { API_BASE_URL } from '@/lib/api'

function normalizeImage(src?: string) {
  if (!src) return src || ''
  try {
    if (src.startsWith('/therapists/')) {
      const parts = src.split('/')
      const base = parts[parts.length - 1]
      return base ? `/${base}` : src
    }
  } catch (e) {
    // ignore
  }
  return src
}

interface Props {
  params: { locale: Locale }
}

interface Therapist {
  id: string
  slug: string
  name: {
    ar: string
    en: string
  }
  image: string
  specialties: {
    ar: string[]
    en: string[]
  }
  experience: number
  basePrice: number
  rating: number
  credentials: {
    yearsExperience: number
    scfhsVerified: boolean
  }
  modes: string[]
  city: string
  languages: string[]
  nextAvailable: string
  gender: string
  bio: {
    ar: string
    en: string
  }
}

export default function TherapistsPage({ params }: Props) {
  const locale = params.locale
  const isArabic = locale === "ar"

  //   States جديدة
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    gender: "",
    specialty: "",
    session: "",
    language: "",
    city: "",
    priceRange: "",
    availability: ""
  })
  const [sortBy, setSortBy] = useState("rating")
  const [showFilters, setShowFilters] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  //   جلب جميع المعالجين من الباك إند
  useEffect(() => {
    const fetchTherapists = async () => {
      try {
        setLoading(true)
        console.log('📡 جلب بيانات المعالجين من الباك إند...')
        
        const response = await fetch(`${API_BASE_URL}/therapists`)
        
        if (!response.ok) {
          throw new Error('فشل في جلب بيانات المعالجين')
        }
        
        const result = await response.json()
        console.log('  استجابة الباك إند:', result)
        
        if (result.success && Array.isArray(result.data)) {
          // Only include therapists whose image file exists in `public/` (case-insensitive)
          const allowed = new Set([
            'abdullah.jpg',
            'alaa.png',
            'ayman.jpg',
            'khalid.jpg',
            'nismah.jpg',
            'thamir.png'
          ])

          const filtered = result.data.filter((t: any) => {
            const img = normalizeImage(t.image || '') || ''
            const base = (img.split('/').pop() || '').toLowerCase()
            return allowed.has(base)
          })

          setTherapists(filtered)
          console.log(`  تم جلب ${result.data.length} معالج بنجاح`)
        } else {
          console.warn('⚠️ البيانات ليست بالشكل المتوقع:', result)
          setTherapists([])
        }
        
      } catch (err) {
        console.error(' خطأ في جلب بيانات المعالجين:', err)
        setError('فشل في تحميل بيانات المعالجين')
        setTherapists([])
      } finally {
        setLoading(false)
      }
    }

    fetchTherapists()
  }, [])

  //   Filter logic مع البيانات من الباك إند
  const filteredTherapists = useMemo(() => {
    let filtered = therapists.filter((therapist) => {
      const nameMatch = therapist.name[locale].toLowerCase().includes(searchTerm.toLowerCase())
      const specialtyMatch = !filters.specialty || 
        filters.specialty === "all" || 
        therapist.specialties[locale]?.includes(filters.specialty)
      const genderMatch = !filters.gender || 
        filters.gender === "all" || 
        therapist.gender === filters.gender
      const sessionMatch = !filters.session || 
        filters.session === "all" || 
        therapist.modes.includes(filters.session)
      const languageMatch = !filters.language || 
        filters.language === "all" || 
        therapist.languages.includes(filters.language)
      const cityMatch = !filters.city || 
        filters.city === "all" || 
        therapist.city === filters.city

      return nameMatch && specialtyMatch && genderMatch && sessionMatch && languageMatch && cityMatch
    })

    // Sort logic
    switch (sortBy) {
      case "experience":
        return filtered.sort((a, b) => b.credentials.yearsExperience - a.credentials.yearsExperience)
      case "price-low":
        return filtered.sort((a, b) => a.basePrice - b.basePrice)
      case "price-high":
        return filtered.sort((a, b) => b.basePrice - a.basePrice)
      case "rating":
        return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
      case "availability":
        return filtered.sort((a, b) => new Date(a.nextAvailable).getTime() - new Date(b.nextAvailable).getTime())
      default:
        return filtered
    }
  }, [therapists, searchTerm, filters, sortBy, locale])

  //   Get unique values for filter options
  const specialties = [...new Set(therapists.flatMap(t => t.specialties[locale] || []))]
  const cities = [...new Set(therapists.map(t => t.city))]
  const languages = [...new Set(therapists.flatMap(t => t.languages))]

  //   شاشة التحميل
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {isArabic ? "جاري تحميل بيانات المعالجين..." : "Loading therapists..."}
          </p>
        </div>
      </div>
    )
  }

  //   شاشة الخطأ
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {isArabic ? "حدث خطأ" : "Error"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
            {error}
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/90"
          >
            {isArabic ? "إعادة المحاولة" : "Try Again"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        
        {/* Header */}
        <Card className="p-8 bg-white border shadow-sm">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              {isArabic ? "ابحث عن أخصائي العلاج الطبيعي" : "Find Your Physiotherapist"}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {isArabic ? "أخصائيون معتمدون متاحون للجلسات المنزلية والإلكترونية مع أسعار واضحة" : "Licensed professionals available for home visits and online sessions with transparent pricing"}
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto mt-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <Input
                type="text"
                placeholder={isArabic ? "ابحث عن أخصائي بالاسم أو التخصص..." : "Search by name or specialty..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-6 py-4 text-lg border shadow-sm rounded-xl placeholder:text-gray-500"
              />
            </div>
          </div>
        </Card>

        {/* Filters Section */}
        <Card className="p-6 shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white border-gray-200 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              {isArabic ? "الفلاتر المتقدمة" : "Advanced Filters"}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>

            {/* Sort Options */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-white border-gray-200">
                <SelectValue placeholder={isArabic ? "ترتيب حسب" : "Sort by"} />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="rating">{isArabic ? "التقييم" : "Rating"}</SelectItem>
                <SelectItem value="experience">{isArabic ? "الخبرة" : "Experience"}</SelectItem>
                <SelectItem value="price-low">{isArabic ? "السعر (منخفض لعالي)" : "Price (Low to High)"}</SelectItem>
                <SelectItem value="price-high">{isArabic ? "السعر (عالي لمنخفض)" : "Price (High to Low)"}</SelectItem>
                <SelectItem value="availability">{isArabic ? "التوفر الأقرب" : "Next Available"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showFilters && (
            <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-xl">
              <Select value={filters.specialty} onValueChange={(value) => setFilters({...filters, specialty: value})}>
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder={isArabic ? "التخصص" : "Specialty"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">{isArabic ? "كل التخصصات" : "All Specialties"}</SelectItem>
                  {specialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>{specialty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.session} onValueChange={(value) => setFilters({...filters, session: value})}>
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder={isArabic ? "نوع الجلسة" : "Session Type"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">{isArabic ? "كل الأنواع" : "All Types"}</SelectItem>
                  <SelectItem value="online">{isArabic ? "عن بُعد" : "Online"}</SelectItem>
                  <SelectItem value="home">{isArabic ? "زيارة منزلية" : "Home Visit"}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.gender} onValueChange={(value) => setFilters({...filters, gender: value})}>
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder={isArabic ? "الجنس" : "Gender"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">{isArabic ? "كلا الجنسين" : "Both"}</SelectItem>
                  <SelectItem value="male">{isArabic ? "ذكر" : "Male"}</SelectItem>
                  <SelectItem value="female">{isArabic ? "أنثى" : "Female"}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.city} onValueChange={(value) => setFilters({...filters, city: value})}>
                <SelectTrigger className="bg-white border-gray-200">
                  <SelectValue placeholder={isArabic ? "المدينة" : "City"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">{isArabic ? "كل المدن" : "All Cities"}</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => setFilters({ gender: "", specialty: "", session: "", language: "", city: "", priceRange: "", availability: "" })}
                className="bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                {isArabic ? "إعادة تعيين" : "Reset All"}
              </Button>
            </div>
          )}
        </Card>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-gray-900">
            {isArabic ? "المعالجون المتاحون" : "Available Therapists"} 
            <span className="text-gray-500 text-lg ml-2">
              ({filteredTherapists.length})
            </span>
          </h2>
        </div>

        {/* Enhanced Therapist Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTherapists.map((therapist) => (
            <Card key={therapist.id} className="group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border shadow-sm bg-white">
              
              {/* Image */}
              <div className="relative">
                <div className="aspect-[4/3] relative overflow-hidden">
                  <Image
                    src={normalizeImage(therapist.image || "/avatar-placeholder.jpg")}
                    alt={therapist.name[locale]}
                    fill
                    sizes="(max-width: 768px) 300px, 600px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                </div>
                
                {/* Simple Badge using brand colors */}
                <div className="absolute top-3 left-3">
                  {therapist.credentials.scfhsVerified && (
                    <Badge className="bg-primary hover:bg-primary/90 text-white border-0 text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      {isArabic ? "معتمد" : "Verified"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                      {therapist.name[locale]}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <Award className="w-4 h-4" />
                      {therapist.credentials.yearsExperience} {isArabic ? "سنوات خبرة" : "years exp"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-primary">
                      {isArabic ? "من" : "from"} {therapist.basePrice} {isArabic ? "ر.س" : "SAR"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {isArabic ? "للجلسة" : "per session"}
                    </div>
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-1">
                  {(therapist.specialties[locale] || []).slice(0, 3).map((specialty: string) => (
                    <Badge key={specialty} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                      {specialty}
                    </Badge>
                  ))}
                  {(therapist.specialties[locale] || []).length > 3 && (
                    <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">
                      +{(therapist.specialties[locale] || []).length - 3}
                    </Badge>
                  )}
                </div>

                {/* Session Types */}
                <div className="text-sm text-gray-600">
                  {therapist.modes.map((mode: string) => (
                    <span key={mode} className="inline-flex items-center gap-1 mr-3">
                      {mode === "home" ? "🏠" : "💻"}
                      {mode === "home" ? (isArabic ? "منزلية" : "Home") : (isArabic ? "أونلاين" : "Online")}
                    </span>
                  ))}
                </div>

                {/*   Location & Languages - مصحح */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {therapist.city}
                  </div>
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    {/*   التصحيح: التحقق من أن languages مصفوفة قبل استخدام slice */}
                    {Array.isArray(therapist.languages) 
                      ? therapist.languages.slice(0, 2).join(", ")
                      : "العربية, English" /* قيمة افتراضية إذا لم تكن مصفوفة */}
                  </div>
                </div>

                {/* Next Available */}
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    {isArabic ? "متاح" : "Available"}{' '}
                    {mounted ? new Date(therapist.nextAvailable).toLocaleDateString(locale === "ar" ? "ar-SA" : "en-GB") : ''}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link 
                    href={`/${locale}/therapists/${therapist.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800">
                      {isArabic ? "عرض الملف" : "View Profile"}
                    </Button>
                  </Link>
                  <Link 
                    href={`/${locale}/therapists/${therapist.id}?book=true`}
                    className="flex-1"
                  >
                    <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                      {isArabic ? "احجز الآن" : "Book Now"}
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredTherapists.length === 0 && therapists.length > 0 && (
          <Card className="text-center py-16 bg-white">
            <Users className="mx-auto w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isArabic ? "لا توجد نتائج" : "No Results Found"}
            </h3>
            <p className="text-gray-500 text-lg mb-6">
              {isArabic ? "لا توجد نتائج مطابقة لبحثك" : "No therapists match your search criteria"}
            </p>
            <Button 
              onClick={() => {
                setSearchTerm("")
                setFilters({ gender: "", specialty: "", session: "", language: "", city: "", priceRange: "", availability: "" })
              }}
              className="bg-primary hover:bg-primary/90"
            >
              {isArabic ? "إعادة تعيين البحث" : "Reset Search"}
            </Button>
          </Card>
        )}

        {/* No Therapists at all */}
        {therapists.length === 0 && !loading && (
          <Card className="text-center py-16 bg-white">
            <Users className="mx-auto w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isArabic ? "لا يوجد معالجون" : "No Therapists"}
            </h3>
            <p className="text-gray-500 text-lg mb-6">
              {isArabic ? "لا توجد بيانات معالجين متاحة حالياً" : "No therapist data available at the moment"}
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}