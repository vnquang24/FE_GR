'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Plus, Trash2, AlertTriangle, Loader2, X, Check } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { useCreateRescueType, useFindManyDisaster, useFindManyDataField, useCreateRescueTypeOnDisaster } from '@/generated/hooks';
import DateTimePickerWrapper from '@/components/wrapper/date-time-picker';
import { TableWrapper, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type RescueResourceDisaster = {
  id: string; // ID tạm thời cho UI
  disasterId: string;
  value: number;
  unitId: string; 
  startDate?: Date;
  endDate?: Date;
  source?: string;
};

const CreateRescueResourcePage: React.FC = () => {
  const router = useRouter();
  
  // State chứa thông tin cơ bản nguồn lực cứu hộ
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    description: ''
  });
  
  // State cho danh sách thảm họa được chọn sử dụng nguồn lực này
  const [selectedDisasters, setSelectedDisasters] = useState<RescueResourceDisaster[]>([]);
  
  // State cho thảm họa đang được chọn để thêm
  const [currentDisaster, setCurrentDisaster] = useState<string[]>([]);
  const [disasterValue, setDisasterValue] = useState<string>('');
  const [disasterUnit, setDisasterUnit] = useState<string>('');
  const [disasterSource, setDisasterSource] = useState<string>('');
  const [disasterStartDate, setDisasterStartDate] = useState<Date | undefined>(undefined);
  const [disasterEndDate, setDisasterEndDate] = useState<Date | undefined>(undefined);
  const [openDisasterSelect, setOpenDisasterSelect] = useState(false);
  
  // Mutation để tạo nguồn lực cứu hộ mới
  const createRescueTypeMutation = useCreateRescueType();
  
  // Mutation để tạo liên kết giữa nguồn lực cứu hộ và thảm họa
  const createRescueTypeOnDisasterMutation = useCreateRescueTypeOnDisaster();
  
  // Lấy danh sách thảm họa hiện có
  const { data: disasters, isLoading: isLoadingDisasters } = useFindManyDisaster({
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
  
  // Xử lý thay đổi thông tin cơ bản
  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({ ...prev, [name]: value }));
  };

  // Xử lý thêm thảm họa vào danh sách
  const handleAddDisaster = () => {
    if (currentDisaster.length === 0 || !disasterValue || !disasterUnit) {
      toast.error({
        title: "Lỗi",
        description: "Vui lòng chọn thảm họa, nhập giá trị và chọn đơn vị"
      });
      return;
    }
    
    // Thêm tất cả các thảm họa đã chọn
    const newDisasters = currentDisaster.map(disasterId => {
      // Kiểm tra xem thảm họa đã được thêm chưa
      if (selectedDisasters.some(d => d.disasterId === disasterId)) {
        return null;
      }
      
      return {
        id: `temp-${Date.now()}-${disasterId}`,
        disasterId: disasterId,
        value: parseFloat(disasterValue) || 0,
        unitId: disasterUnit,
        startDate: disasterStartDate,
        endDate: disasterEndDate,
        source: disasterSource || undefined
      };
    }).filter(Boolean) as RescueResourceDisaster[];
    
    if (newDisasters.length === 0) {
      toast.error({
        title: "Lỗi",
        description: "Tất cả thảm họa đã được thêm vào danh sách"
      });
      return;
    }
    
    setSelectedDisasters(prev => [...prev, ...newDisasters]);
    
    // Reset các trường nhập liệu
    setCurrentDisaster([]);
    setDisasterValue('');
    setDisasterUnit('');
    setDisasterSource('');
    setDisasterStartDate(undefined);
    setDisasterEndDate(undefined);
    
    toast.success({
      title: "Thành công",
      description: `Đã thêm ${newDisasters.length} thảm họa vào danh sách`
    });
  };
  
  // Xử lý xóa thảm họa khỏi danh sách
  const handleRemoveDisaster = (id: string) => {
    setSelectedDisasters(prev => prev.filter(d => d.id !== id));
  };
  
  // Xử lý lưu nguồn lực cứu hộ và các thảm họa liên quan
  const handleSave = async () => {
    try {
      // Kiểm tra thông tin cơ bản
      if (!basicInfo.name) {
        toast.error({
          title: "Lỗi",
          description: "Vui lòng nhập tên nguồn lực cứu hộ"
        });
        return;
      }
      
      // Tạo nguồn lực cứu hộ mới
      const newRescueType = await createRescueTypeMutation.mutateAsync({
        data: {
          name: basicInfo.name,
          description: basicInfo.description
        }
      });
      
      if (!newRescueType) {
        throw new Error("Không thể tạo nguồn lực cứu hộ");
      }
      
      // Tạo các liên kết với thảm họa nếu có
      if (selectedDisasters.length > 0) {
        const createPromises = selectedDisasters.map(disaster => 
          createRescueTypeOnDisasterMutation.mutateAsync({
            data: {
              disaster: {
                connect: { id: disaster.disasterId }
              },
              rescueType: {
                connect: { id: newRescueType.id }
              },
              unit: {
                connect: { id: disaster.unitId }
              },
              value: disaster.value,
              startDate: disaster.startDate,
              endDate: disaster.endDate,
              source: disaster.source
            }
          })
        );
        
        await Promise.all(createPromises);
      }
      
      toast.success({
        title: "Thành công",
        description: "Đã tạo nguồn lực cứu hộ mới"
      });
      
      // Quay lại trang danh sách
      router.push('/operation/rescue-resource');
      
    } catch (error: any) {
      console.error("Lỗi khi tạo nguồn lực cứu hộ:", error);
      toast.error({
        title: "Lỗi",
        description: error.message || "Đã xảy ra lỗi khi tạo nguồn lực cứu hộ"
      });
    }
  };
  
  // Xử lý hủy và quay lại trang danh sách
  const handleCancel = () => {
    router.push('/operation/rescue-resource');
  };
  
  // Định dạng ngày giờ
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi });
  };
  
  // Hiển thị trạng thái thảm họa
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
  
  return (
    <div className="w-full mx-auto p-2 sm:p-4">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          className="mr-4"
          onClick={handleCancel}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 flex-1">
          Thêm mới nguồn lực cứu hộ
        </h1>
        <Button 
          variant="default"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={handleSave}
          disabled={createRescueTypeMutation.isPending}
        >
          {createRescueTypeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Lưu
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Thông tin cơ bản */}
        <Card className="shadow-md border-t-4 border-blue-400">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3">
            <CardTitle className="text-lg flex items-center">
              Thông tin cơ bản
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  Tên nguồn lực cứu hộ <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={basicInfo.name}
                  onChange={handleBasicInfoChange}
                  placeholder="Nhập tên nguồn lực cứu hộ"
                  className="mt-1"
                />
                {!basicInfo.name && (
                  <p className="text-xs text-red-500 mt-1">Trường này là bắt buộc</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Mô tả
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={basicInfo.description}
                  onChange={handleBasicInfoChange}
                  placeholder="Nhập mô tả về nguồn lực cứu hộ này"
                  className="mt-1 resize-none"
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Thêm thảm họa sử dụng nguồn lực */}
        <Card className="shadow-md border-t-4 border-indigo-400">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 py-3">
            <CardTitle className="text-lg flex items-center">
              Thêm thảm họa sử dụng nguồn lực
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 pb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="disaster" className="text-sm font-medium text-gray-700">
                  Chọn thảm họa (có thể chọn nhiều)
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
                          {isLoadingDisasters ? (
                            <div className="flex items-center justify-center p-2">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang tải...
                            </div>
                          ) : disasters && disasters.length > 0 ? (
                            disasters.map((disaster) => {
                              const isSelected = currentDisaster.includes(disaster.id);
                              return (
                                <CommandItem
                                  key={disaster.id}
                                  value={disaster.id}
                                  onSelect={() => {
                                    setCurrentDisaster((prev) => {
                                      if (isSelected) {
                                        return prev.filter((id) => id !== disaster.id);
                                      } else {
                                        return [...prev, disaster.id];
                                      }
                                    });
                                  }}
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
                  Giá trị
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
                  Đơn vị
                </Label>
                <Select value={disasterUnit} onValueChange={setDisasterUnit}>
                  <SelectTrigger id="unit" className="w-full">
                    <SelectValue placeholder="Chọn đơn vị" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {isLoadingDataFields ? (
                      <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang tải...
                      </div>
                    ) : dataFields && dataFields.length > 0 ? (
                      dataFields.map(field => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name} ({field.unit})
                        </SelectItem>
                      ))
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
            
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleAddDisaster}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Plus size={16} className="mr-1" /> Thêm vào danh sách
              </Button>
            </div>
            
            {/* Danh sách thảm họa đã chọn */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Danh sách thảm họa sử dụng nguồn lực này
              </h3>
              
              {selectedDisasters.length > 0 ? (
                <TableWrapper
                  variant="border"
                  className="w-full"
                  data={selectedDisasters}
                  columns={[
                    {
                      header: "STT",
                      cell: (_, index) => (
                        <div className="text-center font-medium">
                          {index + 1}
                        </div>
                      ),
                      className: "w-12 text-center"
                    },
                    {
                      header: "Thảm họa",
                      cell: (item) => {
                        const disaster = disasters?.find(d => d.id === item.disasterId);
                        return (
                          <div className="flex flex-col">
                            <span className="font-medium">{disaster?.name || 'Không xác định'}</span>
                            <span className="text-xs text-gray-500">
                              {disaster?.disasterType?.name}
                            </span>
                          </div>
                        );
                      }
                    },
                    {
                      header: "Giá trị",
                      cell: (item) => {
                        const unit = dataFields?.find(u => u.id === item.unitId);
                        return (
                          <div className="text-center">
                            <span className="font-medium">{item.value}</span>
                            <span className="text-xs text-gray-500 ml-1">
                              {unit?.unit}
                            </span>
                          </div>
                        );
                      },
                      className: "w-24 text-center"
                    },
                    {
                      header: "Thời gian",
                      cell: (item) => (
                        <div className="flex flex-col">
                          <span className="text-xs">
                            Bắt đầu: {formatDate(item.startDate) || 'Chưa xác định'}
                          </span>
                          <span className="text-xs mt-1">
                            Kết thúc: {formatDate(item.endDate) || 'Chưa xác định'}
                          </span>
                        </div>
                      ),
                      className: "w-48"
                    },
                    {
                      header: "Nguồn cung cấp",
                      cell: (item) => (
                        <div>{item.source || 'Không có thông tin'}</div>
                      )
                    },
                    {
                      header: "Thao tác",
                      cell: (item) => (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemoveDisaster(item.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      ),
                      className: "w-20 text-center"
                    }
                  ]}
                  emptyState={
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10">
                        <div className="flex flex-col items-center">
                          <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                          <p className="text-gray-500">Chưa có thảm họa nào được thêm vào danh sách</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  }
                />
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-md">
                  <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-gray-500">Chưa có thảm họa nào được thêm vào danh sách</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6 flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={handleCancel}
          className="border-gray-300"
        >
          Hủy
        </Button>
        <Button 
          variant="default"
          className="bg-green-600 hover:bg-green-700 text-white"
          onClick={handleSave}
          disabled={createRescueTypeMutation.isPending}
        >
          {createRescueTypeMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" /> Lưu nguồn lực cứu hộ
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateRescueResourcePage; 