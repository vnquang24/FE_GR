'use client';
import React, { useCallback, useState } from 'react';
import { PermissionType } from '@prisma/client';
import { 
  TableWrapper,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Shield, AlertTriangle, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 5; // Giảm số lượng để hiển thị tốt hơn

  // Sử dụng các hooks được sinh ra từ ZenStack
  const { data: userGroups = [], isLoading: isLoadingGroups, refetch: refetchUserGroups } = useFindManyUserGroup({
    include: {
      permission: true,
      _count: {
        select: { user: true }
      }
    },
    take: ITEMS_PER_PAGE,
    skip: currentPage * ITEMS_PER_PAGE,
    orderBy: {
      name: 'asc'
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

  // Xử lý phân trang
  const handlePreviousPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (userGroups.length === ITEMS_PER_PAGE) setCurrentPage(currentPage + 1);
  };

  // Tạo columns cho bảng phân quyền của từng vai trò
  const createPermissionColumns = (group: any) => [
    {
      header: "STT",
      cell: (_: any, index: number) => <div className="text-center font-medium">{index + 1}</div>,
      className: "w-16 text-center"
    },
    {
      header: "Chức năng",
      accessorKey: "permissionName",
      cell: (item: any) => (
        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
          {item.permissionName}
        </span>
      ),
      className: "w-48"
    },
    {
      header: PERMISSION_TYPES_VI.CREATE,
      cell: (item: any) => {
        const createPerm = permissions.find(p => 
          p.name === PERMISSION_NAMES[item.permissionKey] && p.permissionType === PermissionType.CREATE
        );
        const isGranted = createPerm && group.permission?.some(
          (p: any) => p.name === PERMISSION_NAMES[item.permissionKey] && p.permissionType === PermissionType.CREATE
        );
        return (
          <div className="flex items-center justify-center">
            <Switch
              checked={!!isGranted}
              onCheckedChange={() => createPerm && togglePermission(group.id, createPerm.id)}
            />
          </div>
        );
      },
      className: "w-24 text-center"
    },
    {
      header: PERMISSION_TYPES_VI.READ,
      cell: (item: any) => {
        const readPerm = permissions.find(p => 
          p.name === PERMISSION_NAMES[item.permissionKey] && p.permissionType === PermissionType.READ
        );
        const isGranted = readPerm && group.permission?.some(
          (p: any) => p.name === PERMISSION_NAMES[item.permissionKey] && p.permissionType === PermissionType.READ
        );
        return (
          <div className="flex items-center justify-center">
            <Switch
              checked={!!isGranted}
              onCheckedChange={() => readPerm && togglePermission(group.id, readPerm.id)}
            />
          </div>
        );
      },
      className: "w-24 text-center"
    },
    {
      header: PERMISSION_TYPES_VI.UPDATE,
      cell: (item: any) => {
        const updatePerm = permissions.find(p => 
          p.name === PERMISSION_NAMES[item.permissionKey] && p.permissionType === PermissionType.UPDATE
        );
        const isGranted = updatePerm && group.permission?.some(
          (p: any) => p.name === PERMISSION_NAMES[item.permissionKey] && p.permissionType === PermissionType.UPDATE
        );
        return (
          <div className="flex items-center justify-center">
            <Switch
              checked={!!isGranted}
              onCheckedChange={() => updatePerm && togglePermission(group.id, updatePerm.id)}
            />
          </div>
        );
      },
      className: "w-24 text-center"
    },
    {
      header: PERMISSION_TYPES_VI.DELETE,
      cell: (item: any) => {
        const deletePerm = permissions.find(p => 
          p.name === PERMISSION_NAMES[item.permissionKey] && p.permissionType === PermissionType.DELETE
        );
        const isGranted = deletePerm && group.permission?.some(
          (p: any) => p.name === PERMISSION_NAMES[item.permissionKey] && p.permissionType === PermissionType.DELETE
        );
        return (
          <div className="flex items-center justify-center">
            <Switch
              checked={!!isGranted}
              onCheckedChange={() => deletePerm && togglePermission(group.id, deletePerm.id)}
            />
          </div>
        );
      },
      className: "w-24 text-center"
    }
  ];

  // Tạo dữ liệu cho bảng phân quyền
  const createPermissionData = () => {
    return Object.keys(PERMISSION_NAMES).map(permKey => ({
      id: permKey,
      permissionKey: permKey,
      permissionName: PERMISSION_NAMES_VI[permKey]
    }));
  };

  if (isLoadingGroups || isLoadingPermissions) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        <span className="ml-3 text-lg">Đang tải...</span>
      </div>
    );
  }

  const permissionData = createPermissionData();

  return (
    <div className="w-full mx-auto p-2 space-y-6">
      <Card className="shadow-lg border-t-4 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="text-xl text-gray-800 flex items-center">
            <Shield className="mr-2 h-6 w-6" />
            Quản lý Phân quyền Hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-sm text-gray-600 mb-4">
            Quản lý phân quyền cho từng vai trò trong hệ thống. Bật/tắt các quyền tương ứng cho từng chức năng.
          </div>
          
          {userGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="flex flex-col items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                <p>Không có dữ liệu phân quyền</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {userGroups.map((group, groupIndex) => (
                <Card key={group.id} className="border border-blue-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                    <CardTitle className="text-lg text-blue-800 flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="mr-2 h-5 w-5" />
                        <span>{group.name}</span>
                        {group.description && (
                          <span className="text-blue-600 text-sm ml-2 font-normal">
                            ({group.description})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-sm">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          {group._count?.user || 0} người dùng
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          {group.permission?.length || 0} quyền
                        </span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <TableWrapper
                      variant="border"
                      className="w-full"
                      isLoading={false}
                      data={permissionData}
                      columns={createPermissionColumns(group)}
                      emptyState={
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                            Không có dữ liệu chức năng
                          </TableCell>
                        </TableRow>
                      }
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t p-3 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="text-sm text-blue-700 font-medium">
            Trang {currentPage + 1} | Hiển thị {userGroups.length} vai trò
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handlePreviousPage} 
              disabled={currentPage === 0} 
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleNextPage} 
              disabled={userGroups.length < ITEMS_PER_PAGE} 
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PermissionPage;