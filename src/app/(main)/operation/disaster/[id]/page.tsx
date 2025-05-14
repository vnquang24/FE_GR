'use client';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFindUniqueDisaster, useUpdateDisaster, useFindManyDisasterType, useFindManyPriorityLevel, useFindManyEmergencyLevel, useFindManyProvince, useFindManyDistrict, useFindManyCommune, useFindManyDataField, useCreateDataFieldOnDisaster, useUpdateDataFieldOnDisaster, useDeleteDataFieldOnDisaster, useUpdateRescueTypeOnDisaster, useUpdateCoordinate } from '@/generated/hooks';
import { Disaster } from '@prisma/client';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Calendar, Clipboard, Edit, Globe, Info, MapPin, ArrowLeft, AlertCircle, Shield, BookOpen, Clock, FileType, Users, Image, Activity, Building, FileText, Map, Save, X, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TableWrapper, TableRow, TableCell, TableHead, TableHeader, TableBody } from '@/components/ui/table';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import DateTimePickerWrapper from '@/components/wrapper/date-time-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DataField } from "@prisma/client";
import { useStoreState } from '@/lib/redux/hook';
import HierarchicalSelect, { DataFieldNode } from '@/components/wrapper/hierarchical-select';
import { generateDisasterName } from '@/lib/utils';
import MediaUploader from '@/components/wrapper/media-uploader';
import { getUserId } from '@/utils/auth';
// Tạo kiểu dữ liệu mở rộng từ DataField của Prisma
type DataFieldWithOptimistic = Partial<DataField> & {
  id: string;
  name: string;
  code: string;
  unit: string;
  parentId: string;
  dataFieldGroup: string;
  $optimistic?: boolean;
}

// Thêm kiểu dữ liệu cho Media và Zone
type Media = {
  id: string;
  url: string;
  mediaType: string;
  description?: string;
  createdAt: Date;
  coordinates?: {
    id: string;
    lat: number;
    lng: number;
    address: string | null;
  };
  user?: {
    id: string;
    name: string;
  };
};

type Zone = {
  id: string;
  name: string;
  description?: string;
  boundary: any;
};

const DisasterDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const disasterId = params.id as string;
  const userID = getUserId();
  // Lấy giá trị operationNowPage từ Redux store
  const operationNowPage = useStoreState(state => state.appState.operationNowPage);

  // State cho chế độ chỉnh sửa
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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

  const [adminData, setAdminData] = useState({
    selectedProvinces: [] as string[],
    selectedDistricts: [] as string[],
    selectedCommunes: [] as string[]
  });

  // State for DataField edit
  const [dataFieldValues, setDataFieldValues] = useState<{ [key: string]: number }>({});
  const [showAddDataFieldDialog, setShowAddDataFieldDialog] = useState(false);
  const [selectedDataField, setSelectedDataField] = useState<string>('');
  const [newDataFieldValue, setNewDataFieldValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('disasterData');

  // Thêm state cho việc chỉnh sửa giá trị cứu hộ
  const [rescueTypeValues, setRescueTypeValues] = useState<{ [key: string]: number }>({});
  const [rescueTypeStartDates, setRescueTypeStartDates] = useState<{ [key: string]: Date | undefined }>({});
  const [rescueTypeEndDates, setRescueTypeEndDates] = useState<{ [key: string]: Date | undefined }>({});
  const [rescueTypeUnitIds, setRescueTypeUnitIds] = useState<{ [key: string]: string }>({});

  // Thêm state cho dialog chỉnh sửa tọa độ
  const [isCoordinateModalOpen, setIsCoordinateModalOpen] = useState(false);
  const [coordinateData, setCoordinateData] = useState<{
    id: string;
    lat: number;
    lng: number;
    address: string | null;
  }>({
    id: '',
    lat: 0,
    lng: 0,
    address: null
  });

  // State cho dialog tải lên media
  const [showMediaUploadDialog, setShowMediaUploadDialog] = useState(false);

  // Lấy dữ liệu thảm họa
  const { data: disaster, isLoading, error, refetch } = useFindUniqueDisaster({
    where: { id: disasterId },
    include: {
      disasterType: true,
      priorityLevel: true,
      emergencyLevel: true,
      coordinate: true,
      province: true,
      district: true,
      commune: true,
      zone: true,
      media: {
        include: {
          coordinates: true,
          user: true,
        }
      },
      dataFields: {
        include: {
          dataField: true
        }
      },
      rescueTypes: {
        include: {
          rescueType: true,
          unit: true
        }
      }
    },

  });

  // Function to handle media refresh after upload
  const handleMediaUploadSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  // Mutation để cập nhật thảm họa
  const updateDisasterMutation = useUpdateDisaster({
    onSuccess: () => {
      toast.success({
        title: "Thành công",
        description: "Đã cập nhật thông tin thảm họa"
      });
    },
    onError: (error) => {
      toast.error({
        title: "Lỗi",
        description: `Không thể cập nhật thảm họa: ${error.message}`
      });

    }
  });

  // Mutation để cập nhật tọa độ
  const updateCoordinateMutation = useUpdateCoordinate({
    onSuccess: () => {
      toast.success({
        title: "Thành công",
        description: "Đã cập nhật tọa độ thành công"
      });
      setIsCoordinateModalOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error({
        title: "Lỗi",
        description: `Không thể cập nhật tọa độ: ${error.message}`
      });
    }
  });

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

  // Lấy danh sách tỉnh/thành, quận/huyện, xã/phường
  const { data: provinces } = useFindManyProvince({
    select: { id: true, name: true },
    where: { deleted: null }
  });
  // Optimize query parameters with useMemo
  const districtQueryParams = useMemo(() => ({
    select: { id: true, name: true, provinceId: true },
    where: {
      deleted: null,
      ...(adminData.selectedProvinces.length > 0 ? { provinceId: { in: adminData.selectedProvinces } } : {})
    }
  }), [adminData.selectedProvinces]);

  const communeQueryParams = useMemo(() => ({
    select: { id: true, name: true, districtId: true },
    where: {
      deleted: null,
      ...(adminData.selectedDistricts.length > 0 ? { districtId: { in: adminData.selectedDistricts } } : {})
    }
  }), [adminData.selectedDistricts]);

  // Sử dụng query parameters đã được memoize
  const { data: districts } = useFindManyDistrict(districtQueryParams);

  const { data: communes } = useFindManyCommune(communeQueryParams);

  // Tạo dữ liệu cho các select
  const disasterTypeOptions = React.useMemo(() =>
    disasterTypes?.map(type => ({ value: type.id, label: type.name })) || [],
    [disasterTypes]
  );

  const priorityLevelOptions = React.useMemo(() =>
    priorityLevels?.map(level => ({ value: level.id, label: level.name })) || [],
    [priorityLevels]
  );

  const emergencyLevelOptions = React.useMemo(() =>
    emergencyLevels?.map(level => ({ value: level.id, label: level.name })) || [],
    [emergencyLevels]
  );

  const provinceOptions = React.useMemo(() =>
    provinces?.map(province => ({ value: province.id, label: province.name })) || [],
    [provinces]
  );

  const districtOptions = React.useMemo(() =>
    districts?.map(district => ({ value: district.id, label: district.name })) || [],
    [districts]
  );

  const communeOptions = React.useMemo(() =>
    communes?.map(commune => ({ value: commune.id, label: commune.name })) || [],
    [communes]
  );

  // Lấy danh sách các dataField có sẵn
  const { data: availableDataFields } = useFindManyDataField({
    where: { deleted: null },
    select: { id: true, name: true, code: true, unit: true, dataFieldGroup: true, parentId: true },
    orderBy: {
      dataFieldGroup: 'asc',
    }
  });

  // Mutation để thêm/sửa/xóa data field
  const createDataFieldMutation = useCreateDataFieldOnDisaster({
    onSuccess: () => {
      toast.success({
        title: "Thành công",
        description: "Đã thêm trường dữ liệu mới"
      });
      refetch();
      setShowAddDataFieldDialog(false);
      setSelectedDataField('');
      setNewDataFieldValue('');
    },
    onError: (error) => {
      toast.error({
        title: "Lỗi",
        description: `Không thể thêm trường dữ liệu: ${error.message}`
      });
    }
  });

  const updateDataFieldMutation = useUpdateDataFieldOnDisaster({
    onSuccess: () => {
      toast.success({
        title: "Thành công",
        description: "Đã cập nhật giá trị trường dữ liệu"
      });
      refetch();
    },
    onError: (error) => {
      toast.error({
        title: "Lỗi",
        description: `Không thể cập nhật trường dữ liệu: ${error.message}`
      });
    }
  });

  const deleteDataFieldMutation = useDeleteDataFieldOnDisaster({
    onSuccess: () => {
      toast.success({
        title: "Thành công",
        description: "Đã xóa trường dữ liệu"
      });
      refetch();
    },
    onError: (error) => {
      toast.error({
        title: "Lỗi",
        description: `Không thể xóa trường dữ liệu: ${error.message}`
      });
    }
  });

  // Cập nhật useEffect để cập nhật các state tách biệt
  useEffect(() => {
    if (disaster) {
      setBasicInfo({
        name: disaster.name || '',
        description: disaster.description || ''
      });

      setClassification({
        disasterTypeId: disaster.disasterTypeId || '',
        priorityLevelId: disaster.priorityLevelId || '',
        emergencyLevelId: disaster.emergencyLevelId || ''
      });

      setTimeData({
        startDateTime: disaster.startDateTime || undefined,
        endDateTime: disaster.endDateTime || undefined
      });

      setAdminData({
        selectedProvinces: disaster.province ? disaster.province.map(p => p.id) : [],
        selectedDistricts: disaster.district ? disaster.district.map(d => d.id) : [],
        selectedCommunes: disaster.commune ? disaster.commune.map(c => c.id) : []
      });
    }
  }, [disaster]);

  // Cập nhật state khi có dữ liệu disaster
  useEffect(() => {
    if (disaster && disaster.dataFields) {
      const values: { [key: string]: number } = {};
      disaster.dataFields.forEach(field => {
        values[field.id] = field.value;
      });
      setDataFieldValues(values);
    }
  }, [disaster]);

  // Cập nhật state cho rescueTypeValues
  useEffect(() => {
    if (disaster && disaster.rescueTypes) {
      const values: { [key: string]: number } = {};
      const startDates: { [key: string]: Date | undefined } = {};
      const endDates: { [key: string]: Date | undefined } = {};
      const unitIds: { [key: string]: string } = {};

      disaster.rescueTypes.forEach(rescueType => {
        values[rescueType.id] = rescueType.value;
        startDates[rescueType.id] = rescueType.startDate ? new Date(rescueType.startDate) : undefined;
        endDates[rescueType.id] = rescueType.endDate ? new Date(rescueType.endDate) : undefined;
        unitIds[rescueType.id] = rescueType.unitId;
      });

      setRescueTypeValues(values);
      setRescueTypeStartDates(startDates);
      setRescueTypeEndDates(endDates);
      setRescueTypeUnitIds(unitIds);
    }
  }, [disaster]);

  // Cập nhật state coordinate khi có dữ liệu disaster
  useEffect(() => {
    if (disaster && disaster.coordinate) {
      setCoordinateData({
        id: disaster.coordinate.id,
        lat: disaster.coordinate.lat,
        lng: disaster.coordinate.lng,
        address: disaster.coordinate.address
      });
    }
  }, [disaster]);

  // Thêm useEffect để cập nhật tên thảm họa tự động khi thông tin thay đổi
  useEffect(() => {
    if (disaster && classification.disasterTypeId) {
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
  }, [classification.disasterTypeId, disasterTypes, adminData.selectedProvinces, provinces, timeData.startDateTime, timeData.endDateTime, disaster]);

  // Optimize event handlers with useCallback
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Xác định state nào cần cập nhật
    if (name === 'name' || name === 'description') {
      setBasicInfo(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    // Xác định state nào cần cập nhật
    if (['disasterTypeId', 'priorityLevelId', 'emergencyLevelId'].includes(name)) {
      setClassification(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, []);

  const handleDateChange = useCallback((name: string, value: Date | undefined) => {
    setTimeData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleProvincesChange = useCallback((selectedOptions: Array<{ label: string, value: string }>) => {
    const provinceIds = selectedOptions.map(option => option.value);
    setAdminData(prev => ({
      ...prev,
      selectedProvinces: provinceIds,
      selectedDistricts: [],
      selectedCommunes: []
    }));
  }, []);

  const handleDistrictsChange = useCallback((selectedOptions: Array<{ label: string, value: string }>) => {
    const districtIds = selectedOptions.map(option => option.value);
    setAdminData(prev => ({
      ...prev,
      selectedDistricts: districtIds,
      selectedCommunes: []
    }));
  }, []);

  const handleCommunesChange = useCallback((selectedOptions: Array<{ label: string, value: string }>) => {
    const communeIds = selectedOptions.map(option => option.value);
    setAdminData(prev => ({
      ...prev,
      selectedCommunes: communeIds
    }));
  }, []);

  // Thêm mutation để cập nhật giá trị và thời gian của RescueTypeOnDisaster
  const updateRescueTypeMutation = useUpdateRescueTypeOnDisaster({
    onSuccess: () => {
      toast.success({
        title: "Thành công",
        description: "Đã cập nhật thông tin cứu hộ"
      });
      refetch();
    },
    onError: (error) => {
      toast.error({
        title: "Lỗi",
        description: `Không thể cập nhật thông tin cứu hộ: ${error.message}`
      });
    }
  });

  // Xử lý sự kiện form
  const handleSaveChanges = useCallback(async () => {
    try {
      // Kết hợp tất cả dữ liệu từ các state riêng biệt
      const combinedData = {
        name: basicInfo.name,
        description: basicInfo.description,
        disasterTypeId: classification.disasterTypeId,
        priorityLevelId: classification.priorityLevelId,
        emergencyLevelId: classification.emergencyLevelId,
        startDateTime: timeData.startDateTime,
        endDateTime: timeData.endDateTime,
        province: {
          set: adminData.selectedProvinces.map(id => ({ id }))
        },
        district: {
          set: adminData.selectedDistricts.map(id => ({ id }))
        },
        commune: {
          set: adminData.selectedCommunes.map(id => ({ id }))
        }
      };

      // Cập nhật thông tin thảm họa
      await updateDisasterMutation.mutateAsync({
        where: { id: disasterId },
        data: combinedData
      });

      // Phần còn lại giữ nguyên
      if (disaster && disaster.dataFields) {
        const updatePromises = disaster.dataFields.map(field => {
          // Chỉ cập nhật các trường có thay đổi giá trị
          if (dataFieldValues[field.id] !== field.value) {
            return updateDataFieldMutation.mutateAsync({
              where: { id: field.id },
              data: { value: dataFieldValues[field.id] }
            });
          }
          return Promise.resolve();
        });

        await Promise.all(updatePromises);
      }

      toast.success({
        title: "Thành công",
        description: "Đã cập nhật thông tin thảm họa và dữ liệu"
      });

    } catch (error: any) {
      console.error("Lỗi khi cập nhật thảm họa:", error);
      toast.error({
        title: "Lỗi",
        description: `Không thể cập nhật: ${error.message || 'Đã xảy ra lỗi'}`
      });
    }
  }, [
    basicInfo,
    classification,
    timeData,
    adminData,
    disasterId,
    updateDisasterMutation,
    disaster,
    dataFieldValues,
    updateDataFieldMutation
  ]);

  // Xử lý các sự kiện cho DataField
  const handleDataFieldValueChange = (id: string, value: string) => {
    setDataFieldValues({
      ...dataFieldValues,
      [id]: parseFloat(value) || 0
    });
  };

  const handleDeleteDataField = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa trường dữ liệu này?')) {
      updateDataFieldMutation.mutateAsync({
        where: { id },
        data: {
          deleted: new Date()
        }
      });
    }
  };

  const handleAddDataField = () => {
    if (!selectedDataField || !newDataFieldValue) {
      toast.error({
        title: "Lỗi",
        description: "Vui lòng chọn trường dữ liệu và nhập giá trị"
      });
      return;
    }

    createDataFieldMutation.mutateAsync({
      data: {
        disaster: {
          connect: { id: disasterId }
        },
        dataField: {
          connect: { id: selectedDataField }
        },
        value: parseFloat(newDataFieldValue) || 0
      }
    });
  };

  // Chuyển đổi availableDataFields sang định dạng DataFieldNode để sử dụng với component HierarchicalSelect
  const convertToDataFieldNodes = (): DataFieldNode[] => {
    if (!availableDataFields) return [];
    return availableDataFields.map((field: DataFieldWithOptimistic) => ({
      id: field.id,
      name: field.name,
      code: field.code,
      unit: field.unit,
      parentId: field.parentId,
      dataFieldGroup: field.dataFieldGroup,
      $optimistic: field.$optimistic
    }));
  };

  // Danh sách các trường dữ liệu đã tồn tại
  const existingDataFieldIds = disaster?.dataFields?.map(field => field.dataFieldId) || [];
  const handleCancelEdit = () => {
    // Reset form data về giá trị ban đầu từ disaster
    if (disaster) {
      setBasicInfo({
        name: disaster.name || '',
        description: disaster.description || ''
      });

      setClassification({
        disasterTypeId: disaster.disasterTypeId || '',
        priorityLevelId: disaster.priorityLevelId || '',
        emergencyLevelId: disaster.emergencyLevelId || ''
      });

      setTimeData({
        startDateTime: disaster.startDateTime || undefined,
        endDateTime: disaster.endDateTime || undefined
      });

      setAdminData({
        selectedProvinces: disaster.province ? disaster.province.map(p => p.id) : [],
        selectedDistricts: disaster.district ? disaster.district.map(d => d.id) : [],
        selectedCommunes: disaster.commune ? disaster.commune.map(c => c.id) : []
      });
    }
    setShowConfirmDialog(false);
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
      return <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">Chưa bắt đầu</span>;
    } else if (!end) {
      return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">Đang diễn ra</span>;
    } else if (end < now) {
      return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">Đã kết thúc</span>;
    } else {
      return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">Kết thúc dự kiến</span>;
    }
  };

  const handleBack = () => {
    // Khi quay lại trang danh sách, vẫn giữ nguyên số trang hiện tại được lưu trong global state
    router.push('/operation/disaster');
  };

  const handleGotoRescuePage = () => {
    router.push('/operation/rescue-resource');
  }
  // Hàm lấy tên phân cấp của trường dữ liệu (hỗ trợ đến cấp 6)
  const getDataFieldHierarchyName = (dataFieldId: string) => {
    if (!availableDataFields) return { name: "", hierarchyPath: [] };

    // Mảng lưu đường dẫn phân cấp (từ thấp đến cao)
    const hierarchyPath: { id: string; name: string }[] = [];

    // Tìm trường dữ liệu hiện tại
    const currentField = availableDataFields.find(field => field.id === dataFieldId);
    if (!currentField) return { name: "", hierarchyPath: [] };

    // Thêm trường hiện tại vào đầu đường dẫn
    hierarchyPath.unshift({ id: currentField.id, name: currentField.name });

    // Tìm các cấp cha lên đến cấp cao nhất (lặp tối đa 5 lần ~ 6 cấp)
    let parentId = currentField.parentId;
    let depth = 0;
    const maxDepth = 5; // Giới hạn số lần lặp để tránh vòng lặp vô hạn

    while (parentId && parentId !== '0' && parentId !== '' && depth < maxDepth) {
      // Tìm trường cha
      const parentField = availableDataFields.find(field => field.id === parentId);
      if (!parentField) break;

      // Thêm trường cha vào đầu đường dẫn
      hierarchyPath.unshift({ id: parentField.id, name: parentField.name });

      // Chuyển lên cấp cao hơn
      parentId = parentField.parentId;
      depth++;
    }

    // Tạo chuỗi tên phân cấp từ cao xuống thấp (tên > tên > tên)
    const hierarchyName = hierarchyPath.map(item => item.name).join(' > ');

    return {
      name: hierarchyName,
      hierarchyPath
    };
  };

  // Thêm hàm xử lý thay đổi giá trị cứu hộ
  const handleRescueTypeValueChange = (id: string, value: string) => {
    setRescueTypeValues({
      ...rescueTypeValues,
      [id]: parseFloat(value) || 0
    });
  };

  // Hàm xử lý khi thay đổi thời gian cứu hộ
  const handleRescueTypeStartDateChange = (id: string, date: Date | undefined) => {
    setRescueTypeStartDates({
      ...rescueTypeStartDates,
      [id]: date
    });
  };

  const handleRescueTypeEndDateChange = (id: string, date: Date | undefined) => {
    setRescueTypeEndDates({
      ...rescueTypeEndDates,
      [id]: date
    });
  };

  // Thêm hàm xử lý khi thay đổi đơn vị
  const handleRescueTypeUnitChange = (id: string, unitId: string) => {
    setRescueTypeUnitIds({
      ...rescueTypeUnitIds,
      [id]: unitId
    });
  };

  // Hàm xử lý khi thay đổi thông tin tọa độ
  const handleCoordinateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCoordinateData(prev => ({
      ...prev,
      [name]: name === 'address' ? value : parseFloat(value) || 0
    }));
  };

  // Hàm lưu thay đổi tọa độ
  const handleSaveCoordinateChanges = async () => {
    try {
      await updateCoordinateMutation.mutateAsync({
        where: { id: coordinateData.id },
        data: {
          lat: coordinateData.lat,
          lng: coordinateData.lng,
          address: coordinateData.address
        }
      });

      // Đóng modal khi cập nhật thành công
      setIsCoordinateModalOpen(false);

      // Thông báo thành công
      toast.success({
        title: "Thành công",
        description: "Đã cập nhật tọa độ thành công"
      });

      // Làm mới dữ liệu
      refetch();
    } catch (error: any) {
      console.error("Lỗi khi cập nhật tọa độ:", error);
      toast.error({
        title: "Lỗi",
        description: `Không thể cập nhật tọa độ: ${error.message || 'Đã xảy ra lỗi'}`
      });
    }
  };

  // Hàm xử lý khi vị trí trên bản đồ thay đổi
  const handleMapPositionChange = (lat: number, lng: number) => {
    setCoordinateData(prev => ({
      ...prev,
      lat,
      lng
    }));
  };

  // Thêm các section UI được memoize để tránh re-render không cần thiết
  const BasicInfoSection = useMemo(() => (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
          <FileText className="h-4 w-4 mr-1" /> Mô tả
        </h3>
        <Textarea
          name="description"
          value={basicInfo.description}
          onChange={handleInputChange}
          rows={4}
          className="resize-none w-full"
          placeholder="Nhập mô tả thảm họa"
        />
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
              onValueChange={(value) => handleSelectChange('disasterTypeId', value)}
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
              onValueChange={(value) => handleSelectChange('emergencyLevelId', value)}
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
              onValueChange={(value) => handleSelectChange('priorityLevelId', value)}
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
  ), [basicInfo, classification, disasterTypeOptions, emergencyLevelOptions, priorityLevelOptions, handleInputChange, handleSelectChange]);

  // UI section for time and location
  const TimeAndLocationSection = useMemo(() => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Thời gian bắt đầu:</Label>
        <DateTimePickerWrapper
          value={timeData.startDateTime}
          onChange={(value) => handleDateChange('startDateTime', value)}
          showTime={true}
          showClear={true}
          placeHolder="Chọn thời gian bắt đầu"
          className="w-full bg-white mb-3"
        />
      </div>
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Thời gian kết thúc:</Label>
        <DateTimePickerWrapper
          value={timeData.endDateTime}
          onChange={(value) => handleDateChange('endDateTime', value)}
          showTime={true}
          showClear={true}
          placeHolder="Chọn thời gian kết thúc"
          className="w-full bg-white mb-3"
          minDate={timeData.startDateTime}
        />
        {timeData.endDateTime && timeData.startDateTime && timeData.endDateTime < timeData.startDateTime && (
          <p className="text-red-500 text-xs mt-1 mb-3">
            Thời gian kết thúc phải sau thời gian bắt đầu
          </p>
        )}
      </div>
      <div>
        <p className="text-xs text-gray-500">Thời gian tạo:</p>
        <p className="text-gray-800">{disaster ? formatDate(disaster.createdAt) : "-"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Cập nhật lần cuối:</p>
        <p className="text-gray-800">{disaster ? formatDate(disaster.updatedAt) : "-"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Thời gian bắt đầu:</p>
        <p className="text-gray-800">{disaster ? formatDate(disaster.startDateTime) : "-"}</p>
      </div>
      <div>
        <p className="text-xs text-gray-500">Thời gian kết thúc:</p>
        <p className="text-gray-800">{disaster ? formatDate(disaster.endDateTime) : "-"}</p>
      </div>
    </div>
  ), [timeData, disaster, handleDateChange, formatDate]);

  // Hàm cập nhật thông tin cứu hộ
  const handleUpdateRescueType = async (id: string) => {
    try {
      await updateRescueTypeMutation.mutateAsync({
        where: { id },
        data: {
          value: rescueTypeValues[id],
          unitId: rescueTypeUnitIds[id],
          startDate: rescueTypeStartDates[id],
          endDate: rescueTypeEndDates[id]
        }
      });
    } catch (error: any) {
      console.error("Lỗi khi cập nhật thông tin cứu hộ:", error);
      toast.error({
        title: "Lỗi",
        description: `Không thể cập nhật thông tin cứu hộ: ${error.message || 'Đã xảy ra lỗi'}`
      });
    }
  };

  // Sắp xếp danh sách cứu hộ theo thời gian bắt đầu từ gần hiện tại nhất đến xa nhất
  const sortedRescueTypes = useMemo(() => {
    if (!disaster?.rescueTypes) return [];

    return [...disaster.rescueTypes].sort((a, b) => {
      // Lấy thời gian bắt đầu từ state, nếu không có thì lấy từ dữ liệu
      const aStartDate = rescueTypeStartDates[a.id] || a.startDate;
      const bStartDate = rescueTypeStartDates[b.id] || b.startDate;

      // Nếu cả hai đều không có ngày bắt đầu, giữ nguyên thứ tự
      if (!aStartDate && !bStartDate) return 0;

      // Đưa những mục không có ngày bắt đầu xuống cuối
      if (!aStartDate) return 1;
      if (!bStartDate) return -1;

      // Tính khoảng cách từ hiện tại đến ngày bắt đầu
      const now = new Date();
      const aDiff = Math.abs(now.getTime() - new Date(aStartDate).getTime());
      const bDiff = Math.abs(now.getTime() - new Date(bStartDate).getTime());

      // Sắp xếp từ gần đến xa
      return aDiff - bDiff;
    });
  }, [disaster?.rescueTypes, rescueTypeStartDates]);

  // Content for the TabsContent for "media" tab
  const MediaContent = useMemo(() => (
    <Card className="shadow">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 py-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Image className="h-5 w-5 text-blue-500 mr-2" />
            Hình ảnh & Media
          </CardTitle>
          <Button
            onClick={() => setShowMediaUploadDialog(true)}
            variant="outline"
            size="sm"
            className="flex items-center bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
          >
            <Upload className="h-4 w-4 mr-1" /> Tải lên hình ảnh/media
          </Button>
        </div>
      </CardHeader>
      {disaster &&
        (
          <MediaUploader
            disasterId={disaster.id}
            disasterCoordinateId={disaster.coordinate?.id}
            userId={userID || ''}
            showGallery={true}
            initialMedia={disaster?.media || []}
            onSuccess={handleMediaUploadSuccess}
            showUploadButton={false}
            isUploadDialogOpen={showMediaUploadDialog}
            onUploadDialogOpenChange={setShowMediaUploadDialog}
          />
        )}
    </Card>
  ), [disaster, handleMediaUploadSuccess, userID, showMediaUploadDialog]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-gray-700">Đang tải thông tin thảm họa...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <AlertTriangle className="h-16 w-16 mb-4" />
        <div className="text-xl font-semibold">Đã xảy ra lỗi</div>
        <div className="mt-2">{error.message}</div>
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

  if (!disaster) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-yellow-500">
        <AlertTriangle className="h-16 w-16 mb-4" />
        <div className="text-xl font-semibold">Không tìm thấy thảm họa</div>
        <div className="mt-2">Thảm họa với ID này không tồn tại hoặc đã bị xóa.</div>
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
          {/* Thay đổi từ Input sang hiển thị tên, không cho phép chỉnh sửa */}
          <div className="font-bold text-xl">
            {basicInfo.name}
          </div>
        </h1>
        <Button
          variant={"default"}
          size="sm"
          className={
            "bg-green-600 hover:bg-green-700 text-white ml-2"
          }
          onClick={handleSaveChanges}
        >
          <>
            <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
          </>
        </Button>
      </div>

      <Card className="shadow-md border-t-4 border-blue-400 mb-4">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-blue-500 mr-2" />
              <CardTitle className="text-lg text-gray-800">Thông tin cơ bản</CardTitle>
            </div>
            <div>{getStatusIndicator(disaster)}</div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
            {BasicInfoSection}

            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-medium text-gray-500 flex items-center mb-2">
                  <Clock className="h-4 w-4 mr-1" /> Thời gian
                </h3>
                {TimeAndLocationSection}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 flex items-center mb-2">
                  <MapPin className="h-4 w-4 mr-1" /> Vị trí
                </h3>
                {disaster.coordinate && (
                  <div className="mb-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Tọa độ:</p>
                        <p className="text-gray-800 font-medium">
                          {disaster.coordinate.lat.toFixed(6)}, {disaster.coordinate.lng.toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 mb-1">Địa chỉ:</p>
                        <p className="text-gray-800">{disaster.coordinate.address || "Không có địa chỉ"}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-500 border-blue-200 bg-blue-50 hover:bg-blue-100"
                        onClick={() => setIsCoordinateModalOpen(true)}
                      >
                        <Edit className="h-3.5 w-3.5 mr-1" /> Sửa tọa độ
                      </Button>
                    </div>
                  </div>
                )}
              </div>

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
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Quận/Huyện:</Label>
                    <MultiSelect
                      data={districtOptions}
                      value={adminData.selectedDistricts}
                      onValueChange={handleDistrictsChange}
                      placeholder="Chọn quận/huyện"
                      className="bg-white"
                      popoverContentClassName="bg-white shadow-md"
                      disabled={adminData.selectedProvinces.length === 0}
                    />
                  </div>
                  <div className="pb-3">
                    <Label className="text-xs text-gray-500 mb-1 block">Xã/Phường:</Label>
                    <MultiSelect
                      data={communeOptions}
                      value={adminData.selectedCommunes}
                      onValueChange={handleCommunesChange}
                      placeholder="Chọn xã/phường"
                      className="bg-white"
                      popoverContentClassName="bg-white shadow-md"
                      disabled={adminData.selectedDistricts.length === 0}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="disasterData" className="w-full" onValueChange={setActiveTab}>
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
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-500 border-blue-200 bg-blue-50 hover:bg-blue-100"
                  onClick={() => {
                    setActiveTab('disasterData');
                    setShowAddDataFieldDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Thêm số liệu
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {disaster?.dataFields && (
                <TableWrapper
                  variant="border"
                  spacing="md"
                  columns={[
                    {
                      header: "Tên trường dữ liệu",
                      accessorKey: "name",
                      className: "w-[40%]",
                      cell: (item) => <span className="font-medium">{item.hierarchyName}</span>
                    },
                    {
                      header: "Giá trị",
                      accessorKey: "value",
                      cell: (item) => (
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={dataFieldValues[item.id] !== undefined ? dataFieldValues[item.id] : item.value}
                            onChange={(e) => handleDataFieldValueChange(item.id, e.target.value)}
                            className="w-36"
                          />
                          <span className="ml-2 text-gray-500">{item.unit}</span>
                        </div>
                      )
                    },
                    {
                      header: "Thao tác",
                      cell: (item) => (
                        <div className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDataField(item.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      ),
                      className: "text-center"
                    }
                  ]}
                  data={disaster.dataFields
                    .filter(field => {
                      const dataField = availableDataFields?.find(df => df.id === field.dataFieldId);
                      return dataField?.dataFieldGroup?.toLowerCase() === 'disaster' && !field.deleted;
                    })
                    .sort((a, b) => {
                      const aName = getDataFieldHierarchyName(a.dataFieldId).name;
                      const bName = getDataFieldHierarchyName(b.dataFieldId).name;
                      return aName.localeCompare(bName);
                    })
                    .map(field => {
                      const dataField = availableDataFields?.find(df => df.id === field.dataFieldId);
                      const hierarchyName = getDataFieldHierarchyName(field.dataFieldId).name;
                      return {
                        id: field.id,
                        value: field.value,
                        hierarchyName,
                        unit: dataField?.unit || '',
                        dataFieldId: field.dataFieldId
                      };
                    })
                  }
                  emptyState={
                    <TableRow>
                      <TableCell colSpan={3} className="h-[300px]">
                        <div className="text-center py-8 bg-gray-50 rounded-md">
                          <Activity className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 mb-2">Không có số liệu thảm họa</p>
                          <p className="text-sm text-gray-400 mb-4">Chưa có số liệu nào được thêm vào thảm họa này</p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setActiveTab('disasterData');
                              setShowAddDataFieldDialog(true);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Thêm số liệu thảm họa
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="damageData">
          <Card className="shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-orange-50 py-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                  Thiệt hại từ thảm họa
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-orange-500 border-orange-200 bg-orange-50 hover:bg-orange-100"
                  onClick={() => {
                    setActiveTab('damageData');
                    setShowAddDataFieldDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" /> Thêm số liệu thiệt hại
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {disaster?.dataFields && (
                <TableWrapper
                  variant="border"
                  spacing="md"
                  columns={[
                    {
                      header: "Tên trường dữ liệu",
                      accessorKey: "name",
                      className: "w-[40%]",
                      cell: (item) => <span className="font-medium">{item.hierarchyName}</span>
                    },
                    {
                      header: "Giá trị",
                      accessorKey: "value",
                      cell: (item) => (
                        <div className="flex items-center">
                          <Input
                            type="number"
                            value={dataFieldValues[item.id] !== undefined ? dataFieldValues[item.id] : item.value}
                            onChange={(e) => handleDataFieldValueChange(item.id, e.target.value)}
                            className="w-36"
                          />
                          <span className="ml-2 text-gray-500">{item.unit}</span>
                        </div>
                      )
                    },
                    {
                      header: "Thao tác",
                      cell: (item) => (
                        <div className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDataField(item.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      ),
                      className: "text-center"
                    }
                  ]}
                  data={disaster.dataFields
                    .filter(field => {
                      const dataField = availableDataFields?.find(df => df.id === field.dataFieldId);
                      return dataField?.dataFieldGroup?.toLowerCase() === 'common' && !field.deleted;
                    })
                    .sort((a, b) => {
                      const aName = getDataFieldHierarchyName(a.dataFieldId).name;
                      const bName = getDataFieldHierarchyName(b.dataFieldId).name;
                      return aName.localeCompare(bName);
                    })
                    .map(field => {
                      const dataField = availableDataFields?.find(df => df.id === field.dataFieldId);
                      const hierarchyName = getDataFieldHierarchyName(field.dataFieldId).name;
                      return {
                        id: field.id,
                        value: field.value,
                        hierarchyName,
                        unit: dataField?.unit || '',
                        dataFieldId: field.dataFieldId
                      };
                    })
                  }
                  emptyState={
                    <TableRow>
                      <TableCell colSpan={3} className="h-[300px]">
                        <div className="text-center py-8 bg-gray-50 rounded-md">
                          <AlertTriangle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 mb-2">Không có số liệu thiệt hại</p>
                          <p className="text-sm text-gray-400 mb-4">Chưa có số liệu thiệt hại nào được thêm vào thảm họa này</p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setActiveTab('damageData');
                              setShowAddDataFieldDialog(true);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Thêm số liệu thiệt hại
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rescueTypes">
          <Card className="shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 py-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <Shield className="h-5 w-5 text-green-500 mr-2" />
                  Thông tin cứu hộ
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
                  onClick={handleGotoRescuePage}
                >
                  <Plus className="h-4 w-4 mr-1" /> Quản lý cứu hộ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {disaster?.rescueTypes && (
                <TableWrapper
                  variant="border"
                  columns={[
                    {
                      header: "Loại cứu hộ",
                      accessorKey: "name",
                      className: "w-[25%]",
                      cell: (item) => <span className="font-medium">{item.name}</span>
                    },
                    {
                      header: "Số lượng",
                      accessorKey: "value",
                      cell: (item) => (
                        <Input
                          type="number"
                          value={rescueTypeValues[item.id] !== undefined ? rescueTypeValues[item.id] : item.value}
                          onChange={(e) => handleRescueTypeValueChange(item.id, e.target.value)}
                          className="w-24"
                        />
                      )
                    },
                    {
                      header: "Đơn vị",
                      accessorKey: "unit",
                      cell: (item) => <div className="text-sm">{item.unitName || "Không có đơn vị"}</div>
                    },
                    {
                      header: "Thời gian bắt đầu",
                      accessorKey: "startDate",
                      cell: (item) => (
                        <DateTimePickerWrapper
                          value={rescueTypeStartDates[item.id] || item.startDate}
                          onChange={(date) => handleRescueTypeStartDateChange(item.id, date)}
                          showTime={true}
                          showClear={true}
                          placeHolder="Chọn thời gian"
                          className="w-full"
                        />
                      )
                    },
                    {
                      header: "Thời gian kết thúc",
                      accessorKey: "endDate",
                      cell: (item) => (
                        <DateTimePickerWrapper
                          value={rescueTypeEndDates[item.id] || item.endDate}
                          onChange={(date) => handleRescueTypeEndDateChange(item.id, date)}
                          showTime={true}
                          showClear={true}
                          placeHolder="Chọn thời gian"
                          className="w-full"
                          minDate={rescueTypeStartDates[item.id] || item.startDate}
                        />
                      )
                    },
                    {
                      header: "Thao tác",
                      cell: (item) => (
                        <div className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateRescueType(item.id)}
                            className="h-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Save className="h-5 w-5 mr-1" /> Lưu
                          </Button>
                        </div>
                      ),
                      className: "text-center"
                    }
                  ]}
                  data={sortedRescueTypes.map(rescueType => ({
                    id: rescueType.id,
                    value: rescueType.value,
                    name: rescueType.rescueType?.name || "Không xác định",
                    unitName: rescueType.unit?.name || "",
                    unitId: rescueType.unitId,
                    startDate: rescueType.startDate || undefined,
                    endDate: rescueType.endDate || undefined
                  }))}
                  emptyState={
                    <TableRow>
                      <TableCell colSpan={6} className="h-[300px]">
                        <div className="text-center py-8 bg-gray-50 rounded-md">
                          <Shield className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 mb-2">Không có thông tin cứu hộ</p>
                          <p className="text-sm text-gray-400 mb-4">Thảm họa này chưa có thông tin cứu hộ nào được thêm vào</p>
                          <Button
                            variant="outline"
                            className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                            onClick={handleGotoRescuePage}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Đi đến trang quản lý cứu hộ
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          {MediaContent}
        </TabsContent>

        <TabsContent value="zones">
          <Card className="shadow">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50 py-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center">
                  <Map className="h-5 w-5 text-indigo-500 mr-2" />
                  Khu vực & Vùng ảnh hưởng
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {disaster?.zone && (
                <TableWrapper
                  variant="border"
                  spacing="md"
                  columns={[
                    {
                      header: "Tên khu vực",
                      accessorKey: "name",
                      className: "w-[30%]",
                      cell: (item) => <span className="font-medium">{item.name}</span>
                    },
                    {
                      header: "Mô tả",
                      accessorKey: "description",
                      className: "w-[50%]",
                      cell: (item) => <span className="text-gray-500">{item.description || "Không có mô tả"}</span>
                    },
                    {
                      header: "Thao tác",
                      cell: (item) => (
                        <div className="text-center">
                          <Link
                            href={`/operation/zone/${item.id}`}
                            className="text-blue-500 hover:text-blue-700 text-sm inline-flex items-center"
                          >
                            <Globe className="h-3.5 w-3.5 mr-1" /> Xem khu vực
                          </Link>
                        </div>
                      ),
                      className: "text-center"
                    }
                  ]}
                  data={disaster.zone}
                  emptyState={
                    <TableRow>
                      <TableCell colSpan={3} className="p-0 items-center">
                        <div className="text-center py-8 bg-gray-50 rounded-md">
                          <Map className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-500 mb-2">Không có khu vực bị ảnh hưởng</p>
                          <p className="text-sm text-gray-400 mb-4">Thảm họa này chưa có thông tin về khu vực hoặc vùng bị ảnh hưởng</p>
                          <Button
                            variant="outline"
                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-indigo-200"
                            onClick={() => router.push('/operation/zone')}
                          >
                            <Plus className="mr-2 h-4 w-4" /> Quản lý khu vực
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-4 border-t pt-3 pb-2 flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
        </Button>
      </div>

      {/* Modal thêm data field */}
      <Dialog open={showAddDataFieldDialog} onOpenChange={setShowAddDataFieldDialog}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'disasterData'
                ? 'Thêm số liệu thảm họa'
                : activeTab === 'damageData'
                  ? 'Thêm dữ liệu thiệt hại'
                  : 'Thêm trường dữ liệu'}
            </DialogTitle>
            <DialogDescription>
              {activeTab === 'disasterData'
                ? 'Chọn trường dữ liệu và nhập giá trị số liệu thảm họa'
                : activeTab === 'damageData'
                  ? 'Chọn trường dữ liệu và nhập giá trị thiệt hại'
                  : 'Chọn trường dữ liệu và nhập giá trị để thêm vào thảm họa'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="dataField">Trường dữ liệu</Label>
              {activeTab === 'disasterData' && (
                <div className="text-xs text-blue-500 bg-blue-50 p-2 rounded-md mb-2">
                  <AlertCircle className="h-3 w-3 inline-block mr-1" />
                  Chỉ hiển thị các trường dữ liệu thuộc nhóm "Thảm họa"
                </div>
              )}
              {activeTab === 'damageData' && (
                <div className="text-xs text-orange-500 bg-orange-50 p-2 rounded-md mb-2">
                  <AlertCircle className="h-3 w-3 inline-block mr-1" />
                  Chỉ hiển thị các trường dữ liệu thuộc nhóm "Thiệt hại chung"
                </div>
              )}
              <Select
                value={selectedDataField}
                onValueChange={setSelectedDataField}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Chọn trường dữ liệu">
                    {selectedDataField && getDataFieldHierarchyName(selectedDataField).name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white max-h-[300px] overflow-y-auto">
                  <HierarchicalSelect
                    dataFields={convertToDataFieldNodes()}
                    existingFieldIds={existingDataFieldIds}
                    emptyMessage="Không có trường dữ liệu khả dụng"
                    rootGroupLabel="Trường dữ liệu cấp 1"
                    onSelectNode={setSelectedDataField}
                    filterFunction={(node) => {
                      // Sử dụng state activeTab thay vì kiểm tra DOM

                      // Nếu đang ở tab "Số liệu thảm họa", chỉ hiển thị các trường có nhóm "disaster"
                      if (activeTab === 'disasterData') {
                        return node.dataFieldGroup?.toLowerCase() === 'disaster';
                      }

                      // Nếu đang ở tab "Thiệt hại từ thảm họa", chỉ hiển thị các trường có nhóm "common" 
                      if (activeTab === 'damageData') {
                        return node.dataFieldGroup?.toLowerCase() === 'common';
                      }

                      // Mặc định hiển thị tất cả
                      return true;
                    }}
                  />
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Giá trị</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="value"
                  type="number"
                  value={newDataFieldValue}
                  onChange={(e) => setNewDataFieldValue(e.target.value)}
                  className="bg-white"
                  placeholder="Nhập giá trị"
                />
                <span className="text-gray-500">
                  {selectedDataField && availableDataFields?.find(f => f.id === selectedDataField)?.unit}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowAddDataFieldDialog(false)}>
              Hủy
            </Button>
            <Button
              variant="default"
              onClick={handleAddDataField}
              disabled={!selectedDataField || !newDataFieldValue}
            >
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal xác nhận khi hủy chỉnh sửa */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Xác nhận hủy chỉnh sửa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn hủy các thay đổi? Mọi thay đổi sẽ không được lưu.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Tiếp tục chỉnh sửa
            </Button>
            <Button variant="destructive" onClick={handleCancelEdit}>
              Hủy thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog chỉnh sửa tọa độ */}
      <Dialog open={isCoordinateModalOpen} onOpenChange={setIsCoordinateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa tọa độ</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin vị trí của thảm họa. Bạn có thể nhập tọa độ trực tiếp hoặc chọn trên bản đồ.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* <div className="mb-4">
            <Label className="text-sm font-medium mb-2 block">Chọn vị trí trên bản đồ:</Label>
            <MapPicker 
              initialPosition={[
                Number.isFinite(coordinateData.lat) ? coordinateData.lat : 10.762622, 
                Number.isFinite(coordinateData.lng) ? coordinateData.lng : 106.660172
              ]} 
              onPositionChange={handleMapPositionChange}
              height="300px"
              className="mb-4"
            />
          </div> */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Vĩ độ:</Label>
                <Input
                  name="lat"
                  value={coordinateData.lat}
                  onChange={handleCoordinateChange}
                  placeholder="Ví dụ: 10.762622"
                  type="number"
                  step="0.000001"
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Kinh độ:</Label>
                <Input
                  name="lng"
                  value={coordinateData.lng}
                  onChange={handleCoordinateChange}
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
                value={coordinateData.address || ''}
                onChange={handleCoordinateChange}
                placeholder="Nhập địa chỉ"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCoordinateModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveCoordinateChanges}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default DisasterDetailPage;
