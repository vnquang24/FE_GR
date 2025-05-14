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
import { useFindManyDisasterType, useDeleteDisasterType } from '@/generated/hooks';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import DialogCreateUpdateDisasterType from '@/components/common/dialog-create-update-disaster-type';
import _ from 'lodash'

const DisasterTypePage: React.FC = () => {
  const [searchText, setSearchText] = useState<string>('')
  const debouncedSearchText = _.debounce(setSearchText, 500)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDisasterType, setSelectedDisasterType] = useState<{ id: string, name: string, description: string | null }>({
    id: '',
    name: '',
    description: ''
  });

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Cài đặt debounce cho việc tìm kiếm
  // useEffect(() => {
  //   const debouncedSearch = _.debounce(() => {
  //     setSearchText(searchTerm);
  //   }, 500);

  //   debouncedSearch();

  //   return () => {
  //     debouncedSearch.cancel();
  //   };
  // }, [searchTerm]);

  const { data, error, isLoading, refetch } = useFindManyDisasterType({
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

  const deleteDisasterTypeMutation = useDeleteDisasterType({
    onSuccess: () => {
      refetch();
    }
  });

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleEdit = (disasterType: { id: string, name: string, description: string | null }) => {
    setSelectedDisasterType(disasterType);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (disasterType: { id: string, name: string, description: string | null }) => {
    setSelectedDisasterType(disasterType);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteDisasterType = async () => {
    try {
      await deleteDisasterTypeMutation.mutateAsync({
        where: { id: selectedDisasterType.id }
      });

      toast.success({
        title: "Thành công",
        description: "Đã xóa loại thảm họa"
      });

      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error({
        title: "Lỗi",
        description: "Không thể xóa loại thảm họa. Vui lòng thử lại sau."
      });
      console.error("Lỗi khi xóa loại thảm họa:", error);
    }
  };

  // if (isLoading) {
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
  //     </div>
  //   );
  // }

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
            Danh sách Loại Thảm họa
          </CardTitle>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc mô tả..."
                className="pl-8 w-64 border-blue-200 "
                onChange={(e) =>
                  debouncedSearchText(e.target.value)
                } />
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
            <TableWrapper
              variant="border"
              className="w-full"
              isLoading={isLoading}
              data={data || []}
              columns={[
                {
                  header: "STT",
                  cell: (_, index) => (
                    <div className="text-center font-medium">
                      {index + 1 + currentPage * ITEMS_PER_PAGE}
                    </div>
                  ),
                  className: "w-20 text-center"
                },
                {
                  header: "Tên loại thảm họa",
                  accessorKey: "name",
                  cell: (item) => (
                    <div className="flex items-center">
                      <span className="font-medium">{item.name}</span>
                    </div>
                  )
                },
                {
                  header: "Mô tả",
                  accessorKey: "description",
                  cell: (item) => (
                    <span className="text-gray-600">
                      {item.description || "Không có mô tả"}
                    </span>
                  )
                },
                {
                  header: "Thao tác",
                  cell: (item) => (
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
                  ),
                  className: "w-40 text-center"
                }
              ]}
              emptyState={
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                      <p>Không có dữ liệu loại thảm họa</p>
                      <Button
                        variant="outline"
                        className="mt-4 border-blue-300 text-blue-600"
                        onClick={handleOpenAddModal}
                      >
                        <Plus size={16} className="mr-1" /> Thêm loại thảm họa mới
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
            Trang {currentPage + 1} | Tổng số: {data?.length || 0} loại thảm họa
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

      {/* Dialog thêm mới loại thảm họa */}
      <DialogCreateUpdateDisasterType
        open={isAddModalOpen}
        setOpen={setIsAddModalOpen}
        mode="create"
        onSuccess={refetch}
      />

      {/* Dialog cập nhật loại thảm họa */}
      <DialogCreateUpdateDisasterType
        open={isEditModalOpen}
        setOpen={setIsEditModalOpen}
        initialData={selectedDisasterType}
        mode="update"
        onSuccess={refetch}
      />

      {/* Modal Xác Nhận Xóa */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Xác Nhận Xóa</DialogTitle>
            <DialogDescription className="text-center">
              Bạn có chắc chắn muốn xóa loại thảm họa này không?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 text-center">
            <p className="font-medium text-lg text-gray-800">{selectedDisasterType.name}</p>
            <p className="text-gray-600 mt-2">{selectedDisasterType.description || "Không có mô tả"}</p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
              <AlertTriangle className="h-4 w-4 inline-block mr-1" />
              Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến loại thảm họa này sẽ bị xóa.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDisasterType}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deleteDisasterTypeMutation.isPending}
            >
              {deleteDisasterTypeMutation.isPending ? (
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

export default DisasterTypePage;