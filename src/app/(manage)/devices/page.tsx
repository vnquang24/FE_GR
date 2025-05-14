'use client';
import React, { useState } from 'react';
import { useFindManyDevice } from '@/generated/hooks/index';
import { useAuthControllerDeleteDevice } from '@/generated/api/chcnComponents';

import { useToast } from '@/components/ui/toast';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2, RefreshCw, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDistance } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getUserId } from '@/utils/auth';

const ManageDevicePage: React.FC = () => {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const userId = getUserId();
  console.log(userId);
  // Lấy danh sách thiết bị của người dùng hiện tại
  const { data: devices, isLoading, refetch } = useFindManyDevice({
    include: {
      refreshToken: {
        select: {
          createdAt: true,
          expiresAt: true,
          revoked: true
        }
      }
    },
    where: userId ? { userId: userId } : undefined,
    orderBy: {
      updatedAt: 'desc'
    }
  });
  console.log(devices);

  // Sử dụng hook được tạo tự động từ OpenAPI
  const deleteDevice = useAuthControllerDeleteDevice({
    onSuccess: () => {
      toast({
        title: "Thành công",
        description: "Đã đăng xuất khỏi thiết bị",
      });
      refetch();
      setDeleteId(null); // Đóng dialog
    },
    onError: (error) => {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'string'
          ? error
          : "Lỗi không xác định";
          
      toast({
        title: "Lỗi",
        description: "Không thể đăng xuất khỏi thiết bị: " + errorMessage,
        type: "error"
      });
    }
  });

  const handleRevokeDevice = (id: string) => {
    deleteDevice.mutate({
      pathParams: {
        id
      }
    });
  };

  // Tạo một thiết bị hiện tại (để so sánh và hiển thị)
  const currentDeviceName = typeof window !== 'undefined' 
    ? `${window.navigator.userAgent.split(' ')[0]} - ${window.navigator.platform}`
    : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý thiết bị</h1>
        <Button 
          onClick={() => refetch()} 
          size="sm" 
          variant="outline" 
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Làm mới
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableCaption>Danh sách thiết bị đang đăng nhập tài khoản của bạn</TableCaption>
          <TableHeader>
            <TableRow className="bg-blue-600">
              <TableHead>Tên thiết bị</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Đăng nhập gần nhất</TableHead>
              <TableHead>Hết hạn</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">Đang tải dữ liệu...</p>
                </TableCell>
              </TableRow>
            ) : devices && devices.length > 0 ? (
              devices.map((device) => {
                const lastLogin = device.refreshToken && device.refreshToken.length > 0 
                  ? device.refreshToken[0].createdAt 
                  : device.createdAt;
                
                const expiresAt = device.refreshToken && device.refreshToken.length > 0
                  ? device.refreshToken[0].expiresAt
                  : null;
                
                const isRevoked = device.refreshToken && device.refreshToken.length > 0
                  ? device.refreshToken[0].revoked
                  : false;
                
                const isCurrent = device.name === currentDeviceName;
                
                return (
                  <TableRow key={device.id} className={isCurrent ? "bg-blue-50" : ""}>
                    <TableCell className="font-medium">
                      {device.name}
                      {isCurrent && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Hiện tại</span>}
                    </TableCell>
                    <TableCell>
                      {isRevoked 
                        ? <span className="text-red-500">Đã hết hạn</span>
                        : <span className="text-green-500">Đang hoạt động</span>
                      }
                    </TableCell>
                    <TableCell>
                      {lastLogin && formatDistance(new Date(lastLogin), new Date(), { 
                        addSuffix: true,
                        locale: vi 
                      })}
                    </TableCell>
                    <TableCell>
                      {expiresAt && formatDistance(new Date(expiresAt), new Date(), { 
                        addSuffix: true, 
                        locale: vi
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog open={deleteId === device.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setDeleteId(device.id)}
                            disabled={isCurrent}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Đăng xuất từ thiết bị này?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Hành động này sẽ đăng xuất tài khoản của bạn khỏi thiết bị &quot;{device.name}&quot;. 
                              Bạn sẽ cần đăng nhập lại nếu muốn sử dụng trên thiết bị này.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRevokeDevice(device.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Đăng xuất
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                  Không tìm thấy thiết bị nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="text-right">
                Tổng số: {devices?.length || 0} thiết bị
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
      
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Lưu ý về quản lý thiết bị</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc pl-5 space-y-1">
                <li>Bạn không thể đăng xuất khỏi thiết bị hiện tại từ trang này</li>
                <li>Khi bạn đăng xuất khỏi một thiết bị, người dùng trên thiết bị đó sẽ cần đăng nhập lại</li>
                <li>Nếu bạn phát hiện thiết bị lạ, hãy đăng xuất khỏi thiết bị đó và đổi mật khẩu ngay lập tức</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageDevicePage;