import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import type { Locale } from "@/lib/i18n";
import { getDictionary } from "@/lib/i18n";
import "../globals.css";
import Header from "@/components/header";          // client component
import FooterSection from "@/components/footer";   // <-- import the named default correctly
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/ui/base-toast"

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "Awn | عون",
  description: "Physical Therapy Platform",
};

// Type helper so TS knows the dict shape coming from getDictionary (still useful elsewhere)
type Dict = Awaited<ReturnType<typeof getDictionary>>;

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // Next may provide params as a Promise whose inner `locale` is typed as `string`.
  // Accept a flexible shape and coerce to our `Locale` union below.
  params: any | Promise<any>;
}) {
  const resolvedParams = params && typeof params.then === "function" ? await params : params;
  const rawLocale = (resolvedParams && resolvedParams.locale) ? String(resolvedParams.locale) : "en";
  const lang: Locale = rawLocale === "ar" ? "ar" : "en";
  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={lang}
      dir={dir}
      suppressHydrationWarning
      className={cairo.variable}
    >
      <body className="min-h-dvh flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ToastProvider position="top-right" timeout={5000} showCloseButton={true}>
  <Header locale={lang} />
  <main id="main" className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
    {children}
  </main>
  <FooterSection locale={lang} />
</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}