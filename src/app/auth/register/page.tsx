// pages/register.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { register as authRegister } from '@/utils/auth';

// Định nghĩa schema Zod cho form register
const registerFormSchema = z.object({
    email: z.string().email({
        message: 'Email không hợp lệ',
    }),
    password: z.string({
        message: 'Mật khẩu không hợp lệ',
    }),
    name: z.string({
        message: 'Tên không hợp lệ',
    }),
    phone: z.string().min(10, { message: 'Số điện thoại phải có ít nhất 10 ký tự' }).max(10, { message: 'Số điện thoại không được vượt quá 10 ký tự' })
});

type registerFormType = z.infer<typeof registerFormSchema>;

const registerPage: React.FC = () => {
    const router = useRouter();
    // Sử dụng React Hook Form với Zod Resolver
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<registerFormType>({
        resolver: zodResolver(registerFormSchema),
    });

    const onSubmit = async (data: registerFormType) => {
        if (await authRegister(data.email, data.password, data.phone, data.name)){
            router.push('/statistical/disaster');
            router.refresh();
        } else {
            alert('Đăng kí thất bại');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-lg w-96">
                <h2 className="text-2xl font-semibold text-center mb-6">Đăng ký</h2>

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
                    {/* Name input */}
                    <div className="mb-4">
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                            Tên
                        </label>
                        <input
                            type="text"
                            id="name"
                            {...register('name')}
                            className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder="Nhập tên"
                        />
                        {errors.name && (
                            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                        )}
                    </div>
                    {/* Phone input */}
                    <div className="mb-4">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Số điện thoại
                        </label>
                        <input
                            type="text"
                            id="phone"
                            {...register('phone')}
                            className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder="Nhập số điện thoại"
                        />
                        {errors.phone && (
                            <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                        )}
                    </div>
                    {/* Submit button */}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white p-2 rounded-lg mt-4 hover:bg-blue-700 focus:outline-none"
                    >
                        Đăng ký
                    </button>
                </form>
            </div>
        </div>
    );
};

export default registerPage;
