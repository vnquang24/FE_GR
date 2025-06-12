'use client';
import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { PermissionType, UserRole } from '@prisma/client';
import { ArrowLeft, User, Clock, Calendar, Edit, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableCaption
} from '@/components/ui/table';
import { useFindUniqueUserGroup, useFindManyUser, useUpdateUserGroup, useUpdateUser } from '@/generated/hooks';
import { useRouter } from 'next/navigation';
import { PERMISSION_NAMES, PERMISSION_NAMES_VI, PERMISSION_TYPES_VI } from '@/constant';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/components/ui/toast';

// Định nghĩa interface cho đối tượng User để tránh sử dụng kiểu any
interface UserType {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  locked?: boolean;
  group: Array<{ id: string; name: string }>;
}

const RoleDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;
  const [activeTab, setActiveTab] = React.useState("basic-info");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'info' | 'permissions' | 'users'>('info');
  const [formValues, setFormValues] = useState<{ name: string; description: string }>({
    name: '',
    description: ''
  });
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserType[]>([]);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Lấy thông tin chi tiết vai trò
  const { data: group, isLoading, refetch } = useFindUniqueUserGroup({
    where: { id: groupId },
    include: {
      permission: true,
      user: true
    }
  });

  // Lấy danh sách tất cả người dùng
  const { data: allUsers = [], isLoading: isLoadingUsers } = useFindManyUser({
    include: {
      group: true
    }
  });

  // Mutation hooks
  const updateUserGroupMutation = useUpdateUserGroup();
  const updateUserMutation = useUpdateUser();

  // Khởi tạo giá trị form khi có dữ liệu nhóm
  React.useEffect(() => {
    if (group) {
      setFormValues({
        name: group.name,
        description: group.description || ''
      });
    }
  }, [group]);

  // Tìm những người dùng thuộc vai trò này
  const linkedUsers = React.useMemo(() => {
    if (!group) return [];
    return allUsers.filter(user => user.group.some(g => g.id === groupId));
  }, [group, allUsers, groupId]);

  // Lấy danh sách người dùng với khả năng tìm kiếm
  const { data: searchResults = [], refetch: refetchSearch, isLoading: isLoadingSearch } = useFindManyUser({
    where: searchQuery.trim() ? {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { phone: { contains: searchQuery, mode: 'insensitive' } }
      ],
      NOT: {
        group: {
          some: { id: groupId }
        }
      }
    } : {
      NOT: {
        group: {
          some: { id: groupId }
        }
      }
    },
    include: {
      group: true
    }
  }, {
    enabled: isAddUserDialogOpen,
  });

  // Xử lý tìm kiếm người dùng
  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      setIsSearching(true);
      try {
        await refetchSearch();
      } finally {
        setIsSearching(false);
      }
    },
    [refetchSearch]
  );

  // Xử lý debounce tìm kiếm
  useEffect(() => {
    const debounceTimeout = setTimeout(() => {
      if (isAddUserDialogOpen) {
        handleSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, isAddUserDialogOpen, handleSearch]);

  // Reset danh sách người dùng đã chọn khi đóng dialog
  useEffect(() => {
    if (!isAddUserDialogOpen) {
      setSelectedUsers([]);
      setSearchQuery('');
    }
  }, [isAddUserDialogOpen]);

  // Xử lý thêm người dùng vào vai trò
  const handleAddUsersToRole = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Cảnh báo",
        description: "Vui lòng chọn ít nhất một tài khoản để thêm vào vai trò.",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const user of selectedUsers) {
        await updateUserMutation.mutateAsync({
          where: { id: user.id },
          data: {
            group: {
              connect: { id: groupId }
            }
          }
        });
      }
      
      toast({
        title: "Thành công",
        description: `Đã thêm ${selectedUsers.length} tài khoản vào vai trò "${group?.name}".`
      });
      
      setIsAddUserDialogOpen(false);
      refetch();
    } catch (error) {
      console.error('Lỗi khi thêm tài khoản vào vai trò:', error);
      toast({
        title: "Lỗi",
        description: "Không thể thêm tài khoản vào vai trò. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  };

  // Xử lý xóa người dùng khỏi vai trò
  const handleRemoveUserFromRole = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này khỏi vai trò không?')) {
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        where: { id: userId },
        data: {
          group: {
            disconnect: { id: groupId }
          }
        }
      });
      
      toast({
        title: "Thành công",
        description: "Đã xóa tài khoản khỏi vai trò."
      });
      
      refetch();
    } catch (error) {
      console.error('Lỗi khi xóa tài khoản khỏi vai trò:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa tài khoản khỏi vai trò. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  };

  // Xử lý chọn/bỏ chọn người dùng
  const toggleSelectUser = (user: UserType) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  // Kiểm tra người dùng đã được chọn chưa
  const isUserSelected = (userId: string) => {
    return selectedUsers.some(user => user.id === userId);
  };

  // Mở dialog phù hợp với tab hiện tại
  const openEditDialog = (mode: 'info' | 'permissions' | 'users') => {
    if (mode === 'permissions') {
      router.push('/system/permission');
      return;
    }
    setDialogMode(mode);
    setIsEditDialogOpen(true);
  };

  // Xử lý cập nhật vai trò
  const handleUpdateGroup = async () => {
    if (dialogMode === 'info') {
      if (!formValues.name.trim()) {
        toast({
          title: "Lỗi",
          description: "Tên vai trò không được để trống",
          variant: "destructive"
        });
        return;
      }

      try {
        await updateUserGroupMutation.mutateAsync({
          where: { id: groupId },
          data: {
            name: formValues.name,
            description: formValues.description
          }
        });
        
        setIsEditDialogOpen(false);
        toast({
          title: "Thành công",
          description: "Đã cập nhật thông tin vai trò",
        });
        refetch();
      } catch (error) {
        console.error('Lỗi khi cập nhật vai trò:', error);
        toast({
          title: "Lỗi",
          description: "Không thể cập nhật vai trò. Vui lòng thử lại.",
          variant: "destructive"
        });
      }
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: 'name' | 'description') => {
    setFormValues(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  // Lấy role name từ enum
  const getUserRoleName = (role: UserRole) => {
    const roleNames = {
      ADMIN: 'Quản trị viên',
      RESIDENT: 'Người dân',
      STAFF: 'Nhân viên'
    };
    return roleNames[role] || role;
  };

  // Tạo initials từ tên người dùng
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Tiêu đề dialog
  const getDialogTitle = () => {
    switch (dialogMode) {
      case 'info':
        return 'Chỉnh sửa thông tin vai trò';
      case 'users':
        return 'Quản lý tài khoản liên kết';
      default:
        return 'Chỉnh sửa';
    }
  };

  // Mô tả dialog
  const getDialogDescription = () => {
    switch (dialogMode) {
      case 'info':
        return 'Thay đổi thông tin cơ bản của vai trò. Nhấn lưu khi hoàn tất.';
      case 'users':
        return 'Quản lý tài khoản được gán vai trò này. Nhấn lưu khi hoàn tất.';
      default:
        return 'Thực hiện các thay đổi cần thiết.';
    }
  };

  // Nội dung dialog
  const renderDialogContent = () => {
    switch (dialogMode) {
      case 'info':
        return (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Tên vai trò
              </Label>
              <Input
                id="name"
                value={formValues.name}
                onChange={(e) => handleInputChange(e, 'name')}
                className="col-span-3"
                placeholder="Nhập tên vai trò"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Mô tả
              </Label>
              <Textarea
                id="description"
                value={formValues.description}
                onChange={(e) => handleInputChange(e, 'description')}
                className="col-span-3"
                placeholder="Nhập mô tả chi tiết về vai trò"
              />
            </div>
          </div>
        );
      case 'users':
        return (
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-gray-500">
                Quản lý tài khoản được liên kết với vai trò này.
              </p>
            </div>
            <div className="rounded-lg border border-blue-100 overflow-hidden max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead className="text-blue-800 font-medium">Tài khoản</TableHead>
                    <TableHead className="text-blue-800 font-medium">Email</TableHead>
                    <TableHead className="text-blue-800 font-medium">Vai trò hệ thống</TableHead>
                    <TableHead className="text-blue-800 font-medium">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linkedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        Chưa có tài khoản nào được liên kết
                      </TableCell>
                    </TableRow>
                  ) : (
                    linkedUsers.map((user) => (
                      <TableRow key={user.id} className="hover:bg-blue-50">
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback className="bg-blue-100 text-blue-800">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-800">
                            {getUserRoleName(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                            onClick={() => handleRemoveUserFromRole(user.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Gỡ bỏ
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (isLoading || isLoadingUsers) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        <span className="ml-3 text-lg">Đang tải...</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <h3 className="font-bold">Lỗi</h3>
          <p>Không tìm thấy vai trò</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mr-4 border-blue-300 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold text-blue-800">
          Chi tiết vai trò: {group.name}
        </h1>
      </div>

      {/* Dialog chỉnh sửa thông tin */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
            <DialogDescription>
              {getDialogDescription()}
            </DialogDescription>
          </DialogHeader>
          {renderDialogContent()}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button 
              type="submit" 
              onClick={handleUpdateGroup}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog chọn người dùng để thêm vào vai trò */}
      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Thêm tài khoản vào vai trò</DialogTitle>
            <DialogDescription>
              Tìm kiếm và chọn tài khoản người dùng để thêm vào vai trò {group?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="relative mb-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                {isSearching ? (
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                ) : (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 text-gray-400" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                    />
                  </svg>
                )}
              </div>
            </div>
            
            <div className="rounded-lg border border-gray-200 overflow-hidden max-h-80 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center"></TableHead>
                    <TableHead>Tài khoản</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vai trò hệ thống</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingSearch ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                          <span className="ml-3">Đang tìm kiếm...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : searchResults.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">
                        {searchQuery ? 'Không tìm thấy tài khoản phù hợp' : 'Tất cả tài khoản đã được thêm vào vai trò này'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    searchResults.map((user) => (
                      <TableRow 
                        key={user.id} 
                        className={`hover:bg-blue-50 ${isUserSelected(user.id) ? 'bg-blue-50' : ''} cursor-pointer`}
                        onClick={() => toggleSelectUser(user)}
                      >
                        <TableCell className="text-center">
                          <input 
                            type="checkbox" 
                            checked={isUserSelected(user.id)} 
                            onChange={() => {}} 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback className="bg-blue-100 text-blue-800">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.phone || '(Không có SĐT)'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-800">
                            {getUserRoleName(user.role)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              {selectedUsers.length > 0 ? (
                <p>Đã chọn {selectedUsers.length} tài khoản</p>
              ) : (
                <p>Chưa có tài khoản nào được chọn</p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddUserDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button 
              onClick={handleAddUsersToRole}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={selectedUsers.length === 0}
            >
              Thêm vào vai trò
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-white p-6 rounded-lg shadow-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 gap-4 mb-6">
            <TabsTrigger value="basic-info" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
              Thông tin cơ bản
            </TabsTrigger>
            <TabsTrigger value="permissions" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
              Danh sách quyền
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800">
              Tài khoản liên kết
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic-info" className="outline-none">
            <div className="bg-blue-50 p-6 rounded-lg border">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-700">Thông tin cơ bản</h2>
                <Button
                  onClick={() => openEditDialog('info')}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Chỉnh sửa thông tin
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-blue-500 font-medium mb-1">Tên vai trò:</p>
                  <p className="font-semibold text-lg">{group.name}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-blue-500 font-medium mb-1">Mô tả:</p>
                  <p className="font-medium">{group.description || 'Không có mô tả'}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-blue-500 font-medium mb-1">Tổng số quyền:</p>
                  <div className="flex items-center">
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-bold text-lg">
                      {group.permission.length}
                    </span>
                    <span className="ml-2 text-gray-500">quyền</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <p className="text-sm text-blue-500 font-medium mb-1">Số tài khoản liên kết:</p>
                  <div className="flex items-center">
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-bold text-lg">
                      {linkedUsers.length}
                    </span>
                    <span className="ml-2 text-gray-500">tài khoản</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm md:col-span-2">
                  <p className="text-sm text-blue-500 font-medium mb-3">Thông tin thời gian:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Ngày tạo:</p>
                        <p className="font-medium">
                          {format(new Date(group.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-5 w-5 text-blue-500 mr-2" />
                      <div>
                        <p className="text-xs text-gray-500">Cập nhật cuối:</p>
                        <p className="font-medium">
                          {format(new Date(group.updatedAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="outline-none">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-700">Danh sách quyền</h2>
                <Button
                  onClick={() => router.push('/system/permission')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-1 rotate-180" />
                  Đến trang phân quyền
                </Button>
              </div>
              <div className="rounded-lg border border-blue-100 overflow-hidden">
                <Table>
                  <TableCaption>Danh sách quyền của vai trò {group.name}</TableCaption>
                  <TableHeader>
                    <TableRow className="bg-blue-50">
                      <TableHead className="text-blue-800 font-medium">Chức năng</TableHead>
                      <TableHead className="text-blue-800 font-medium text-center">{PERMISSION_TYPES_VI.CREATE}</TableHead>
                      <TableHead className="text-blue-800 font-medium text-center">{PERMISSION_TYPES_VI.READ}</TableHead>
                      <TableHead className="text-blue-800 font-medium text-center">{PERMISSION_TYPES_VI.UPDATE}</TableHead>
                      <TableHead className="text-blue-800 font-medium text-center">{PERMISSION_TYPES_VI.DELETE}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(PERMISSION_NAMES).map(permKey => (
                      <TableRow key={permKey} className="hover:bg-blue-50">
                        <TableCell className="font-medium text-blue-800">{PERMISSION_NAMES_VI[permKey]}</TableCell>
                        {Object.values(PermissionType).map(permType => {
                          const hasPermission = group.permission.some(
                            p => p.name === PERMISSION_NAMES[permKey] && p.permissionType === permType
                          );
                          return (
                            <TableCell key={`${permKey}-${permType}`} className="text-center">
                              <div className="flex items-center justify-center">
                                {hasPermission ? (
                                  <span className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-400 rounded-full">
                                    ✗
                                  </span>
                                )}
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
          </TabsContent>

          <TabsContent value="users" className="outline-none">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-blue-700">Tài khoản liên kết</h2>
                <Button
                  onClick={() => setIsAddUserDialogOpen(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Thêm tài khoản
                </Button>
              </div>
              
              {linkedUsers.length === 0 ? (
                <div className="bg-gray-50 rounded-lg border p-8 text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Chưa có tài khoản nào được liên kết với vai trò này</p>
                  <Button
                    onClick={() => setIsAddUserDialogOpen(true)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm tài khoản
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-blue-100 overflow-hidden">
                  <Table>
                    <TableCaption>Danh sách tài khoản được gán vai trò {group.name}</TableCaption>
                    <TableHeader>
                      <TableRow className="bg-blue-50">
                        <TableHead className="text-blue-800 font-medium">STT</TableHead>
                        <TableHead className="text-blue-800 font-medium">Tài khoản</TableHead>
                        <TableHead className="text-blue-800 font-medium">Email</TableHead>
                        <TableHead className="text-blue-800 font-medium">Vai trò hệ thống</TableHead>
                        <TableHead className="text-blue-800 font-medium">Trạng thái</TableHead>
                        <TableHead className="text-blue-800 font-medium">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkedUsers.map((user, index) => (
                        <TableRow key={user.id} className="hover:bg-blue-50">
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarFallback className="bg-blue-100 text-blue-800">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-gray-500">{user.phone || '(Không có SĐT)'}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-50 text-blue-800">
                              {getUserRoleName(user.role)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.locked ? (
                              <Badge variant="outline" className="bg-red-50 text-red-800">
                                Đã khóa
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-800">
                                Đang hoạt động
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                              onClick={() => handleRemoveUserFromRole(user.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Gỡ bỏ
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button
            onClick={() => router.push('/system/role')}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            Quay Lại Danh Sách
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RoleDetailPage;