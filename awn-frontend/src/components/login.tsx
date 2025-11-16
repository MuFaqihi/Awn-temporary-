'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Eye, EyeOff } from 'lucide-react';
import { toastManager } from '@/hooks/use-toast';
import { login } from '@/lib/api';

type Locale = 'ar' | 'en';
type Dict = {
  title: string; 
  subtitle: string;
  emailLabel: string; 
  emailPlaceholder: string;
  passwordLabel: string; 
  forgot: string; 
  signIn: string;
  noAccount: string; 
  create: string;
  signingIn: string;
  success: string;
  error: string;
  networkError: string;
};

const AR: Dict = {
  title: 'تسجيل الدخول إلى عون',
  subtitle: 'مرحبًا بعودتك! سجّل دخولك للمتابعة.',
  emailLabel: 'البريد الإلكتروني', 
  emailPlaceholder: 'example@email.com',
  passwordLabel: 'كلمة المرور', 
  forgot: 'نسيت كلمة المرور؟', 
  signIn: 'تسجيل الدخول',
  noAccount: 'ليس لديك حساب؟', 
  create: 'إنشاء حساب',
  signingIn: 'جاري تسجيل الدخول...',
  success: 'تم تسجيل الدخول بنجاح',
  error: 'فشل في تسجيل الدخول',
  networkError: 'حدث خطأ في الشبكة'
};

const EN: Dict = {
  title: 'Sign in to Awn',
  subtitle: 'Welcome back! Sign in to continue.',
  emailLabel: 'Email address', 
  emailPlaceholder: 'example@email.com',
  passwordLabel: 'Password', 
  forgot: 'Forgot your password?', 
  signIn: 'Sign in',
  noAccount: "Don't have an account?", 
  create: 'Create account',
  signingIn: 'Signing in...',
  success: 'Login successful',
  error: 'Login failed',
  networkError: 'Network error occurred'
};

export default function LoginPage({
  locale = 'ar',
  dict,
}: { 
  locale?: Locale; 
  dict?: Partial<Dict>;
}) {
  const t: Dict = { ...(locale === 'ar' ? AR : EN), ...(dict || {}) };
  const isRTL = locale === 'ar';
  const router = useRouter();
  const sp = useSearchParams();

  const role = sp.get('role') || 'patient';
  const next = sp.get('next') || 
    (role === 'therapist' ? `/${locale}/therapist-dashboard` : `/${locale}/dashboard`);

  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const form = e.currentTarget as HTMLFormElement;
      const formData = new FormData(form);

      const loginData = {
        email: formData.get('email') as string,
        password: formData.get('password') as string
      };

      console.log('  إرسال بيانات تسجيل الدخول:', loginData);

        const result = await login(loginData);

      if (result.success) {
        // حفظ التوكن والمستخدم
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('isLoggedIn', '1');
        // Notify other components in the same window that auth changed
        try { window.dispatchEvent(new Event('auth-change')); } catch (e) {}
        
        toastManager.add({
          title: t.success,
          type: 'success'
        });

        // التوجيه إلى الصفحة التالية
        // small delay so storage events propagate and background fetches see the token
        setTimeout(() => router.push(next), 120);
      } else {
        toastManager.add({
          title: result.error || t.error,
          type: 'error'
        });
      }
    } catch (error) {
      // Prefer an Error message from the API if available
      const message = error instanceof Error ? error.message : String(error);
      toastManager.add({
        title: message || t.error,
        description: t.networkError,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section 
      dir={isRTL ? 'rtl' : 'ltr'} 
      className="flex min-h-screen bg-gray-50 px-4 py-8 md:py-16 dark:bg-gray-900"
    >
      <form
        onSubmit={onSubmit}
        className="m-auto w-full max-w-[28rem] md:max-w-[36rem] overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-200 dark:bg-gray-800 dark:border-gray-700"
      >
        <div className="bg-primary/65 border-b border-primary/25 px-8 py-6">
          <div className="text-center">
            <Link href={`/${locale}`} aria-label="home" className="mx-auto block w-fit">
              <Logo className="text-white" />
            </Link>
            <h1 className="mb-2 mt-4 text-2xl font-bold text-white">{t.title}</h1>
            <p className="text-sm text-primary-foreground/90">{t.subtitle}</p>
          </div>
        </div>

        <div className="px-8 py-8">
          <div className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                {t.emailLabel}
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder={t.emailPlaceholder}
                  className="h-12 pl-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary dark:border-gray-600"
                  autoComplete="username"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                {t.passwordLabel}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="h-12 pr-10 rounded-xl border-gray-200 focus:border-primary focus:ring-primary dark:border-gray-600"
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              <div className="flex justify-end">
                <Link
                  href={`/${locale}/forgot-password`}
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  {t.forgot}
                </Link>
              </div>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? t.signingIn : t.signIn}
            </Button>

            {/* Create Account Button */}
            <Button 
              asChild 
              variant="outline" 
              className="w-full h-12 text-base border-2 border-primary text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
            >
              <Link href={`/${locale}/signup?next=${encodeURIComponent(next)}`}>
                {t.create}
              </Link>
            </Button>
          </div>
        </div>

        {/* Footer link */}
        <div className="bg-gray-50 dark:bg-gray-700 px-8 py-6 border-t border-gray-100 dark:border-gray-600">
          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            {t.noAccount}{' '}
            <Link
              href={`/${locale}/signup?next=${encodeURIComponent(next)}`}
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {t.create}
            </Link>
          </p>
        </div>
      </form>
    </section>
  );
}