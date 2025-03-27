import React from 'react';
import { ToastContainer as ToastifyContainer, toast as toastify, Zoom, ToastOptions, Theme } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

// Các vị trí có thể có của toast
export type ToastPosition = 
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

// Các loại toast
export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'default';

// Props cho toast
export interface ToastProps extends Omit<ToastOptions, 'type'> {
  title?: string;
  description?: string;
  type?: ToastType;
  variant?: 'default' | 'destructive'; // Thêm thuộc tính variant
}

// Component Toast container chính
export const Toast: React.FC<{ 
  position?: ToastPosition; 
  className?: string;
  theme?: Theme;
  toastOptions?: ToastOptions;
}> = ({ 
  position = 'top-center',
  className,
  theme = 'light',
  toastOptions
}) => {
  return (
    <ToastifyContainer
      position={position}
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick={true}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme}
      transition={Zoom}
      className={cn('toast-container', className)}
      {...toastOptions}
    />
  );
};

// Hook để sử dụng toast từ bất kỳ component nào
export const useToast = () => {
  const success = (content: string | ToastProps) => {
    if (typeof content === 'string') {
      toastify.success(content);
    } else {
      const { title, description, ...rest } = content;
      toastify.success(
        <div>
          {title && <h3 className="font-medium">{title}</h3>}
          {description && <p className="text-sm opacity-90">{description}</p>}
        </div>,
        { icon: <CheckCircle className="h-5 w-5" />, ...rest }
      );
    }
  };

  const error = (content: string | ToastProps) => {
    if (typeof content === 'string') {
      toastify.error(content);
    } else {
      const { title, description, ...rest } = content;
      toastify.error(
        <div>
          {title && <h3 className="font-medium">{title}</h3>}
          {description && <p className="text-sm opacity-90">{description}</p>}
        </div>,
        { icon: <XCircle className="h-5 w-5" />, ...rest }
      );
    }
  };

  const info = (content: string | ToastProps) => {
    if (typeof content === 'string') {
      toastify.info(content);
    } else {
      const { title, description, ...rest } = content;
      toastify.info(
        <div>
          {title && <h3 className="font-medium">{title}</h3>}
          {description && <p className="text-sm opacity-90">{description}</p>}
        </div>,
        { icon: <Info className="h-5 w-5" />, ...rest }
      );
    }
  };

  const warning = (content: string | ToastProps) => {
    if (typeof content === 'string') {
      toastify.warning(content);
    } else {
      const { title, description, ...rest } = content;
      toastify.warning(
        <div>
          {title && <h3 className="font-medium">{title}</h3>}
          {description && <p className="text-sm opacity-90">{description}</p>}
        </div>,
        { icon: <AlertCircle className="h-5 w-5" />, ...rest }
      );
    }
  };

  const showToast = (content: string | ToastProps) => {
    if (typeof content === 'string') {
      toastify(content);
    } else {
      const { title, description, type, variant, ...rest } = content;
      
      // Xác định style dựa trên variant
      const toastStyle = variant === 'destructive' ? 
        { style: { background: '#f44336', color: 'white' } } : {};
      
      const toastContent = (
        <div>
          {title && <h3 className="font-medium">{title}</h3>}
          {description && <p className="text-sm opacity-90">{description}</p>}
        </div>
      );
      
      switch (type) {
        case 'success':
          toastify.success(toastContent, { icon: <CheckCircle className="h-5 w-5" />, ...toastStyle, ...rest });
          break;
        case 'error':
          toastify.error(toastContent, { icon: <XCircle className="h-5 w-5" />, ...toastStyle, ...rest });
          break;
        case 'info':
          toastify.info(toastContent, { icon: <Info className="h-5 w-5" />, ...toastStyle, ...rest });
          break;
        case 'warning':
          toastify.warning(toastContent, { icon: <AlertCircle className="h-5 w-5" />, ...toastStyle, ...rest });
          break;
        default:
          toastify(toastContent, { ...toastStyle, ...rest });
      }
    }
  };
  
  // Truy cập trực tiếp vào API của react-toastify nếu cần thêm chức năng
  const toastApi = toastify;

  return {
    success,
    error,
    info,
    warning,
    toast: showToast,
    toastApi,
  };
};

// Export convenience functions
export const toast = {
  success: (content: string | ToastProps) => useToast().success(content),
  error: (content: string | ToastProps) => useToast().error(content),
  info: (content: string | ToastProps) => useToast().info(content),
  warning: (content: string | ToastProps) => useToast().warning(content),
  show: (content: string | ToastProps) => useToast().toast(content),
  dismiss: toastify.dismiss,
  isActive: toastify.isActive,
  update: toastify.update,
};