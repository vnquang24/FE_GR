import { useState, useEffect, useCallback, useRef } from 'react';
import { useCreateDataFieldOnDisaster, useUpdateDataFieldOnDisaster, useDeleteDataFieldOnDisaster } from '@/generated/hooks';
import { toast } from '@/components/ui/toast';
import { DataField } from "@prisma/client";
import { isEqual } from 'lodash';
// Định nghĩa kiểu dữ liệu cho DataField
export type DataFieldWithOptimistic = Partial<DataField> & {
  id: string;
  name: string;
  code: string;
  unit: string;
  parentId: string;
  dataFieldGroup: string;
  $optimistic?: boolean;
}

// Định nghĩa kiểu dữ liệu cho DataField trên Disaster
export type DataFieldOnDisaster = {
  id: string;
  disasterId: string;
  dataFieldId: string;
  value: number;
  deleted?: Date | null;
  dataField?: DataFieldWithOptimistic;
}

export const useDataFields = (disasterId: string, initialDataFields: DataFieldOnDisaster[], refetch: () => void) => {
  // State cho giá trị các trường dữ liệu
  const [dataFieldValues, setDataFieldValues] = useState<{ [key: string]: number }>({});
  const [showAddDataFieldDialog, setShowAddDataFieldDialog] = useState(false);
  const [selectedDataField, setSelectedDataField] = useState<string>('');
  const [newDataFieldValue, setNewDataFieldValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('disasterData');
  
  // State cho delete confirm dialog
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [deletingDataFieldId, setDeletingDataFieldId] = useState<string>('');
  
  // Sử dụng ref để theo dõi giá trị trước đó của initialDataFields
  const prevInitialDataFieldsRef = useRef<DataFieldOnDisaster[]>([]);

  // Cập nhật state khi có dữ liệu ban đầu và chỉ khi dữ liệu thực sự thay đổi
  useEffect(() => {
    // Kiểm tra nếu initialDataFields đã thay đổi thực sự
    const fieldsChanged = !isEqual(
      initialDataFields.map(f => ({ id: f.id, value: f.value })),
      prevInitialDataFieldsRef.current.map(f => ({ id: f.id, value: f.value }))
    );

    if (initialDataFields && fieldsChanged) {
      const values: { [key: string]: number } = {};
      initialDataFields.forEach(field => {
        values[field.id] = field.value;
      });
      
      // Kiểm tra xem giá trị mới có khác với giá trị hiện tại không
      if (!isEqual(values, dataFieldValues)) {
        setDataFieldValues(values);
      }
      
      // Cập nhật ref
      prevInitialDataFieldsRef.current = initialDataFields;
    }
  }, [initialDataFields]);

  // Mutation để thêm trường dữ liệu
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

  // Mutation để cập nhật trường dữ liệu
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

  // Mutation để xóa trường dữ liệu
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

  // Xử lý thay đổi giá trị trường dữ liệu
  const handleDataFieldValueChange = useCallback((id: string, value: string) => {
    setDataFieldValues(prev => {
      const newValue = parseFloat(value) || 0;
      // Nếu giá trị không thay đổi, trả về state cũ để tránh render lại
      if (prev[id] === newValue) return prev;
      return {
        ...prev,
        [id]: newValue
      };
    });
  }, []);

  // Thêm trường dữ liệu mới
  const addDataField = useCallback(async () => {
    if (!selectedDataField || !newDataFieldValue) {
      toast.error({
        title: "Lỗi",
        description: "Vui lòng chọn trường dữ liệu và nhập giá trị"
      });
      return;
    }

    try {
      await createDataFieldMutation.mutateAsync({
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
    } catch (error) {
      console.error("Lỗi khi thêm trường dữ liệu:", error);
    }
  }, [selectedDataField, newDataFieldValue, disasterId, createDataFieldMutation]);

  // Cập nhật trường dữ liệu
  const updateDataField = useCallback(async (id: string, value: number) => {
    try {
      await updateDataFieldMutation.mutateAsync({
        where: { id },
        data: { value }
      });
    } catch (error) {
      console.error("Lỗi khi cập nhật trường dữ liệu:", error);
    }
  }, [updateDataFieldMutation]);

  // Xóa trường dữ liệu
  const deleteDataField = useCallback(async (id: string) => {
    setDeletingDataFieldId(id);
    setShowDeleteConfirmDialog(true);
  }, []);

  // Xác nhận xóa trường dữ liệu
  const confirmDeleteDataField = useCallback(async () => {
    if (!deletingDataFieldId) return;

    try {
      await deleteDataFieldMutation.mutateAsync({
        where: { id: deletingDataFieldId }
      });
      
      // Cập nhật UI ngay lập tức
      setDataFieldValues(prev => {
        const newValues = { ...prev };
        delete newValues[deletingDataFieldId];
        return newValues;
      });
      
      // Đóng dialog
      setShowDeleteConfirmDialog(false);
      setDeletingDataFieldId('');
      
    } catch (error: any) {
      console.error("Lỗi khi xóa trường dữ liệu:", error);
      toast.error({
        title: "Lỗi",
        description: `Không thể xóa trường dữ liệu: ${error.message || 'Đã xảy ra lỗi'}`
      });
    }
  }, [deletingDataFieldId, deleteDataFieldMutation, setDataFieldValues]);

  // Lưu các thay đổi của tất cả trường dữ liệu
  const saveAllDataFieldChanges = useCallback(async () => {
    if (!initialDataFields || initialDataFields.length === 0) return true;

    try {
      const updatePromises = initialDataFields
        .filter(field => !field.deleted)
        .map(field => {
          // Chỉ cập nhật các trường có thay đổi giá trị
          if (dataFieldValues[field.id] !== undefined && dataFieldValues[field.id] !== field.value) {
            return updateDataFieldMutation.mutateAsync({
              where: { id: field.id },
              data: { value: dataFieldValues[field.id] }
            });
          }
          return Promise.resolve();
        });

      await Promise.all(updatePromises);
      return true;
    } catch (error: any) {
      console.error("Lỗi khi cập nhật trường dữ liệu:", error);
      toast.error({
        title: "Lỗi",
        description: `Không thể cập nhật trường dữ liệu: ${error.message || 'Đã xảy ra lỗi'}`
      });
      return false;
    }
  }, [initialDataFields, dataFieldValues, updateDataFieldMutation]);

  // Lấy tên phân cấp của trường dữ liệu - không phụ thuộc vào các state nội bộ
  const getDataFieldHierarchyName = useCallback((
    dataFieldId: string,
    availableDataFields: DataFieldWithOptimistic[]
  ) => {
    if (!availableDataFields || !dataFieldId) return { name: "", hierarchyPath: [] };

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
  }, []);

  return {
    dataFieldValues,
    setDataFieldValues,
    showAddDataFieldDialog,
    setShowAddDataFieldDialog,
    selectedDataField,
    setSelectedDataField,
    newDataFieldValue,
    setNewDataFieldValue,
    activeTab,
    setActiveTab,
    handleDataFieldValueChange,
    addDataField,
    updateDataField,
    deleteDataField,
    saveAllDataFieldChanges,
    getDataFieldHierarchyName,
    isLoading: createDataFieldMutation.isPending || updateDataFieldMutation.isPending,
    showDeleteConfirmDialog,
    setShowDeleteConfirmDialog,
    deletingDataFieldId,
    setDeletingDataFieldId,
    confirmDeleteDataField
  };
}; 