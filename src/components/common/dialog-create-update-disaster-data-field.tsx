'use client'
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDataField, useUpdateDataField, useFindUniqueDataField, useFindManyDataField } from "@/generated/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Save, Loader2 } from 'lucide-react';
import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";

const formSchema = z.object({
  name: z.string().min(1, "Tên là bắt buộc"),
  description: z.string().optional(),
  unit: z.string().min(1, "Đơn vị là bắt buộc"),
  parentId: z.string().optional(),
  code: z.string().min(1, "Mã là bắt buộc"),
});

interface DialogCreateUpdateDataFieldProps {
  parentId?: string;
  nodeId?: string | null;
  onNodeCreated?: () => void;
  onClose?: () => void;
}

export const CreateNodeDialog = ({
  parentId = "", 
  nodeId = null, 
  onNodeCreated, 
  onClose,
}: DialogCreateUpdateDataFieldProps) => {
  const [open, setOpen] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const isUpdateMode = !!nodeId;
  
  // Fetch all data fields for parent selection
  const { data: allDataFields, isLoading: isLoadingDataFields } = useFindManyDataField({
    select: {
      id: true,
      name: true,
      code: true,
      parentId: true
    },
    where: {
      dataFieldGroup: "disaster",
    },
  });
  
  // Fetch existing data field details if in update mode
  const { data: existingDataField, isLoading: isLoadingDetails } = useFindUniqueDataField(
    { where: { id: nodeId || '' } },
    { enabled: isUpdateMode }
  );
  
  // Khởi tạo form sau khi đã có dữ liệu
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingDataField?.name || "",
      description: existingDataField?.description || "",
      unit: existingDataField?.unit || "",
      parentId: existingDataField?.parentId || parentId || "root",
      code: existingDataField?.code || "",
    },
  });

  // Cập nhật form khi có dữ liệu từ API
  useEffect(() => {
    if (existingDataField && isUpdateMode) {
      const parentIdValue = existingDataField.parentId || "root";
      
      form.reset({
        name: existingDataField.name || "",
        description: existingDataField.description || "",
        unit: existingDataField.unit || "",
        parentId: parentIdValue,
        code: existingDataField.code || "",
      });
      
      // Mở rộng đường dẫn đến node cha đã chọn nếu có
      if (existingDataField.parentId) {
        expandPathToNode(existingDataField.parentId);
      }
    }
  }, [existingDataField, form, isUpdateMode]);

  // Update parentId field when parentId prop changes
  useEffect(() => {
    if (!isUpdateMode) {
      if (parentId) {
        form.setValue("parentId", parentId);
      } else {
        form.setValue("parentId", "root");
      }
    }
  }, [parentId, form, isUpdateMode]);

  // Xử lý dữ liệu khi dialog mở/đóng
  useEffect(() => {
    if (open && isUpdateMode && existingDataField) {
      // Đảm bảo form có dữ liệu chính xác khi dialog mở
      const parentIdValue = existingDataField.parentId || "root";
      
      form.reset({
        name: existingDataField.name || "",
        description: existingDataField.description || "",
        unit: existingDataField.unit || "",
        parentId: parentIdValue,
        code: existingDataField.code || "",
      });
    }
  }, [open, existingDataField, isUpdateMode, form]);
  
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

  const { mutate: createDataField, isPending: isCreating } = useCreateDataField();
  const { mutate: updateDataField, isPending: isUpdating } = useUpdateDataField();

  const isPending = isCreating || isUpdating || isLoadingDetails || isLoadingDataFields;

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Chuyển đổi giá trị "root" thành chuỗi rỗng
    const parentId = values.parentId === "root" ? "" : values.parentId || "";
    
    if (isUpdateMode && nodeId) {
      // Update mode
      updateDataField({
        where: { id: nodeId },
        data: { 
          name: values.name,
          description: values.description,
          unit: values.unit,
          code: values.code,
          parentId: parentId,
        }
      }, {
        onSuccess: () => {
          form.reset();
          onNodeCreated?.();
          handleClose();
        },
      });
    } else {
      // Create mode
      createDataField({
        data: {
          name: values.name,
          description: values.description,
          unit: values.unit,
          code: values.code,
          parentId: parentId,
          dataFieldGroup: "disaster",
        }
      }, {
        onSuccess: () => {
          form.reset();
          onNodeCreated?.();
          handleClose();
        },
      });
    }
  };
  
  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  // Lọc ra danh sách node cha hợp lệ (không bao gồm chính node hiện tại để tránh tạo vòng lặp)
  const validParentOptions = allDataFields?.filter(field => field.id !== nodeId) || [];

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

  // Kiểm tra xem node có chứa node con không
  const hasChildren = (nodeId: string) => {
    return validParentOptions.some(node => node.parentId === nodeId);
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) handleClose();
    }}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-600">
            {isUpdateMode 
              ? "Chỉnh sửa Node" 
              : parentId 
                ? "Thêm Node Con" 
                : "Tạo Node Mới"
            }
          </DialogTitle>
        </DialogHeader>

        {isPending && isLoadingDetails ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Tên Node</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nhập tên node" 
                          {...field}
                          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Mã Node</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nhập mã node" 
                          {...field}
                          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Mô tả</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Nhập mô tả chi tiết về node" 
                        {...field}
                        className="bg-white min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Đơn vị</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nhập đơn vị" 
                          {...field}
                          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Node cha</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={!!parentId && !isUpdateMode}
                      >
                        <FormControl>
                          <SelectTrigger className={`bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${parentId && !isUpdateMode ? 'bg-gray-100' : ''}`}>
                            <SelectValue placeholder="Chọn node cha" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white max-h-[300px] overflow-y-auto">
                          {renderTreeSelectItems()}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-300"
                  onClick={handleClose}
                >
                  Hủy
                </Button>
                <Button 
                  type="submit"
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isUpdateMode ? 'Cập nhật' : 'Lưu'}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};
