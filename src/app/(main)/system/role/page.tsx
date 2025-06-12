'use client';
import React, { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Eye, Shield, Search, Edit, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { Textarea } from "@/components/ui/textarea";
import {
  useFindManyUserGroup,
  useCreateUserGroup,
  useDeleteUserGroup,
  useUpdateUserGroup
} from '@/generated/hooks/user-group';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import _ from 'lodash';
import { UserGroup } from '@prisma/client';

// Định nghĩa kiểu dữ liệu cho vai trò được chọn
type SelectedRole = {
  id: string;
  name: string;
  description: string | null;
}

const RolePage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  
  // State quản lý dialog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // State quản lý dữ liệu
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedRole, setSelectedRole] = useState<SelectedRole | null>(null);
  const [roleFormData, setRoleFormData] = useState({ name: '', description: '' });

  const ITEMS_PER_PAGE = 10;
  const debouncedSearchText = _.debounce(setSearchText, 500);

  // Hooks truy vấn dữ liệu
  const { data: userGroups = [], isLoading, refetch } = useFindManyUserGroup({
    where: {
      name: {
        contains: searchText,
        mode: 'insensitive'
      }
    },
    include: {
      _count: {
        select: { user: true }
      },
      permission: true
    },
    take: ITEMS_PER_PAGE,
    skip: currentPage * ITEMS_PER_PAGE,
    orderBy: {
      name: 'asc'
    }
  });

  // Hooks thực hiện các hành động (create, update, delete)
  const createUserGroupMutation = useCreateUserGroup();
  const updateUserGroupMutation = useUpdateUserGroup();
  const deleteUserGroupMutation = useDeleteUserGroup();

  // Xử lý khi có sự thay đổi trong form
  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setRoleFormData(prev => ({ ...prev, [id]: value }));
  };

  // Xử lý lưu (thêm mới hoặc cập nhật)
  const handleSave = async () => {
    if (!roleFormData.name.trim()) {
      toast({ title: "Lỗi", description: "Tên vai trò không được để trống", variant: "destructive" });
      return;
    }

    try {
      if (isEditDialogOpen && selectedRole) {
        // Cập nhật
        await updateUserGroupMutation.mutateAsync({
          where: { id: selectedRole.id },
          data: roleFormData
        });
        toast({ title: "Thành công", description: "Đã cập nhật vai trò" });
        setIsEditDialogOpen(false);
      } else {
        // Thêm mới
        await createUserGroupMutation.mutateAsync({
          data: roleFormData
        });
        toast({ title: "Thành công", description: "Đã tạo vai trò mới" });
        setIsAddDialogOpen(false);
      }
      refetch();
    } catch (error) {
      console.error('Lỗi khi lưu vai trò:', error);
      toast({ title: "Lỗi", description: "Không thể lưu vai trò. Vui lòng thử lại.", variant: "destructive" });
    }
  };
  
  // Xử lý xóa
  const handleConfirmDelete = async () => {
    if (!selectedRole) return;
    try {
      await deleteUserGroupMutation.mutateAsync({
        where: { id: selectedRole.id }
      });
      toast({ title: "Thành công", description: "Đã xóa vai trò" });
      setIsDeleteModalOpen(false);
      refetch();
    } catch (error) {
      console.error('Lỗi khi xóa vai trò:', error);
      toast({ title: "Lỗi", description: "Không thể xóa vai trò. Vui lòng thử lại.", variant: "destructive" });
    }
  };

  // Mở dialog thêm mới
  const handleOpenAddDialog = () => {
    setRoleFormData({ name: '', description: '' });
    setIsAddDialogOpen(true);
  };
  
  // Mở dialog sửa
  const handleOpenEditDialog = (role: SelectedRole) => {
    setSelectedRole(role);
    setRoleFormData({ name: role.name, description: role.description || '' });
    setIsEditDialogOpen(true);
  };
  
  // Mở dialog xác nhận xóa
  const handleOpenDeleteDialog = (role: SelectedRole) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };
  
  // Xử lý phân trang
  const handlePreviousPage = () => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (userGroups.length === ITEMS_PER_PAGE) setCurrentPage(currentPage + 1);
  };

  const columns = [
    {
      header: "STT",
      cell: (_: UserGroup, index: number) => <div className="text-center font-medium">{index + 1 + currentPage * ITEMS_PER_PAGE}</div>,
      className: "w-20 text-center"
    },
    {
      header: "Tên vai trò",
      accessorKey: "name",
    },
    {
      header: "Mô tả",
      accessorKey: "description",
      cell: (item: any) => item.description || "Không có mô tả"
    },
    {
        header: "Số người dùng",
        accessorKey: "_count.user",
        cell: (item: any) => (
          <div className="text-center">
            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full font-medium text-sm">
                {item._count?.user || 0}
            </span>
          </div>
        )
    },
    {
      header: "Số quyền",
      accessorKey: "permission.length",
      cell: (item: any) => (
        <div className="text-center">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium text-sm">
                {item.permission?.length || 0}
            </span>
        </div>
      )
    },
    {
      header: "Thao tác",
      cell: (item: SelectedRole) => (
        <div className="flex justify-center space-x-2">
            <Button
                size="sm"
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                onClick={() => router.push(`/system/role/${item.id}`)}
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
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{isEditDialogOpen ? 'Cập nhật vai trò' : 'Thêm vai trò mới'}</DialogTitle>
        <DialogDescription>
          {isEditDialogOpen ? 'Chỉnh sửa thông tin vai trò.' : 'Điền thông tin vai trò mới.'} Nhấn lưu khi hoàn tất.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Tên vai trò
          </Label>
          <Input
            id="name"
            value={roleFormData.name}
            onChange={handleFormChange}
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
            value={roleFormData.description}
            onChange={handleFormChange}
            className="col-span-3"
            placeholder="Nhập mô tả chi tiết về vai trò"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" onClick={handleSave}>Lưu</Button>
      </DialogFooter>
    </DialogContent>
  );

  return (
    <div className="w-full mx-auto p-2">
      <Card className="shadow-lg border-t-4 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-gray-800">Quản lý Vai trò Hệ thống</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm vai trò..."
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
                data={userGroups}
                columns={columns}
                emptyState={
                    <TableRow>
                        <TableCell colSpan={columns.length} className='text-center py-8 text-gray-500'>
                            <div className='flex flex-col items-center justify-center'>
                                <AlertTriangle className='h-8 w-8 text-yellow-500 mb-2'/>
                                <p>Không có dữ liệu vai trò</p>
                                <Button variant='outline' className='mt-4 border-blue-300 text-blue-600' onClick={handleOpenAddDialog}>
                                    <Plus size={16} className='mr-1' /> Thêm vai trò mới
                                </Button>
                            </div>
                        </TableCell>
                    </TableRow>
                }
            />
        </CardContent>
        <CardFooter className="flex justify-between border-t p-3 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className='text-sm text-blue-700 font-medium'>
                Trang {currentPage + 1} | Hiển thị {userGroups.length} kết quả
            </div>
            <div className='flex space-x-2'>
                <Button size='sm' variant='outline' onClick={handlePreviousPage} disabled={currentPage === 0} className='border-blue-300 text-blue-700 hover:bg-blue-100'>
                    <ChevronLeft className='h-4 w-4'/>
                </Button>
                <Button size='sm' variant='outline' onClick={handleNextPage} disabled={userGroups.length < ITEMS_PER_PAGE} className='border-blue-300 text-blue-700 hover:bg-blue-100'>
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
              Bạn có chắc chắn muốn xóa vai trò này không?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <p className="font-medium text-lg text-gray-800">{selectedRole?.name}</p>
            <p className="text-gray-600 mt-2">{selectedRole?.description || "Không có mô tả"}</p>
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
              disabled={deleteUserGroupMutation.isPending}
            >
              {deleteUserGroupMutation.isPending ? "Đang xử lý..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RolePage;