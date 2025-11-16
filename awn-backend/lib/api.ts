// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // في تطبيق Next.js، يمكن استخدام cookies أو localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` })
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // إذا انتهت صلاحية التوكن، توجيه لل login
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/login';
    return;
  }

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const appointmentsApi = {
  getAppointments: () => fetchWithAuth('/appointments'),
  
  createAppointment: (data: any) => 
    fetchWithAuth('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  reschedule: (id: string, data: any) =>
    fetchWithAuth(`/appointments/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  
  cancel: (id: string) =>
    fetchWithAuth(`/appointments/${id}/cancel`, {
      method: 'PATCH'
    }),
  
  submitFeedback: (id: string, data: any) =>
    fetchWithAuth(`/appointments/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
};

export const therapistsApi = {
  getTherapists: () => fetchWithAuth('/therapists'),
  getTherapist: (id: string) => fetchWithAuth(`/therapists/${id}`)
};