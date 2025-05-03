// pages/login.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { login, isTokenValid } from '@/utils/auth';
import Link from 'next/link';

// Định nghĩa schema Zod cho form login
const loginFormSchema = z.object({
  email: z.string().email({
    message: 'Email không hợp lệ',
  }),
  password: z.string({
    message: 'Mật khẩu không hợp lệ',
  }),
});

type LoginFormType = z.infer<typeof loginFormSchema>;

const LoginPage: React.FC = () => {
  const router = useRouter();
  const isDev = process.env.NODE_ENV === 'development';

  // Sử dụng React Hook Form với Zod Resolver
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormType>({
    resolver: zodResolver(loginFormSchema),
  });

  // Nếu đang ở môi trường dev, tự động điền email và password
  React.useEffect(() => {
    if (isDev) {
      setValue('email', 'admin@gmail.com');
      setValue('password', '1');
    }
  }, [isDev, setValue]);

  const onSubmit = async (data: LoginFormType) => {
    if (await login(data.email, data.password)) {
      router.push('/statistical/disaster');
      router.refresh(); // Refresh để đảm bảo middleware được chạy lại
    } else {
      alert('Sai email hoặc mật khẩu');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold text-center mb-6">Đăng nhập</h2>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Email input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              {...register('email')}
              className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Nhập email"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password input */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              {...register('password')}
              className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Nhập mật khẩu"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>
          <div className="flex justify-between w-full">
            <div>
              <Link href="/auth/register" className="text-blue-500 hover:underline">Đăng ký</Link>
            </div>
            <div>
              <Link href="/auth/forgot-password" className="text-blue-500 hover:underline">Quên mật khẩu</Link>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded-lg mt-4 hover:bg-blue-700 focus:outline-none"
          >
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
