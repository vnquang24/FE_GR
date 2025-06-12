'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Eye, Search, Edit, AlertTriangle, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  TableWrapper,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from '@/components/ui/multi-select';
import {
  useFindManyUser,
  useCreateUser,
  useDeleteUser,
  useUpdateUser
} from '@/generated/hooks/user';
import { useFindManyUserGroup } from '@/generated/hooks/user-group';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import _ from 'lodash';
import { User, UserRole } from '@prisma/client';

// Định nghĩa kiểu dữ liệu cho người dùng được chọn  
type SelectedUser = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  locked: boolean;
  group?: Array<{ id: string; name: string }>;
}

// Định nghĩa form data
type UserFormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole | '';
  locked: boolean;
  groupIds: string[];
}

const UserPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  
  // State quản lý dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // State quản lý dữ liệu
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<SelectedUser | null>(null);
  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: '',
    locked: false,
    groupIds: []
  });

  const ITEMS_PER_PAGE = 10;
  const debouncedSearchText = _.debounce((value: string) => setSearchText(value), 500);

  // Hooks truy vấn dữ liệu
  const { data: users = [], isLoading, refetch } = useFindManyUser({
    where: {
      OR: [
        { name: { contains: searchText, mode: 'insensitive' } },
        { email: { contains: searchText, mode: 'insensitive' } }
      ]
    },
    include: {
      group: {
        select: {
          id: true,
          name: true
        }
      }
    },
    take: ITEMS_PER_PAGE,
    skip: currentPage * ITEMS_PER_PAGE,
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Hooks cho danh sách nhóm người dùng
  const { data: userGroups = [] } = useFindManyUserGroup({
    select: {
      id: true,
      name: true
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Hooks thực hiện các hành động (create, update, delete)
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Định nghĩa các giá trị UserRole
  const userRoleOptions = [
    { value: 'ADMIN', label: 'Quản trị viên' },
    { value: 'STAFF', label: 'Nhân viên' },
    { value: 'RESIDENT', label: 'Cư dân' }
  ];

  // Chuyển đổi userGroups thành format cho MultiSelect
  const userGroupOptions = userGroups.map(group => ({
    value: group.id,
    label: group.name
  }));

  // Xử lý khi có sự thay đổi trong form
  const handleFormChange = (field: keyof UserFormData, value: string | boolean | string[]) => {
    setUserFormData(prev => ({ ...prev, [field]: value }));
  };

  // Xử lý thay đổi nhóm người dùng từ MultiSelect
  const handleGroupsChange = (selectedGroups: Array<{ label: string; value: string }>) => {
    const groupIds = selectedGroups.map(group => group.value);
    handleFormChange('groupIds', groupIds);
  };

  // Xử lý lưu (thêm mới hoặc cập nhật)
  const handleSave = async () => {
    if (!userFormData.name.trim() || !userFormData.email.trim() || !userFormData.role) {
      toast({ title: "Lỗi", description: "Vui lòng điền đầy đủ thông tin bắt buộc", variant: "destructive" });
      return;
    }

    try {
      if (isEditDialogOpen && selectedUser) {
        // Cập nhật
        await updateUserMutation.mutateAsync({
          where: { id: selectedUser.id },
          data: {
            name: userFormData.name,
            email: userFormData.email,
            phone: userFormData.phone || null,
            role: userFormData.role as UserRole,
            locked: userFormData.locked,
            ...(userFormData.password && { password: userFormData.password }),
            group: {
              set: userFormData.groupIds.map(id => ({ id }))
            }
          }
        });
        toast({ title: "Thành công", description: "Đã cập nhật người dùng" });
        setIsEditDialogOpen(false);
      } else {
        // Thêm mới
        if (!userFormData.password.trim()) {
          toast({ title: "Lỗi", description: "Mật khẩu không được để trống khi thêm mới", variant: "destructive" });
          return;
        }
        
        await createUserMutation.mutateAsync({
          data: {
            name: userFormData.name,
            email: userFormData.email,
            phone: userFormData.phone || null,
            password: userFormData.password,
            role: userFormData.role as UserRole,
            locked: userFormData.locked,
            group: {
              connect: userFormData.groupIds.map(id => ({ id }))
            }
          }
        });
        toast({ title: "Thành công", description: "Đã tạo người dùng mới" });
        setIsAddDialogOpen(false);
      }
      refetch();
    } catch (error) {
      console.error('Lỗi khi lưu người dùng:', error);
      toast({ title: "Lỗi", description: "Không thể lưu người dùng. Vui lòng thử lại.", variant: "destructive" });
    }
  };
  
  // Xử lý xóa
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await deleteUserMutation.mutateAsync({
        where: { id: selectedUser.id }
      });
      toast({ title: "Thành công", description: "Đã xóa người dùng" });
      setIsDeleteModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Lỗi khi xóa người dùng:', error);
      toast({ title: "Lỗi", description: "Không thể xóa người dùng. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  // Mở dialog thêm mới
  const handleOpenAddDialog = () => {
    setUserFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: '',
      locked: false,
      groupIds: []
    });
    setIsAddDialogOpen(true);
  };
  
  // Mở dialog sửa
  const handleOpenEditDialog = (user: SelectedUser) => {
    setSelectedUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '', // Không hiển thị mật khẩu cũ
      role: user.role,
      locked: user.locked,
      groupIds: user.group?.map(g => g.id) || []
    });
    setIsEditDialogOpen(true);
  };
  
  // Mở dialog xác nhận xóa
  const handleOpenDeleteDialog = (user: SelectedUser) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };
  
  // Xử lý phân trang
  const handlePreviousPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (users.length === ITEMS_PER_PAGE) setCurrentPage(currentPage + 1);
  };

  // Hàm lấy tên vai trò bằng tiếng Việt
  const getRoleLabel = (role: UserRole) => {
    const roleOption = userRoleOptions.find(opt => opt.value === role);
    return roleOption?.label || role;
  };

  const columns = [
    {
      header: "STT",
      cell: (_: User, index: number) => <div className="text-center font-medium">{index + 1 + currentPage * ITEMS_PER_PAGE}</div>,
      className: "w-20 text-center"
    },
    {
      header: "Tên người dùng",
      accessorKey: "name",
    },
    {
      header: "Email",
      accessorKey: "email",
    },
    {
      header: "Số điện thoại",
      accessorKey: "phone",
      cell: (item: User & { group?: Array<{ id: string; name: string }> }) => item.phone || "Chưa có"
    },
    {
      header: "Vai trò",
      accessorKey: "role",
      cell: (item: User & { group?: Array<{ id: string; name: string }> }) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
          {getRoleLabel(item.role)}
        </span>
      )
    },
    {
      header: "Nhóm người dùng",
      accessorKey: "group",
      cell: (item: User & { group?: Array<{ id: string; name: string }> }) => (
        <div className="text-center">
          {item.group && item.group.length > 0 ? (
            <div className="flex flex-wrap gap-1 justify-center">
              {item.group.slice(0, 2).map((group) => (
                <span key={group.id} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  {group.name}
                </span>
              ))}
              {item.group.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                  +{item.group.length - 2}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500 text-sm">Chưa có nhóm</span>
          )}
        </div>
      )
    },
    {
      header: "Trạng thái",
      accessorKey: "locked",
      cell: (item: User & { group?: Array<{ id: string; name: string }> }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          !item.locked 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {!item.locked ? 'Đang hoạt động' : 'Bị khóa'}
        </span>
      )
    },
    {
      header: "Thao tác",
      cell: (item: SelectedUser) => (
        <div className="flex justify-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            onClick={() => router.push(`/system/user/${item.id}`)}
          >
            <Eye size={16} className="mr-1" /> Chi tiết
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-yellow-400 text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
            onClick={() => handleOpenEditDialog(item)}
          >
            <Edit size={16} className="mr-1" /> Sửa
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => handleOpenDeleteDialog(item)}
          >
            <Trash2 size={16} className="mr-1" /> Xóa
          </Button>
        </div>
      ),
      className: "w-64 text-center"
    }
  ];

  const renderDialog = (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>{isEditDialogOpen ? 'Cập nhật người dùng' : 'Thêm người dùng mới'}</DialogTitle>
        <DialogDescription>
          {isEditDialogOpen ? 'Chỉnh sửa thông tin người dùng.' : 'Điền thông tin người dùng mới.'} Nhấn lưu khi hoàn tất.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Tên <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            value={userFormData.name}
            onChange={(e) => handleFormChange('name', e.target.value)}
            className="col-span-3"
            placeholder="Nhập tên người dùng"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            value={userFormData.email}
            onChange={(e) => handleFormChange('email', e.target.value)}
            className="col-span-3"
            placeholder="Nhập địa chỉ email"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="phone" className="text-right">
            Số điện thoại
          </Label>
          <Input
            id="phone"
            value={userFormData.phone}
            onChange={(e) => handleFormChange('phone', e.target.value)}
            className="col-span-3"
            placeholder="Nhập số điện thoại"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="password" className="text-right">
            Mật khẩu {!isEditDialogOpen && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="password"
            type="password"
            value={userFormData.password}
            onChange={(e) => handleFormChange('password', e.target.value)}
            className="col-span-3"
            placeholder={isEditDialogOpen ? "Để trống nếu không đổi mật khẩu" : "Nhập mật khẩu"}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="role" className="text-right">
            Vai trò <span className="text-red-500">*</span>
          </Label>
          <Select
            value={userFormData.role}
            onValueChange={(value) => handleFormChange('role', value)}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Chọn vai trò" />
            </SelectTrigger>
            <SelectContent>
              {userRoleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="groups" className="text-right">
            Nhóm người dùng
          </Label>
          <div className="col-span-3">
            <MultiSelect
              data={userGroupOptions}
              value={userFormData.groupIds}
              onValueChange={handleGroupsChange}
              placeholder="Chọn nhóm người dùng"
              className="bg-white"
              popoverContentClassName="bg-white shadow-md"
              maxCount={3}
              maxCountLabel="nhóm khác"
            />
            {userFormData.groupIds.length > 0 && (
              <p className="text-xs text-blue-500 mt-1">
                Đã chọn {userFormData.groupIds.length} nhóm
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="locked" className="text-right">
            Trạng thái
          </Label>
          <Select
            value={userFormData.locked ? 'locked' : 'active'}
            onValueChange={(value) => handleFormChange('locked', value === 'locked')}
          >
            <SelectTrigger className="col-span-3">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Đang hoạt động</SelectItem>
              <SelectItem value="locked">Bị khóa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button 
          variant="outline" 
          onClick={() => {
            setIsAddDialogOpen(false);
            setIsEditDialogOpen(false);
          }}
        >
          Hủy
        </Button>
        <Button type="submit" onClick={handleSave}>Lưu</Button>
      </DialogFooter>
    </DialogContent>
  );

  return (
    <div className="w-full mx-auto p-2">
      <Card className="shadow-lg border-t-4 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-gray-800 flex items-center">
            <Users className="mr-2 h-6 w-6" />
            Quản lý Người dùng Hệ thống
          </CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm người dùng..."
                className="pl-8 w-64 border-blue-200"
                onChange={(e) => debouncedSearchText(e.target.value)}
              />
            </div>
            <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={handleOpenAddDialog}>
              <Plus size={16} className="mr-1" /> Thêm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <TableWrapper
            variant='border'
            className='w-full'
            isLoading={isLoading}
            data={users}
            columns={columns}
            emptyState={
              <TableRow>
                <TableCell colSpan={columns.length} className='text-center py-8 text-gray-500'>
                  <div className='flex flex-col items-center justify-center'>
                    <AlertTriangle className='h-8 w-8 text-yellow-500 mb-2'/>
                    <p>Không có dữ liệu người dùng</p>
                    <Button variant='outline' className='mt-4 border-blue-300 text-blue-600' onClick={handleOpenAddDialog}>
                      <Plus size={16} className='mr-1' /> Thêm người dùng mới
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            }
          />
        </CardContent>
        <CardFooter className="flex justify-between border-t p-3 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className='text-sm text-blue-700 font-medium'>
            Trang {currentPage + 1} | Hiển thị {users.length} kết quả
          </div>
          <div className='flex space-x-2'>
            <Button size='sm' variant='outline' onClick={handlePreviousPage} disabled={currentPage === 0} className='border-blue-300 text-blue-700 hover:bg-blue-100'>
              <ChevronLeft className='h-4 w-4'/>
            </Button>
            <Button size='sm' variant='outline' onClick={handleNextPage} disabled={users.length < ITEMS_PER_PAGE} className='border-blue-300 text-blue-700 hover:bg-blue-100'>
              <ChevronRight className='h-4 w-4'/>
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        {renderDialog}
      </Dialog>
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        {renderDialog}
      </Dialog>
      
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Xác Nhận Xóa</DialogTitle>
            <DialogDescription className="text-center">
              Bạn có chắc chắn muốn xóa người dùng này không?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="font-medium text-lg text-gray-800">{selectedUser?.name}</p>
            <p className="text-gray-600 mt-2">{selectedUser?.email}</p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
              <AlertTriangle className="h-4 w-4 inline-block mr-1" />
              Hành động này không thể hoàn tác.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Đang xử lý..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserPage;