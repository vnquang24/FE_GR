'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFindManyDisaster, useDeleteDisaster, useFindManyDisasterType, useFindManyPriorityLevel, useFindManyEmergencyLevel, useFindManyProvince, useFindManyDistrict, useFindManyCommune, useUpdateDisaster } from '@/generated/hooks';
import { Disaster } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TableWrapper, TableRow, TableCell } from '@/components/ui/table';
import { Plus, Search, AlertTriangle, Edit, Trash2, MapPin, Clock, X, Filter, ChevronDown, Calendar, RefreshCw, CalendarIcon } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { PaginationComponent } from '@/components/ui/pagination-component';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import DateTimePickerWrapper from '@/components/wrapper/date-time-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import _ from 'lodash';
import { useStoreState, useStoreActions } from '@/lib/redux/hook';

const DisasterPage: React.FC = () => {
  const router = useRouter();
  const [searchText, setSearchText] = useState<string>('');
  const debouncedSearchText = _.debounce(setSearchText, 500);
  
  // Sử dụng operationNowPage từ Redux store
  const operationNowPage = useStoreState(state => state.appState.operationNowPage);
  const setOperationNowPage = useStoreActions(actions => actions.appState.setOperationNowPage);
  const [currentPage, setCurrentPage] = useState<number>(operationNowPage);
  
  const ITEMS_PER_PAGE = 10;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDisaster, setSelectedDisaster] = useState<{ id: string, name: string }>({
    id: '',
    name: ''
  });
  // Các state cho tìm kiếm nâng cao
  const [selectedDisasterTypes, setSelectedDisasterTypes] = useState<string[]>([]);
  const [selectedPriorityLevels, setSelectedPriorityLevels] = useState<string[]>([]);
  const [selectedEmergencyLevels, setSelectedEmergencyLevels] = useState<string[]>([]);
  const [searchStatus, setSearchStatus] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<Date | undefined>(undefined);
  const [endDateFilter, setEndDateFilter] = useState<Date | undefined>(undefined);
  const [activeFiltersCount, setActiveFiltersCount] = useState<number>(0);

  // Thêm state cho tỉnh/thành, quận/huyện, xã/phường
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [selectedCommunes, setSelectedCommunes] = useState<string[]>([]);

  // Lấy danh sách loại thảm họa, mức độ ưu tiên, mức độ khẩn cấp từ API
  const { data: disasterTypes } = useFindManyDisasterType({
    select: { id: true, name: true },
    where: { deleted: null }
  });

  const { data: priorityLevels } = useFindManyPriorityLevel({
    select: { id: true, name: true },
    where: { deleted: null }
  });

  const { data: emergencyLevels } = useFindManyEmergencyLevel({
    select: { id: true, name: true },
    where: { deleted: null }
  });

  // Tạo data cho các MultiSelect
  const disasterTypeData = React.useMemo(() => 
    disasterTypes?.map(type => ({ value: type.id, label: type.name })) || [],
    [disasterTypes]
  );

  const priorityLevelData = React.useMemo(() => 
    priorityLevels?.map(level => ({ value: level.id, label: level.name })) || [],
    [priorityLevels]
  );

  const emergencyLevelData = React.useMemo(() => 
    emergencyLevels?.map(level => ({ value: level.id, label: level.name })) || [],
    [emergencyLevels]
  );

  // Lấy danh sách tỉnh/thành từ API
  const { data: provinces } = useFindManyProvince({
    select: { id: true, name: true },
    where: { deleted: null }
  });

  // Lấy danh sách quận/huyện từ API dựa trên tỉnh/thành đã chọn
  const { data: districts } = useFindManyDistrict({
    select: { id: true, name: true, provinceId: true },
    where: { 
      deleted: null,
      ...(selectedProvinces.length > 0 ? { provinceId: { in: selectedProvinces } } : {})
    }
  });

  // Lấy danh sách xã/phường từ API dựa trên quận/huyện đã chọn
  const { data: communes } = useFindManyCommune({
    select: { id: true, name: true, districtId: true },
    where: { 
      deleted: null,
      ...(selectedDistricts.length > 0 ? { districtId: { in: selectedDistricts } } : {})
    }
  });

  const provinceData = React.useMemo(() => 
    provinces?.map(province => ({ value: province.id, label: province.name })) || [],
    [provinces]
  );

  const districtData = React.useMemo(() => 
    districts?.map(district => ({ value: district.id, label: district.name })) || [],
    [districts]
  );

  const communeData = React.useMemo(() => 
    communes?.map(commune => ({ value: commune.id, label: commune.name })) || [],
    [communes]
  );

  // Đếm số lượng filter đang active
  useEffect(() => {
    let count = 0;
    if (selectedDisasterTypes.length > 0) count++;
    if (selectedPriorityLevels.length > 0) count++;
    if (selectedEmergencyLevels.length > 0) count++;
    if (selectedProvinces.length > 0) count++;
    if (selectedDistricts.length > 0) count++;
    if (selectedCommunes.length > 0) count++;
    if (searchStatus && searchStatus !== 'all') count++;
    if (startDateFilter) count++;
    if (endDateFilter) count++;
    setActiveFiltersCount(count);
  }, [selectedDisasterTypes, selectedPriorityLevels, selectedEmergencyLevels, selectedProvinces, selectedDistricts, selectedCommunes, searchStatus, startDateFilter, endDateFilter]);

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

    // Lọc theo nhiều loại thảm họa
    if (selectedDisasterTypes.length > 0) {
      whereCondition = {
        ...whereCondition,
        disasterTypeId: { in: selectedDisasterTypes }
      };
    }

    // Lọc theo nhiều mức độ ưu tiên
    if (selectedPriorityLevels.length > 0) {
      whereCondition = {
        ...whereCondition,
        priorityLevelId: { in: selectedPriorityLevels }
      };
    }

    // Lọc theo nhiều mức độ khẩn cấp
    if (selectedEmergencyLevels.length > 0) {
      whereCondition = {
        ...whereCondition,
        emergencyLevelId: { in: selectedEmergencyLevels }
      };
    }

    // Lọc theo tỉnh/thành - quan hệ nhiều-nhiều
    if (selectedProvinces.length > 0) {
      whereCondition.AND = whereCondition.AND || [];
      whereCondition.AND.push({
        province: {
          some: {
            id: { in: selectedProvinces }
          }
        }
      });
    }

    // Lọc theo quận/huyện - quan hệ nhiều-nhiều
    if (selectedDistricts.length > 0) {
      whereCondition.AND = whereCondition.AND || [];
      whereCondition.AND.push({
        district: {
          some: {
            id: { in: selectedDistricts }
          }
        }
      });
    }

    // Lọc theo xã/phường - quan hệ nhiều-nhiều
    if (selectedCommunes.length > 0) {
      whereCondition.AND = whereCondition.AND || [];
      whereCondition.AND.push({
        commune: {
          some: {
            id: { in: selectedCommunes }
          }
        }
      });
    }

    // Lọc theo trạng thái
    if (searchStatus === 'active') {
      whereCondition = {
        ...whereCondition,
        startDateTime: { not: null },
        endDateTime: null
      };
    } else if (searchStatus === 'pending') {
      whereCondition = {
        ...whereCondition,
        startDateTime: null
      };
    } else if (searchStatus === 'completed') {
      whereCondition = {
        ...whereCondition,
        startDateTime: { not: null },
        endDateTime: { not: null }
      };
    }

    // Lọc theo thời gian bắt đầu
    if (startDateFilter) {
      const startDate = new Date(startDateFilter);
      startDate.setHours(0, 0, 0, 0);
      
      whereCondition = {
        ...whereCondition,
        startDateTime: {
          ...whereCondition.startDateTime,
          gte: startDate
        }
      };
    }

    // Lọc theo thời gian kết thúc
    if (endDateFilter) {
      const endDate = new Date(endDateFilter);
      endDate.setHours(23, 59, 59, 999);
      
      whereCondition = {
        ...whereCondition,
        endDateTime: {
          ...whereCondition.endDateTime,
          lte: endDate
        }
      };
    }

    return whereCondition;
  };

  // Tạo điều kiện tìm kiếm
  const searchCondition = buildSearchCondition();
  const { data: disasters, isLoading, error, refetch } = useFindManyDisaster({
    where: {
      ...searchCondition,
      deleted: null
    },
    include: {
      disasterType: true,
      priorityLevel: true,
      emergencyLevel: true,
      coordinate: true,
      province: true,
      district: true,
      commune: true,
    },
    skip: (currentPage - 1) * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE,
    orderBy: {
      createdAt: 'desc'
    }
  });

  const { data: totalCount } = useFindManyDisaster({
    where: {
      ...searchCondition,
      deleted: null
    },
    select: {
      id: true
    }
  });

  const totalPages = Math.ceil((totalCount?.length || 0) / ITEMS_PER_PAGE);

  // const deleteDisasterMutation = useDeleteDisaster({
  //   onSuccess: () => {
  //     refetch();
  //   }
  // });
  
  // Thêm mutation để update (soft delete)
  const { mutateAsync: deleteDisaster } = useUpdateDisaster()
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setOperationNowPage(page); // Cập nhật giá trị trong Redux store
  };

  const handleEdit = (id: string) => {
    router.push(`/operation/disaster/${id}`);
  };

  const handleAddNew = () => {
    router.push('/operation/disaster/create');
  };

  const handleOpenDeleteModal = (disaster: { id: string, name: string }) => {
    setSelectedDisaster(disaster);
    setIsDeleteModalOpen(true);
  };

  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDeleteDisaster = async () => {
    if (!selectedDisaster.id) {
      toast.error(
        {
          title: "Lỗi",
          description: "Không tìm thấy thảm họa để xóa."
        }
      )
    }
    try {
      // Sử dụng updateDisaster thay vì deleteDisaster để thực hiện soft delete
      const id = selectedDisaster.id;
      const result = await deleteDisaster({
        where: { id: id },
        data: { deleted: new Date() }, // Đặt trường deleted là thời gian hiện tại
        select : {id : true}
      });
      console.log("result test delete", result);
      toast.success({
        title: "Thành công",
        description: "Đã xóa thảm họa"
      });

      setIsDeleteModalOpen(false);
      router.push('/operation/disaster');

    } catch (error) {
      toast.error({
        title: "Lỗi",
        description: "Không thể xóa thảm họa. Vui lòng thử lại sau."
      });
      console.error("Lỗi khi xóa thảm họa:", error);
    } finally {
      // Đặt lại trạng thái xóa khi hoàn thành
      setIsDeleting(false);
    }
  };

  
  const resetFilters = () => {
    setSelectedDisasterTypes([]);
    setSelectedPriorityLevels([]);
    setSelectedEmergencyLevels([]);
    setSelectedProvinces([]);
    setSelectedDistricts([]);
    setSelectedCommunes([]);
    setSearchStatus('all');
    setStartDateFilter(undefined);
    setEndDateFilter(undefined);
    setSearchText('');
  };

  const formatDate = (dateString: Date | null | undefined) => {
    if (!dateString) return 'Chưa xác định';
    
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIndicator = (disaster: any) => {
    const now = new Date();
    const start = disaster.startDateTime ? new Date(disaster.startDateTime) : null;
    const end = disaster.endDateTime ? new Date(disaster.endDateTime) : null;
    
    if (!start) {
      return <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">Chưa bắt đầu</span>;
    } else if (!end) {
      return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs">Đang diễn ra</span>;
    } else if (end < now) {
      return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">Đã kết thúc</span>;
    } else {
      return <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">Kết thúc dự kiến</span>;
    }
  };

  // Cập nhật handler cho các multiselect
  const handleDisasterTypesChange = (selectedOptions: Array<{label: string, value: string}>) => {
    setSelectedDisasterTypes(selectedOptions.map(option => option.value));
  };

  const handlePriorityLevelsChange = (selectedOptions: Array<{label: string, value: string}>) => {
    setSelectedPriorityLevels(selectedOptions.map(option => option.value));
  };

  const handleEmergencyLevelsChange = (selectedOptions: Array<{label: string, value: string}>) => {
    setSelectedEmergencyLevels(selectedOptions.map(option => option.value));
  };

  const handleProvincesChange = (selectedOptions: Array<{label: string, value: string}>) => {
    const provinceIds = selectedOptions.map(option => option.value);
    setSelectedProvinces(provinceIds);
    // Reset quận/huyện và xã/phường khi thay đổi tỉnh/thành
    if (provinceIds.length === 0) {
      setSelectedDistricts([]);
      setSelectedCommunes([]);
    }
  };

  const handleDistrictsChange = (selectedOptions: Array<{label: string, value: string}>) => {
    const districtIds = selectedOptions.map(option => option.value);
    setSelectedDistricts(districtIds);
    // Reset xã/phường khi thay đổi quận/huyện
    if (districtIds.length === 0) {
      setSelectedCommunes([]);
    }
  };

  const handleCommunesChange = (selectedOptions: Array<{label: string, value: string}>) => {
    setSelectedCommunes(selectedOptions.map(option => option.value));
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
            Danh sách Thảm họa
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

        {/* Bộ lọc trực tiếp */}
        <div className="px-5 py-3 border-t border-b border-gray-100 bg-gray-50">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Bộ lọc loại thảm họa */}
            <div className="w-60">
              <Label htmlFor="disaster-type" className="text-xs font-medium text-gray-600 mb-1 block">
                Loại thảm họa
              </Label>
              <MultiSelect
                data={disasterTypeData}
                value={selectedDisasterTypes}
                onValueChange={handleDisasterTypesChange}
                placeholder="Chọn loại thảm họa"
                className="bg-white cursor-pointer"
                popoverContentClassName="bg-white shadow-md"
                maxCount={3}
                maxCountLabel="khác"
              />
            </div>

            {/* Bộ lọc mức độ ưu tiên */}
            <div className="w-60">
              <Label htmlFor="priority-level" className="text-xs font-medium text-gray-600 mb-1 block">
                Mức độ ưu tiên
              </Label>
              <MultiSelect
                data={priorityLevelData}
                value={selectedPriorityLevels}
                onValueChange={handlePriorityLevelsChange}
                placeholder="Chọn mức độ ưu tiên"
                className="bg-white cursor-pointer"
                popoverContentClassName="bg-white shadow-md"
                maxCount={3}
                maxCountLabel="khác"
              />
            </div>

            {/* Bộ lọc mức độ khẩn cấp */}
            <div className="w-60">
              <Label htmlFor="emergency-level" className="text-xs font-medium text-gray-600 mb-1 block">
                Mức độ khẩn cấp
              </Label>
              <MultiSelect
                data={emergencyLevelData}
                value={selectedEmergencyLevels}
                onValueChange={handleEmergencyLevelsChange}
                placeholder="Chọn mức độ khẩn cấp"
                className="bg-white cursor-pointer"
                popoverContentClassName="bg-white shadow-md"
                maxCount={3}
                maxCountLabel="khác"
              />
            </div>

            {/* Bộ lọc tỉnh/thành */}
            <div className="w-60">
              <Label htmlFor="province" className="text-xs font-medium text-gray-600 mb-1 block">
                Tỉnh/Thành phố
              </Label>
              <MultiSelect
                data={provinceData}
                value={selectedProvinces}
                onValueChange={handleProvincesChange}
                placeholder="Chọn tỉnh/thành phố"
                className="bg-white cursor-pointer"
                popoverContentClassName="bg-white shadow-md"
                maxCount={3}
                maxCountLabel="khác"
              />
            </div>

            {/* Bộ lọc quận/huyện */}
            <div className="w-60">
              <Label htmlFor="district" className="text-xs font-medium text-gray-600 mb-1 block">
                Quận/Huyện
              </Label>
              <MultiSelect
                data={districtData}
                value={selectedDistricts}
                onValueChange={handleDistrictsChange}
                placeholder="Chọn quận/huyện"
                className="bg-white cursor-pointer"
                popoverContentClassName="bg-white shadow-md"
                maxCount={3}
                maxCountLabel="khác"
                modalPopover={selectedProvinces.length === 0}
              />
            </div>

            {/* Bộ lọc xã/phường */}
            <div className="w-60">
              <Label htmlFor="commune" className="text-xs font-medium text-gray-600 mb-1 block">
                Xã/Phường
              </Label>
              <MultiSelect
                data={communeData}
                value={selectedCommunes}
                onValueChange={handleCommunesChange}
                placeholder="Chọn xã/phường"
                className="bg-white cursor-pointer"
                popoverContentClassName="bg-white shadow-md"
                maxCount={3}
                maxCountLabel="khác"
                modalPopover={selectedDistricts.length === 0}
              />
            </div>

            {/* Bộ lọc trạng thái */}
            <div className="w-48">
              <Label htmlFor="status-filter" className="text-xs font-medium text-gray-600 mb-1 block">
                Trạng thái
              </Label>
              <Select value={searchStatus} onValueChange={setSearchStatus}>
                <SelectTrigger id="status-filter" className="w-full h-9 bg-white cursor-pointer">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="all" className="cursor-pointer">Tất cả</SelectItem>
                  <SelectItem value="pending" className="cursor-pointer">Chưa bắt đầu</SelectItem>
                  <SelectItem value="active" className="cursor-pointer">Đang diễn ra</SelectItem>
                  <SelectItem value="completed" className="cursor-pointer">Đã kết thúc</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Bộ lọc thời gian bắt đầu */}
            <div className="w-48">
              <Label htmlFor="start-date" className="text-xs font-medium text-gray-600 mb-1 block">
                Bắt đầu từ
              </Label>
              <DateTimePickerWrapper
                value={startDateFilter}
                onChange={setStartDateFilter}
                showTime={false}
                showClear={true}
                timePickType="startOfDay"
                placeHolder="Chọn ngày bắt đầu"
                className="h-9 bg-white cursor-pointer"
              />
            </div>
            
            {/* Bộ lọc thời gian kết thúc */}
            <div className="w-48">
              <Label htmlFor="end-date" className="text-xs font-medium text-gray-600 mb-1 block">
                Kết thúc trước
              </Label>
              <DateTimePickerWrapper
                value={endDateFilter}
                onChange={setEndDateFilter}
                showTime={false}
                showClear={true}
                timePickType="endOfDay"
                placeHolder="Chọn ngày kết thúc"
                className="h-9 bg-white cursor-pointer"
              />
            </div>
            
            {/* Nút đặt lại bộ lọc */}
            <div className="flex ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="h-9 bg-white cursor-pointer"
                onClick={resetFilters}
                disabled={activeFiltersCount === 0}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Đặt lại bộ lọc {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <TableWrapper
              variant="border"
              className="w-full"
              isLoading={isLoading}
              data={disasters || []}
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
                  accessorKey: "name",
                  cell: (item) => (
                    <div className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-xs text-gray-500 mt-1">{item.description}</span>
                    </div>
                  )
                },
                {
                  header: "Phân loại",
                  cell: (item) => (
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <span className="text-sm">Loại: </span>
                        <span className="font-medium ml-1">{item.disasterType?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-sm">Mức độ khẩn cấp: </span>
                        <span className="font-medium ml-1">{item.emergencyLevel?.name || 'N/A'}</span>
                      </div>
                      <div className="flex items-center mt-1">
                        <span className="text-sm">Ưu tiên: </span>
                        <span className="font-medium ml-1">{item.priorityLevel?.name || 'N/A'}</span>
                      </div>
                    </div>
                  )
                },
                {
                  header: "Địa điểm",
                  cell: (item) => (
                    <div className="flex flex-col">
                      <div className="flex items-center">
                        <MapPin size={16} className="text-gray-500 mr-1" />
                        <span className="text-gray-600 font-medium">Các tỉnh/thành:</span>
                      </div>
                      {item.province && item.province.length > 0 ? (
                        <div className="mt-1 ml-5">
                          {item.province.map((prov: any, index: number) => (
                            <span key={prov.id} className="inline-block bg-blue-50 text-blue-700 rounded-full text-xs px-2 py-1 mr-1 mb-1">
                              {prov.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 mt-1 ml-5">Không có thông tin tỉnh/thành</span>
                      )}
                      
                      {/* {item.coordinate && (
                        <div className="text-xs text-gray-500 mt-1">
                          Địa chỉ: {item.coordinate.address || 'Không có địa chỉ cụ thể'}
                        </div>
                      )} */}
                    </div>
                  )
                },
                {
                  header: "Thời gian",
                  cell: (item) => (
                    <div className="flex flex-col">
                      <div className="flex items-center mb-1">
                        <Clock size={14} className="text-gray-500 mr-1" />
                        <span className="text-xs text-gray-700">Bắt đầu: {formatDate(item.startDateTime)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock size={14} className="text-gray-500 mr-1" />
                        <span className="text-xs text-gray-700">Kết thúc: {formatDate(item.endDateTime)}</span>
                      </div>
                      <div className="mt-1">
                        {getStatusIndicator(item)}
                      </div>
                    </div>
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
                        onClick={() => handleEdit(item.id)}
                      >
                        <Edit size={16} className="mr-1" /> Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleOpenDeleteModal({ id: item.id, name: item.name })}
                      >
                        <Trash2 size={16} className="mr-1" /> Xóa
                      </Button>
                    </div>
                  ),
                  className: "w-48 text-center"
                }
              ]}
              emptyState={
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mb-3" />
                      <p className="text-lg font-medium text-gray-700 mb-2">Không có dữ liệu thảm họa</p>
                      <p className="text-gray-500 mb-4">Chưa có thảm họa nào được thêm vào hệ thống</p>
                      <Button
                        variant="outline"
                        className="mt-2 border-blue-300 text-blue-600"
                        onClick={handleAddNew}
                      >
                        <Plus size={16} className="mr-1" /> Thêm thảm họa mới
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
            Trang {currentPage} | Tổng số: {totalCount?.length || 0} thảm họa
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
              Bạn có chắc chắn muốn xóa thảm họa này không?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 text-center">
            <p className="font-medium text-lg text-gray-800">{selectedDisaster.name}</p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
              <AlertTriangle className="h-4 w-4 inline-block mr-1" />
              Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến thảm họa này sẽ bị xóa.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="bg-white cursor-pointer">
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDisaster}
              className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
            >  
            <Trash2 size={16} className="mr-1" /> Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisasterPage;