// src/lib/api.ts - النسخة الحقيقية
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

class ApiService {
  private async fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    
    console.log('  جاري الاتصال بـ:', `${API_BASE_URL}${url}`);
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` })
    };

    // Try primary URL first. If we get a 404 and the base URL does not contain '/api',
    // retry with '/api' inserted. This helps when NEXT_PUBLIC_API_URL is set
    // to e.g. 'http://localhost:5001' instead of 'http://localhost:5001/api'.
    let response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (response.status === 404 && !API_BASE_URL.includes('/api')) {
      try {
        const alt = `${API_BASE_URL.replace(/\/$/, '')}/api${url}`;
        console.warn('Primary request returned 404; retrying with', alt);
        response = await fetch(alt, { ...options, headers, credentials: 'include' });
      } catch (e) {
        // ignore and handle below
      }
    }

    console.log('📡 حالة الاستجابة:', response.status, response.statusText);

    if (response.status === 401) {
      // Clear auth locally and throw - let callers decide how to handle redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  private handleUnauthorized() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  // المواعيد - الاتصال الحقيقي
  async getAppointments() {
    return this.fetchWithAuth('/appointments');
  }

  async createAppointment(data: any) {
    return this.fetchWithAuth('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async rescheduleAppointment(id: string, data: any) {
    return this.fetchWithAuth(`/appointments/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Bookings (guest / request-based) endpoints
  async rescheduleBooking(id: string, data: any) {
    return this.fetchWithAuth(`/bookings/${id}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async cancelBooking(id: string, data: any = {}) {
    return this.fetchWithAuth(`/bookings/${id}/cancel`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async cancelAppointment(id: string) {
    return this.fetchWithAuth(`/appointments/${id}/cancel`, {
      method: 'PATCH'
    });
  }

  async submitFeedback(id: string, data: any) {
    return this.fetchWithAuth(`/appointments/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // المعالجين - الاتصال الحقيقي
  async getTherapists() {
    return this.fetchWithAuth('/therapists');
  }

  async getTherapist(id: string) {
    return this.fetchWithAuth(`/therapists/${id}`);
  }

  // Favorites
  async getFavorites() {
    return this.fetchWithAuth('/favorites');
  }

  async toggleFavorite(therapistId: string, action: 'add' | 'remove') {
    return this.fetchWithAuth('/favorites', {
      method: 'POST',
      body: JSON.stringify({ therapistId, action })
    });
  }

  // Settings
  async getSettings() {
    return this.fetchWithAuth('/settings');
  }

  async updateSettings(data: any) {
    return this.fetchWithAuth('/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.fetchWithAuth('/settings/change-password', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Medical history
  async getMedicalHistory() {
    return this.fetchWithAuth('/medical-history');
  }

  async saveMedicalHistory(data: any) {
    return this.fetchWithAuth('/medical-history', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Treatment plans for patient
  async getTreatmentPlans(patientId: string, status?: string) {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.fetchWithAuth(`/treatment-plans/patient/${patientId}${q}`);
  }
}

export const apiService = new ApiService();

// Public auth helpers (no auth header required)
export async function signup(data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const text = await res.text().catch(() => '')
    let json: any = {}
    try { json = text ? JSON.parse(text) : {} } catch (e) { json = {} }

    if (!res.ok) {
      const msg = json?.error || json?.message || text || `HTTP error ${res.status}`
      throw new Error(msg)
    }

    return json
  } catch (err: any) {
    throw new Error(err?.message || 'Network error during signup')
  }
}

export async function login(data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const text = await res.text().catch(() => '')
    let json: any = {}
    try { json = text ? JSON.parse(text) : {} } catch (e) { json = {} }

    if (!res.ok) {
      const msg = json?.error || json?.message || text || `HTTP error ${res.status}`
      throw new Error(msg)
    }

    return json
  } catch (err: any) {
    throw new Error(err?.message || 'Network error during login')
  }
}