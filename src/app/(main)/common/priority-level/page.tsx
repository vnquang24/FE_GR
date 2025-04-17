'use client';
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, AlertTriangle, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFindManyPriorityLevel, useCreatePriorityLevel, useUpdatePriorityLevel, useDeletePriorityLevel } from '@/generated/hooks';
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

const PriorityLevelPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPriorityLevel, setSelectedPriorityLevel] = useState<{id: string, name: string, description: string | null}>({
    id: '',
    name: '',
    description: ''
  });
  const [newPriorityLevel, setNewPriorityLevel] = useState({
    name: '',
    description: ''
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

  const { data, error, isLoading, refetch } = useFindManyPriorityLevel({
    where: {
      name: {
        contains: debouncedSearchTerm,
        mode: 'insensitive'
      }
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

  const createPriorityLevelMutation = useCreatePriorityLevel({
    onSuccess: () => {
      refetch();
    }
  });
  const updatePriorityLevelMutation = useUpdatePriorityLevel({
    onSuccess: () => {
      refetch();
    }
  });
  const deletePriorityLevelMutation = useDeletePriorityLevel({
    onSuccess: () => {
      refetch();
    }
  });

  const handleOpenAddModal = () => {
    setNewPriorityLevel({ name: '', description: '' });
    setIsAddModalOpen(true);
  };

  const handleCreatePriorityLevel = async () => {
    if (!newPriorityLevel.name.trim()) {
      toast.error({
        title: "Lỗi",
        description: "Tên độ ưu tiên không được để trống"
      });
      return;
    }

    try {
      await createPriorityLevelMutation.mutateAsync({
        data: {
          name: newPriorityLevel.name,
          description: newPriorityLevel.description || undefined
        }
      });
      
      toast.success({
        title: "Thành công",
        description: "Đã thêm độ ưu tiên mới"
      });
      
      setIsAddModalOpen(false);
    } catch (error) {
      toast.error({
        title: "Lỗi",
        description: "Không thể thêm độ ưu tiên. Vui lòng thử lại sau."
      });
      console.error("Lỗi khi thêm độ ưu tiên:", error);
    }
  };

  const handleEdit = (PriorityLevel: {id: string, name: string, description: string | null}) => {
    setSelectedPriorityLevel(PriorityLevel);
    setIsEditModalOpen(true);
  };

  const handleUpdatePriorityLevel = async () => {
    if (!selectedPriorityLevel.name.trim()) {
      toast.error({
        title: "Lỗi",
        description: "Tên độ ưu tiên không được để trống"
      });
      return;
    }

    try {
      await updatePriorityLevelMutation.mutateAsync({
        where: { id: selectedPriorityLevel.id },
        data: {
          name: selectedPriorityLevel.name,
          description: selectedPriorityLevel.description || undefined
        }
      });
      
      toast.success({
        title: "Thành công",
        description: "Đã cập nhật độ ưu tiên"
      });
      
      setIsEditModalOpen(false);
    } catch (error) {
      toast.error({
        title: "Lỗi",
        description: "Không thể cập nhật độ ưu tiên. Vui lòng thử lại sau."
      });
      console.error("Lỗi khi cập nhật độ ưu tiên:", error);
    }
  };

  const handleOpenDeleteModal = (PriorityLevel: {id: string, name: string, description: string | null}) => {
    setSelectedPriorityLevel(PriorityLevel);
    setIsDeleteModalOpen(true);
  };

  const handleDeletePriorityLevel = async () => {
    try {
      await deletePriorityLevelMutation.mutateAsync({
        where: { id: selectedPriorityLevel.id }
      });
      
      toast.success({
        title: "Thành công",
        description: "Đã xóa độ ưu tiên"
      });
      
      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error({
        title: "Lỗi",
        description: "Không thể xóa độ ưu tiên. Vui lòng thử lại sau."
      });
      console.error("Lỗi khi xóa độ ưu tiên:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

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
            Danh sách độ ưu tiên
          </CardTitle>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm độ ưu tiên..."
                className="pl-8 w-64 border-blue-200 focus:border-blue-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={handleOpenAddModal}
            >
              <Plus size={16} className="mr-1" /> Thêm mới
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-20 text-center font-semibold text-gray-700">STT</TableHead>
                  <TableHead className="font-semibold text-gray-700">Tên độ ưu tiên</TableHead>
                  <TableHead className="font-semibold text-gray-700">Mô tả</TableHead>
                  <TableHead className="w-40 text-center font-semibold text-gray-700">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data && data.length > 0 ? (
                  data.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="text-center font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className="font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{item.description || "Không có mô tả"}</TableCell>
                      <TableCell>
                        <div className="flex justify-center space-x-2">
                          <Button 
                            size="sm"
                            variant="outline"
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => handleEdit(item)}
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
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                        <p>Không có dữ liệu độ ưu tiên</p>
                        <Button 
                          variant="outline" 
                          className="mt-4 border-blue-300 text-blue-600"
                          onClick={handleOpenAddModal}
                        >
                          <Plus size={16} className="mr-1" /> Thêm độ ưu tiên mới
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        
        {/* Phân trang */}
        <CardFooter className="flex justify-between border-t p-3 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="text-sm text-blue-700 font-medium">
              Trang {currentPage + 1} | Tổng số: {data?.length || 0} độ ưu tiên
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

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Thêm độ ưu tiên Mới</DialogTitle>
            <DialogDescription className="text-center">
              Nhập thông tin chi tiết về độ ưu tiên mới
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right font-medium">
                Tên độ ưu tiên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={newPriorityLevel.name}
                onChange={(e) => setNewPriorityLevel({...newPriorityLevel, name: e.target.value})}
                className="col-span-3"
                placeholder="Nhập tên độ ưu tiên"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right font-medium">
                Mô tả
              </Label>
              <Textarea
                id="description"
                value={newPriorityLevel.description}
                onChange={(e) => setNewPriorityLevel({...newPriorityLevel, description: e.target.value})}
                className="col-span-3"
                placeholder="Nhập mô tả chi tiết về độ ưu tiên"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleCreatePriorityLevel} 
              className="bg-green-500 hover:bg-green-600 text-white"
              disabled={createPriorityLevelMutation.isPending}
            >
              {createPriorityLevelMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </div>
              ) : (
                <>
                  <Save size={16} className="mr-1" /> Lưu
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Chỉnh Sửa Loại độ ưu tiên*/}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Chỉnh Sửa độ ưu tiên</DialogTitle>
            <DialogDescription className="text-center">
              Cập nhật thông tin chi tiết về độ ưu tiên
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right font-medium">
                Tên độ ưu tiên <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={selectedPriorityLevel.name}
                onChange={(e) => setSelectedPriorityLevel({...selectedPriorityLevel, name: e.target.value})}
                className="col-span-3"
                placeholder="Nhập tên độ ưu tiên"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right font-medium">
                Mô tả
              </Label>
              <Textarea
                id="edit-description"
                value={selectedPriorityLevel.description || ''}
                onChange={(e) => setSelectedPriorityLevel({...selectedPriorityLevel, description: e.target.value})}
                className="col-span-3"
                placeholder="Nhập mô tả chi tiết về độ ưu tiên"
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={handleUpdatePriorityLevel} 
              className="bg-blue-500 hover:bg-blue-600 text-white"
              disabled={updatePriorityLevelMutation.isPending}
            >
              {updatePriorityLevelMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </div>
              ) : (
                <>
                  <Save size={16} className="mr-1" /> Cập nhật
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Xác Nhận Xóa */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Xác Nhận Xóa</DialogTitle>
            <DialogDescription className="text-center">
              Bạn có chắc chắn muốn xóa độ ưu tiên này không?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 text-center">
            <p className="font-medium text-lg text-gray-800">{selectedPriorityLevel.name}</p>
            <p className="text-gray-600 mt-2">{selectedPriorityLevel.description || "Không có mô tả"}</p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
              <AlertTriangle className="h-4 w-4 inline-block mr-1" />
              Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến độ ưu tiên này sẽ bị xóa.
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Hủy
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeletePriorityLevel}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deletePriorityLevelMutation.isPending}
            >
              {deletePriorityLevelMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </div>
              ) : (
                <>
                  <Trash2 size={16} className="mr-1 " /> Xóa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PriorityLevelPage;