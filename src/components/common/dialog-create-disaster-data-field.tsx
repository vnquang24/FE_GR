'use client'
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateDataField } from "@/generated/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Save, Loader2 } from 'lucide-react';
import { useState, useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(1, "Tên là bắt buộc"),
  description: z.string().optional(),
  unit: z.string().min(1, "Đơn vị là bắt buộc"),
  parentId: z.string(),
  code: z.string().min(1, "Mã là bắt buộc"),
});

interface CreateNodeDialogProps {
  parentId?: string;
  onNodeCreated?: () => void;
  onClose?: () => void;
}

export const CreateNodeDialog = ({ parentId = "", onNodeCreated, onClose }: CreateNodeDialogProps) => {
  const [open, setOpen] = useState(true);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      unit: "",
      parentId: parentId,
      code: "",
    },
  });

  // Cập nhật giá trị parentId khi prop thay đổi
  useEffect(() => {
    if (parentId) {
      form.setValue("parentId", parentId);
    }
  }, [parentId, form]);

  const { mutate: createDataField, isPending } = useCreateDataField();

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createDataField({
      data: {
        ...values,
        dataFieldGroup: "disaster",
      }
    }, {
      onSuccess: () => {
        form.reset();
        onNodeCreated?.();
        handleClose();
      },
    });
  };
  
  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) handleClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-600">
            {parentId ? "Thêm Node Con" : "Tạo Node Mới"}
          </DialogTitle>
        </DialogHeader>
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
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                      className="min-h-[100px] border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                        className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                    <FormLabel className="font-medium">ID Node Cha</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Nhập ID node cha" 
                        {...field}
                        disabled={!!parentId}
                        className={`border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${parentId ? 'bg-gray-100' : ''}`}
                      />
                    </FormControl>
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
                    Lưu
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};