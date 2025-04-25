'use client';
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableWrapper
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, AlertTriangle, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFindManyEmergencyLevel, useCreateEmergencyLevel, useUpdateEmergencyLevel, useDeleteEmergencyLevel } from '@/generated/hooks';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import _ from 'lodash';
import { z } from 'zod';
import DialogCreateUpdatePriorityLevel from '@/components/common/dialog-create-update-priority-level';
import DialogCreateUpdateEmergencyLevel from '@/components/common/dialog-create-update-emergency-level';

// Định nghĩa schema validation sử dụng Zod
const emergencyLevelFormSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, { message: "Tên cấp khẩn cấp không được để trống" }),
  description: z.string().optional(), // Cho phép null hoặc undefined, và là tùy chọn
});

// Định nghĩa kiểu dữ liệu từ schema Zod
export type EmergencyLevelFormData = z.infer<typeof emergencyLevelFormSchema>;
export { emergencyLevelFormSchema };

const EmergencyLevelPage: React.FC = () => {
  const [searchText, setSearchText] = useState<string>('')
  const debouncedSearchText = _.debounce(setSearchText, 500)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEmergencyLevel, setSelectedEmergencyLevel] = useState<EmergencyLevelFormData>({
    id: '',
    name: '',
    description: ''
  });

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const { data, error} = useFindManyEmergencyLevel({
    where: {
      OR: [
        {
          name: {
            contains: searchText,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: searchText,
            mode: 'insensitive'
          }
        }
      ]
    },
    select: {
      id: true,
      name: true,
      description: true
    },
    orderBy: {
      name: 'asc'
    },
    skip: currentPage * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE
  });

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

  const deleteEmergencyLevelMutation = useDeleteEmergencyLevel({});

  const handleOpenAddEditModal = (emergencyLevel: EmergencyLevelFormData) => {
    if (emergencyLevel.id === '') {
      setIsAddModalOpen(true);
    } else {
      setSelectedEmergencyLevel(emergencyLevel);
      setIsEditModalOpen(true);
    }
  };

  // Xóa cấp khẩn cấp
  const handleOpenDeleteModal = (emergencyLevel: EmergencyLevelFormData) => {
    setSelectedEmergencyLevel(emergencyLevel);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteEmergencyLevel = async () => {
    try {
      await deleteEmergencyLevelMutation.mutateAsync({
        where: { id: selectedEmergencyLevel.id }
      });

      toast.success({
        title: "Thành công",
        description: "Đã xóa cấp khẩn cấp"
      });

      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error({
        title: "Lỗi",
        description: "Không thể xóa cấp khẩn cấp. Vui lòng thử lại sau."
      });
      console.error("Lỗi khi xóa cấp khẩn cấp:", error);
    }
  };

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
            Danh sách cấp khẩn cấp
          </CardTitle>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc mô tả..."
                className="pl-8 w-64 border-blue-200"
                onChange={(e) => {
                  debouncedSearchText(e.target.value);
                  setSearchText(e.target.value);
                }}
              />
            </div>
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={() => handleOpenAddEditModal({id: '', name: searchText, description: ''})}
            >
              <Plus size={16} className="mr-1" /> Thêm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <TableWrapper
              data={data}
              columns={[
                {
                  header: 'STT',
                  cell: (_, index) => index + 1,
                  className: 'w-20 text-center font-medium'
                },
                {
                  header: 'Tên cấp khẩn cấp',
                  accessorKey: 'name',
                  cell: (item) => (
                    <div className="flex items-center">
                      <span className="font-medium">{item.name}</span>
                    </div>
                  )
                },
                {
                  header: 'Mô tả',
                  accessorKey: 'description',
                  cell: (item) => item.description || "Không có mô tả",
                  className: 'text-gray-600'
                },
                {
                  header: 'Thao tác',
                  cell: (item) => (
                    <div className="flex justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        onClick={() => handleOpenAddEditModal(item)}
                      >
                        <Edit size={16} className="mr-1" /> Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => handleOpenDeleteModal(item)}
                      >
                        <Trash2 size={16} className="mr-1" /> Xóa
                      </Button>
                    </div>
                  ),
                  className: 'w-40 text-center'
                }
              ]}
              emptyState={
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                      <p>Không có dữ liệu cấp khẩn cấp</p>
                      <Button
                        variant="outline"
                        className="mt-4 border-blue-300 text-blue-600"
                        onClick={() => handleOpenAddEditModal({id: '', name: searchText, description: ''})}
                      >
                        <Plus size={16} className="mr-1" /> Thêm cấp khẩn cấp mới
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              }
            />
          </div>
        </CardContent>
        {/* Phân trang */}
        <CardFooter className="flex justify-between border-t p-3 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="text-sm text-blue-700 font-medium">
            Trang {currentPage + 1} | Tổng số: {data?.length || 0} cấp khẩn cấp
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

      <DialogCreateUpdateEmergencyLevel
        open={isAddModalOpen}
        setOpen={setIsAddModalOpen}
        mode="create"
      >
      </DialogCreateUpdateEmergencyLevel>

      <DialogCreateUpdateEmergencyLevel
        open={isEditModalOpen}
        setOpen={setIsEditModalOpen}
        mode="update"
        initialData={selectedEmergencyLevel}
      >
      </DialogCreateUpdateEmergencyLevel>

      
      {/* Dialog xác nhận xóa */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Xác nhận xóa</DialogTitle>
            <DialogDescription className="text-center">
              Bạn có chắc chắn muốn xóa cấp khẩn cấp "{selectedEmergencyLevel?.name}"?
            </DialogDescription>
          </DialogHeader>
          
          <div className="text-center py-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-3" />
            <p className="text-sm text-gray-500">
              Hành động này không thể hoàn tác.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleDeleteEmergencyLevel} 
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deleteEmergencyLevelMutation.isPending}
            >
              {deleteEmergencyLevelMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </div>
              ) : (
                <>
                  <Trash2 size={16} className="mr-1" /> Xóa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmergencyLevelPage;