"use client";
import * as React from "react";
import type { Locale } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toastManager } from "@/hooks/use-toast";
import dynamic from 'next/dynamic';
import { 
  User, 
  Bell, 
  Phone, 
  Mail, 
  Save,
  Eye,
  EyeOff,
  MapPin,
  Calendar,
  CreditCard,
  Heart,
  Map,
  X,
  Crosshair
} from "lucide-react";
import { Shield, Download, Trash2 } from 'lucide-react';
import { useMedicalHistoryStatus, getMedicalHistoryLabels } from '@/hooks/use-medical-history-status';
import { apiService } from '@/lib/api';

// Dynamically import the map to avoid SSR issues
const DynamicMap = dynamic(() => import('@/components/MapComponent'), { ssr: false });

// Map Component Props
interface MapPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
  currentLocation?: string;
  ar?: boolean;
}

const MapPicker: React.FC<MapPickerProps> = ({ 
  isOpen, 
  onClose, 
  onLocationSelect, 
  currentLocation,
  ar = false 
}) => {
  const [selectedCoords, setSelectedCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [mapAddress, setMapAddress] = React.useState(currentLocation || '');
  const [isLoading, setIsLoading] = React.useState(false);

  // Get user's current location
  const getCurrentLocation = () => {
    setIsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setSelectedCoords(coords);
          reverseGeocode(coords.lat, coords.lng);
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Riyadh if location access denied
          const defaultCoords = { lat: 24.7136, lng: 46.6753 };
          setSelectedCoords(defaultCoords);
          setMapAddress(ar ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia');
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    } else {
      // Fallback to default location
      const defaultCoords = { lat: 24.7136, lng: 46.6753 };
      setSelectedCoords(defaultCoords);
      setMapAddress(ar ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia');
      setIsLoading(false);
    }
  };

  // Free reverse geocoding using Nominatim (OpenStreetMap)
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${ar ? 'ar' : 'en'}`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        setMapAddress(data.display_name);
      } else {
        // Fallback address
        setMapAddress(ar ? 'عنوان غير محدد' : 'Address not found');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setMapAddress(ar ? 'خطأ في تحديد العنوان' : 'Error finding address');
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    reverseGeocode(lat, lng);
  };

  const handleConfirmLocation = () => {
    if (selectedCoords && mapAddress) {
      onLocationSelect(mapAddress, selectedCoords);
      onClose();
    }
  };

  React.useEffect(() => {
    if (isOpen && !selectedCoords) {
      getCurrentLocation();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {ar ? 'اختر موقعك' : 'Choose Your Location'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Map Area */}
        <div className="p-6">
          <div className="mb-4">
            <Label className="text-gray-700 font-medium mb-2 block">
              {ar ? 'العنوان المحدد' : 'Selected Address'}
            </Label>
            <Input
              value={mapAddress}
              onChange={(e) => setMapAddress(e.target.value)}
              placeholder={ar ? 'اكتب العنوان أو اختر من الخريطة' : 'Type address or select from map'}
              className="bg-white border-gray-300"
            />
          </div>

          {/* Real Map */}
          <div className="relative">
            <div className="w-full h-96 rounded-lg border-2 border-gray-300 overflow-hidden">
              {isLoading ? (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="h-5 w-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                    {ar ? 'جاري تحميل الخريطة...' : 'Loading map...'}
                  </div>
                </div>
              ) : (
                <DynamicMap
                  center={selectedCoords || { lat: 24.7136, lng: 46.6753 }}
                  onMapClick={handleMapClick}
                  selectedPosition={selectedCoords}
                />
              )}
            </div>

            {/* Current Location Button */}
            <Button
              onClick={getCurrentLocation}
              disabled={isLoading}
              className="absolute top-2 right-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm"
              size="sm"
            >
              <Crosshair className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              onClick={onClose}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {ar ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleConfirmLocation}
              disabled={!selectedCoords || !mapAddress}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {ar ? 'تأكيد الموقع' : 'Confirm Location'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function SettingsClient({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  
  // Medical History integration
  const medicalHistory = useMedicalHistoryStatus();
  const labels = getMedicalHistoryLabels(locale);
  
  // Basic user info
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  
  // New profile fields
  const [nationalId, setNationalId] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [locationCoords, setLocationCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [dateOfBirth, setDateOfBirth] = React.useState('');
  const [maritalStatus, setMaritalStatus] = React.useState('');
  
  // Map state
  const [showMap, setShowMap] = React.useState(false);
  
  // Basic preferences
  const [language, setLanguage] = React.useState(locale);
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [smsNotifications, setSmsNotifications] = React.useState(true);
  
  // Password change
  const [showPassword, setShowPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [currentPassword, setCurrentPassword] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  
  // Medical data settings state
  const [allowTherapistAccess, setAllowTherapistAccess] = React.useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  
  // Loading state
  const [isLoading, setIsLoading] = React.useState(false);

  // Load current settings from backend
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const res: any = await apiService.getSettings();
        const data = res?.data || res || {};
        if (cancelled) return;

        setFirstName(data.first_name || data.firstName || firstName || '');
        setLastName(data.last_name || data.lastName || lastName || '');
        setEmail(data.email || email || '');
        setPhone(data.phone || phone || '');
        setNationalId(data.national_id || data.nationalId || nationalId || '');
        setLocation(data.address || data.location || location || '');
        setDateOfBirth(data.date_of_birth || data.dateOfBirth || dateOfBirth || '');
        setMaritalStatus(data.marital_status || data.maritalStatus || maritalStatus || '');
        if (data.city) setLocationCoords((c) => c); // keep coords unchanged; server doesn't provide coords
        setLanguage(data.language || language);
        setEmailNotifications(Boolean(data.notification_email ?? emailNotifications));
        setSmsNotifications(Boolean(data.notification_sms ?? smsNotifications));
        setAllowTherapistAccess(Boolean(data.allow_history_access ?? allowTherapistAccess));
      } catch (err) {
        console.warn('Failed to load settings from backend, using local defaults', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const handleLocationSelect = (address: string, coordinates: { lat: number; lng: number }) => {
    setLocation(address);
    setLocationCoords(coordinates);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const payload: any = {
        first_name: firstName,
        last_name: lastName,
        phone,
        address: location,
        national_id: nationalId,
        date_of_birth: dateOfBirth,
        marital_status: maritalStatus
      };

      // Include notification preferences
      payload.notification_email = Boolean(emailNotifications);
      payload.notification_sms = Boolean(smsNotifications);
      payload.allow_history_access = Boolean(allowTherapistAccess);

      const res: any = await apiService.updateSettings(payload);
      if (res && res.success === false) throw new Error(res.error || 'Failed to save');

      toastManager.add({
        title: ar ? 'تم حفظ البيانات بنجاح' : 'Profile saved successfully',
        description: ar ? 'تم تحديث معلوماتك الشخصية' : 'Your profile information has been updated',
        type: 'success',
        timeout: 3000,
      });
    } catch (error: any) {
      toastManager.add({
        title: ar ? 'خطأ في حفظ البيانات' : 'Error saving profile',
        description: String(error?.message || error) || (ar ? 'حدث خطأ أثناء حفظ البيانات' : 'An error occurred while saving your profile'),
        type: 'error',
        timeout: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toastManager.add({
        title: ar ? 'بيانات مفقودة' : 'Missing Information',
        description: ar ? 'يرجى ملء جميع الحقول' : 'Please fill all password fields',
        type: 'warning',
        timeout: 3000,
      });
      return;
    }

    setIsLoading(true);
    try {
      const res: any = await apiService.changePassword({ currentPassword, newPassword });
      if (res && res.success === false) throw new Error(res.error || 'Failed to change password');

      toastManager.add({
        title: ar ? 'تم تغيير كلمة المرور' : 'Password changed successfully',
        description: ar ? 'تم تحديث كلمة المرور بنجاح' : 'Your password has been updated successfully',
        type: 'success',
        timeout: 3000,
      });

      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      toastManager.add({
        title: ar ? 'خطأ في تغيير كلمة المرور' : 'Password change failed',
        description: String(error?.message || error) || (ar ? 'حدث خطأ أثناء تغيير كلمة المرور' : 'An error occurred while changing your password'),
        type: 'error',
        timeout: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportMedicalHistory = () => {
    if (!medicalHistory.isComplete) {
      toastManager.add({
        title: ar ? 'التاريخ الطبي غير مكتمل' : 'Medical History Incomplete',
        description: ar ? 'يرجى إكمال تاريخك الطبي أولاً' : 'Please complete your medical history first',
        type: 'warning',
        timeout: 3000,
      });
      return;
    }
    
    // Navigate to medical history summary in print mode
    window.open(`/${locale}/dashboard/medical-history?print=true`, '_blank');
    
    toastManager.add({
      title: ar ? 'جاري التصدير' : 'Exporting',
      description: ar ? 'تم فتح صفحة التصدير' : 'Export page opened',
      type: 'success',
      timeout: 3000,
    });
  };

  const handleDeleteMedicalHistory = () => {
    setShowDeleteConfirm(false);
    
    // Mock deletion - in real app this would call API
    toastManager.add({
      title: ar ? 'تم الحذف' : 'Deleted',
      description: ar ? 'تم حذف التاريخ الطبي (مؤقت)' : 'Medical history deleted (temporary)',
      type: 'success',
      timeout: 3000,
    });
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{ar ? "الإعدادات" : "Settings"}</h1>
        <p className="text-gray-600 mt-2">
          {ar ? "أدِر إعدادات حسابك الأساسية" : "Manage your basic account settings"}
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {ar ? "المعلومات الشخصية" : "Profile Information"}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gray-700 font-medium">
                  {ar ? "الاسم الأول" : "First Name"}
                </Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 bg-white border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-700 font-medium">
                  {ar ? "اسم العائلة" : "Last Name"}
                </Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 bg-white border-gray-300"
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  {ar ? "البريد الإلكتروني" : "Email"}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 bg-white border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-gray-700 font-medium">
                  {ar ? "رقم الهاتف" : "Phone Number"}
                </Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 bg-white border-gray-300"
                />
              </div>
            </div>

            {/* ID and Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nationalId" className="flex items-center gap-2 text-gray-700 font-medium">
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  {ar ? "رقم الهوية الوطنية" : "National ID"}
                </Label>
                <Input
                  id="nationalId"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder={ar ? "أدخل رقم الهوية" : "Enter National ID"}
                  className="mt-1 bg-white border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="location" className="flex items-center gap-2 text-gray-700 font-medium">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  {ar ? "العنوان" : "Address"}
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={ar ? "أدخل العنوان الكامل للزيارات المنزلية" : "Enter full address for home visits"}
                    className="bg-white border-gray-300 flex-1"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-3"
                    size="sm"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {ar ? 'انقر على أيقونة الخريطة لتحديد موقعك بدقة' : 'Click map icon to pinpoint your exact location'}
                </p>
              </div>
            </div>

            {/* Date of Birth and Marital Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  {ar ? "تاريخ الميلاد" : "Date of Birth"}
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="mt-1 bg-white border-gray-300"
                />
              </div>
              <div>
                <Label htmlFor="maritalStatus" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Heart className="h-4 w-4 text-gray-500" />
                  {ar ? "الحالة الاجتماعية" : "Marital Status"}
                </Label>
                <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                  <SelectTrigger className="mt-1 bg-white border-gray-300">
                    <SelectValue placeholder={ar ? "اختر الحالة" : "Select Status"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-300">
                    <SelectItem value="single" className="hover:bg-gray-50">
                      {ar ? "أعزب" : "Single"}
                    </SelectItem>
                    <SelectItem value="married" className="hover:bg-gray-50">
                      {ar ? "متزوج" : "Married"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <Button 
                onClick={handleSaveProfile} 
                disabled={isLoading} 
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {ar ? "جاري الحفظ..." : "Saving..."}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {ar ? "حفظ التغييرات" : "Save Changes"}
                  </div>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Medical Data & Privacy */}
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {ar ? "البيانات الطبية والخصوصية" : "Medical Data & Privacy"}
            </h2>
          </div>

          <div className="space-y-6">
            {/* Therapist Access Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">
                    {ar ? "السماح للمعالج المعين بالوصول لتاريخي الطبي" : "Allow assigned therapist to access my Medical History"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {ar ? "مطلوب لتقديم رعاية آمنة ومخصصة" : "Required for safe and personalized care"}
                  </div>
                </div>
              </div>
              <Switch
                checked={allowTherapistAccess}
                onCheckedChange={setAllowTherapistAccess}
              />
            </div>

            {/* Export Option */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">
                    {ar ? "تصدير التاريخ الطبي" : "Export Medical History"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {ar ? "احصل على نسخة قابلة للطباعة من تاريخك الطبي" : "Get a printable copy of your medical history"}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleExportMedicalHistory}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                {ar ? "تصدير" : "Export"}
              </Button>
            </div>

            {/* Delete Option */}
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-3">
                <Trash2 className="h-5 w-5 text-red-500" />
                <div>
                  <div className="font-medium text-red-900">
                    {ar ? "حذف التاريخ الطبي" : "Delete Medical History"}
                  </div>
                  <div className="text-sm text-red-600">
                    {ar ? "حذف نهائي لجميع بياناتك الطبية" : "Permanently delete all your medical data"}
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-100"
              >
                {ar ? "حذف" : "Delete"}
              </Button>
            </div>

            {/* Last Updated Info */}
            {medicalHistory.lastUpdated && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  {labels.lastUpdated} {new Date(medicalHistory.lastUpdated).toLocaleDateString(ar ? 'ar-SA' : 'en-US')}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Bell className="h-5 w-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {ar ? "الإشعارات" : "Notifications"}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">{ar ? "إشعارات البريد الإلكتروني" : "Email Notifications"}</div>
                  <div className="text-sm text-gray-500">{ar ? "تلقي إشعارات المواعيد عبر البريد" : "Receive appointment notifications via email"}</div>
                </div>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium text-gray-900">{ar ? "الرسائل النصية" : "SMS Notifications"}</div>
                  <div className="text-sm text-gray-500">{ar ? "تلقي تذكيرات المواعيد عبر الرسائل" : "Receive appointment reminders via SMS"}</div>
                </div>
              </div>
              <Switch
                checked={smsNotifications}
                onCheckedChange={setSmsNotifications}
              />
            </div>
          </div>
        </Card>

        {/* Change Password */}
        <Card className="p-6 bg-white border border-gray-200 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {ar ? "تغيير كلمة المرور" : "Change Password"}
            </h2>
          </div>

          <div className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="currentPassword" className="text-gray-700 font-medium">
                {ar ? "كلمة المرور الحالية" : "Current Password"}
              </Label>
              <div className="relative mt-1">
                <Input
                  id="currentPassword"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={ar ? "أدخل كلمة المرور الحالية" : "Enter current password"}
                  className="bg-white border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword" className="text-gray-700 font-medium">
                {ar ? "كلمة المرور الجديدة" : "New Password"}
              </Label>
              <div className="relative mt-1">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={ar ? "أدخل كلمة المرور الجديدة" : "Enter new password"}
                  className="bg-white border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </button>
              </div>
            </div>

            <Button 
              onClick={handleChangePassword} 
              disabled={isLoading || !currentPassword || !newPassword}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {ar ? "جاري التحديث..." : "Updating..."}
                </div>
              ) : (
                ar ? "تحديث كلمة المرور" : "Update Password"
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                {ar ? "تأكيد حذف التاريخ الطبي" : "Confirm Delete Medical History"}
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              {ar 
                ? "هل أنت متأكد من حذف تاريخك الطبي؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to delete your medical history? This action cannot be undone."
              }
            </p>
            <div className="flex justify-end gap-3">
              <Button 
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {ar ? "إلغاء" : "Cancel"}
              </Button>
              <Button 
                onClick={handleDeleteMedicalHistory}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {ar ? "حذف نهائي" : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Map Picker Modal */}
      <MapPicker
        isOpen={showMap}
        onClose={() => setShowMap(false)}
        onLocationSelect={handleLocationSelect}
        currentLocation={location}
        ar={ar}
      />
    </div>
  );
}