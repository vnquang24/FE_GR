import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface CoordinateData {
  id: string;
  lat: number;
  lng: number;
  address: string | null;
}

interface CoordinateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coordinateData: CoordinateData;
  onCoordinateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
}

const CoordinateDialog: React.FC<CoordinateDialogProps> = ({
  open,
  onOpenChange,
  coordinateData,
  onCoordinateChange,
  onSave
}) => {
  const handleSave = () => {
    onSave();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa tọa độ</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin vị trí của thảm họa. Bạn có thể nhập tọa độ trực tiếp hoặc chọn trên bản đồ.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Vĩ độ:</Label>
              <Input
                name="lat"
                value={coordinateData.lat.toString()}
                onChange={onCoordinateChange}
                placeholder="Ví dụ: 10.762622"
                type="number"
                step="0.000001"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Kinh độ:</Label>
              <Input
                name="lng"
                value={coordinateData.lng.toString()}
                onChange={onCoordinateChange}
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
              onChange={onCoordinateChange}
              placeholder="Nhập địa chỉ"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Lưu thay đổi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CoordinateDialog; 