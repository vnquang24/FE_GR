'use client';
import React, { useState, useEffect } from 'react';
import {
  TableCell,
  TableRow,
  TableWrapper
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFindManyRescueType, useDeleteRescueType } from '@/generated/hooks';
import { ConfirmDialog } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import DialogCreateUpdateRescueResourceType from '@/components/common/dialog-create-update-rescue-resource-type';
import { z } from 'zod';

const rescueTypeSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: 'Tên phương thức cứu hộ không được để trống' }),
  description: z.string().optional(),
  unit: z.string().optional(),
});

type RescueTypeFormValues = z.infer<typeof rescueTypeSchema>;

const RescueResourceTypePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRescueType, setSelectedRescueType] = useState<RescueTypeFormValues>({
    id: '',
    name: '',
    description: '',
    unit: ''
  });

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Thêm lại logic Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, error, isLoading, refetch } = useFindManyRescueType({
    where: {
      name: {
        contains: debouncedSearchTerm,
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: {
      name: 'asc'
    },
    skip: currentPage * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE
  });

  // Bỏ comment useEffect này để reset trang khi tìm kiếm
  useEffect(() => {
    setCurrentPage(0);
  }, [debouncedSearchTerm]);

  // Xử lý chuyển trang
  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (data && data.length === ITEMS_PER_PAGE) {
      setCurrentPage(currentPage + 1);
    }
  };

  const deleteRescueTypeMutation = useDeleteRescueType({
    onSuccess: () => {
      toast.success({
        title: "Thành công",
        description: "Đã xóa phương thức cứu hộ"
      });
      setIsDeleteModalOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error({
        title: "Lỗi",
        description: "Không thể xóa phương thức cứu hộ. Vui lòng thử lại sau."
      });
      console.error("Lỗi khi xóa phương thức cứu hộ:", error);
    }
  });

  const handleOpenAddEditModal = (rescueType: RescueTypeFormValues) => {
    if (rescueType.id === '') {
      setIsAddModalOpen(true);
    } else {
      setSelectedRescueType(rescueType);
      setIsEditModalOpen(true);
    }
  };
  const handleOpenDeleteModal = (rescueType: RescueTypeFormValues) => {
    setSelectedRescueType(rescueType);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteRescueType = async () => {
    await deleteRescueTypeMutation.mutateAsync({
      where: { id: selectedRescueType.id }
    });
  };

  // Định nghĩa cấu trúc columns cho TableWrapper
  const columns = [
    {
      header: 'STT',
      cell: (_: any, index: number) => <div className="text-center font-medium">{index + 1}</div>,
      className: 'w-20 text-center font-semibold text-gray-700'
    },
    {
      header: 'Tên phương thức cứu hộ',
      accessorKey: 'name',
      cell: (item: any) => (
        <div className="flex items-center">
          <span className="font-medium">{item.name}</span>
        </div>
      ),
      className: 'font-semibold text-gray-700'
    },
    {
      header: 'Mô tả',
      accessorKey: 'description',
      cell: (item: any) => <div className="text-gray-600">{item.description || "Không có mô tả"}</div>,
      className: 'font-semibold text-gray-700'
    },
    {
      header: 'Thao tác',
      cell: (item: any) => (
        <div className="flex justify-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            onClick={() => handleOpenAddEditModal(item)}
          >
            <Edit size={16} className="mr-1" /> Sửa
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => handleOpenDeleteModal(item)}
          >
            <Trash2 size={16} className="mr-1" /> Xóa
          </Button>
        </div>
      ),
      className: 'w-40 text-center font-semibold text-gray-700'
    }
  ];

  // Định nghĩa EmptyState cho TableWrapper
  const emptyState = (
    <TableRow>
      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
        <div className="flex flex-col items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
          <p>Không có dữ liệu cấp khẩn cấp</p>
          <Button
            variant="outline"
            className="mt-4 border-blue-300 text-blue-600"
            onClick={() => handleOpenAddEditModal({ id: '', name: '', description: '', unit: '' })}
          >
            <Plus size={16} className="mr-1" /> Thêm phương thức cứu hộ mới
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <AlertTriangle className="h-12 w-12 mb-4" />
        <div className="text-xl font-semibold">Đã xảy ra lỗi</div>
        <div className="mt-2">{error.message}</div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-2">
      <Card className="shadow-lg border-t-4 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-gray-800">
            Danh sách phương thức cứu hộ
          </CardTitle>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm phương thức cứu hộ..."
                className="pl-8 w-64 border-blue-200 focus:border-blue-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={() => handleOpenAddEditModal({ id: '', name: '', description: ''})}
            >
              <Plus size={16} className="mr-1" /> Thêm mới
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <TableWrapper
            variant="border"
            columns={columns}
            data={data || []}
            isLoading={isLoading}
            emptyState={emptyState}
          />
        </CardContent>

        {/* Phân trang */}
        <CardFooter className="flex justify-between border-t p-3 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="text-sm text-blue-700 font-medium">
            Trang {currentPage + 1} | Tổng số: {data?.length || 0} phương thức cứu hộ
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
              disabled={!data || data.length < ITEMS_PER_PAGE}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Dialog Thêm mới */}
      <DialogCreateUpdateRescueResourceType
        open={isAddModalOpen}
        setOpen={setIsAddModalOpen}
        onSuccess={refetch}
        mode="create"
      />

      {/* Dialog Chỉnh sửa */}
      <DialogCreateUpdateRescueResourceType
        open={isEditModalOpen}
        setOpen={setIsEditModalOpen}
        initialData={selectedRescueType}
        onSuccess={refetch}
        mode="update"
      />

      {/* Modal Xác Nhận Xóa */}
      <ConfirmDialog
        open={isDeleteModalOpen}
        setOpen={setIsDeleteModalOpen}
        title="Xác nhận xóa"
        description="Bạn có chắc chắn muốn xóa phương thức cứu hộ này không?"
        onConfirm={handleDeleteRescueType}
        isLoading={deleteRescueTypeMutation.isPending}
        confirmText="Xóa"
        cancelText="Hủy"
      />
    </div>
  );
};

export default RescueResourceTypePage;