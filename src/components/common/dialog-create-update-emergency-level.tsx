import React, { useState, useEffect } from 'react';
import { useCreateEmergencyLevel, useUpdateEmergencyLevel } from '@/generated/hooks';
import { FormDialog, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { EmergencyLevelFormData } from '@/app/(main)/common/emergency-level/page';
import { Button } from '@/components/ui/button';
import { emergencyLevelFormSchema } from '@/app/(main)/common/emergency-level/page';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

interface DialogCreateUpdateEmergencyLevelProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  mode: 'create' | 'update';
  initialData?: EmergencyLevelFormData;
  onSuccess?: () => void;
}

const DialogCreateUpdateEmergencyLevel: React.FC<DialogCreateUpdateEmergencyLevelProps> = ({
  open,
  setOpen,
  mode,
  initialData,
  onSuccess
}) => {
  // State cho modal xác nhận
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  // Sử dụng react-hook-form với zodResolver để validate
  const form = useForm<EmergencyLevelFormData>({
    resolver: zodResolver(emergencyLevelFormSchema),
    defaultValues: {
      id: '',
      name: '',
      description: ''
    }
  });
  
  const { register, handleSubmit, formState: { errors }, reset, getValues, setValue } = form;

  useEffect(() => {
    if (mode === 'update' && initialData) {
      reset({
        id: initialData.id,
        name: initialData.name,
        description: initialData.description || ''
      });
    } else if (mode === 'create') {
      reset({
        id: '',
        name: '',
        description: ''
      });
    }
  }, [mode, initialData, open, reset]);

  const createEmergencyLevelMutation = useCreateEmergencyLevel();
  const updateEmergencyLevelMutation = useUpdateEmergencyLevel();

  const onSubmit = (data: EmergencyLevelFormData) => {
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const formData = getValues();
    
    try {
      if (mode === 'create') {
        await createEmergencyLevelMutation.mutateAsync({
          data: {
            name: formData.name,
            description: formData.description || undefined
          }
        });
        
        toast.success({
          title: "Thành công",
          description: "Đã thêm mức độ khẩn cấp mới"
        });
      } else {
        await updateEmergencyLevelMutation.mutateAsync({
          where: { id: formData.id },
          data: {
            name: formData.name,
            description: formData.description || undefined
          }
        });
        
        toast.success({
          title: "Thành công",
          description: "Đã cập nhật mức độ khẩn cấp"
        });
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      setIsConfirmOpen(false);
      setOpen(false);
    } catch (error) {
      toast.error({
        title: "Lỗi",
        description: mode === 'create'
          ? "Không thể thêm mức độ khẩn cấp. Vui lòng thử lại sau."
          : "Không thể cập nhật mức độ khẩn cấp. Vui lòng thử lại sau."
      });
      console.error(`Lỗi khi ${mode === 'create' ? 'thêm' : 'cập nhật'} mức độ khẩn cấp:`, error);
    }
  };

  const isLoading = createEmergencyLevelMutation.isPending || updateEmergencyLevelMutation.isPending;

  return (
    <>
      <FormDialog
        open={open}
        setOpen={setOpen}
        title={mode === 'create' ? 'Thêm mức độ khẩn cấp mới' : 'Chỉnh sửa mức độ khẩn cấp'}
        description={
          mode === 'create'
            ? 'Nhập thông tin chi tiết về mức độ khẩn cấp mới'
            : 'Cập nhật thông tin chi tiết về mức độ khẩn cấp'
        }
        onSubmit={handleSubmit(onSubmit)}
        submitText={mode === 'create' ? 'Lưu' : 'Cập nhật'}
        isLoading={isLoading}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="name" className="text-right font-medium pt-2">
                Tên mức độ khẩn cấp <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="name"
                  {...register('name')}
                  className={errors.name ? "border-red-500" : ""}
                  placeholder="Nhập tên mức độ khẩn cấp"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right font-medium">
                Mô tả
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                className="col-span-3"
                placeholder="Nhập mô tả chi tiết về mức độ khẩn cấp"
                rows={4}
              />
            </div>
          </div>
        </form>
      </FormDialog>

      {/* Dialog xác nhận */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận</DialogTitle>
            <DialogDescription>
              {mode === 'create' 
                ? 'Bạn có chắc chắn muốn thêm mức độ khẩn cấp mới không?' 
                : 'Bạn có chắc chắn muốn cập nhật mức độ khẩn cấp không?'}
            </DialogDescription>
          </DialogHeader>
          <div className="text-center">
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Hành động này không thể hoàn tác.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleConfirm}
              className={mode === 'create' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </div>
              ) : (
                mode === 'create' ? 'Thêm mới' : 'Cập nhật'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DialogCreateUpdateEmergencyLevel;

