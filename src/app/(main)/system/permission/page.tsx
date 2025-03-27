'use client';
import React, { useState, ChangeEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PermissionName, PermissionType } from '@prisma/client';
import { PlusCircle, Trash2, Save, Edit, Check, X, Eye } from 'lucide-react';
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
  useUpdateUserGroup, 
  useDeleteUserGroup 
} from '@/generated/hooks/user-group';
import { 
  useFindManyPermission, 
  useCreatePermission, 
  useUpdatePermission, 
  useDeletePermission 
} from '@/generated/hooks/permission';
import { motion } from 'framer-motion';
import { PERMISSION_NAMES, PERMISSION_NAMES_VI, PERMISSION_TYPES_VI } from '@/constant';

const PermissionPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [currentGroup, setCurrentGroup] = useState<any>(null);

  // Sử dụng các hooks được sinh ra từ ZenStack
  const { data: userGroups = [], isLoading: isLoadingGroups, refetch: refetchUserGroups } = useFindManyUserGroup({
    include: {
      permission: true
    }
  });

  const { data: permissions = [], isLoading: isLoadingPermissions } = useFindManyPermission();
  
  // Mutation hooks
  const updateUserGroupMutation = useUpdateUserGroup();

  const togglePermission = useCallback(async (groupId: string, permissionId: string) => {
    try {
      const group = userGroups.find(g => g.id === groupId);
      if (!group) return;

      const hasPermission = group.permission.some(p => p.id === permissionId);
      
      // Cập nhật quyền cho nhóm
      await updateUserGroupMutation.mutateAsync({
        where: { id: groupId },
        data: {
          permission: {
            [hasPermission ? 'disconnect' : 'connect']: { id: permissionId }
          }
        }
      });
      
      toast({
        title: "Thành công",
        description: hasPermission 
          ? 'Đã xóa quyền khỏi vai trò'
          : 'Đã thêm quyền cho vai trò',
      });
      refetchUserGroups();
    } catch (error) {
      console.error('Lỗi khi cập nhật quyền:', error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật quyền. Vui lòng thử lại.",
        variant: "destructive"
      });
    }
  }, [userGroups, updateUserGroupMutation, toast, refetchUserGroups]);

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
          Quản lý Phân quyền Hệ thống
        </motion.h1>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          <motion.h2 
            variants={itemVariants}
            className="text-xl font-semibold mb-6 text-blue-700"
          >
            Phân quyền theo vai trò
          </motion.h2>
          
          {userGroups.map((group, groupIndex) => (
            <motion.div 
              key={group.id} 
              variants={itemVariants}
              className="mb-8 border border-blue-100 rounded-lg p-5 hover:shadow-md transition-shadow duration-300"
              custom={groupIndex}
            >
              <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-blue-50 to-blue-100 p-3 rounded-lg text-blue-700">
                {group.name} 
                <span className="text-blue-500 text-sm ml-2">({group.description})</span>
              </h3>
              
              <div className="rounded-lg border border-blue-100 overflow-hidden">
                <Table>
                  <TableCaption>Phân quyền cho vai trò: {group.name}</TableCaption>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-blue-500 to-blue-600">
                      <TableHead className="text-white font-medium">Chức năng</TableHead>
                      <TableHead className="text-white font-medium text-center">{PERMISSION_TYPES_VI.CREATE}</TableHead>
                      <TableHead className="text-white font-medium text-center">{PERMISSION_TYPES_VI.READ}</TableHead>
                      <TableHead className="text-white font-medium text-center">{PERMISSION_TYPES_VI.UPDATE}</TableHead>
                      <TableHead className="text-white font-medium text-center">{PERMISSION_TYPES_VI.DELETE}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(PERMISSION_NAMES).map(permKey => (
                      <TableRow key={permKey} className="hover:bg-blue-50 transition-colors duration-200">
                        <TableCell className="font-medium text-blue-800">{PERMISSION_NAMES_VI[permKey]}</TableCell>
                        {Object.values(PermissionType).map(permType => {
                          // Tìm quyền tương ứng
                          const perm = permissions.find(p => 
                            p.name === PERMISSION_NAMES[permKey] && p.permissionType === permType
                          );
                          
                          // Kiểm tra xem nhóm này có quyền này không
                          const isGranted = perm && group.permission?.some(
                            p => p.name === PERMISSION_NAMES[permKey] && p.permissionType === permType
                          );
                          
                          return (
                            <TableCell key={`${permKey}-${permType}`} className="text-center">
                              <label className="relative inline-flex items-center justify-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!isGranted}
                                  onChange={() => perm && togglePermission(group.id, perm.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </>
  );
};

export default PermissionPage;