"use client";
import * as React from "react";
import type { Locale } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { CalendarDays, Heart, Settings, ClipboardList, User } from "lucide-react";
import { FileText } from "lucide-react";
import { IconBrandTabler, IconArrowLeft } from "@tabler/icons-react";
import { motion } from "motion/react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  locale: Locale;
}

// Logo components exactly like in the original
const Logo = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black dark:text-white"
      >
        Awn
      </motion.span>
    </a>
  );
};

const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <div className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </a>
  );
};

export default function DashboardLayout({ children, locale }: DashboardLayoutProps) {
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [profileLabel, setProfileLabel] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return setProfileLabel('');
      const u = JSON.parse(raw || '{}');
      const first = u.first_name || u.firstName || u.first || '';
      const last = u.last_name || u.lastName || u.last || '';
      const full = u.name || u.full_name || `${first} ${last}`.trim();
      const name = (full && String(full).trim()) || first || last || '';
      setProfileLabel(name || '');
    } catch (err) {
      console.error('Failed to parse user for sidebar label', err);
      setProfileLabel('');
    }
  }, []);

  useEffect(() => {
    const loggedIn = localStorage.getItem("isLoggedIn");
    if (!loggedIn) {
      window.location.href = `/${locale}/login`;
    }
  }, [locale]);

  // Links exactly like the original
  const links = [
    {
      label: ar ? "لوحة التحكم" : "Dashboard",
      href: `/${locale}/dashboard`,
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: ar ? "المواعيد" : "Appointments",
      href: `/${locale}/dashboard/appointments`,
      icon: (
        <CalendarDays className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: ar ? "البيانات الطبية" : "Medical History",
      href: `/${locale}/dashboard/medical-history`,
      icon: (
        <FileText className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: ar ? "خطط العلاج" : "Treatment Plans",
      href: `/${locale}/dashboard/plans`,
      icon: (
        <ClipboardList className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: ar ? "المفضلة" : "Favorites",
      href: `/${locale}/dashboard/favorites`,
      icon: (
        <Heart className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: ar ? "الإعدادات" : "Settings",
      href: `/${locale}/dashboard/settings`,
      icon: (
        <Settings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
   
  ];

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-gray-100 md:flex-row dark:border-neutral-700 dark:bg-neutral-800",
        "min-h-screen"
      )}
      dir={ar ? "rtl" : "ltr"}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {open ? <Logo /> : <LogoIcon />}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: profileLabel || (ar ? 'الإعدادات' : 'Profile'),
                href: `/${locale}/dashboard/settings`,
                icon: (
                  <User className="h-7 w-7 shrink-0 text-neutral-700 dark:text-neutral-200" />
                ),
              }}
            />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1">
        <div className="flex h-full w-full flex-1 flex-col gap-2 rounded-tl-2xl border border-neutral-200 bg-white p-2 md:p-10 dark:border-neutral-700 dark:bg-neutral-900">
          {children}
        </div>
      </div>
    </div>
  );
}