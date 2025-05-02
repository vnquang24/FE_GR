'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFindUniqueRescueType, useFindManyRescueTypeOnDisaster, useFindManyDisaster, useFindManyDataField, useCreateRescueTypeOnDisaster } from '@/generated/hooks';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableWrapper, TableRow, TableCell } from '@/components/ui/table';
import { AlertTriangle, ArrowLeft, Calendar, Clock, FileText, AlertCircle, Info, MapPin, Shield, BarChart, Plus, Loader2, Trash2, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { PaginationComponent } from '@/components/ui/pagination-component';
import { useStoreState, useStoreActions } from '@/lib/redux/hook';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import DateTimePickerWrapper from '@/components/wrapper/date-time-picker';
import { toast } from '@/components/ui/toast';
import HierarchicalSelect, { DataFieldNode } from '@/components/wrapper/hierarchical-select';

// Định nghĩa type cho province
type Province = {
  id: string;
  name: string;
  code?: string;
};

// Định nghĩa type cho RescueResourceDisaster
type RescueResourceDisaster = {
  disasterId: string;
  value: number;
  unitId: string; 
  startDate?: Date;
  endDate?: Date;
  source?: string;
};

const RescueResourceDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const rescueTypeId = params.id as string;

  // Lấy giá trị operationNowPage từ Redux store
  const operationNowPage = useStoreState(state => state.appState.operationNowPage);
  const setOperationNowPage = useStoreActions(actions => actions.appState.setOperationNowPage);
  const [currentPage, setCurrentPage] = useState<number>(1);
  
  const ITEMS_PER_PAGE = 10;
  const [disasterStats, setDisasterStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    scheduled: 0,
    notStarted: 0
  });

  // State hiển thị dialog thêm thảm họa mới
  const [showAddDialog, setShowAddDialog] = useState(false);
  // State cho việc thêm thảm họa mới
  const [openDisasterSelect, setOpenDisasterSelect] = useState(false);
  const [currentDisaster, setCurrentDisaster] = useState<string[]>([]);
  const [disasterValue, setDisasterValue] = useState<string>('');
  const [disasterUnit, setDisasterUnit] = useState<string>('');
  const [disasterSource, setDisasterSource] = useState<string>('');
  const [disasterStartDate, setDisasterStartDate] = useState<Date | undefined>(undefined);
  const [disasterEndDate, setDisasterEndDate] = useState<Date | undefined>(undefined);
  const [isAddingDisaster, setIsAddingDisaster] = useState(false);

  // Lấy thông tin chi tiết nguồn lực cứu hộ
  const { data: rescueType, isLoading: isLoadingRescueType, error: errorRescueType } = useFindUniqueRescueType({
    where: { id: rescueTypeId }
  });

  // Lấy danh sách các thảm họa sử dụng nguồn lực cứu hộ này
  const { data: rescueTypeOnDisasters, isLoading: isLoadingDisasters, error: errorDisasters, refetch: refetchRescueTypeOnDisasters } = useFindManyRescueTypeOnDisaster({
    where: {
      rescueTypeId: rescueTypeId,
      deleted: null,
    },
    include: {
      disaster: {
        include: {
          disasterType: true,
          priorityLevel: true,
          emergencyLevel: true,
          coordinate: true,
          province: true
        }
      },
      unit: true
    },
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    orderBy: {
      startDate: 'desc'
    }
  });

  // Lấy tổng số thảm họa để tính phân trang và tất cả thông tin cho thống kê
  const { data: allRescueTypeOnDisasters, refetch: refetchAllRescueTypeOnDisasters } = useFindManyRescueTypeOnDisaster({
    where: {
      rescueTypeId: rescueTypeId,
      deleted: null
    },
    include: {
      disaster: true
    }
  });

  // Lấy danh sách thảm họa hiện có để thêm vào
  const { data: disasters, isLoading: isLoadingDisasterList } = useFindManyDisaster({
    where: {
      deleted: null
    },
    orderBy: {
      createdAt: 'desc'
    },
    include: {
      disasterType: true
    }
  });
  
  // Lấy danh sách data field để làm đơn vị
  const { data: dataFields, isLoading: isLoadingDataFields } = useFindManyDataField({
    where: {
      deleted: null
    },
    orderBy: {
      name: 'asc'
    }
  });

  // Mutation để tạo liên kết giữa nguồn lực cứu hộ và thảm họa
  const createRescueTypeOnDisasterMutation = useCreateRescueTypeOnDisaster();

  const totalPages = Math.ceil((allRescueTypeOnDisasters?.length || 0) / ITEMS_PER_PAGE);

  // Tính toán thống kê về thảm họa
  useEffect(() => {
    if (allRescueTypeOnDisasters) {
      // Tạo Set để đảm bảo không đếm trùng thảm họa
      const uniqueDisasterIds = new Set();
      const now = new Date();
      
      let active = 0;
      let completed = 0;
      let scheduled = 0;
      let notStarted = 0;
      
      allRescueTypeOnDisasters.forEach(item => {
        if (!uniqueDisasterIds.has(item.disasterId)) {
          uniqueDisasterIds.add(item.disasterId);
          
          const start = item.disaster.startDateTime ? new Date(item.disaster.startDateTime) : null;
          const end = item.disaster.endDateTime ? new Date(item.disaster.endDateTime) : null;
          
          if (!start) {
            notStarted++;
          } else if (!end) {
            active++;
          } else if (end < now) {
            completed++;
          } else {
            scheduled++;
          }
        }
      });
      
      setDisasterStats({
        total: uniqueDisasterIds.size,
        active,
        completed,
        scheduled,
        notStarted
      });
    }
  }, [allRescueTypeOnDisasters]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleBack = () => {
    router.push('/operation/rescue-resource');
  };

  const handleDisasterClick = (disasterId: string) => {
    router.push(`/operation/disaster/${disasterId}`);
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Chưa xác định';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  const getStatusIndicator = (disaster: any) => {
    const now = new Date();
    const start = disaster.startDateTime ? new Date(disaster.startDateTime) : null;
    const end = disaster.endDateTime ? new Date(disaster.endDateTime) : null;

    if (!start) {
      return <Badge variant="outline" className="bg-gray-200 text-gray-700">Chưa bắt đầu</Badge>;
    } else if (!end) {
      return <Badge variant="outline" className="bg-red-100 text-red-700">Đang diễn ra</Badge>;
    } else if (end < now) {
      return <Badge variant="outline" className="bg-blue-100 text-blue-700">Đã kết thúc</Badge>;
    } else {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Kết thúc dự kiến</Badge>;
    }
  };

  // Hiển thị dialog thêm thảm họa
  const openAddDisasterDialog = () => {
    setShowAddDialog(true);
    resetDisasterForm();
  };

  // Reset form thêm thảm họa
  const resetDisasterForm = () => {
    setCurrentDisaster([]);
    setDisasterValue('');
    setDisasterUnit('');
    setDisasterSource('');
    setDisasterStartDate(undefined);
    setDisasterEndDate(undefined);
  };

  // Đóng dialog thêm thảm họa
  const closeAddDisasterDialog = () => {
    setShowAddDialog(false);
    resetDisasterForm();
  };

  // Xử lý thêm thảm họa
  const handleAddDisaster = async () => {
    try {
      if (currentDisaster.length === 0 || !disasterValue || !disasterUnit) {
        toast.error({
          title: "Lỗi",
          description: "Vui lòng chọn thảm họa, nhập giá trị và chọn đơn vị"
        });
        return;
      }

      setIsAddingDisaster(true);

      // Kiểm tra xem thảm họa đã tồn tại trong danh sách chưa
      const existingDisasters = allRescueTypeOnDisasters?.filter(item => 
        currentDisaster.includes(item.disasterId)
      ) || [];

      if (existingDisasters.length > 0) {
        const existingNames = existingDisasters.map(item => 
          disasters?.find(d => d.id === item.disasterId)?.name || "Không xác định"
        ).join(", ");

        toast.error({
          title: "Lỗi",
          description: `Thảm họa đã tồn tại trong danh sách: ${existingNames}`
        });
        setIsAddingDisaster(false);
        return;
      }

      // Thêm các thảm họa mới
      const createPromises = currentDisaster.map(disasterId => 
        createRescueTypeOnDisasterMutation.mutateAsync({
          data: {
            disaster: {
              connect: { id: disasterId }
            },
            rescueType: {
              connect: { id: rescueTypeId }
            },
            unit: {
              connect: { id: disasterUnit }
            },
            value: parseFloat(disasterValue) || 0,
            startDate: disasterStartDate,
            endDate: disasterEndDate,
            source: disasterSource || undefined
          }
        })
      );
      
      await Promise.all(createPromises);
      
      // Refresh danh sách
      await refetchRescueTypeOnDisasters();
      await refetchAllRescueTypeOnDisasters();
      
      toast.success({
        title: "Thành công",
        description: `Đã thêm ${currentDisaster.length} thảm họa vào danh sách`
      });
      
      setIsAddingDisaster(false);
      closeAddDisasterDialog();
    } catch (error: any) {
      console.error("Lỗi khi thêm thảm họa:", error);
      toast.error({
        title: "Lỗi",
        description: error.message || "Đã xảy ra lỗi khi thêm thảm họa"
      });
      setIsAddingDisaster(false);
    }
  };

  // Thêm hàm để chuyển đổi dataFields thành DataFieldNode
  const convertToDataFieldNodes = (): DataFieldNode[] => {
    if (!dataFields) return [];
    return dataFields.map((field) => ({
      id: field.id,
      name: field.name,
      code: field.code,
      unit: field.unit,
      parentId: field.parentId || '',
      dataFieldGroup: field.dataFieldGroup || ''
    }));
  };

  // Hiển thị trang loading
  if (isLoadingRescueType || isLoadingDisasters) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-gray-700">Đang tải thông tin nguồn lực cứu hộ...</span>
      </div>
    );
  }

  // Hiển thị trang lỗi
  if (errorRescueType || errorDisasters) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <AlertTriangle className="h-16 w-16 mb-4" />
        <div className="text-xl font-semibold">Đã xảy ra lỗi</div>
        <div className="mt-2">{(errorRescueType || errorDisasters)?.message}</div>
        <Button 
          variant="outline" 
          className="mt-6"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
      </div>
    );
  }

  // Hiển thị trang không tìm thấy nguồn lực cứu hộ
  if (!rescueType) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-yellow-500">
        <AlertTriangle className="h-16 w-16 mb-4" />
        <div className="text-xl font-semibold">Không tìm thấy nguồn lực cứu hộ</div>
        <div className="mt-2">Nguồn lực cứu hộ với ID này không tồn tại hoặc đã bị xóa.</div>
        <Button 
          variant="outline" 
          className="mt-6"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-2 sm:p-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-4"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 flex-1">
          {rescueType.name}
        </h1>
      </div>

      <Card className="shadow-md border-t-4 border-blue-400 mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg flex items-center">
              <Info className="h-5 w-5 text-blue-500 mr-2" />
              Thông tin nguồn lực cứu hộ
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-1" /> Mô tả
                </h3>
                <p className="text-gray-700">{rescueType.description || 'Không có mô tả'}</p>
              </div>
              
              <div className="pt-2">
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-1" /> Thông tin sử dụng
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Tổng số thảm họa:</p>
                    <p className="text-lg font-semibold text-blue-600">{disasterStats.total}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Đang diễn ra:</p>
                    <p className="text-md font-medium text-red-600">{disasterStats.active}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Đã kết thúc:</p>
                    <p className="text-md font-medium text-blue-600">{disasterStats.completed}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Sắp diễn ra:</p>
                    <p className="text-md font-medium text-yellow-600">{disasterStats.scheduled}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" /> Thời gian
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Ngày tạo:</p>
                    <p className="text-gray-700">{formatDate(rescueType.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Cập nhật lần cuối:</p>
                    <p className="text-gray-700">{formatDate(rescueType.updatedAt)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                  <BarChart className="h-4 w-4 mr-1" /> Thống kê sử dụng
                </h3>
                <div className="bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Đang diễn ra</span>
                    <span className="text-xs font-medium text-red-600">{disasterStats.active}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${disasterStats.total ? (disasterStats.active / disasterStats.total) * 100 : 0}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Đã kết thúc</span>
                    <span className="text-xs font-medium text-blue-600">{disasterStats.completed}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${disasterStats.total ? (disasterStats.completed / disasterStats.total) * 100 : 0}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Sắp diễn ra</span>
                    <span className="text-xs font-medium text-yellow-600">{disasterStats.scheduled}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${disasterStats.total ? (disasterStats.scheduled / disasterStats.total) * 100 : 0}%` }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Chưa bắt đầu</span>
                    <span className="text-xs font-medium text-gray-600">{disasterStats.notStarted}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${disasterStats.total ? (disasterStats.notStarted / disasterStats.total) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-t-4 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl text-gray-800">
              Danh sách thảm họa sử dụng nguồn lực này
            </CardTitle>
            <Button 
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
              onClick={openAddDisasterDialog}
            >
              <Plus className="mr-2 h-4 w-4" /> Thêm thảm họa
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <TableWrapper
              variant="border"
              className="w-full"
              isLoading={isLoadingDisasters}
              data={rescueTypeOnDisasters || []}
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
                  header: "Tên thảm họa",
                  cell: (item) => (
                    <div className="flex flex-col">
                      <button 
                        onClick={() => handleDisasterClick(item.disaster.id)}
                        className="text-left font-medium text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {item.disaster.name}
                      </button>
                      <span className="text-xs text-gray-500 mt-1">
                        {item.disaster.disasterType?.name || 'Không phân loại'}
                      </span>
                    </div>
                  )
                },
                {
                  header: "Thời gian",
                  cell: (item) => (
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {formatDate(item.disaster.startDateTime)}
                      </span>
                      {item.disaster.endDateTime && (
                        <span className="text-xs text-gray-500 mt-1">
                          đến {formatDate(item.disaster.endDateTime)}
                        </span>
                      )}
                    </div>
                  ),
                  className: "w-48"
                },
                {
                  header: "Vị trí",
                  cell: (item) => (
                    <div className="flex flex-col">
                      {item.disaster.province && item.disaster.province.length > 0 ? (
                        <span className="text-sm">{item.disaster.province.map((p: Province) => p.name).join(', ')}</span>
                      ) : (
                        <span className="text-sm text-gray-500">Không có thông tin</span>
                      )}
                      {item.disaster.coordinate && (
                        <span className="text-xs text-gray-500 mt-1">
                          {item.disaster.coordinate.address || `${item.disaster.coordinate.lat.toFixed(4)}, ${item.disaster.coordinate.lng.toFixed(4)}`}
                        </span>
                      )}
                    </div>
                  )
                },
                {
                  header: "Giá trị",
                  cell: (item) => (
                    <div className="flex flex-col items-center">
                      <span className="font-medium">{item.value}</span>
                      <span className="text-xs text-gray-500 mt-1">{item.unit?.unit || ''}</span>
                    </div>
                  ),
                  className: "w-24 text-center"
                },
                {
                  header: "Trạng thái",
                  cell: (item) => (
                    <div className="flex justify-center">
                      {getStatusIndicator(item.disaster)}
                    </div>
                  ),
                  className: "w-32 text-center"
                },
                {
                  header: "Thao tác",
                  cell: (item) => (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => handleDisasterClick(item.disaster.id)}
                    >
                      Xem chi tiết
                    </Button>
                  ),
                  className: "w-32 text-center"
                }
              ]}
              emptyState={
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="h-12 w-12 text-yellow-500 mb-3" />
                      <p className="text-lg font-medium text-gray-700 mb-2">Không có dữ liệu thảm họa</p>
                      <p className="text-gray-500 mb-4">Chưa có thảm họa nào sử dụng nguồn lực cứu hộ này</p>
                    </div>
                  </TableCell>
                </TableRow>
              }
            />
          </div>
        </CardContent>

        {allRescueTypeOnDisasters && allRescueTypeOnDisasters.length > 0 && (
          <CardFooter className="flex justify-between border-t p-3 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="text-sm text-blue-700 font-medium">
              Trang {currentPage} | Tổng số: {disasterStats.total} thảm họa
            </div>
            <div className="flex space-x-2">
              <PaginationComponent
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Dialog thêm thảm họa */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Thêm thảm họa sử dụng nguồn lực</DialogTitle>
            <DialogDescription>
              Thêm thảm họa sử dụng nguồn lực cứu hộ "{rescueType?.name}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="disaster" className="text-sm font-medium text-gray-700">
                Chọn thảm họa (có thể chọn nhiều) <span className="text-red-500">*</span>
              </Label>
              <Popover open={openDisasterSelect} onOpenChange={setOpenDisasterSelect}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openDisasterSelect}
                    className="w-full justify-between overflow-hidden h-10"
                  >
                    {currentDisaster.length > 0 ? (
                      <div className="flex items-center gap-1 overflow-hidden">
                        <span>{currentDisaster.length} thảm họa đã chọn</span>
                      </div>
                    ) : (
                      "Chọn thảm họa"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-white">
                  <Command>
                    <CommandInput placeholder="Tìm kiếm thảm họa..." className="h-9" />
                    <CommandEmpty>Không tìm thấy thảm họa</CommandEmpty>
                    <CommandGroup>
                      <div className="h-60 overflow-y-auto">
                        {isLoadingDisasterList ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang tải...
                          </div>
                        ) : disasters && disasters.length > 0 ? (
                          disasters.map((disaster) => {
                            const isSelected = currentDisaster.includes(disaster.id);
                            // Kiểm tra xem thảm họa đã có trong danh sách chưa
                            const isExisting = allRescueTypeOnDisasters?.some(item => 
                              item.disasterId === disaster.id
                            );
                            return (
                              <CommandItem
                                key={disaster.id}
                                value={disaster.id}
                                disabled={isExisting}
                                onSelect={() => {
                                  if (!isExisting) {
                                    setCurrentDisaster((prev) => {
                                      if (isSelected) {
                                        return prev.filter((id) => id !== disaster.id);
                                      } else {
                                        return [...prev, disaster.id];
                                      }
                                    });
                                  }
                                }}
                                className={isExisting ? "opacity-50 cursor-not-allowed" : ""}
                              >
                                <div className={cn(
                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                  isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                                )}>
                                  {isSelected ? <Check className="h-3 w-3" /> : null}
                                </div>
                                <div className="flex flex-col">
                                  <span>{disaster.name}</span>
                                  <span className="text-xs text-gray-500">
                                    {disaster.disasterType?.name} | {getStatusIndicator(disaster)}
                                    {isExisting && " (Đã thêm)"}
                                  </span>
                                </div>
                              </CommandItem>
                            )
                          })
                        ) : (
                          <div className="p-2 text-center text-gray-500">
                            Không có thảm họa nào
                          </div>
                        )}
                      </div>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="value" className="text-sm font-medium text-gray-700">
                Giá trị <span className="text-red-500">*</span>
              </Label>
              <Input
                id="value"
                type="number"
                value={disasterValue}
                onChange={(e) => setDisasterValue(e.target.value)}
                placeholder="Nhập số lượng/giá trị"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unit" className="text-sm font-medium text-gray-700">
                Đơn vị <span className="text-red-500">*</span>
              </Label>
              <Select value={disasterUnit} onValueChange={setDisasterUnit}>
                <SelectTrigger id="unit" className="w-full">
                  <SelectValue placeholder="Chọn đơn vị" />
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[300px] overflow-y-auto">
                  {isLoadingDataFields ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang tải...
                    </div>
                  ) : dataFields && dataFields.length > 0 ? (
                    <HierarchicalSelect 
                      dataFields={convertToDataFieldNodes()}
                      emptyMessage="Không có đơn vị nào"
                      rootGroupLabel="Đơn vị cấp 1"
                      onSelectNode={setDisasterUnit}
                    />
                  ) : (
                    <div className="p-2 text-center text-gray-500">
                      Không có đơn vị nào
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="source" className="text-sm font-medium text-gray-700">
                Nguồn cung cấp
              </Label>
              <Input
                id="source"
                value={disasterSource}
                onChange={(e) => setDisasterSource(e.target.value)}
                placeholder="Nhập nguồn cung cấp (nếu có)"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Thời gian bắt đầu
              </Label>
              <DateTimePickerWrapper
                value={disasterStartDate}
                onChange={setDisasterStartDate}
                showTime={true}
                showClear={true}
                placeHolder="Chọn thời gian bắt đầu"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Thời gian kết thúc
              </Label>
              <DateTimePickerWrapper
                value={disasterEndDate}
                onChange={setDisasterEndDate}
                showTime={true}
                showClear={true}
                placeHolder="Chọn thời gian kết thúc"
                className="w-full"
                minDate={disasterStartDate}
              />
              {disasterEndDate && disasterStartDate && disasterEndDate < disasterStartDate && (
                <p className="text-xs text-red-500 mt-1">
                  Thời gian kết thúc phải sau thời gian bắt đầu
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={closeAddDisasterDialog} disabled={isAddingDisaster}>
              Hủy
            </Button>
            <Button 
              type="button" 
              onClick={handleAddDisaster}
              disabled={isAddingDisaster}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isAddingDisaster ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang thêm...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Thêm thảm họa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RescueResourceDetailPage;
