 'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toastManager } from '@/hooks/use-toast';
import { Check, X, Eye, EyeOff, Mail, MapPin, Map, Crosshair } from 'lucide-react';
import dynamic from 'next/dynamic';
import { signup } from '@/lib/api'
import { API_BASE_URL } from '@/lib/api'

type Locale = 'ar' | 'en';

const AR = {
  title: 'إنشاء حساب في عون',
  subtitle: 'مرحبًا بك! أنشئ حسابك للبدء.',
  first: 'الاسم الأول',
  last: 'اسم العائلة',
  email: 'البريد الإلكتروني',
  emailPlaceholder: 'example@email.com',
  password: 'كلمة المرور',
  confirmPassword: 'تأكيد كلمة المرور',
  passwordRulesTitle: 'متطلبات كلمة المرور:',
  passwordRules: {
    length: 'على الأقل 8 أحرف',
    uppercase: 'حرف كبير واحد على الأقل',
    lowercase: 'حرف صغير واحد على الأقل',
    number: 'رقم واحد على الأقل',
    special: 'رمز خاص واحد على الأقل (!@#$%^&*)',
    match: 'كلمات المرور متطابقة'
  },
  signUp: 'إنشاء الحساب',
  haveAccount: 'لديك حساب مسبقًا؟',
  signIn: 'تسجيل الدخول',
  passwordError: 'يرجى استيفاء جميع متطلبات كلمة المرور',
  success: 'تم إنشاء الحساب بنجاح',
  error: 'فشل في إنشاء الحساب',
  creating: 'جاري إنشاء الحساب...'
};

const EN = {
  title: 'Create your Awn account',
  subtitle: 'Welcome! Create an account to get started.',
  first: 'First name',
  last: 'Last name',
  email: 'Email address',
  emailPlaceholder: 'example@email.com',
  password: 'Password',
  confirmPassword: 'Confirm password',
  passwordRulesTitle: 'Password requirements:',
  passwordRules: {
    length: 'At least 8 characters',
    uppercase: 'One uppercase letter',
    lowercase: 'One lowercase letter',
    number: 'One number',
    special: 'One special character (!@#$%^&*)',
    match: 'Passwords match'
  },
  signUp: 'Sign Up',
  haveAccount: 'Already have an account?',
  signIn: 'Sign in',
  passwordError: 'Please meet all password requirements',
  success: 'Account created successfully',
  error: 'Failed to create account',
  creating: 'Creating account...'
};

interface PasswordValidation {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
  match: boolean;
}

export default function SignUpPage({ locale = 'ar' }: { locale?: Locale }) {
  const t = locale === 'ar' ? AR : EN;
  const isRTL = locale === 'ar';
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get('next') || `/${locale}/dashboard`;

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [passwordTouched, setPasswordTouched] = React.useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [addressCoords, setAddressCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = React.useState(false);
  const [selectedCoords, setSelectedCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [mapAddress, setMapAddress] = React.useState('');
  const [isLoadingMap, setIsLoadingMap] = React.useState(false);
  const [firstname, setFirstname] = React.useState('');
  const [lastname, setLastname] = React.useState('');
  const [email, setEmail] = React.useState('');

  const passwordValidation: PasswordValidation = React.useMemo(() => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      match: password === confirmPassword && confirmPassword !== ''
    };
  }, [password, confirmPassword]);

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  // Dynamically import the Map component to avoid SSR issues
  const DynamicMap = dynamic(() => import('@/components/MapComponent'), { ssr: false });

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${locale === 'ar' ? 'ar' : 'en'}`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setMapAddress(data.display_name);
        return data.display_name;
      }
    } catch (e) {
      // ignore
    }
    const fallback = '';
    setMapAddress(fallback);
    return fallback;
  };

  const getCurrentLocation = () => {
    setIsLoadingMap(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setSelectedCoords(coords);
        await reverseGeocode(coords.lat, coords.lng);
        setIsLoadingMap(false);
      }, (err) => {
        console.warn('Geolocation error', err);
        // fallback to Riyadh
        const coords = { lat: 24.7136, lng: 46.6753 };
        setSelectedCoords(coords);
        reverseGeocode(coords.lat, coords.lng).finally(() => setIsLoadingMap(false));
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    } else {
      const coords = { lat: 24.7136, lng: 46.6753 };
      setSelectedCoords(coords);
      reverseGeocode(coords.lat, coords.lng).finally(() => setIsLoadingMap(false));
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    await reverseGeocode(lat, lng);
  };

  const handleConfirmLocation = () => {
    if (selectedCoords && mapAddress) {
      setAddress(mapAddress);
      setAddressCoords(selectedCoords);
      setShowMap(false);
    }
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    if (!isPasswordValid) {
      toastManager.add({
        title: t.passwordError,
        description: '',
      });
      setIsSubmitting(false);
      return;
    }

    // Basic email validation before sending
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const emailVal = (formData.get('email') as string) || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      toastManager.add({ title: t.error, description: 'البريد الإلكتروني غير صالح', type: 'error' });
      setIsSubmitting(false);
      return;
    }
    try {
      // formData already created above for email check
      const signupData: any = {
        first_name: (formData.get('firstname') as string || '').trim() || firstname,
        last_name: (formData.get('lastname') as string || '').trim() || lastname,
        email: (formData.get('email') as string || '').trim().toLowerCase() || email,
        phone: (formData.get('phone') as string || '').trim() || phone,
        password: formData.get('password') as string,
        role: 'patient'
      };

      // include address and coordinates when present
      if (address) signupData.address = address;
      if (addressCoords) signupData.address_coords = addressCoords;

      // Basic phone validation (digits, +, -, spaces, parentheses)
      const phoneRegex = /^[0-9+\-() ]{7,20}$/;
      if (!phoneRegex.test(signupData.phone)) {
        toastManager.add({ title: 'Invalid phone number', description: '', type: 'error' });
        setIsSubmitting(false);
        return;
      }

      const result: any = await signup(signupData);

      if (result.success) {
        // Merge client-side provided fields into the returned user object so frontend
        // always has phone/address available immediately after signup.
        const mergedUser = {
          ...(result.user || {}),
          first_name: signupData.first_name || (result.user || {}).first_name,
          last_name: signupData.last_name || (result.user || {}).last_name,
          email: signupData.email || (result.user || {}).email,
          phone: signupData.phone || (result.user || {}).phone,
          address: address || (result.user || {}).address,
        };

        
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(mergedUser));
        localStorage.setItem('isLoggedIn', '1');
        // Notify other components in the same window that auth changed
        try { window.dispatchEvent(new Event('auth-change')); } catch (e) {}
        
        toastManager.add({
          title: t.success,
          description: '',
          type: 'success'
        });

        // If there is a pending booking, auto-submit it now with the new token
        try {
          const rawPending = localStorage.getItem('pendingBooking');
          if (rawPending) {
            const parsedPending = JSON.parse(rawPending);
            const pb = parsedPending.bookingData || parsedPending;
            const therapistId = parsedPending.therapistId || pb.therapist_id || '';

            const bookingPayload: any = {
              therapist_id: therapistId || pb.therapist_id,
              patient_name: `${signupData.first_name} ${signupData.last_name}`.trim() || pb.patient_name || '',
              patient_email: signupData.email || pb.patient_email || '',
              patient_phone: signupData.phone || pb.patient_phone || '',
              booking_date: pb.booking_date || pb.date,
              booking_time: pb.booking_time || pb.time,
              session_type: pb.session_type || pb.kind || pb.session_type,
              session_duration: pb.session_duration || pb.session_duration || 60,
              notes: pb.notes || '',
              address: pb.address || address || undefined,
            }

            const resp = await fetch(`${API_BASE_URL}/booking`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${result.token}`
              },
              body: JSON.stringify(bookingPayload)
            })

            const bookingResText = await resp.text().catch(() => '')
            let bookingJson: any = {}
            try { bookingJson = bookingResText ? JSON.parse(bookingResText) : {} } catch (e) { bookingJson = {} }

            if (resp.ok && bookingJson?.success) {
              const bookingId = bookingJson.data?.booking_id || bookingJson.data?.id || ''
              // remove pending booking now that it's created
              try { localStorage.removeItem('pendingBooking') } catch (e) {}
              // redirect back to therapist with bookingId so page shows confirmation
              router.push(`/${locale}/therapists/${therapistId}?book=true&resume=1&bookingId=${encodeURIComponent(bookingId)}`)
              return
            } else {
              console.warn('Auto-booking failed', { status: resp.status, body: bookingJson || bookingResText })
              // fallthrough to normal redirect
            }
          }
        } catch (autoErr) {
          console.warn('Auto-submit pending booking failed', autoErr)
        }

        router.push(next);
      } else {
        toastManager.add({
          title: result.error || t.error,
          description: result.details || '',
          type: 'error'
        });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      const message = error?.message || error?.toString() || t.error
      toastManager.add({
        title: message,
        description: typeof error?.details === 'string' ? error.details : 'حدث خطأ في الشبكة',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Prefill from pending booking if present
  React.useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('pendingBooking');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const data = parsed?.bookingData;
      if (!data) return;
      // patient_name may be full name
      const full = data.patient_name || '';
      const parts = full.trim().split(/\s+/);
      if (parts.length > 0) setFirstname(parts[0]);
      if (parts.length > 1) setLastname(parts.slice(1).join(' '));
      if (data.patient_email) setEmail(data.patient_email);
      if (data.patient_phone) setPhone(data.patient_phone);
      if (data.address) setAddress(data.address);
    } catch (e) {
      // ignore
    }
  }, []);

  const RuleIcon = ({ isValid, touched }: { isValid: boolean; touched: boolean }) => {
    if (!touched) return null;
    return isValid ? (
      <Check className="w-4 h-4 text-green-500" />
    ) : (
      <X className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <section
      className="flex min-h-screen bg-gray-50 px-4 py-8 md:py-16 dark:bg-gray-900"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <form
        onSubmit={onSubmit}
        className="m-auto w-full max-w-[28rem] md:max-w-[36rem] overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
      >
        <div className="bg-primary/65 backdrop-blur-md border-b border-primary/25 px-8 py-6">
          <div className="text-center">
            <Link href={`/${locale}`} aria-label="home" className="mx-auto block w-fit">
              <Logo className="text-white" />
            </Link>
            <h1 className="mt-4 mb-2 text-2xl font-bold text-white">{t.title}</h1>
            <p className="text-sm text-white/80">{t.subtitle}</p>
          </div>
        </div>

        <div className="px-8 py-8">
          <div className="space-y-6">
            {/* First + Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.first}</Label>
                <Input 
                    name="firstname"
                    required 
                    className="h-12 rounded-xl" 
                    disabled={isSubmitting}
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.last}</Label>
                <Input 
                    name="lastname"
                    required 
                    className="h-12 rounded-xl" 
                    disabled={isSubmitting}
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label>{t.email}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  name="email"
                  type="email"
                  required
                  placeholder={t.emailPlaceholder}
                  className="h-12 pl-10 rounded-xl"
                  disabled={isSubmitting}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="05xxxxxxxx"
                className="h-12 rounded-xl"
                disabled={isSubmitting}
              />
            </div>

            {/* Address (optional, required for home visits) - uses MapPicker like Settings */}
            <div className="space-y-2">
              <Label>{locale === 'ar' ? 'العنوان' : 'Address'}</Label>
              <div className="flex gap-2">
                <Input
                  name="address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={locale === 'ar' ? 'أدخل العنوان كاملاً' : 'Enter address (required for home visits)'}
                  className="h-12 rounded-xl flex-1"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  disabled={isSubmitting}
                  className="inline-flex items-center px-3 py-2 rounded-xl bg-primary text-white hover:opacity-90"
                >
                  <Map className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label>{t.password}</Label>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordTouched(true);
                  }}
                  className="h-12 pr-10 rounded-xl"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isSubmitting}
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label>{t.confirmPassword}</Label>
              <div className="relative">
                <Input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setConfirmPasswordTouched(true);
                  }}
                  className="h-12 pr-10 rounded-xl"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Password Rules */}
            {passwordTouched && (
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <h4 className="text-sm font-medium">{t.passwordRulesTitle}</h4>

                {Object.entries(passwordValidation).map(([key, valid]) => (
                  key !== 'match' || confirmPasswordTouched ? (
                    <div className="flex justify-between text-sm" key={key}>
                      <span className={valid ? 'text-green-600' : 'text-gray-600'}>
                        {t.passwordRules[key as keyof typeof t.passwordRules]}
                      </span>
                      <RuleIcon isValid={valid} touched={key === 'match' ? confirmPasswordTouched : passwordTouched} />
                    </div>
                  ) : null
                ))}
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={!isPasswordValid || isSubmitting}
              className="w-full h-12 font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50"
            >
              {isSubmitting ? t.creating : t.signUp}
            </Button>
          </div>
        </div>

        <div className="p-5 text-center text-sm">
          {t.haveAccount}{' '}
          <Link
            href={`/${locale}/login?next=${encodeURIComponent(next)}`}
            className="font-semibold text-primary"
          >
            {t.signIn}
          </Link>
        </div>
      </form>
      {/* Map Picker Modal */}
      {showMap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">{locale === 'ar' ? 'اختر موقعك' : 'Choose Your Location'}</h2>
              <button onClick={() => setShowMap(false)} className="text-gray-500 hover:text-gray-700">{locale === 'ar' ? 'إغلاق' : 'Close'}</button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <Label className="text-gray-700 font-medium mb-2 block">{locale === 'ar' ? 'العنوان المحدد' : 'Selected Address'}</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={locale === 'ar' ? 'اكتب العنوان أو اختر من الخريطة' : 'Type address or select from map'} className="bg-white border-gray-300" />
              </div>

              <div className="relative">
                <div className="w-full h-96 rounded-lg border-2 border-gray-300 overflow-hidden">
                  <DynamicMap center={selectedCoords || addressCoords || { lat: 24.7136, lng: 46.6753 }} onMapClick={(lat: number, lng: number) => handleMapClick(lat, lng)} selectedPosition={selectedCoords || addressCoords} />
                </div>

                <Button onClick={async () => {
                  const coords = selectedCoords || addressCoords;
                  if (coords) {
                    await reverseGeocode(coords.lat, coords.lng);
                    setSelectedCoords(coords);
                    handleConfirmLocation();
                  } else if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(async (pos) => {
                      const pcoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                      setSelectedCoords(pcoords);
                      await reverseGeocode(pcoords.lat, pcoords.lng);
                      handleConfirmLocation();
                    }, () => {});
                  }
                }} className="mt-4 bg-teal-600 text-white">
                  {locale === 'ar' ? 'تأكيد الموقع' : 'Confirm Location'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}