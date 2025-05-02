'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFindManyRescueType, useDeleteRescueType, useFindManyRescueTypeOnDisaster, useUpdateRescueType } from '@/generated/hooks';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableWrapper, TableRow, TableCell } from '@/components/ui/table';
import { Plus, Search, AlertTriangle, Edit, Trash2, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { PaginationComponent } from '@/components/ui/pagination-component';
import { Label } from '@/components/ui/label';
import _ from 'lodash';
import { useStoreState, useStoreActions } from '@/lib/redux/hook';

const RescueResourcePage: React.FC = () => {
  const router = useRouter();
  const [searchText, setSearchText] = useState<string>('');
  const debouncedSearchText = _.debounce(setSearchText, 500);
  
  // Sử dụng operationNowPage từ Redux store
  const operationNowPage = useStoreState(state => state.appState.operationNowPage);
  const setOperationNowPage = useStoreActions(actions => actions.appState.setOperationNowPage);
  const [currentPage, setCurrentPage] = useState<number>(operationNowPage);
  
  const ITEMS_PER_PAGE = 10;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRescueType, setSelectedRescueType] = useState<{ id: string, name: string }>({
    id: '',
    name: ''
  });

  // Lấy dữ liệu từ store khi component được mount
  useEffect(() => {
    setCurrentPage(operationNowPage);
  }, [operationNowPage]);

  // Xây dựng điều kiện tìm kiếm
  const buildSearchCondition = () => {
    let whereCondition: any = {
      deleted: null,
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
    };

    return whereCondition;
  };

  // Tạo điều kiện tìm kiếm
  const searchCondition = buildSearchCondition();
  
  // Lấy danh sách nguồn lực cứu hộ
  const { data: rescueTypes, isLoading, error, refetch } = useFindManyRescueType({
    where: {
      ...searchCondition,
      deleted: null
    },
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    orderBy: {
      createdAt: 'desc'
    }
  });

  const { data: totalCount } = useFindManyRescueType({
    where: {
      ...searchCondition,
      deleted: null
    },
    select: {
      id: true
    }
  });

  // Lấy thông tin số lượng thảm họa cho mỗi nguồn lực cứu hộ
  const { data: rescueTypeOnDisasters } = useFindManyRescueTypeOnDisaster({
    where: {
      deleted: null
    },
    select: {
      rescueTypeId: true,
      disasterId: true
    }
  });

  // Tính toán số thảm họa cho mỗi loại nguồn lực cứu hộ
  const getDisasterCountForRescueType = (rescueTypeId: string) => {
    if (!rescueTypeOnDisasters) return 0;
    
    // Tạo Set để đảm bảo không đếm trùng thảm họa
    const uniqueDisasters = new Set(
      rescueTypeOnDisasters
        .filter(item => item.rescueTypeId === rescueTypeId)
        .map(item => item.disasterId)
    );
    
    return uniqueDisasters.size;
  };

  const totalPages = Math.ceil((totalCount?.length || 0) / ITEMS_PER_PAGE);

  const deleteRescueTypeMutation = useUpdateRescueType({
    onSuccess: () => {
      refetch();
    }
  });
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setOperationNowPage(page); // Cập nhật giá trị trong Redux store
  };

  const handleEdit = (id: string) => {
    router.push(`/operation/rescue-resource/${id}`);
  };

  const handleAddNew = () => {
    router.push('/operation/rescue-resource/create');
  };

  const handleOpenDeleteModal = (rescueType: { id: string, name: string }) => {
    setSelectedRescueType(rescueType);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteRescueType = async () => {
    try {
      await deleteRescueTypeMutation.mutateAsync({
        where: { id: selectedRescueType.id },
        data: {
          deleted: new Date()
        }
      });

      toast.success({
        title: "Thành công",
        description: "Đã xóa nguồn lực cứu hộ"
      });

      setIsDeleteModalOpen(false);
    } catch (error) {
      toast.error({
        title: "Lỗi",
        description: "Không thể xóa nguồn lực cứu hộ. Vui lòng thử lại sau."
      });
      console.error("Lỗi khi xóa nguồn lực cứu hộ:", error);
    }
  };

  const resetFilters = () => {
    setSearchText('');
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
            Danh sách Nguồn lực cứu hộ
          </CardTitle>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc mô tả..."
                className="pl-8 w-64 border-blue-200"
                onChange={(e) => debouncedSearchText(e.target.value)}
              />
            </div>
            <Button
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={handleAddNew}
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
              data={rescueTypes || []}
              columns={[
                {
                  header: "STT",
                  cell: (_, index) => (
                    <div className="text-center font-medium">
                      {index + 1 + (currentPage - 1) * ITEMS_PER_PAGE}
                    </div>
                  ),
                  className: "w-12 text-center"
                },
                {
                  header: "Tên nguồn lực",
                  accessorKey: "name",
                  cell: (item) => (
                    <div className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                    </div>
                  )
                },
                {
                  header: "Mô tả",
                  cell: (item) => (
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700">{item.description || 'Không có mô tả'}</span>
                    </div>
                  )
                },
                {
                  header: "Số thảm họa",
                  cell: (item) => (
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-lg">{getDisasterCountForRescueType(item.id)}</span>
                      <span className="text-xs text-gray-500 mt-1">thảm họa sử dụng</span>
                    </div>
                  ),
                  className: "w-32 text-center"
                },
                {
                  header: "Thao tác",
                  cell: (item) => (
                    <div className="flex justify-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => handleEdit(item.id)}
                      >
                        <Edit size={16} className="mr-1" /> Bổ sung thảm họa
                      </Button>
                      {/* <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleOpenDeleteModal({ id: item.id, name: item.name })}
                      >
                        <Trash2 size={16} className="mr-1" /> Xóa
                      </Button> */}
                    </div>
                  ),
                  className: "w-48 text-center"
                }
              ]}
              emptyState={
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mb-3" />
                      <p className="text-lg font-medium text-gray-700 mb-2">Không có dữ liệu nguồn lực cứu hộ</p>
                      <p className="text-gray-500 mb-4">Chưa có nguồn lực cứu hộ nào được thêm vào hệ thống</p>
                      <Button
                        variant="outline"
                        className="mt-2 border-blue-300 text-blue-600"
                        onClick={handleAddNew}
                      >
                        <Plus size={16} className="mr-1" /> Thêm nguồn lực cứu hộ mới
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
            Trang {currentPage} | Tổng số: {totalCount?.length || 0} nguồn lực cứu hộ
          </div>
          <div className="flex space-x-2">
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </CardFooter>
      </Card>

      {/* Modal Xác Nhận Xóa */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[450px] bg-white">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Xác Nhận Xóa</DialogTitle>
            <DialogDescription className="text-center">
              Bạn có chắc chắn muốn xóa nguồn lực cứu hộ này không?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 text-center">
            <p className="font-medium text-lg text-gray-800">{selectedRescueType.name}</p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
              <AlertTriangle className="h-4 w-4 inline-block mr-1" />
              Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến nguồn lực cứu hộ này sẽ bị xóa.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="bg-white cursor-pointer">
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRescueType}
              className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
              disabled={deleteRescueTypeMutation.isPending}
            >
              {deleteRescueTypeMutation.isPending ? (
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

export default RescueResourcePage;