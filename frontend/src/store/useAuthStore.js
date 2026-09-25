import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('cvsu_staff_token') || null,
  staff: JSON.parse(localStorage.getItem('cvsu_staff_profile') || 'null'),

  login: (token, staff) => {
    localStorage.setItem('cvsu_staff_token', token);
    localStorage.setItem('cvsu_staff_profile', JSON.stringify(staff));
    set({ token, staff });
  },

  logout: () => {
    localStorage.removeItem('cvsu_staff_token');
    localStorage.removeItem('cvsu_staff_profile');
    set({ token: null, staff: null });
  },
}));
