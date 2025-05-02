'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateDisaster, useFindManyDisasterType, useFindManyPriorityLevel, useFindManyEmergencyLevel, useFindManyProvince, useFindManyDistrict, useFindManyCommune, useCreateCoordinate } from '@/generated/hooks';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Calendar, Clipboard, Edit, Globe, Info, MapPin, ArrowLeft, AlertCircle, Shield, BookOpen, Clock, FileType, Users, Image, Activity, Building, FileText, Map, Save, X, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import DateTimePickerWrapper from '@/components/wrapper/date-time-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import _ from 'lodash';
import { generateDisasterName } from '@/lib/utils';

const CreateDisasterPage: React.FC = () => {
  const router = useRouter();
  
  // Tách state thành nhiều phần nhỏ để giảm re-render không cần thiết
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    description: ''
  });

  const [classification, setClassification] = useState({
    disasterTypeId: '',
    priorityLevelId: '',
    emergencyLevelId: ''
  });

  const [timeData, setTimeData] = useState({
    startDateTime: undefined as Date | undefined,
    endDateTime: undefined as Date | undefined
  });

  const [locationData, setLocationData] = useState({
    latitude: '',
    longitude: '',
    address: ''
  });

  const [adminData, setAdminData] = useState({
    selectedProvinces: [] as string[],
    selectedDistricts: [] as string[],
    selectedCommunes: [] as string[]
  });

  // State cho việc tạo thảm họa
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Sử dụng useMemo cho các query parameters để tránh tạo objects mới mỗi khi render
  const disasterTypeQueryParams = useMemo(() => ({
    select: { id: true, name: true },
    where: { deleted: null }
  }), []);

  const priorityLevelQueryParams = useMemo(() => ({
    select: { id: true, name: true },
    where: { deleted: null }
  }), []);

  const emergencyLevelQueryParams = useMemo(() => ({
    select: { id: true, name: true },
    where: { deleted: null }
  }), []);

  const provinceQueryParams = useMemo(() => ({
    select: { id: true, name: true },
    where: { deleted: null }
  }), []);

  // Sửa lại query params để đảm bảo filter đúng
  const districtQueryParams = useMemo(() => {
    return {
      select: { id: true, name: true, provinceId: true },
      where: { 
        deleted: null,
        ...(adminData.selectedProvinces.length > 0 
          ? { provinceId: { in: adminData.selectedProvinces } } 
          : {})
      }
    };
  }, [adminData.selectedProvinces]);

  // Tương tự, cập nhật query cho communes
  const communeQueryParams = useMemo(() => {
    return {
      select: { id: true, name: true, districtId: true },
      where: { 
        deleted: null,
        ...(adminData.selectedDistricts.length > 0 
          ? { districtId: { in: adminData.selectedDistricts } } 
          : {})
      }
    };
  }, [adminData.selectedDistricts]);

  // Mutation để tạo thảm họa mới
  const createDisasterMutation = useCreateDisaster({
    onSuccess: (data) => {
      toast.success({
        title: "Thành công",
        description: "Đã tạo thảm họa mới thành công!"
      });
      // Chuyển hướng đến trang chi tiết của thảm họa vừa tạo thay vì về trang danh sách
      if (data && data.id) {
        router.push(`/operation/disaster/${data.id}`);
      } else {
        router.push('/operation/disaster');
      }
    },
    onError: (error) => {
      toast.error({
        title: "Lỗi",
        description: `Không thể tạo thảm họa: ${error.message}`
      });
      setIsCreating(false);
    }
  });

  // Mutation để tạo tọa độ
  const createCoordinateMutation = useCreateCoordinate({
    onSuccess: (data) => {
      // Sau khi tạo tọa độ thành công, tiếp tục tạo thảm họa với tọa độ đã tạo
      if (data) {
        createDisasterWithCoordinate(data.id);
      }
    },
    onError: (error) => {
      toast.error({
        title: "Lỗi",
        description: `Không thể tạo tọa độ: ${error.message}`
      });
      setIsCreating(false);
    }
  });

  // Loại bỏ thuộc tính enabled và để queries chạy bình thường
  const { data: districts, refetch: refetchDistricts } = useFindManyDistrict(districtQueryParams);
  const { data: communes, refetch: refetchCommunes } = useFindManyCommune(communeQueryParams);

  // Thêm useEffect để re-fetch quận/huyện khi chọn tỉnh
  useEffect(() => {
    refetchDistricts();
  }, [adminData.selectedProvinces, refetchDistricts]);

  // Thêm useEffect để re-fetch xã/phường khi chọn quận/huyện
  useEffect(() => {
    refetchCommunes();
  }, [adminData.selectedDistricts, refetchCommunes]);

  // Tạo dữ liệu cho các select với useMemo để tránh tính toán lại
  const { data: disasterTypes } = useFindManyDisasterType(disasterTypeQueryParams);
  const { data: priorityLevels } = useFindManyPriorityLevel(priorityLevelQueryParams);
  const { data: emergencyLevels } = useFindManyEmergencyLevel(emergencyLevelQueryParams);
  const { data: provinces } = useFindManyProvince(provinceQueryParams);

  const disasterTypeOptions = useMemo(() => 
    disasterTypes?.map(type => ({ value: type.id, label: type.name })) || [],
    [disasterTypes]
  );

  const priorityLevelOptions = useMemo(() => 
    priorityLevels?.map(level => ({ value: level.id, label: level.name })) || [],
    [priorityLevels]
  );

  const emergencyLevelOptions = useMemo(() => 
    emergencyLevels?.map(level => ({ value: level.id, label: level.name })) || [],
    [emergencyLevels]
  );

  const provinceOptions = useMemo(() => 
    provinces?.map(province => ({ value: province.id, label: province.name })) || [],
    [provinces]
  );

  const districtOptions = useMemo(() => {
    return districts?.map(district => ({ value: district.id, label: district.name })) || [];
  }, [districts]);

  const communeOptions = useMemo(() => {
    return communes?.map(commune => ({ value: commune.id, label: commune.name })) || [];
  }, [communes]);

  // Sử dụng useCallback để tránh tạo hàm mới mỗi khi render
  const handleBasicInfoChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBasicInfo(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleLocationChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLocationData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleClassificationChange = useCallback((name: string, value: string) => {
    setClassification(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleTimeChange = useCallback((name: string, value: Date | undefined) => {
    setTimeData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleProvincesChange = useCallback((selectedOptions: Array<{label: string, value: string}>) => {
    const provinceIds = selectedOptions.map(option => option.value);
    
    // Cập nhật state và clear các lựa chọn cấp dưới
    setAdminData(prev => {
      // Tạo một state mới hoàn toàn với các giá trị đã reset
      const newState = {
        selectedProvinces: provinceIds,
        selectedDistricts: [],
        selectedCommunes: []
      };
      return newState;
    });
  }, []);

  const handleDistrictsChange = useCallback((selectedOptions: Array<{label: string, value: string}>) => {
    const districtIds = selectedOptions.map(option => option.value);
    
    // Cập nhật state và clear các lựa chọn xã
    setAdminData(prev => {
      // Tạo một state mới giữ nguyên tỉnh nhưng reset xã
      const newState = {
        ...prev,
        selectedDistricts: districtIds,
        selectedCommunes: []
      };
      return newState;
    });
  }, []);

  const handleCommunesChange = useCallback((selectedOptions: Array<{label: string, value: string}>) => {
    const communeIds = selectedOptions.map(option => option.value);
    
    // Cập nhật state giữ nguyên tỉnh và huyện
    setAdminData(prev => {
      const newState = {
        ...prev,
        selectedCommunes: communeIds
      };
      return newState;
    });
  }, []);

  // Hàm tạo thảm họa với tọa độ đã tạo
  const createDisasterWithCoordinate = useCallback(async (coordinateId: string) => {
    try {
      const formData = {
        ...basicInfo,
        ...classification,
        ...adminData,
        startDateTime: timeData.startDateTime,
        endDateTime: timeData.endDateTime
      };

      createDisasterMutation.mutate({
        data: {
          name: formData.name,
          description: formData.description || "",
          disasterTypeId: formData.disasterTypeId,
          priorityLevelId: formData.priorityLevelId,
          emergencyLevelId: formData.emergencyLevelId,
          startDateTime: formData.startDateTime !== undefined ? formData.startDateTime : null,
          endDateTime: formData.endDateTime !== undefined ? formData.endDateTime : null,
          coordinateId: coordinateId,
          province: {
            connect: formData.selectedProvinces.map(id => ({ id }))
          },
          district: {
            connect: formData.selectedDistricts.map(id => ({ id }))
          },
          commune: {
            connect: formData.selectedCommunes.map(id => ({ id }))
          }
        }
      });
    } catch (error: any) {
      console.error("Lỗi khi tạo thảm họa sau khi tạo tọa độ:", error);
      setIsCreating(false);
      toast.error({
        title: "Lỗi",
        description: `Không thể tạo thảm họa: ${error.message || 'Đã xảy ra lỗi'}`
      });
    }
  }, [basicInfo, classification, adminData, timeData, createDisasterMutation]);

  // Thay thế toàn bộ hàm generateDisasterName bằng:
  // Sử dụng hàm tiện ích từ utils.ts
  const updateDisasterName = useCallback(() => {
    if (classification.disasterTypeId) {
      // Lấy tên loại thảm họa
      const disasterType = disasterTypes?.find(type => type.id === classification.disasterTypeId)?.name || '';
      
      // Lấy tên các tỉnh đã chọn
      const selectedProvinceNames = adminData.selectedProvinces.map(provinceId => {
        const province = provinces?.find(p => p.id === provinceId);
        return province?.name || '';
      }).filter(Boolean);
      
      // Tạo tên thảm họa sử dụng hàm từ utils.ts
      const generatedName = generateDisasterName(
        disasterType,
        selectedProvinceNames,
        timeData.startDateTime,
        timeData.endDateTime
      );
      
      // Cập nhật state với tên mới
      setBasicInfo(prev => ({
        ...prev,
        name: generatedName
      }));
    }
  }, [classification.disasterTypeId, disasterTypes, adminData.selectedProvinces, provinces, timeData.startDateTime, timeData.endDateTime]);

  // Cập nhật tên tự động khi thông tin thay đổi
  useEffect(() => {
    // Chỉ tạo tên tự động khi đã chọn loại thảm họa
    if (classification.disasterTypeId) {
      updateDisasterName();
    }
  }, [classification.disasterTypeId, adminData.selectedProvinces, timeData.startDateTime, timeData.endDateTime, updateDisasterName]);

  // Cập nhật lại hàm validation để không kiểm tra tên (vì đã tạo tự động)
  const validateForm = useCallback(() => {
    // Validation logic
    if (!classification.disasterTypeId) {
      return { valid: false, message: "Vui lòng chọn loại thảm họa" };
    }

    if (!classification.priorityLevelId) {
      return { valid: false, message: "Vui lòng chọn mức độ ưu tiên" };
    }

    if (!classification.emergencyLevelId) {
      return { valid: false, message: "Vui lòng chọn mức độ khẩn cấp" };
    }

    if (timeData.startDateTime && timeData.endDateTime && timeData.endDateTime < timeData.startDateTime) {
      return { valid: false, message: "Thời gian kết thúc phải sau thời gian bắt đầu" };
    }

    if (!locationData.latitude || !locationData.longitude) {
      return { valid: false, message: "Vui lòng nhập tọa độ (vĩ độ và kinh độ) cho thảm họa" };
    }

    return { valid: true, message: "" };
  }, [classification, timeData, locationData]);
  
  // Xử lý tạo thảm họa - được tối ưu với useCallback
  const handleCreateDisaster = useCallback(async () => {
    try {
      const validation = validateForm();
      if (!validation.valid) {
        toast.error({
          title: "Thiếu thông tin",
          description: validation.message
        });
        return;
      }

      setIsCreating(true);

      // Nếu có tọa độ, tạo tọa độ trước rồi tạo thảm họa
      createCoordinateMutation.mutate({
        data: {
          lat: parseFloat(locationData.latitude),
          lng: parseFloat(locationData.longitude),
          address: locationData.address || null
        }
      });
    } catch (error: any) {
      console.error("Lỗi khi tạo thảm họa:", error);
      setIsCreating(false);
      toast.error({
        title: "Lỗi",
        description: `Không thể tạo thảm họa: ${error.message || 'Đã xảy ra lỗi'}`
      });
    }
  }, [locationData, validateForm, createCoordinateMutation]);

  const handleCancel = useCallback(() => {
    router.push('/operation/disaster');
  }, [router]);

  // JSX phần form - chỉ render lại khi các state liên quan thay đổi
  const BasicInfoForm = useMemo(() => (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 flex items-center mb-2">
          <FileText className="h-4 w-4 mr-1" /> Thông tin thảm họa
        </h3>
        <div className="space-y-2">
          <Label className="text-xs text-gray-500 mb-1 block">Tên thảm họa (được tạo tự động):</Label>
          <Input 
            name="name"
            value={basicInfo.name} 
            readOnly
            className="font-medium bg-gray-50"
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Tên thảm họa được tạo tự động từ loại thảm họa, địa điểm và thời gian</p>
        </div>
        <div className="space-y-2 mt-3">
          <Label className="text-xs text-gray-500 mb-1 block">Mô tả:</Label>
          <Textarea 
            name="description"
            value={basicInfo.description}
            onChange={handleBasicInfoChange}
            rows={4}
            className="resize-none w-full"
            placeholder="Nhập mô tả thảm họa"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center ">
          <FileType className="h-4 w-4 mr-1" /> Phân loại
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Loại thảm họa:</Label>
            <Select 
              value={classification.disasterTypeId} 
              onValueChange={(value) => handleClassificationChange('disasterTypeId', value)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Chọn loại thảm họa" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {disasterTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Mức độ khẩn cấp:</Label>
            <Select 
              value={classification.emergencyLevelId} 
              onValueChange={(value) => handleClassificationChange('emergencyLevelId', value)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Chọn mức độ khẩn cấp" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {emergencyLevelOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Mức độ ưu tiên:</Label>
            <Select 
              value={classification.priorityLevelId} 
              onValueChange={(value) => handleClassificationChange('priorityLevelId', value)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Chọn mức độ ưu tiên" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {priorityLevelOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  ), [basicInfo, classification, disasterTypeOptions, emergencyLevelOptions, priorityLevelOptions, handleClassificationChange]);

  // Component UI phần địa chỉ hành chính
  const AdministrativeForm = useMemo(() => (
    <div>
      <h3 className="text-sm font-medium text-gray-500 flex items-center mb-2">
        <Building className="h-4 w-4 mr-1" /> Phạm vi hành chính
      </h3>
      
      <div className="space-y-3">
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Tỉnh/Thành phố:</Label>
          <MultiSelect
            data={provinceOptions}
            value={adminData.selectedProvinces}
            onValueChange={handleProvincesChange}
            placeholder="Chọn tỉnh/thành phố"
            className="bg-white"
            popoverContentClassName="bg-white shadow-md"
          />
          {adminData.selectedProvinces.length > 0 && (
            <p className="text-xs text-blue-500 mt-1">
              Đã chọn {adminData.selectedProvinces.length} tỉnh/thành phố
            </p>
          )}
        </div>
        <div>
          <Label className="text-xs text-gray-500 mb-1 block">Quận/Huyện:</Label>
          <MultiSelect
            data={districtOptions}
            value={adminData.selectedDistricts}
            onValueChange={handleDistrictsChange}
            placeholder={adminData.selectedProvinces.length === 0 
              ? "Vui lòng chọn tỉnh/thành phố trước" 
              : "Chọn quận/huyện"
            }
            className="bg-white"
            popoverContentClassName="bg-white shadow-md"
            disabled={adminData.selectedProvinces.length === 0}
          />
          {adminData.selectedDistricts.length > 0 && (
            <p className="text-xs text-blue-500 mt-1">
              Đã chọn {adminData.selectedDistricts.length} quận/huyện
            </p>
          )}
        </div>
        <div className="pb-3">
          <Label className="text-xs text-gray-500 mb-1 block">Xã/Phường:</Label>
          <MultiSelect
            data={communeOptions}
            value={adminData.selectedCommunes}
            onValueChange={handleCommunesChange}
            placeholder={adminData.selectedDistricts.length === 0 
              ? "Vui lòng chọn quận/huyện trước" 
              : "Chọn xã/phường"
            }
            className="bg-white"
            popoverContentClassName="bg-white shadow-md"
            disabled={adminData.selectedDistricts.length === 0}
          />
          {adminData.selectedCommunes.length > 0 && (
            <p className="text-xs text-blue-500 mt-1">
              Đã chọn {adminData.selectedCommunes.length} xã/phường
            </p>
          )}
        </div>
      </div>
    </div>
  ), [adminData, provinceOptions, districtOptions, communeOptions, handleProvincesChange, handleDistrictsChange, handleCommunesChange]);

  // Thay thế phần hiển thị dữ liệu hành chính trong TimeAndLocationForm 
  // với component đã tách ra ở trên
  const TimeAndLocationForm = useMemo(() => (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium text-gray-500 flex items-center mb-2">
          <Clock className="h-4 w-4 mr-1" /> Thời gian
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Thời gian bắt đầu:</Label>
            <DateTimePickerWrapper
              value={timeData.startDateTime}
              onChange={(value) => handleTimeChange('startDateTime', value)}
              showTime={true}
              showClear={true}
              placeHolder="Chọn thời gian bắt đầu"
              className="w-full bg-white"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Thời gian kết thúc:</Label>
            <DateTimePickerWrapper
              value={timeData.endDateTime}
              onChange={(value) => handleTimeChange('endDateTime', value)}
              showTime={true}
              showClear={true}
              placeHolder="Chọn thời gian kết thúc"
              className="w-full bg-white"
              minDate={timeData.startDateTime}
            />
            {timeData.endDateTime && timeData.startDateTime && timeData.endDateTime < timeData.startDateTime && (
              <p className="text-red-500 text-xs mt-1">
                Thời gian kết thúc phải sau thời gian bắt đầu
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 flex items-center mb-2">
          <MapPin className="h-4 w-4 mr-1" /> Vị trí
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Vĩ độ:</Label>
              <Input 
                name="latitude"
                value={locationData.latitude} 
                onChange={handleLocationChange}
                placeholder="Ví dụ: 10.762622"
                type="number"
                step="0.000001"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Kinh độ:</Label>
              <Input 
                name="longitude"
                value={locationData.longitude} 
                onChange={handleLocationChange}
                placeholder="Ví dụ: 106.660172"
                type="number"
                step="0.000001"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Địa chỉ:</Label>
            <Input 
              name="address"
              value={locationData.address} 
              onChange={handleLocationChange}
              placeholder="Nhập địa chỉ"
            />
          </div>
        </div>
      </div>

      {/* Thêm component hành chính đã tách */}
      {AdministrativeForm}
      
    </div>
  ), [timeData, locationData, handleTimeChange, handleLocationChange, AdministrativeForm]);

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
          Tạo thảm họa mới
        </h1>
      </div>

      <Card className="shadow-md border-t-4 border-blue-400 mb-4">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-blue-500 mr-2" />
              <CardTitle className="text-lg text-gray-800">Thông tin cơ bản</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
            {BasicInfoForm}
            {TimeAndLocationForm}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-6">
          <Button 
            variant="outline"
            onClick={handleCancel}
            disabled={isCreating}
          >
            <X className="mr-2 h-4 w-4" /> Hủy
          </Button>
          <Button 
            variant="default"
            onClick={handleCreateDisaster}
            disabled={isCreating}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isCreating ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Đang tạo...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Tạo thảm họa
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Tabs defaultValue="disasterData" className="w-full">
        <TabsList className="w-full grid grid-cols-5 mb-4">
          <TabsTrigger value="disasterData" className="flex items-center">
            <Activity className="h-4 w-4 mr-2" /> Số liệu thảm họa
          </TabsTrigger>
          <TabsTrigger value="damageData" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" /> Thiệt hại từ thảm họa
          </TabsTrigger>
          <TabsTrigger value="rescueTypes" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" /> Thông tin cứu hộ
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center">
            <Image className="h-4 w-4 mr-2" /> Hình ảnh & Media
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center">
            <Map className="h-4 w-4 mr-2" /> Khu vực & Vùng ảnh hưởng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="disasterData">
          <Card className="shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 py-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-5 w-5 text-blue-500 mr-2" />
                  Số liệu thảm họa
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <AlertCircle className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                <p className="text-gray-700 mb-2 font-medium">Chức năng thêm số liệu thảm họa</p>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Số liệu thảm họa có thể được thêm sau khi tạo thảm họa thành công. Vui lòng hoàn tất việc tạo thảm họa trước.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="damageData">
          <Card className="shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 py-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                  Thiệt hại từ thảm họa
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <AlertCircle className="h-10 w-10 text-orange-400 mx-auto mb-3" />
                <p className="text-gray-700 mb-2 font-medium">Chức năng thêm dữ liệu thiệt hại</p>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Thông tin về thiệt hại từ thảm họa có thể được thêm sau khi tạo thảm họa thành công. Vui lòng hoàn tất việc tạo thảm họa trước.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rescueTypes">
          <Card className="shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 py-3">
              <CardTitle className="text-lg flex items-center">
                <Shield className="h-5 w-5 text-blue-500 mr-2" />
                Thông tin cứu hộ
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <AlertCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
                <p className="text-gray-700 mb-2 font-medium">Chức năng thêm thông tin cứu hộ</p>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Thông tin về hoạt động cứu hộ có thể được thêm sau khi tạo thảm họa thành công. Vui lòng hoàn tất việc tạo thảm họa trước.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card className="shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 py-3">
              <CardTitle className="text-lg flex items-center">
                <Image className="h-5 w-5 text-blue-500 mr-2" />
                Hình ảnh & Media
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <AlertCircle className="h-10 w-10 text-purple-400 mx-auto mb-3" />
                <p className="text-gray-700 mb-2 font-medium">Chức năng thêm hình ảnh và media</p>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Hình ảnh và tài liệu media khác có thể được thêm sau khi tạo thảm họa thành công. Vui lòng hoàn tất việc tạo thảm họa trước.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones">
          <Card className="shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 py-3">
              <CardTitle className="text-lg flex items-center">
                <Map className="h-5 w-5 text-blue-500 mr-2" />
                Khu vực & Vùng ảnh hưởng
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center py-8 bg-gray-50 rounded-md">
                <AlertCircle className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
                <p className="text-gray-700 mb-2 font-medium">Chức năng thêm khu vực ảnh hưởng</p>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Thông tin về khu vực và vùng ảnh hưởng có thể được thêm sau khi tạo thảm họa thành công. Vui lòng hoàn tất việc tạo thảm họa trước.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateDisasterPage; 