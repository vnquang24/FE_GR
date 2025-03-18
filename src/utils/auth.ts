// Xử lí cookies 
import { setCookie, getCookie, deleteCookie } from 'cookies-next';
import axios from 'axios';
import { BASE_URL } from '@/constant';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}


export const authenticate = async (email: string, password: string): Promise<boolean> => {  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: email,
      password: password
    });
    console.log('Response:', response);
    if (response.data && response.status === 200) {
      const { user, accessToken, refreshToken } = response.data;
      console.log('User:', user);
      console.log('Access token:', accessToken);
      console.log('Refresh token:', refreshToken);
      // Lưu thông tin người dùng vào cookies/localStorage
      setUser(user);
      setTokens(accessToken, refreshToken);
      setAuthenticated();
      return true;
    }

    return false;
  } catch (err) {
    console.error('Authentication error:', err);
    return false;
  }
};

// Hàm lưu thông tin user
export const setUser = (user : User) => {
  // Lưu thông tin user vào localStorage hoặc cookies
  localStorage.setItem('user', JSON.stringify(user));
};

// Hàm lấy thông tin user
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  return JSON.parse(userStr);
};

// Hàm lưu tokens
export const setTokens = (accessToken: string, refreshToken: string) => {
  // Lưu access token vào memory hoặc cookies với thời gian ngắn
  setCookie('accessToken', accessToken, { 
    maxAge: 60 * 15, // 15 phút
    path: '/',
  });
  
  // Lưu refresh token vào cookie với thời gian dài hơn
  setCookie('refreshToken', refreshToken, { 
    maxAge: 60 * 60 * 24 * 30, // 30 ngày
    path: '/',
  });
};

// Hàm lấy access token
export const getAccessToken = () => {
  return getCookie('accessToken');
};

// Hàm lấy refresh token
export const getRefreshToken = () => {
  return getCookie('refreshToken');
};

export const setAuthenticated = () => {
  setCookie('auth', 'true', { 
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
};

export const isAuthenticated = () => {
  return getCookie('auth') === 'true';
};

export const logout = () => {
  // Xóa tất cả các cookies và localStorage liên quan đến xác thực
  deleteCookie('auth', { path: '/' });
  deleteCookie('accessToken', { path: '/' });
  deleteCookie('refreshToken', { path: '/' });
  localStorage.removeItem('user');
};