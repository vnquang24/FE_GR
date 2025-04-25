"use client";
import React, { useMemo, useState, useRef, useCallback } from "react";
import { useFindManyDataField, useDeleteDataField } from "@/generated/hooks";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Search,
  AlertTriangle,
} from "lucide-react";
import { CreateNodeDialog } from "@/components/common/dialog-create-update-disaster-data-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import _ from 'lodash';

type DataField = {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  unit?: string;
  code?: string;
};

type TreeNode = {
  id: string;
  name: string;
  description?: string;
  unit?: string;
  code?: string;
  children: string[];
  parent: string;
};

// Hàm chuyển đổi dữ liệu phẳng sang dạng cây
const convertDataFieldsToTree = (dataFields: DataField[]): TreeNode[] => {
  const treeNodes: TreeNode[] = [];
  const childrenMap: Record<string, string[]> = {};

  dataFields.forEach((field) => {
    childrenMap[field.id] = [];
  });

  dataFields.forEach((field) => {
    if (field.parentId) {
      if (childrenMap[field.parentId]) {
        childrenMap[field.parentId].push(field.id);
      }
    }
  });

  dataFields.forEach((field) => {
    treeNodes.push({
      id: field.id,
      name: field.name,
      description: field.description,
      unit: field.unit,
      code: field.code,
      children: childrenMap[field.id] || [],
      parent: field.parentId || "0",
    });
  });

  return treeNodes;
};

// Component bảng mới lồng ghép
const NestedTable: React.FC<{
  data: TreeNode[];
  nodes: string[];
  onAddChild: (id: string) => void;
  onEditNode: (id: string) => void;
  onDeleteNode: (id: string) => void;
  indent?: number;
}> = ({ data, nodes, onAddChild, onEditNode, onDeleteNode, indent = 0 }) => {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRow = (nodeId: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Lấy node từ ID
  const getNodeById = (id: string) => {
    return (
      data.find((node) => node.id === id) || {
        id: "0",
        name: "",
        children: [],
        parent: "0",
      }
    );
  };

  // Tính toán mức độ thụt lề dựa trên mức độ lồng ghép
  const indentPadding = `${indent * 2}rem`;

  return (
    <Table>
      <TableHeader className="bg-gray-50 border-b">
        <TableRow>
          <TableCell className="w-12 text-center">SL</TableCell>
          <TableCell>Tên</TableCell>
          <TableCell>Mã</TableCell>
          <TableCell>Đơn vị</TableCell>
          <TableCell className="w-28 text-center">Thao tác</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {nodes.map((nodeId, index) => {
          const node = getNodeById(nodeId);
          const hasChildren = node.children && node.children.length > 0;
          const isExpanded = expandedRows[node.id];
          const childCount = node.children.length;

          return (
            <React.Fragment key={node.id}>
              <TableRow className="hover:bg-gray-50">
                <TableCell className="text-center">
                  <div className="flex items-center justify-center">
                    {hasChildren && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 mr-1"
                        onClick={() => toggleRow(node.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <div className="flex items-center">
                            <ChevronRight className="h-4 w-4" />
                            <span className="ml-1 text-xs text-gray-500 font-normal">
                              ({childCount})
                            </span>
                          </div>
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div style={{ paddingLeft: indentPadding }}>{node.name}</div>
                </TableCell>
                <TableCell className="text-gray-600">{node.code}</TableCell>
                <TableCell className="text-gray-600">{node.unit}</TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => onAddChild(node.id)}
                    >
                      <Plus size={16}/>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => onEditNode(node.id)}
                    >
                      <Edit size={16}/>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => onDeleteNode(node.id)}
                    >
                      <Trash2 size={16}/>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

              {/* Hàng mở rộng chứa bảng con nếu có children */}
              {hasChildren && isExpanded && (
                <TableRow>
                  <TableCell colSpan={5} className="p-0 border-0">
                    <div className="pl-8 pr-2 py-2">
                      <div className="border rounded-lg overflow-hidden">
                        <NestedTable
                          data={data}
                          nodes={node.children}
                          onAddChild={onAddChild}
                          onEditNode={onEditNode}
                          onDeleteNode={onDeleteNode}
                          indent={indent + 1}
                        />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          );
        })}
        {nodes.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
              <div className="flex flex-col items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                <p>Không có dữ liệu trường thông tin thảm họa</p>
              </div>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

const DisasterDataFieldPage: React.FC = () => {
  const [searchText, setSearchText] = useState<string>('')
  const debouncedSearchText = _.debounce(setSearchText, 500)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [parentIdForCreate, setParentIdForCreate] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);

  const { data, isLoading, refetch } = useFindManyDataField({
    select: {
      id: true,
      name: true,
      description: true,
      parentId: true,
      unit: true,
      code: true,
    },
    where: {
      dataFieldGroup: "disaster",
      OR: [
        {
          name: {
            contains: searchText,
            mode: 'insensitive'
          }
        },
        {
          description: {
            contains: searchText,
            mode: 'insensitive'
          }
        },
        {
          code: {
            contains: searchText,
            mode: 'insensitive'
          }
        }
      ]
    },
  });

  const deleteDataFieldMutation = useDeleteDataField({
    onSuccess: () => {
      toast.success({
        title: "Thành công",
        description: "Đã xóa trường dữ liệu thảm họa"
      });
      setIsDeleteModalOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error({
        title: "Lỗi",
        description: "Không thể xóa trường dữ liệu. Vui lòng thử lại sau."
      });
      console.error("Lỗi khi xóa trường dữ liệu thảm họa:", error);
    }
  });

  const dataFieldsTree = useMemo(() => {
    if (!data) return [];
    return convertDataFieldsToTree(data);
  }, [data]);

  const handleAddChild = useCallback((parentId: string) => {
    setParentIdForCreate(parentId);
    setIsCreateDialogOpen(true);
  }, []);

  const handleAddRoot = useCallback(() => {
    setParentIdForCreate("");
    setIsCreateDialogOpen(true);
  }, []);

  const handleEditNode = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
    setIsUpdateDialogOpen(true);
  }, []);

  const handleDeleteNode = useCallback((id: string) => {
    const node = dataFieldsTree.find(n => n.id === id);
    if (node) {
      setSelectedNode(node);
      setIsDeleteModalOpen(true);
    }
  }, [dataFieldsTree]);

  const handleConfirmDelete = useCallback(async () => {
    if (selectedNode) {
      await deleteDataFieldMutation.mutateAsync({
        where: { id: selectedNode.id }
      });
    }
  }, [selectedNode, deleteDataFieldMutation]);

  const rootNodeIds = dataFieldsTree
    .filter((node) => node.parent === "0")
    .map((node) => node.id);

  return (
    <div className="w-full mx-auto p-2">
      <Card className="shadow-lg border-t-4 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 flex flex-row items-center justify-between">
          <CardTitle className="text-xl text-gray-800">
            Quản lý trường dữ liệu thảm họa
          </CardTitle>
          <div className="flex space-x-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, mã, mô tả..."
                className="pl-8 w-64 border-blue-200"
                onChange={(e) => debouncedSearchText(e.target.value)}
              />
            </div>
            <Button
              className="bg-green-500 hover:bg-green-600 text-white"
              onClick={handleAddRoot}
            >
              <Plus size={16} className="mr-1" /> Thêm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="rounded-lg border shadow">
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mr-2" />
                <span>Đang tải dữ liệu...</span>
              </div>
            ) : (
              <NestedTable
                data={dataFieldsTree}
                nodes={rootNodeIds}
                onAddChild={handleAddChild}
                onEditNode={handleEditNode}
                onDeleteNode={handleDeleteNode}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {isCreateDialogOpen && (
        <CreateNodeDialog
          parentId={parentIdForCreate}
          onClose={() => setIsCreateDialogOpen(false)}
          onNodeCreated={() => {
            setIsCreateDialogOpen(false);
            refetch();
          }}
        />
      )}

      {isUpdateDialogOpen && selectedNodeId && (
        <CreateNodeDialog
          nodeId={selectedNodeId}
          onClose={() => setIsUpdateDialogOpen(false)}
          onNodeCreated={() => {
            setIsUpdateDialogOpen(false);
            refetch();
          }}
        />
      )}

      {/* Modal Xác Nhận Xóa */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Xác Nhận Xóa</DialogTitle>
            <DialogDescription className="text-center">
              Bạn có chắc chắn muốn xóa trường dữ liệu thảm họa này không?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 text-center">
            <p className="font-medium text-lg text-gray-800">{selectedNode?.name}</p>
            <p className="text-gray-600 mt-2">{selectedNode?.description || "Không có mô tả"}</p>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700 text-sm">
              <AlertTriangle className="h-4 w-4 inline-block mr-1" />
              Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
              disabled={deleteDataFieldMutation.isPending}
            >
              {deleteDataFieldMutation.isPending ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang xử lý...
                </div>
              ) : (
                <>
                  <Trash2 size={16} className="mr-1" /> Xóa
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DisasterDataFieldPage;

