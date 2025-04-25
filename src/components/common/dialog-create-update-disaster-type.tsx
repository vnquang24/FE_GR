import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { useCreateDisasterType, useUpdateDisasterType } from '@/generated/hooks';

interface DisasterTypeFormData {
  id?: string;
  name: string;
  description: string | null;
}

interface DialogCreateUpdateDisasterTypeProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialData?: DisasterTypeFormData;
  mode: 'create' | 'update';
  onSuccess?: () => void;
}

const DialogCreateUpdateDisasterType: React.FC<DialogCreateUpdateDisasterTypeProps> = ({
  open,
  setOpen,
  initialData,
  mode,
  onSuccess
}) => {
  const [formData, setFormData] = useState<DisasterTypeFormData>({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (initialData && open) {
      setFormData({
        id: initialData.id,
        name: initialData.name || '',
        description: initialData.description || ''
      });
    } else if (!open) {
      setFormData({ name: '', description: '' });
    }
  }, [initialData, open]);

  const createDisasterTypeMutation = useCreateDisasterType({
    onSuccess: () => {
      handleSuccess();
    }
  });

  const updateDisasterTypeMutation = useUpdateDisasterType({
    onSuccess: () => {
      handleSuccess();
    }
  });

  const handleSuccess = () => {
    setOpen(false);
    if (onSuccess) {
      onSuccess();
    }
    toast.success({
      title: "Thành công",
      description: mode === 'create' 
        ? "Đã thêm loại thảm họa mới" 
        : "Đã cập nhật loại thảm họa"
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error({
        title: "Lỗi",
        description: "Tên loại thảm họa không được để trống"
      });
      return;
    }

    try {
      if (mode === 'create') {
        await createDisasterTypeMutation.mutateAsync({
          data: {
            name: formData.name,
            description: formData.description || undefined
          }
        });
      } else {
        if (!formData.id) return;
        
        await updateDisasterTypeMutation.mutateAsync({
          where: { id: formData.id },
          data: {
            name: formData.name,
            description: formData.description || undefined
          }
        });
      }
    } catch (error) {
      toast.error({
        title: "Lỗi",
        description: mode === 'create'
          ? "Không thể thêm loại thảm họa. Vui lòng thử lại sau."
          : "Không thể cập nhật loại thảm họa. Vui lòng thử lại sau."
      });
      console.error(`Lỗi khi ${mode === 'create' ? 'thêm' : 'cập nhật'} loại thảm họa:`, error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isPending = mode === 'create' 
    ? createDisasterTypeMutation.isPending 
    : updateDisasterTypeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {mode === 'create' ? 'Thêm Loại Thảm Họa Mới' : 'Chỉnh Sửa Loại Thảm Họa'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {mode === 'create' 
              ? 'Nhập thông tin chi tiết về loại thảm họa mới'
              : 'Cập nhật thông tin chi tiết về loại thảm họa'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right font-medium">
              Tên loại thảm họa <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="col-span-3"
              placeholder="Nhập tên loại thảm họa"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right font-medium">
              Mô tả
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              className="col-span-3"
              placeholder="Nhập mô tả chi tiết về loại thảm họa"
              rows={4}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            className={mode === 'create' 
              ? "bg-green-500 hover:bg-green-600 text-white" 
              : "bg-blue-500 hover:bg-blue-600 text-white"}
            disabled={isPending}
          >
            {isPending ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang xử lý...
              </div>
            ) : (
              <>
                <Save size={16} className="mr-1" /> 
                {mode === 'create' ? 'Lưu' : 'Cập nhật'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DialogCreateUpdateDisasterType;
