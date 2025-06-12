import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2, AlertTriangle, Save, Info, CheckCircle } from 'lucide-react';

type ConfirmDialogType = 'delete' | 'confirm' | 'edit' | 'warning' | 'info';

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string | React.ReactNode;
    onConfirm: () => void;
    onCancel?: () => void;
    type?: ConfirmDialogType;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    onCancel,
    type = 'confirm',
    confirmText,
    cancelText,
    isLoading = false
}) => {
    // Preset configurations cho từng loại dialog
    const getPresetConfig = (dialogType: ConfirmDialogType) => {
        switch (dialogType) {
            case 'delete':
                return {
                    confirmVariant: 'destructive' as const,
                    cancelVariant: 'outline' as const,
                    defaultConfirmText: 'Xóa',
                    defaultCancelText: 'Hủy',
                    loadingText: 'Đang xóa...',
                    icon: Trash2,
                    iconColor: 'text-red-500',
                    borderColor: 'border-t-red-500',
                    headerBg: 'bg-gradient-to-r from-red-50 to-rose-50',
                    titleColor: 'text-red-900',
                    confirmButtonClass: 'bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700'
                };
            case 'warning':
                return {
                    confirmVariant: 'destructive' as const,
                    cancelVariant: 'outline' as const,
                    defaultConfirmText: 'Tiếp tục',
                    defaultCancelText: 'Hủy',
                    loadingText: 'Đang xử lý...',
                    icon: AlertTriangle,
                    iconColor: 'text-orange-500',
                    borderColor: 'border-t-orange-500',
                    headerBg: 'bg-gradient-to-r from-orange-50 to-amber-50',
                    titleColor: 'text-orange-900',
                    confirmButtonClass: 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600 hover:border-orange-700'
                };
            case 'edit':
                return {
                    confirmVariant: 'default' as const,
                    cancelVariant: 'outline' as const,
                    defaultConfirmText: 'Lưu thay đổi',
                    defaultCancelText: 'Hủy',
                    loadingText: 'Đang lưu...',
                    icon: Save,
                    iconColor: 'text-blue-500',
                    borderColor: 'border-t-blue-500',
                    headerBg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
                    titleColor: 'text-blue-900',
                    confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700'
                };
            case 'info':
                return {
                    confirmVariant: 'default' as const,
                    cancelVariant: 'outline' as const,
                    defaultConfirmText: 'Đã hiểu',
                    defaultCancelText: 'Đóng',
                    loadingText: 'Đang xử lý...',
                    icon: Info,
                    iconColor: 'text-cyan-500',
                    borderColor: 'border-t-cyan-500',
                    headerBg: 'bg-gradient-to-r from-cyan-50 to-sky-50',
                    titleColor: 'text-cyan-900',
                    confirmButtonClass: 'bg-cyan-600 hover:bg-cyan-700 text-white border-cyan-600 hover:border-cyan-700'
                };
            default: // 'confirm'
                return {
                    confirmVariant: 'default' as const,
                    cancelVariant: 'outline' as const,
                    defaultConfirmText: 'Xác nhận',
                    defaultCancelText: 'Hủy',
                    loadingText: 'Đang xử lý...',
                    icon: CheckCircle,
                    iconColor: 'text-green-500',
                    borderColor: 'border-t-green-500',
                    headerBg: 'bg-gradient-to-r from-green-50 to-emerald-50',
                    titleColor: 'text-green-900',
                    confirmButtonClass: 'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700'
                };
        }
    };

    const config = getPresetConfig(type);
    const IconComponent = config.icon;

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            onOpenChange(false);
        }
    };

    const handleConfirm = () => {
        onConfirm();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`sm:max-w-[425px] bg-white border-t-4 ${config.borderColor} shadow-lg`}>
                <DialogHeader className={`${config.headerBg}-m-6 p-6 rounded-t-lg`}>
                    <div className="flex items-center space-x-3">
                        <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
                        <DialogTitle className={`text-lg font-semibold ${config.titleColor}`}>
                            {title}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="mt-2 text-gray-600">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant={config.cancelVariant}
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="mr-2"
                    >
                        {cancelText || config.defaultCancelText}
                    </Button>
                    <Button
                        variant={config.confirmVariant}
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className={config.confirmButtonClass}
                    >
                        {isLoading ? config.loadingText : (confirmText || config.defaultConfirmText)}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConfirmDialog;