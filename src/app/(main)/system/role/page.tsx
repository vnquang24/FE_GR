'use client';
import React, { useState, ChangeEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, Trash2, Eye, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableCaption
} from '@/components/ui/table';
import { useToast, Toast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  useFindManyUserGroup, 
  useCreateUserGroup, 
  useDeleteUserGroup 
} from '@/generated/hooks/user-group';
import { 
  useFindManyPermission, 
} from '@/generated/hooks/permission';
import { motion } from 'framer-motion';
import { PERMISSION_NAMES, PERMISSION_NAMES_VI, PERMISSION_TYPES_VI } from '@/constant';

const RolePage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState<{ name: string; description: string }>({
    name: '',
    description: ''
  });

  // Sử dụng các hooks được sinh ra từ ZenStack
  const { data: userGroups = [], isLoading: isLoadingGroups, refetch: refetchUserGroups } = useFindManyUserGroup({
    include: {
      permission: true
    }
  });

  const { data: permissions = [], isLoading: isLoadingPermissions } = useFindManyPermission();
  
  // Mutation hooks
  const createUserGroupMutation = useCreateUserGroup();
  const deleteUserGroupMutation = useDeleteUserGroup();

  // Xử lý thêm vai trò mới
  const handleAddGroup = async () => {
    if (!newGroup.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Tên vai trò không được để trống",
        variant: "destructive"
      });
      return;
    }

    try {
      await createUserGroupMutation.mutateAsync({
        data: {
          name: newGroup.name,
          description: newGroup.description
        }
      });
      
      setNewGroup({ name: '', description: '' });
      setIsAddDialogOpen(false);
      toast({
        title: "Thành công",
        description: "Đã tạo vai trò mới",
      });
      refetchUserGroups();
    } catch (error) {
      console.error('Lỗi khi tạo vai trò mới:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo vai trò mới. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await deleteUserGroupMutation.mutateAsync({
        where: { id: groupId }
      });
      
      toast({
        title: "Thành công",
        description: "Đã xóa vai trò",
      });
      refetchUserGroups();
    } catch (error) {
      console.error('Lỗi khi xóa vai trò:', error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa vai trò. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  };

  // Reset forms when closing dialogs
  const resetForm = () => {
    setNewGroup({ name: '', description: '' });
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: 'name' | 'description') => {
    setNewGroup(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  if (isLoadingGroups || isLoadingPermissions) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        <span className="ml-3 text-lg">Đang tải...</span>
      </div>
    );
  }

  // Animation variants cho Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <>
      {/* Thêm Toast Container ở góc phải phía trên */}
      <Toast 
        position="top-right" 
        className="custom-toast-container"
        toastOptions={{
          style: { 
            '--toastify-color-progress-light': '#3b82f6',
            '--toastify-color-progress-dark': '#3b82f6'
          } as React.CSSProperties
        }}
      />
      
      <div className="container mx-auto p-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold mb-8 text-blue-800 relative pb-2 after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-1 after:w-24 after:bg-blue-500"
        >
          Quản lý Vai trò Hệ thống
        </motion.h1>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <motion.div
            variants={itemVariants}
            className="flex justify-between items-center mb-6"
          >
            <h2 className="text-xl font-semibold text-blue-700">Danh sách vai trò</h2>
            
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 transition-colors duration-300 hover:shadow-lg active:scale-95 transform"
                >
                  <PlusCircle className="h-5 w-5 mr-2" />
                  Thêm vai trò mới
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Thêm vai trò mới</DialogTitle>
                  <DialogDescription>
                    Điền thông tin vai trò mới. Nhấn lưu khi hoàn tất.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Tên vai trò
                    </Label>
                    <Input
                      id="name"
                      value={newGroup.name}
                      onChange={(e) => handleInputChange(e, 'name')}
                      className="col-span-3"
                      placeholder="Nhập tên vai trò"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Mô tả
                    </Label>
                    <Textarea
                      id="description"
                      value={newGroup.description}
                      onChange={(e) => handleInputChange(e, 'description')}
                      className="col-span-3"
                      placeholder="Nhập mô tả chi tiết về vai trò"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddGroup}>Lưu</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <div className="rounded-lg border border-blue-100 overflow-hidden">
              <Table>
                <TableCaption>Danh sách vai trò trong hệ thống</TableCaption>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-500 to-blue-600">
                    <TableHead className="text-white font-medium">STT</TableHead>
                    <TableHead className="text-white font-medium">Tên vai trò</TableHead>
                    <TableHead className="text-white font-medium">Mô tả</TableHead>
                    <TableHead className="text-white font-medium">Số quyền</TableHead>
                    <TableHead className="text-white font-medium">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userGroups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        Chưa có vai trò nào. Hãy thêm vai trò mới.
                      </TableCell>
                    </TableRow>
                  ) : (
                    userGroups.map((group, index) => (
                      <TableRow 
                        key={group.id} 
                        className="hover:bg-blue-50 transition-colors duration-200"
                      >
                        <TableCell className="font-medium text-blue-800">{index + 1}</TableCell>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{group.description}</TableCell>
                        <TableCell>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                            {group.permission?.length || 0}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => router.push(`/system/role/${group.id}`)}
                              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors duration-300"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Xem
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => router.push(`/system/permission`)}
                              className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white transition-colors duration-300"
                            >
                              <Shield className="h-4 w-4 mr-1" />
                              Phân quyền
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteGroup(group.id)}
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors duration-300"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Xóa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
};

export default RolePage;