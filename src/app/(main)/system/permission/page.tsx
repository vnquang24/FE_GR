'use client';
import React, { useCallback } from 'react';
import { PermissionType } from '@prisma/client';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableCaption
} from '@/components/ui/table';
import { useToast, Toast } from '@/components/ui/toast';
import { Switch } from '@/components/ui/switch';
import { 
  useFindManyUserGroup, 
  useUpdateUserGroup, 
} from '@/generated/hooks/user-group';
import { 
  useFindManyPermission, 
} from '@/generated/hooks/permission';
import { PERMISSION_NAMES, PERMISSION_NAMES_VI, PERMISSION_TYPES_VI } from '@/constant';

const PermissionPage: React.FC = () => {
  const { toast } = useToast();

  // Sử dụng các hooks được sinh ra từ ZenStack
  const { data: userGroups = [], isLoading: isLoadingGroups, refetch: refetchUserGroups } = useFindManyUserGroup({
    include: {
      permission: true
    }
  });

  const { data: permissions = [], isLoading: isLoadingPermissions } = useFindManyPermission();
  
  // Mutation hooks
  const updateUserGroupMutation = useUpdateUserGroup();

  const togglePermission = useCallback(async (groupId: string, permissionId: string) => {
    try {
      const group = userGroups.find(g => g.id === groupId);
      if (!group) return;

      const hasPermission = group.permission.some(p => p.id === permissionId);
      
      // Cập nhật quyền cho nhóm
      await updateUserGroupMutation.mutateAsync({
        where: { id: groupId },
        data: {
          permission: {
            [hasPermission ? 'disconnect' : 'connect']: { id: permissionId }
          }
        }
      });
      
      toast({
        title: "Thành công",
        description: hasPermission 
          ? 'Đã xóa quyền khỏi vai trò'
          : 'Đã thêm quyền cho vai trò',
      });
      refetchUserGroups();
    } catch (error) {
      console.error('Lỗi khi cập nhật quyền:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật quyền. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  }, [userGroups, updateUserGroupMutation, toast, refetchUserGroups]);

  if (isLoadingGroups || isLoadingPermissions) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        <span className="ml-3 text-lg">Đang tải...</span>
      </div>
    );
  }

  return (
    <>
      {/* Thêm Toast Container ở góc phải phía trên */}
      <Toast 
        position="top-right" 
        className="custom-toast-container"
        toastOptions={{
          style: { 
            '--toastify-color-progress-light': '#3b82f6',
            '--toastify-color-progress-dark': '#3b82f6'
          } as React.CSSProperties
        }}
      />
      
      <div className="container mx-auto p-4">
        <h1 

          className="text-3xl font-bold mb-8 text-blue-800 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-1 after:w-24 after:bg-blue-500"
        >
          Quản lý Phân quyền Hệ thống
        </h1>
        
        <div 
         
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <h2 
            className="text-xl font-semibold mb-6 text-blue-700"
          >
            Phân quyền theo vai trò
          </h2>
          
          {userGroups.map((group) => (
            <div 
              key={group.id}
              className="mb-8 border border-blue-100 rounded-lg p-5 hover:shadow-md transition-shadow duration-300"
            >
              <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg text-blue-700">
                {group.name} 
                <span className="text-blue-500 text-sm ml-2">({group.description})</span>
              </h3>
              
              <div className="rounded-lg border border-blue-100 overflow-hidden">
                <Table>
                  <TableCaption>Phân quyền cho vai trò: {group.name}</TableCaption>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-500 to-blue-600">
                      <TableHead className="text-white font-medium">Chức năng</TableHead>
                      <TableHead className="text-white font-medium text-center">{PERMISSION_TYPES_VI.CREATE}</TableHead>
                      <TableHead className="text-white font-medium text-center">{PERMISSION_TYPES_VI.READ}</TableHead>
                      <TableHead className="text-white font-medium text-center">{PERMISSION_TYPES_VI.UPDATE}</TableHead>
                      <TableHead className="text-white font-medium text-center">{PERMISSION_TYPES_VI.DELETE}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(PERMISSION_NAMES).map(permKey => (
                      <TableRow key={permKey} className="hover:bg-blue-50 transition-colors duration-200">
                        <TableCell className="font-medium text-blue-800">{PERMISSION_NAMES_VI[permKey]}</TableCell>
                        {Object.values(PermissionType).map(permType => {
                          // Tìm quyền tương ứng
                          const perm = permissions.find(p => 
                            p.name === PERMISSION_NAMES[permKey] && p.permissionType === permType
                          );
                          
                          // Kiểm tra xem nhóm này có quyền này không
                          const isGranted = perm && group.permission?.some(
                            p => p.name === PERMISSION_NAMES[permKey] && p.permissionType === permType
                          );
                          
                          return (
                            <TableCell key={`${permKey}-${permType}`} className="text-center">
                              <div className="flex items-center justify-center">
                                <Switch
                                  checked={!!isGranted}
                                  onCheckedChange={() => perm && togglePermission(group.id, perm.id)}
                                />
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default PermissionPage;