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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [permissionPage, setPermissionPage] = useState<{[key: string]: number}>({});
  const ITEMS_PER_PAGE = 5; // Số lượng user groups
  const PERMISSIONS_PER_PAGE = 8; // Số lượng permissions hiển thị mỗi trang

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
      header: "Nhóm chức năng",
      accessorKey: "groupName",
      cell: (item: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.groupColor === 'blue' ? 'bg-blue-100 text-blue-800' :
          item.groupColor === 'green' ? 'bg-green-100 text-green-800' :
          item.groupColor === 'purple' ? 'bg-purple-100 text-purple-800' :
          item.groupColor === 'orange' ? 'bg-orange-100 text-orange-800' :
          item.groupColor === 'teal' ? 'bg-teal-100 text-teal-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {item.groupName}
        </span>
      ),
      className: "w-36"
    },
    {
      header: "Chức năng",
      accessorKey: "permissionName",
      cell: (item: any) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 text-sm">
            {item.permissionName}
          </span>
          <span className="text-xs text-gray-500">
            {item.permissionKey}
          </span>
        </div>
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

  // Định nghĩa nhóm quyền
  const permissionGroups = [
    {
      groupName: 'Quyền cốt lõi',
      groupColor: 'blue',
      permissions: ['AdministrativeUnit', 'Category', 'Disaster', 'Media', 'RescueTypeOnDisaster']
    },
    {
      groupName: 'Đơn vị hành chính',
      groupColor: 'green', 
      permissions: ['Province', 'District', 'Commune']
    },
    {
      groupName: 'Danh mục hệ thống',
      groupColor: 'purple',
      permissions: ['DisasterType', 'PriorityLevel', 'EmergencyLevel', 'DataField', 'RescueType']
    },
    {
      groupName: 'Quản lý người dùng',
      groupColor: 'orange',
      permissions: ['User', 'UserGroup', 'Permission']
    },
    {
      groupName: 'Địa lý & Bản đồ',
      groupColor: 'teal',
      permissions: ['Zone', 'Coordinate']
    },
    {
      groupName: 'Hệ thống',
      groupColor: 'gray',
      permissions: ['Device', 'RefreshToken']
    }
  ];

  // Tạo dữ liệu cho bảng phân quyền theo nhóm logic
  const createPermissionData = () => {
    const allPermissions = permissionGroups.flatMap(group => 
      group.permissions.map(permKey => ({
        id: permKey,
        permissionKey: permKey,
        permissionName: PERMISSION_NAMES_VI[permKey],
        groupName: group.groupName,
        groupColor: group.groupColor
      }))
    );

    // Lọc theo nhóm được chọn
    if (selectedGroup === 'all') {
      return allPermissions;
    }
    
    return allPermissions.filter(perm => perm.groupName === selectedGroup);
  };

  // Hàm để lấy permissions cho một group cụ thể với pagination
  const getPermissionsForGroup = (groupId: string) => {
    const permissionData = createPermissionData();
    const currentPermissionPage = permissionPage[groupId] || 0;
    const startIndex = currentPermissionPage * PERMISSIONS_PER_PAGE;
    const endIndex = startIndex + PERMISSIONS_PER_PAGE;
    
    return {
      permissions: permissionData.slice(startIndex, endIndex),
      totalPermissions: permissionData.length,
      currentPage: currentPermissionPage,
      totalPages: Math.ceil(permissionData.length / PERMISSIONS_PER_PAGE)
    };
  };

  // Hàm để thay đổi trang permissions cho một group
  const handlePermissionPageChange = (groupId: string, newPage: number) => {
    setPermissionPage(prev => ({
      ...prev,
      [groupId]: newPage
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
  
  // Reset permission pages when filter changes
  React.useEffect(() => {
    setPermissionPage({});
  }, [selectedGroup]);

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
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              Quản lý phân quyền cho từng vai trò trong hệ thống. Bật/tắt các quyền tương ứng cho từng chức năng.
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Lọc theo nhóm:</span>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Chọn nhóm quyền" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả nhóm</SelectItem>
                  {permissionGroups.map(group => (
                    <SelectItem key={group.groupName} value={group.groupName}>
                      <div className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${
                          group.groupColor === 'blue' ? 'bg-blue-500' :
                          group.groupColor === 'green' ? 'bg-green-500' :
                          group.groupColor === 'purple' ? 'bg-purple-500' :
                          group.groupColor === 'orange' ? 'bg-orange-500' :
                          group.groupColor === 'teal' ? 'bg-teal-500' :
                          'bg-gray-500'
                        }`}></span>
                        <span>{group.groupName}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {userGroups.map((group, groupIndex) => {
                const groupPermissions = getPermissionsForGroup(group.id);
                
                return (
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
                          {/* Hiển thị tóm tắt quyền theo nhóm */}
                          <div className="flex space-x-1">
                            {['CREATE', 'READ', 'UPDATE', 'DELETE'].map(permType => {
                              const count = group.permission?.filter((p: any) => p.permissionType === permType).length || 0;
                              return (
                                <span key={permType} className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  count > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {PERMISSION_TYPES_VI[permType]}: {count}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <TableWrapper
                        variant="border"
                        className="w-full"
                        isLoading={false}
                        data={groupPermissions.permissions}
                        columns={createPermissionColumns(group)}
                        emptyState={
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                              Không có dữ liệu chức năng
                            </TableCell>
                          </TableRow>
                        }
                      />
                      
                      {/* Pagination cho permissions */}
                      {groupPermissions.totalPages > 1 && (
                        <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
                          <div className="text-sm text-gray-600">
                            Trang {groupPermissions.currentPage + 1} / {groupPermissions.totalPages} 
                            ({groupPermissions.totalPermissions} quyền)
                          </div>
                          <div className="flex space-x-1">
                            {/* Nút Previous */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePermissionPageChange(group.id, groupPermissions.currentPage - 1)}
                              disabled={groupPermissions.currentPage === 0}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>

                            {/* Các số trang */}
                            {Array.from({ length: groupPermissions.totalPages }, (_, i) => {
                              const pageNumber = i;
                              const isCurrentPage = pageNumber === groupPermissions.currentPage;
                              
                              // Hiển thị trang đầu, cuối và các trang xung quanh trang hiện tại
                              const shouldShow = 
                                pageNumber === 0 || 
                                pageNumber === groupPermissions.totalPages - 1 ||
                                Math.abs(pageNumber - groupPermissions.currentPage) <= 1;

                              if (!shouldShow) {
                                // Hiển thị dấu ... cho các trang bị ẩn
                                if (pageNumber === 1 && groupPermissions.currentPage > 2) {
                                  return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
                                }
                                if (pageNumber === groupPermissions.totalPages - 2 && groupPermissions.currentPage < groupPermissions.totalPages - 3) {
                                  return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
                                }
                                return null;
                              }

                              return (
                                <Button
                                  key={pageNumber}
                                  size="sm"
                                  variant={isCurrentPage ? "default" : "outline"}
                                  onClick={() => handlePermissionPageChange(group.id, pageNumber)}
                                  className="h-8 w-8 p-0"
                                >
                                  {pageNumber + 1}
                                </Button>
                              );
                            })}

                            {/* Nút Next */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePermissionPageChange(group.id, groupPermissions.currentPage + 1)}
                              disabled={groupPermissions.currentPage === groupPermissions.totalPages - 1}
                              className="h-8 w-8 p-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t p-3 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-blue-700 font-medium">
              Hiển thị {userGroups.length} vai trò
            </span>
            <span className="text-gray-600">
              Tổng {permissionData.length} quyền ({selectedGroup === 'all' ? 'Tất cả nhóm' : selectedGroup})
            </span>
            <div className="text-xs text-gray-500">
              {PERMISSIONS_PER_PAGE} quyền/trang
            </div>
          </div>
          
          {/* Thống kê nhóm quyền */}
          <div className="hidden md:flex space-x-2">
            {permissionGroups.map(group => (
              <span key={group.groupName} className={`px-2 py-1 rounded-full text-xs ${
                group.groupColor === 'blue' ? 'bg-blue-100 text-blue-700' :
                group.groupColor === 'green' ? 'bg-green-100 text-green-700' :
                group.groupColor === 'purple' ? 'bg-purple-100 text-purple-700' :
                group.groupColor === 'orange' ? 'bg-orange-100 text-orange-700' :
                group.groupColor === 'teal' ? 'bg-teal-100 text-teal-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {group.groupName}: {group.permissions.length}
              </span>
            ))}
          </div>
          
          {/* Navigation cho user groups */}
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
            <span className="flex items-center px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded">
              Trang {currentPage + 1}
            </span>
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