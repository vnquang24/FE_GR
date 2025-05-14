import React, { useEffect, useState } from 'react';
import { FormDialog, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from '@/components/ui/form';
import { useCreateRescueType, useUpdateRescueType } from '@/generated/hooks';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { z } from 'zod';

const rescueTypeSchema = z.object({
    id: z.string(),
    name: z.string().min(1, { message: 'Tên phương thức cứu hộ không được để trống' }),
    description: z.string().optional(),
    unit: z.string().optional(),
  });
  
type RescueTypeFormValues = z.infer<typeof rescueTypeSchema>;

interface DialogCreateUpdateRescueResourceTypeProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    initialData?: RescueTypeFormValues;
    onSuccess?: () => void;
    mode: 'create' | 'update';
}

const DialogCreateUpdateRescueResourceType: React.FC<DialogCreateUpdateRescueResourceTypeProps> = ({
    open,
    setOpen,
    initialData = { id: '', name: '', description: '' },
    onSuccess,
    mode
}) => {
    // State cho modal xác nhận
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    
    const form = useForm<RescueTypeFormValues>({
        resolver: zodResolver(rescueTypeSchema),
        defaultValues: {
            id: '',
            name: '',
            description: '',
        },
    });
    
    const { register, handleSubmit, formState: { errors }, reset, getValues } = form;

    // Reset form khi initialData thay đổi hoặc dialog mở
    useEffect(() => {
        if (open) {
            if (mode === 'update' && initialData) {
                reset({
                    id: initialData.id || '',
                    name: initialData.name || '',
                    description: initialData.description || '',
                });
            } else if (mode === 'create') {
                reset({
                    id: '',
                    name: '',
                    description: '',
                });
            }
        }
    }, [initialData?.id, open, mode, reset]);

    // Khởi tạo mutation hooks
    const createRescueTypeMutation = useCreateRescueType();
    const updateRescueTypeMutation = useUpdateRescueType();

    const onSubmit = () => {
        setIsConfirmOpen(true);
    };

    const handleConfirm = async () => {
        const formData = getValues();
        
        try {
            if (mode === 'create') {
                await createRescueTypeMutation.mutateAsync({
                    data: {
                        name: formData.name,
                        description: formData.description || undefined,
                    }
                });
                
                toast.success({
                    title: "Thành công",
                    description: "Đã thêm phương thức cứu hộ mới"
                });
            } else if (mode === 'update' && initialData?.id) {
                await updateRescueTypeMutation.mutateAsync({
                    where: { id: initialData.id },
                    data: {
                        name: formData.name,
                        description: formData.description || undefined,
                    }
                });
                
                toast.success({
                    title: "Thành công",
                    description: "Đã cập nhật phương thức cứu hộ"
                });
            }
            
            if (onSuccess) {
                onSuccess();
            }
            
            setIsConfirmOpen(false);
            setOpen(false);
            
            if (mode === 'create') {
                reset({ id: '', name: '', description: '' });
            }
        } catch (error) {
            toast.error({
                title: "Lỗi",
                description: mode === 'create'
                    ? "Không thể thêm phương thức cứu hộ. Vui lòng thử lại sau."
                    : "Không thể cập nhật phương thức cứu hộ. Vui lòng thử lại sau."
            });
            console.error(`Lỗi khi ${mode === 'create' ? 'thêm' : 'cập nhật'} phương thức cứu hộ:`, error);
        }
    };

    const isLoading = createRescueTypeMutation.isPending || updateRescueTypeMutation.isPending;

    const title = mode === 'create' 
        ? 'Thêm phương thức cứu hộ mới' 
        : 'Chỉnh sửa phương thức cứu hộ';
    
    const description = mode === 'create'
        ? 'Nhập thông tin chi tiết về phương thức cứu hộ mới'
        : 'Cập nhật thông tin chi tiết về phương thức cứu hộ';

    const submitText = mode === 'create' ? 'Tiếp tục' : 'Tiếp tục';

    return (
        <>
            <FormDialog
                open={open}
                setOpen={setOpen}
                title={title}
                description={description}
                onSubmit={handleSubmit(onSubmit)}
                submitText={submitText}
                isLoading={isLoading}
            >
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="name" className="text-right font-medium pt-2">
                                    Tên phương thức cứu hộ <span className="text-red-500">*</span>
                                </Label>
                                <div className="col-span-3 space-y-1">
                                    <Input
                                        id="name"
                                        {...register('name')}
                                        className={errors.name ? "border-red-500" : ""}
                                        placeholder="Nhập tên phương thức cứu hộ"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name.message}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="description" className="text-right font-medium pt-2">
                                    Mô tả
                                </Label>
                                <div className="col-span-3">
                                    <Textarea
                                        id="description"
                                        {...register('description')}
                                        className="col-span-3"
                                        placeholder="Nhập mô tả chi tiết về phương thức cứu hộ"
                                        rows={4}
                                    />
                                </div>
                            </div>
                            
                        </div>
                    </form>
                </Form>
            </FormDialog>

            {/* Dialog xác nhận */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Xác nhận</DialogTitle>
                        <DialogDescription>
                            {mode === 'create' 
                                ? 'Bạn có chắc chắn muốn thêm phương thức cứu hộ mới không?' 
                                : 'Bạn có chắc chắn muốn cập nhật phương thức cứu hộ không?'}
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

export default DialogCreateUpdateRescueResourceType;