import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Cross2Icon } from '@radix-ui/react-icons'

import { cn } from '@/lib/utils'

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            className
        )}
        {...props}
    />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
    <DialogPortal>
        {/* <DialogOverlay /> */}
        <div
            className={cn(
                'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
            )}
        />
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
                className
            )}
            {...props}
        >
            {children}
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <Cross2Icon className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            'flex flex-col space-y-1.5 text-center sm:text-left',
            className
        )}
        {...props}
    />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
            className
        )}
        {...props}
    />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn(
            'text-lg text-primary font-semibold leading-none tracking-tight',
            className
        )}
        {...props}
    />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
    />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

const DialogWrapper = ({ 
    children,
    open,
    setOpen,
    title,
    description,
    className,
    showClose = true,
    footer
}: { 
    children: React.ReactNode,
    open: boolean,
    setOpen: (open: boolean) => void,
    title?: string,
    description?: string,
    className?: string,
    showClose?: boolean,
    footer?: React.ReactNode
}) => {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className={cn("", className)}>
                {title && (
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        {description && <DialogDescription>{description}</DialogDescription>}
                    </DialogHeader>
                )}
                <div className="py-4">
                    {children}
                </div>
                {footer && (
                    <DialogFooter>
                        {footer}
                    </DialogFooter>
                )}
                {!showClose && (
                    <div className="absolute right-4 top-4 opacity-0 pointer-events-none">
                        <Cross2Icon className="h-4 w-4" />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

const ConfirmDialog = ({
    open,
    setOpen,
    title = "Xác nhận",
    description = "Bạn có chắc chắn muốn thực hiện hành động này?",
    onConfirm,
    onCancel,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    confirmButtonProps = { variant: "destructive" as const },
    cancelButtonProps = {},
    isLoading = false
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    title?: string;
    description?: string;
    onConfirm: () => void | Promise<void>;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmButtonProps?: any;
    cancelButtonProps?: any;
    isLoading?: boolean;
}) => {
    return (
        <DialogWrapper
            open={open}
            setOpen={setOpen}
            title={title}
            description={description}
            footer={
                <div className="flex justify-end gap-2 w-full">
                    <DialogClose asChild>
                        <button
                            onClick={() => {
                                if (onCancel) onCancel();
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            {...cancelButtonProps}
                        >
                            {cancelText}
                        </button>
                    </DialogClose>
                    <button
                        onClick={onConfirm}
                        className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        disabled={isLoading}
                        {...confirmButtonProps}
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
                            confirmText
                        )}
                    </button>
                </div>
            }
        >
            <div className="text-center">
                <div className="mt-2">
                    <p className="text-sm text-gray-500">
                        Hành động này không thể hoàn tác.
                    </p>
                </div>
            </div>
        </DialogWrapper>
    );
};

const FormDialog = ({
    open,
    setOpen,
    title,
    description,
    children,
    onSubmit,
    submitText = "Lưu",
    cancelText = "Hủy",
    isLoading = false
}: {
    open: boolean;
    setOpen: (open: boolean) => void;
    title: string;
    description?: string;
    children: React.ReactNode;
    onSubmit: () => void | Promise<void>;
    submitText?: string;
    cancelText?: string;
    isLoading?: boolean;
}) => {
    return (
        <DialogWrapper
            open={open}
            setOpen={setOpen}
            title={title}
            description={description}
            footer={
                <div className="flex justify-end gap-2 w-full">
                    <DialogClose asChild>
                        <button
                            type="button"
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {cancelText}
                        </button>
                    </DialogClose>
                    <button
                        onClick={onSubmit}
                        className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                            submitText
                        )}
                    </button>
                </div>
            }
        >
            {children}
        </DialogWrapper>
    );
};

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogTrigger,
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    DialogWrapper,
    ConfirmDialog,
    FormDialog
}
