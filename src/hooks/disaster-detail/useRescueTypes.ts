import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  useUpdateRescueTypeOnDisaster, 
  useCreateRescueTypeOnDisaster, 
  useDeleteRescueTypeOnDisaster 
} from '@/generated/hooks';
import { toast } from '@/components/ui/toast';

export type RescueTypeOnDisaster = {
  id: string;
  disasterId: string;
  rescueTypeId: string;
  value: number;
  unitId: string;
  startDate?: Date | null;
  endDate?: Date | null;
  source?: string | null;
  rescueType?: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    name: string;
  };
};

export type RescueTypeFormState = {
  id: string;
  disasterId: string;
  rescueTypeId: string;
  value: number;
  unitId: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  source: string | undefined;
};

export const useRescueTypes = (disasterId: string, initialRescueTypes: RescueTypeOnDisaster[], refetch: () => void) => {
  // State cho form thêm/sửa cứu hộ
  const [rescueTypeForm, setRescueTypeForm] = useState<RescueTypeFormState>({
    id: '',
    disasterId: disasterId,
    rescueTypeId: '',
    value: 0,
    unitId: '',
    startDate: undefined,
    endDate: undefined,
    source: undefined
  });

  // State cho dialog thêm/sửa cứu hộ
  const [showAddRescueDialog, setShowAddRescueDialog] = useState(false);

  // State cho các giá trị cứu hộ
  const [rescueTypeValues, setRescueTypeValues] = useState<{ [key: string]: number }>({});
  const [rescueTypeStartDates, setRescueTypeStartDates] = useState<{ [key: string]: Date | undefined }>({});
  const [rescueTypeEndDates, setRescueTypeEndDates] = useState<{ [key: string]: Date | undefined }>({});
  const [rescueTypeUnitIds, setRescueTypeUnitIds] = useState<{ [key: string]: string }>({});

  // Sử dụng ref để theo dõi giá trị trước đó của initialRescueTypes
  const prevInitialRescueTypesRef = useRef<RescueTypeOnDisaster[]>([]);

  // Cập nhật state khi có dữ liệu ban đầu
  useEffect(() => {
    // Kiểm tra nếu initialRescueTypes đã thay đổi thực sự
    const fieldsChanged = hasRescueTypesChanged(initialRescueTypes, prevInitialRescueTypesRef.current);

    if (initialRescueTypes && fieldsChanged) {
      const values: { [key: string]: number } = {};
      const startDates: { [key: string]: Date | undefined } = {};
      const endDates: { [key: string]: Date | undefined } = {};
      const unitIds: { [key: string]: string } = {};

      initialRescueTypes.forEach(rescueType => {
        values[rescueType.id] = rescueType.value;
        startDates[rescueType.id] = rescueType.startDate ? new Date(rescueType.startDate) : undefined;
        endDates[rescueType.id] = rescueType.endDate ? new Date(rescueType.endDate) : undefined;
        unitIds[rescueType.id] = rescueType.unitId;
      });

      // Kiểm tra xem các giá trị mới có khác với các giá trị hiện tại không
      if (hasValuesChanged(values, rescueTypeValues)) {
        setRescueTypeValues(values);
      }

      // Chỉ cập nhật các state khác nếu cần thiết
      setRescueTypeStartDates(startDates);
      setRescueTypeEndDates(endDates);
      setRescueTypeUnitIds(unitIds);
      
      // Cập nhật ref
      prevInitialRescueTypesRef.current = initialRescueTypes;
    }
  }, [initialRescueTypes]);

  // Hàm kiểm tra nếu mảng initialRescueTypes đã thay đổi
  const hasRescueTypesChanged = (
    newTypes: RescueTypeOnDisaster[], 
    oldTypes: RescueTypeOnDisaster[]
  ): boolean => {
    if (newTypes.length !== oldTypes.length) return true;
    
    // Tạo map từ oldTypes để tìm kiếm nhanh
    const oldTypesMap = new Map<string, RescueTypeOnDisaster>();
    oldTypes.forEach(type => oldTypesMap.set(type.id, type));
    
    // Kiểm tra từng phần tử của mảng mới
    for (const newType of newTypes) {
      const oldType = oldTypesMap.get(newType.id);
      if (!oldType) return true;
      
      // Kiểm tra các thuộc tính cơ bản
      if (
        newType.value !== oldType.value ||
        newType.rescueTypeId !== oldType.rescueTypeId ||
        newType.unitId !== oldType.unitId ||
        formatDate(newType.startDate) !== formatDate(oldType.startDate) ||
        formatDate(newType.endDate) !== formatDate(oldType.endDate) ||
        newType.source !== oldType.source
      ) {
        return true;
      }
    }
    
    return false;
  };

  // Hàm định dạng ngày tháng để so sánh
  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return '';
    return new Date(date).toISOString();
  };

  // Kiểm tra nếu giá trị đã thay đổi
  const hasValuesChanged = (
    newValues: { [key: string]: number },
    oldValues: { [key: string]: number }
  ): boolean => {
    const newKeys = Object.keys(newValues);
    const oldKeys = Object.keys(oldValues);
    
    if (newKeys.length !== oldKeys.length) return true;
    
    for (const key of newKeys) {
      if (newValues[key] !== oldValues[key]) return true;
    }
    
    return false;
  };

  // Mutation để cập nhật cứu hộ
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
        description: `Không thể cập nhật thông tin cứu hộ: ${error.message || 'Đã xảy ra lỗi'}`
      });
    }
  });

  // Mutation để tạo mới cứu hộ
  const createRescueTypeMutation = useCreateRescueTypeOnDisaster({
    onSuccess: () => {
      toast.success({
        title: "Thành công",
        description: "Đã thêm thông tin cứu hộ mới"
      });
      refetch();
      setShowAddRescueDialog(false);
      resetRescueTypeForm();
    },
    onError: (error) => {
      toast.error({
        title: "Lỗi",
        description: `Không thể thêm thông tin cứu hộ: ${error.message || 'Đã xảy ra lỗi'}`
      });
    }
  });

  // Mutation để xóa cứu hộ
  const deleteRescueTypeMutation = useDeleteRescueTypeOnDisaster({
    onSuccess: () => {
      toast.success({
        title: "Thành công",
        description: "Đã xóa thông tin cứu hộ"
      });
      refetch();
    },
    onError: (error) => {
      toast.error({
        title: "Lỗi",
        description: `Không thể xóa thông tin cứu hộ: ${error.message || 'Đã xảy ra lỗi'}`
      });
    }
  });

  // Reset form cứu hộ
  const resetRescueTypeForm = useCallback(() => {
    setRescueTypeForm({
      id: '',
      disasterId: disasterId,
      rescueTypeId: '',
      value: 0,
      unitId: '',
      startDate: undefined,
      endDate: undefined,
      source: undefined
    });
  }, [disasterId]);

  // Hàm cập nhật một trường trong form
  const updateFormField = useCallback((field: string, value: any) => {
    setRescueTypeForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Xử lý thêm hoặc cập nhật cứu hộ
  const addOrUpdateRescue = useCallback(async () => {
    try {
      if (!rescueTypeForm.rescueTypeId || !rescueTypeForm.unitId) {
        toast.error({
          title: "Lỗi",
          description: "Vui lòng nhập đầy đủ loại cứu hộ và đơn vị"
        });
        return;
      }

      if (rescueTypeForm.id) {
        // Cập nhật
        await updateRescueTypeMutation.mutateAsync({
          where: { id: rescueTypeForm.id },
          data: {
            rescueType: {
              connect: { id: rescueTypeForm.rescueTypeId }
            },
            value: rescueTypeForm.value,
            unit: {
              connect: { id: rescueTypeForm.unitId }
            },
            startDate: rescueTypeForm.startDate,
            endDate: rescueTypeForm.endDate,
            source: rescueTypeForm.source
          }
        });
      } else {
        // Tạo mới
        await createRescueTypeMutation.mutateAsync({
          data: {
            disaster: {
              connect: { id: disasterId }
            },
            rescueType: {
              connect: { id: rescueTypeForm.rescueTypeId }
            },
            value: rescueTypeForm.value,
            unit: {
              connect: { id: rescueTypeForm.unitId }
            },
            startDate: rescueTypeForm.startDate,
            endDate: rescueTypeForm.endDate,
            source: rescueTypeForm.source
          }
        });
      }
      
      setShowAddRescueDialog(false);
      resetRescueTypeForm();
    } catch (error: any) {
      console.error("Lỗi khi xử lý thông tin cứu hộ:", error);
      toast.error({
        title: "Lỗi",
        description: `Không thể xử lý thông tin cứu hộ: ${error.message || 'Đã xảy ra lỗi'}`
      });
    }
  }, [rescueTypeForm, disasterId, updateRescueTypeMutation, createRescueTypeMutation, resetRescueTypeForm]);

  // Xử lý chỉnh sửa cứu hộ hiện có
  const editRescue = useCallback((rescueType: RescueTypeOnDisaster) => {
    setRescueTypeForm({
      id: rescueType.id,
      disasterId: disasterId,
      rescueTypeId: rescueType.rescueTypeId,
      value: rescueType.value,
      unitId: rescueType.unitId,
      startDate: rescueType.startDate ? new Date(rescueType.startDate) : undefined,
      endDate: rescueType.endDate ? new Date(rescueType.endDate) : undefined,
      source: rescueType.source || undefined
    });
    setShowAddRescueDialog(true);
  }, [disasterId]);

  // Xử lý xóa cứu hộ
  const deleteRescue = useCallback(async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thông tin cứu hộ này?')) {
      try {
        await deleteRescueTypeMutation.mutateAsync({
          where: { id }
        });
      } catch (error: any) {
        console.error("Lỗi khi xóa thông tin cứu hộ:", error);
        toast.error({
          title: "Lỗi",
          description: `Không thể xóa thông tin cứu hộ: ${error.message || 'Đã xảy ra lỗi'}`
        });
      }
    }
  }, [deleteRescueTypeMutation]);

  // Lấy danh sách cứu hộ đã sắp xếp theo thời gian
  const getSortedRescueTypes = useCallback(() => {
    if (!initialRescueTypes) return [];

    return [...initialRescueTypes].sort((a, b) => {
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
  }, [initialRescueTypes, rescueTypeStartDates]);

  return {
    rescueTypeForm,
    showAddRescueDialog,
    setShowAddRescueDialog,
    rescueTypeValues,
    rescueTypeStartDates,
    rescueTypeEndDates,
    rescueTypeUnitIds,
    resetRescueTypeForm,
    updateFormField,
    addOrUpdateRescue,
    editRescue,
    deleteRescue,
    getSortedRescueTypes,
    isLoading: 
      updateRescueTypeMutation.isPending || 
      createRescueTypeMutation.isPending || 
      deleteRescueTypeMutation.isPending
  };
}; 