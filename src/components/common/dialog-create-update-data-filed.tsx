import React, { useEffect, useState } from 'react';
import { FormDialog, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, ConfirmDialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateDataField, useUpdateDataField, useFindManyDataField } from '@/generated/hooks';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, Loader2 } from 'lucide-react';

// Định nghĩa schema validation
export const dataFieldSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, { message: 'Tên trường dữ liệu không được để trống' }),
  description: z.string().optional().nullable(),
  unit: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  parentId: z.string().optional(),
  dataFieldGroup: z.string().default("common")
});

export type DataFieldFormValues = z.infer<typeof dataFieldSchema>;

interface DialogCreateUpdateDataFieldProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialData?: Partial<DataFieldFormValues>;
  onSuccess?: () => void;
  mode: 'create' | 'update';
  parentId?: string;
}

const DialogCreateUpdateDataField: React.FC<DialogCreateUpdateDataFieldProps> = ({
  open,
  setOpen,
  initialData = { id: '', name: '', description: '', unit: '', code: '', parentId: '', dataFieldGroup: 'common' },
  onSuccess,
  mode,
  parentId
}) => {
  // State cho modal xác nhận
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [formInitialized, setFormInitialized] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  
  // Fetch all data fields for parent selection
  const { data: allDataFields, isLoading: isLoadingDataFields } = useFindManyDataField({
    select: {
      id: true,
      name: true,
      code: true,
      parentId: true
    },
    where: {
      dataFieldGroup: "common",
    },
  });
  
  const defaultValues = {
    id: initialData?.id || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    unit: initialData?.unit || '',
    code: initialData?.code || '',
    parentId: initialData?.parentId || parentId || 'root',
    dataFieldGroup: initialData?.dataFieldGroup || 'common'
  };
  
  const form = useForm<DataFieldFormValues>({
    resolver: zodResolver(dataFieldSchema),
    defaultValues
  });
  
  // Reset form chỉ khi dialog mở hoặc đóng, không reset liên tục
  useEffect(() => {
    if (open && !formInitialized) {
      // Chỉ khởi tạo form một lần khi dialog mở
      const values = mode === 'update' && initialData?.id 
        ? {
            id: initialData.id || '',
            name: initialData.name || '',
            description: initialData.description || '',
            unit: initialData.unit || '',
            code: initialData.code || '',
            parentId: initialData.parentId || parentId || 'root',
            dataFieldGroup: initialData.dataFieldGroup || 'common'
          }
        : {
            id: '',
            name: '',
            description: '',
            unit: '',
            code: '',
            parentId: parentId || 'root',
            dataFieldGroup: 'common'
          };
      
      form.reset(values);
      setFormInitialized(true);
      
      // Mở rộng đường dẫn đến node cha đã chọn nếu có
      if (values.parentId && values.parentId !== 'root') {
        expandPathToNode(values.parentId);
      }
    } else if (!open) {
      setFormInitialized(false);
    }
  }, [open, initialData?.id, mode, parentId, form]);

  // Hàm mở rộng đường dẫn đến node
  const expandPathToNode = (nodeId: string) => {
    // Tìm tất cả các node cha từ node hiện tại lên đến gốc
    const parentPath: string[] = [];
    let currentNodeId = nodeId;
    
    // Tìm node cha trực tiếp
    const findParent = (id: string): string | null => {
      const node = allDataFields?.find(n => n.id === id);
      return node?.parentId || null;
    };
    
    // Xây dựng đường dẫn từ dưới lên trên
    while (currentNodeId) {
      const parentId = findParent(currentNodeId);
      if (parentId) {
        parentPath.push(parentId);
        currentNodeId = parentId;
      } else {
        break;
      }
    }
    
    // Cập nhật state để mở rộng tất cả các node cha
    setExpandedNodes(prev => {
      const newExpanded = [...prev];
      parentPath.forEach(id => {
        if (!newExpanded.includes(id)) {
          newExpanded.push(id);
        }
      });
      return newExpanded;
    });
  };

  // Khởi tạo mutation hooks
  const createDataFieldMutation = useCreateDataField();
  const updateDataFieldMutation = useUpdateDataField();

  const onSubmit = (values: DataFieldFormValues) => {
    setIsConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const formData = form.getValues();
    const parentIdValue = formData.parentId === "root" ? "" : formData.parentId || "";
    
    try {
      if (mode === 'create') {
        await createDataFieldMutation.mutateAsync({
          data: {
            name: formData.name,
            description: formData.description || '',
            unit: formData.unit || '',
            code: formData.code || '',
            parentId: parentIdValue,
            dataFieldGroup: formData.dataFieldGroup
          }
        });
        
        toast.success({
          title: "Thành công",
          description: "Đã thêm trường dữ liệu mới"
        });
      } else if (mode === 'update' && initialData?.id) {
        await updateDataFieldMutation.mutateAsync({
          where: { id: initialData.id },
          data: {
            name: formData.name,
            description: formData.description || '',
            unit: formData.unit || '',
            code: formData.code || '',
            parentId: parentIdValue,
            dataFieldGroup: formData.dataFieldGroup
          }
        });
        
        toast.success({
          title: "Thành công",
          description: "Đã cập nhật trường dữ liệu"
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
          ? "Không thể thêm trường dữ liệu. Vui lòng thử lại sau."
          : "Không thể cập nhật trường dữ liệu. Vui lòng thử lại sau."
      });
      console.error(`Lỗi khi ${mode === 'create' ? 'thêm' : 'cập nhật'} trường dữ liệu:`, error);
    }
  };

  const isLoading = createDataFieldMutation.isPending || updateDataFieldMutation.isPending || isLoadingDataFields;

  // Lọc ra danh sách node cha hợp lệ (không bao gồm chính node hiện tại để tránh tạo vòng lặp)
  const validParentOptions = allDataFields?.filter(field => field.id !== initialData?.id) || [];

  // Tạo cấu trúc cây để hiển thị node cha theo thứ tự phân cấp
  const getParentName = (id: string) => {
    const parent = allDataFields?.find(field => field.id === id);
    return parent ? parent.name : '';
  };

  // Sắp xếp và phân nhóm các node để hiển thị với thứ tự phân cấp
  const rootNodes = validParentOptions.filter(node => !node.parentId);
  
  // Tạo cấu trúc cây hoàn chỉnh
  const getChildNodes = (parentId: string) => {
    return validParentOptions.filter(node => node.parentId === parentId);
  };

  // Toggle mở rộng/thu gọn một node
  const toggleNodeExpansion = (nodeId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setExpandedNodes(prev => 
      prev.includes(nodeId)
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
    );
  };

  // Render các SelectItem theo cấu trúc cây
  const renderTreeSelectItems = () => {
    const renderNode = (node: any, level = 0) => {
      const children = getChildNodes(node.id);
      const hasNodeChildren = children.length > 0;
      const isExpanded = expandedNodes.includes(node.id);
      const padding = level * 12; // Tăng mức thụt đầu dòng theo cấp độ
      
      return (
        <React.Fragment key={node.id}>
          <div className="flex items-center w-full hover:bg-blue-50 relative">
            <SelectItem 
              value={node.id}
              className="flex-1 bg-white hover:bg-transparent"
              style={{ paddingLeft: `${16 + padding}px`, paddingRight: hasNodeChildren ? "2.5rem" : "1rem" }}
            >
              {node.name} {node.code ? `(${node.code})` : ''}
            </SelectItem>
            
            {hasNodeChildren && (
              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleNodeExpansion(node.id, e);
                  return false;
                }}
                className="absolute right-8 top-1/2 transform -translate-y-1/2 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full cursor-pointer z-10"
              >
                {isExpanded ? '−' : '+'}
              </div>
            )}
          </div>
          
          {hasNodeChildren && isExpanded && (
            <div className="node-children">
              {children.map(child => renderNode(child, level + 1))}
            </div>
          )}
        </React.Fragment>
      );
    };
    
    return (
      <>
        <SelectItem 
          value="root" 
          className="bg-white hover:bg-blue-50 font-semibold border-b pb-1 mb-1"
        >
          Không có node cha (Node gốc)
        </SelectItem>
        
        {rootNodes.length > 0 && (
          <div className="px-2 py-1 text-xs text-gray-500 font-semibold">Node cấp 1</div>
        )}
        
        {rootNodes.map(node => renderNode(node))}
      </>
    );
  };

  const title = mode === 'create' 
    ? 'Thêm trường dữ liệu mới' 
    : 'Chỉnh sửa trường dữ liệu';
  
  const description = mode === 'create'
    ? (parentId 
      ? 'Nhập thông tin chi tiết về trường dữ liệu con mới' 
      : 'Nhập thông tin chi tiết về trường dữ liệu mới')
    : 'Cập nhật thông tin chi tiết về trường dữ liệu';

  return (
    <>
      <FormDialog
        open={open}
        setOpen={setOpen}
        title={title}
        description={description}
        onSubmit={form.handleSubmit(onSubmit)}
        submitText="Tiếp tục"
        isLoading={isLoading}
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right font-medium">
                      Tên trường dữ liệu <span className="text-red-500">*</span>
                    </FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input
                          placeholder="Nhập tên trường dữ liệu"
                          {...field}
                          value={field.value || ''}
                          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right font-medium">
                      Mã
                    </FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input
                          placeholder="Nhập mã trường dữ liệu"
                          {...field}
                          value={field.value || ''}
                          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-start gap-4">
                    <FormLabel className="text-right font-medium pt-2">
                      Mô tả
                    </FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Textarea
                          placeholder="Nhập mô tả chi tiết về trường dữ liệu"
                          {...field}
                          value={field.value || ''}
                          className="bg-white min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right font-medium">
                      Đơn vị
                    </FormLabel>
                    <div className="col-span-3">
                      <FormControl>
                        <Input
                          placeholder="Nhập đơn vị"
                          {...field}
                          value={field.value || ''}
                          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem className="grid grid-cols-4 items-center gap-4">
                    <FormLabel className="text-right font-medium">
                      Node cha
                    </FormLabel>
                    <div className="col-span-3">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!!parentId && mode === 'create'}
                      >
                        <FormControl>
                          <SelectTrigger className={`bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${parentId && mode === 'create' ? 'bg-gray-100' : ''}`}>
                            <SelectValue placeholder="Chọn node cha" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white max-h-[300px] overflow-y-auto">
                          {renderTreeSelectItems()}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500" />
                    </div>
                  </FormItem>
                )}
              />

              <input type="hidden" {...form.register('dataFieldGroup')} />
            </div>
          </form>
        </Form>
      </FormDialog>

      {/* Thay thế Dialog xác nhận bằng ConfirmDialog */}
      <ConfirmDialog
        open={isConfirmOpen}
        setOpen={setIsConfirmOpen}
        title="Xác nhận"
        description={mode === 'create' 
          ? 'Bạn có chắc chắn muốn thêm trường dữ liệu mới không?' 
          : 'Bạn có chắc chắn muốn cập nhật trường dữ liệu không?'}
        onConfirm={handleConfirm}
        confirmText={mode === 'create' ? 'Thêm mới' : 'Cập nhật'}
        isLoading={isLoading}
      />
    </>
  );
};

export default DialogCreateUpdateDataField;
