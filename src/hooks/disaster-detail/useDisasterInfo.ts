import { useState, useEffect, useCallback } from 'react';
import { useUpdateDisaster } from '@/generated/hooks';
import { toast } from '@/components/ui/toast';
import { generateDisasterName } from '@/lib/utils';

export type BasicInfoState = {
  name: string;
  description: string;
};

export type ClassificationState = {
  disasterTypeId: string;
  priorityLevelId: string;
  emergencyLevelId: string;
};

export type TimeDataState = {
  startDateTime: Date | undefined;
  endDateTime: Date | undefined;
};

export type AdminDataState = {
  selectedProvinces: string[];
  selectedDistricts: string[];
  selectedCommunes: string[];
};

export const useDisasterInfo = (disasterId: string, initialData: any) => {
  // State cho thông tin cơ bản
  const [basicInfo, setBasicInfo] = useState<BasicInfoState>({
    name: '',
    description: ''
  });

  // State cho phân loại thảm họa
  const [classification, setClassification] = useState<ClassificationState>({
    disasterTypeId: '',
    priorityLevelId: '',
    emergencyLevelId: ''
  });

  // State cho thời gian
  const [timeData, setTimeData] = useState<TimeDataState>({
    startDateTime: undefined,
    endDateTime: undefined
  });

  // State cho dữ liệu hành chính
  const [adminData, setAdminData] = useState<AdminDataState>({
    selectedProvinces: [],
    selectedDistricts: [],
    selectedCommunes: []
  });
  
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

  // Cập nhật state khi có dữ liệu ban đầu
  useEffect(() => {
    if (initialData) {
      setBasicInfo({
        name: initialData.name || '',
        description: initialData.description || ''
      });

      setClassification({
        disasterTypeId: initialData.disasterTypeId || '',
        priorityLevelId: initialData.priorityLevelId || '',
        emergencyLevelId: initialData.emergencyLevelId || ''
      });

      setTimeData({
        startDateTime: initialData.startDateTime ? new Date(initialData.startDateTime) : undefined,
        endDateTime: initialData.endDateTime ? new Date(initialData.endDateTime) : undefined
      });
      
      setAdminData({
        selectedProvinces: initialData.province?.map((p: any) => p.id) || [],
        selectedDistricts: initialData.district?.map((d: any) => d.id) || [],
        selectedCommunes: initialData.commune?.map((c: any) => c.id) || []
      });
    }
  }, [initialData]);

  // Xử lý thay đổi input
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'name' || name === 'description') {
      setBasicInfo(prev => {
        if (prev[name] === value) return prev;
        
        return {
          ...prev,
          [name]: value
        };
      });
    }
  }, []);

  // Xử lý thay đổi select
  const handleSelectChange = useCallback((name: string, value: string) => {
    if (['disasterTypeId', 'priorityLevelId', 'emergencyLevelId'].includes(name)) {
      setClassification(prev => {
        const updated = { ...prev };
        // Kiểm tra name là một key hợp lệ của ClassificationState
        if (name === 'disasterTypeId' || name === 'priorityLevelId' || name === 'emergencyLevelId') {
          if (updated[name] === value) return prev;
          updated[name] = value;
        }
        return updated;
      });
    }
  }, []);

  // Xử lý thay đổi ngày tháng
  const handleDateChange = useCallback((name: string, value: Date | undefined) => {
    setTimeData(prev => {
      // Tạo object mới với key động
      const updated = { ...prev };
      // Kiểm tra name là một key hợp lệ của TimeDataState
      if (name === 'startDateTime' || name === 'endDateTime') {
        updated[name] = value;
      }
      return updated;
    });
  }, []);

  // Xử lý thay đổi tỉnh/thành
  const handleProvincesChange = useCallback((selectedOptions: Array<{ label: string, value: string }>) => {
    const provinceIds = selectedOptions.map(option => option.value);
    setAdminData(prev => {
      // Nếu mảng không thay đổi, trả về state cũ để tránh render lại
      if (arraysEqual(prev.selectedProvinces, provinceIds)) return prev;
      
      return {
        ...prev,
        selectedProvinces: provinceIds,
        selectedDistricts: [],
        selectedCommunes: []
      };
    });
  }, []);

  // Xử lý thay đổi quận/huyện
  const handleDistrictsChange = useCallback((selectedOptions: Array<{ label: string, value: string }>) => {
    const districtIds = selectedOptions.map(option => option.value);
    setAdminData(prev => {
      // Nếu mảng không thay đổi, trả về state cũ để tránh render lại
      if (arraysEqual(prev.selectedDistricts, districtIds)) return prev;
      
      return {
        ...prev,
        selectedDistricts: districtIds,
        selectedCommunes: []
      };
    });
  }, []);

  // Xử lý thay đổi xã/phường
  const handleCommunesChange = useCallback((selectedOptions: Array<{ label: string, value: string }>) => {
    const communeIds = selectedOptions.map(option => option.value);
    setAdminData(prev => {
      // Nếu mảng không thay đổi, trả về state cũ để tránh render lại
      if (arraysEqual(prev.selectedCommunes, communeIds)) return prev;
      
      return {
        ...prev,
        selectedCommunes: communeIds
      };
    });
  }, []);
  
  // Hàm kiểm tra nếu hai mảng có cùng nội dung
  const arraysEqual = (a: string[], b: string[]): boolean => {
    if (a.length !== b.length) return false;
    
    // Sắp xếp và so sánh từng phần tử
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    
    for (let i = 0; i < sortedA.length; i++) {
      if (sortedA[i] !== sortedB[i]) return false;
    }
    
    return true;
  };

  // Tự động cập nhật tên thảm họa
  const updateDisasterName = useCallback((
    disasterType: string,
    provinceNames: string[],
    startDate?: Date,
    endDate?: Date
  ) => {
    const generatedName = generateDisasterName(
      disasterType,
      provinceNames,
      startDate,
      endDate
    );

    setBasicInfo(prev => {
      if (prev.name === generatedName) return prev;
      
      return {
        ...prev,
        name: generatedName
      };
    });
  }, []);

  // Lưu thay đổi thông tin thảm họa
  const saveChanges = useCallback(async () => {
    try {
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

      return true;
    } catch (error: any) {
      console.error("Lỗi khi cập nhật thảm họa:", error);
      toast.error({
        title: "Lỗi",
        description: `Không thể cập nhật: ${error.message || 'Đã xảy ra lỗi'}`
      });
      return false;
    }
  }, [basicInfo, classification, timeData, adminData, disasterId, updateDisasterMutation]);

  // Reset form về giá trị ban đầu
  const resetForm = useCallback(() => {
    if (initialData) {
      setBasicInfo({
        name: initialData.name || '',
        description: initialData.description || ''
      });

      setClassification({
        disasterTypeId: initialData.disasterTypeId || '',
        priorityLevelId: initialData.priorityLevelId || '',
        emergencyLevelId: initialData.emergencyLevelId || ''
      });

      setTimeData({
        startDateTime: initialData.startDateTime ? new Date(initialData.startDateTime) : undefined,
        endDateTime: initialData.endDateTime ? new Date(initialData.endDateTime) : undefined
      });

      // Đảm bảo chuỗi là mảng trước khi sử dụng map
      const provinceArray = Array.isArray(initialData.province) ? initialData.province : [];
      const districtArray = Array.isArray(initialData.district) ? initialData.district : [];
      const communeArray = Array.isArray(initialData.commune) ? initialData.commune : [];

      setAdminData({
        selectedProvinces: provinceArray.map((p: any) => p.id),
        selectedDistricts: districtArray.map((d: any) => d.id),
        selectedCommunes: communeArray.map((c: any) => c.id)
      });
    }
  }, [initialData]);

  return {
    basicInfo,
    setBasicInfo,
    classification,
    setClassification,
    timeData,
    setTimeData,
    adminData,
    setAdminData,
    handleInputChange,
    handleSelectChange,
    handleDateChange,
    handleProvincesChange,
    handleDistrictsChange,
    handleCommunesChange,
    updateDisasterName,
    saveChanges,
    resetForm,
    isLoading: updateDisasterMutation.isPending
  };
}; 