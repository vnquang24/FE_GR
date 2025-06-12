'use client';

import { useParams } from 'next/navigation';
import { useFindUniqueUser } from '@/generated/hooks/index';
import { Loader2 } from 'lucide-react';

export default function UserDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  
  const { data: user, isLoading, isError, error } = useFindUniqueUser({
    where: { id },
    include: { group: true }
  });

  // Xử lý trạng thái đang tải
  if (isLoading) {
    return (
      <div className="w-full p-4 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Đang tải thông tin người dùng...</span>
      </div>
    );
  }

  // Xử lý lỗi
  if (isError || !user) {
    return (
      <div className="w-full p-4">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <h3 className="font-bold">Không tìm thấy người dùng</h3>
          <p>{error?.message || 'Người dùng không tồn tại hoặc đã bị xóa'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold mb-6">Thông tin người dùng</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Thông tin cơ bản</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">ID</label>
              <div className="mt-1">{user.id}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Tên</label>
              <div className="mt-1">{user.name}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <div className="mt-1">{user.email}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Vai trò</label>
              <div className="mt-1">{user.role}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Trạng thái</label>
              <div className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  !user.locked ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {!user.locked ? 'Đang hoạt động' : 'Bị khóa'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Nhóm người dùng</h2>
          {user.group?.map(group => (
            <div key={group.id} className="p-3 border rounded-md mb-2">
              {group.name}
            </div>
          )) || <p>Chưa thuộc nhóm nào</p>}
        </div>
      </div>
    </div>
  );
}

