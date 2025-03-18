'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/utils/auth';

const HomePage: React.FC = () => {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-200">
      <h1 className="text-3xl font-bold">Trang Chính</h1>
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white p-2 mt-4 rounded-lg hover:bg-red-700"
      >
        Đăng xuất
      </button>
    </div>
  );
};

export default HomePage;