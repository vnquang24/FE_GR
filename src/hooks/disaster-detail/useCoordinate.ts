import { useState, useEffect, useCallback, useRef } from 'react';
import { useUpdateCoordinate } from '@/generated/hooks';
import { toast } from '@/components/ui/toast';

export type CoordinateData = {
  id: string;
  lat: number;
  lng: number;
  address: string | null;
};

export const useCoordinate = (initialCoordinate: CoordinateData | null, refetch: () => void) => {
  // State cho dữ liệu tọa độ
  const [coordinateData, setCoordinateData] = useState<CoordinateData>({
    id: '',
    lat: 0,
    lng: 0,
    address: null
  });
  
  // State cho dialog chỉnh sửa tọa độ
  const [isCoordinateModalOpen, setIsCoordinateModalOpen] = useState(false);
  
  // Sử dụng ref để theo dõi giá trị trước đó của initialCoordinate
  const prevInitialCoordinateRef = useRef<CoordinateData | null>(null);

  // Cập nhật state khi có dữ liệu ban đầu và chỉ khi dữ liệu thực sự thay đổi
  useEffect(() => {
    // Nếu không có dữ liệu ban đầu hoặc không có sự thay đổi, không làm gì cả
    if (!initialCoordinate) return;
    
    // Kiểm tra nếu initialCoordinate đã thay đổi thực sự
    const hasChanged = hasCoordinateChanged(initialCoordinate, prevInitialCoordinateRef.current);
    
    if (hasChanged) {
      setCoordinateData({
        id: initialCoordinate.id,
        lat: initialCoordinate.lat,
        lng: initialCoordinate.lng,
        address: initialCoordinate.address
      });
      
      // Cập nhật ref
      prevInitialCoordinateRef.current = initialCoordinate;
    }
  }, [initialCoordinate]);
  
  // Hàm kiểm tra nếu tọa độ đã thay đổi
  const hasCoordinateChanged = (
    newCoord: CoordinateData | null, 
    oldCoord: CoordinateData | null
  ): boolean => {
    // Nếu một trong hai là null nhưng không phải cả hai
    if ((!newCoord && oldCoord) || (newCoord && !oldCoord)) return true;
    
    // Nếu cả hai đều null
    if (!newCoord && !oldCoord) return false;
    
    // Khi này chắc chắn cả hai đều không null
    return (
      newCoord!.id !== oldCoord!.id ||
      newCoord!.lat !== oldCoord!.lat ||
      newCoord!.lng !== oldCoord!.lng ||
      newCoord!.address !== oldCoord!.address
    );
  };

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

  // Xử lý thay đổi input
  const handleCoordinateChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCoordinateData(prev => {
      // Copy dữ liệu cũ
      const updated = { ...prev };
      
      // Xử lý khác nhau dựa vào tên trường
      if (name === 'address') {
        // Nếu giá trị không thay đổi, trả về state cũ để tránh render lại
        if (prev.address === value) return prev;
        updated.address = value;
      } else if (name === 'lat' || name === 'lng') {
        const numValue = parseFloat(value) || 0;
        // Nếu giá trị không thay đổi, trả về state cũ để tránh render lại
        if (prev[name] === numValue) return prev;
        updated[name] = numValue;
      }
      
      return updated;
    });
  }, []);

  // Xử lý lưu thay đổi tọa độ
  const saveCoordinateChanges = useCallback(async () => {
    try {
      if (!coordinateData.id) {
        toast.error({
          title: "Lỗi",
          description: "Không tìm thấy ID tọa độ"
        });
        return;
      }

      await updateCoordinateMutation.mutateAsync({
        where: { id: coordinateData.id },
        data: {
          lat: coordinateData.lat,
          lng: coordinateData.lng,
          address: coordinateData.address
        }
      });
    } catch (error: any) {
      console.error("Lỗi khi cập nhật tọa độ:", error);
      toast.error({
        title: "Lỗi",
        description: `Không thể cập nhật tọa độ: ${error.message || 'Đã xảy ra lỗi'}`
      });
    }
  }, [coordinateData, updateCoordinateMutation]);

  // Xử lý thay đổi vị trí trên bản đồ (nếu có)
  const handleMapPositionChange = useCallback((lat: number, lng: number) => {
    setCoordinateData(prev => {
      // Nếu giá trị không thay đổi, trả về state cũ để tránh render lại
      if (prev.lat === lat && prev.lng === lng) return prev;
      
      return {
        ...prev,
        lat,
        lng
      };
    });
  }, []);

  return {
    coordinateData,
    setCoordinateData,
    isCoordinateModalOpen,
    setIsCoordinateModalOpen,
    handleCoordinateChange,
    saveCoordinateChanges,
    handleMapPositionChange,
    isLoading: updateCoordinateMutation.isPending
  };
}; 