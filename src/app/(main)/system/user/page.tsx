'use client';
import React, { useState } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Eye, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useFindManyUser } from '@/generated/index';
import { Button } from '@/components/ui/button';

const UserManagePage: React.FC = () => {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // Sửa lại include, không còn roles mà là group (UserGroup)
  const { data, isLoading, isError, error } = useFindManyUser({
    include: {
      group: true, // Thay vì roles, ta sử dụng group theo schema
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: pageSize,
    skip: (page - 1) * pageSize,
  });

  const users = data || [];

  // Xử lý loading
  if (isLoading) {
    return (
      <div className="w-full p-4 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  // Xử lý lỗi
  if (isError) {
    return (
      <div className="w-full p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <h3 className="font-bold">Lỗi khi tải dữ liệu</h3>
          <p>{error?.message || 'Có lỗi xảy ra, vui lòng thử lại sau'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <Button variant="default">Thêm người dùng</Button>
      </div>
      
      <Table>
        <TableCaption>Danh sách người dùng trong hệ thống</TableCaption>
        <TableHeader>
          <TableRow className="bg-blue-50">
            <TableHead className="text-blue-700">ID</TableHead>
            <TableHead className="text-blue-700">Tên</TableHead>
            <TableHead className="text-blue-700">Email</TableHead>
            <TableHead className="text-blue-700">Vai trò</TableHead>
            <TableHead className="text-blue-700">Nhóm người dùng</TableHead>
            <TableHead className="text-blue-700">Trạng thái</TableHead>
            <TableHead className="text-blue-700">Ngày tham gia</TableHead>
            <TableHead className="text-center text-blue-700">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                Không có dữ liệu người dùng
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {/* Hiển thị nhóm người dùng thay vì vai trò */}
                  {user.group?.length > 0 
                    ? user.group.map(g => g.name).join(', ') 
                    : 'Chưa phân nhóm'}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    !user.locked 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {!user.locked ? 'Đang hoạt động' : 'Bị khóa'}
                  </span>
                </TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                <TableCell className="text-center">
                  <Link 
                    href={`/system/user/${user.id}`} 
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <Eye size={18} className="text-gray-600 hover:text-blue-600" />
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Phân trang đơn giản */}
      <div className="flex items-center justify-end space-x-2 mt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={page === 1}
        >
          Trước
        </Button>
        <span className="text-sm text-gray-600">
          Trang {page}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setPage(p => p + 1)}
          disabled={users.length < pageSize}
        >
          Sau
        </Button>
      </div>
    </div>
  );
};

export default UserManagePage;