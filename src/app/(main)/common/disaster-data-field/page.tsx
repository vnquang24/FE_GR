"use client";
import React, { useMemo, useState, useRef } from "react";
import { useFindManyDataField, useDeleteDataField } from "@/generated/hooks";
import {
  Loader2,
  Plus,
  Edit,
  Trash2,
  HardDriveUpload,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { CreateNodeDialog } from "@/components/common/dialog-create-disaster-data-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  // ... giữ nguyên hàm này
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
          <TableCell className="w-28 text-right">Thao tác</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {nodes.map((nodeId, index) => {
          const node = getNodeById(nodeId);
          const hasChildren = node.children && node.children.length > 0;
          const isExpanded = expandedRows[nodeId];
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
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => onAddChild(node.id)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Thêm node con</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => onEditNode(node.id)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Chỉnh sửa</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 hover:text-red-500"
                            onClick={() => onDeleteNode(node.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Xóa</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
      </TableBody>
    </Table>
  );
};

const DisasterDataFieldPage: React.FC = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [parentIdForCreate, setParentIdForCreate] = useState<string>("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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
    },
  });

  const { mutate: deleteDataField } = useDeleteDataField();

  const dataFieldsTree = useMemo(() => {
    if (!data) return [];
    return convertDataFieldsToTree(data);
  }, [data]);

  const handleAddChild = (parentId: string) => {
    setParentIdForCreate(parentId);
    setIsCreateDialogOpen(true);
  };

  const handleEditNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    // Xử lý mở dialog chỉnh sửa (cần triển khai)
  };

  const handleDeleteNode = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa trường này?")) {
      deleteDataField(
        {
          where: { id },
        },
        {
          onSuccess: () => {
            refetch();
          },
        },
      );
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  const rootNodeIds = dataFieldsTree
    .filter((node) => node.parent === "0")
    .map((node) => node.id);

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Quản lý trường dữ liệu thảm họa</CardTitle>
        </CardHeader>
        <Separator className="mb-4" />
        <CardContent>
          <Button
            onClick={() => {
              setParentIdForCreate("");
              setIsCreateDialogOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white mb-6"
          >
            <HardDriveUpload className="w-4 h-4 mr-2" />
            Thêm mới trường thông tin
          </Button>

          <div className="rounded-lg border shadow">
            <NestedTable
              data={dataFieldsTree}
              nodes={rootNodeIds}
              onAddChild={handleAddChild}
              onEditNode={handleEditNode}
              onDeleteNode={handleDeleteNode}
            />
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

      {/* Dialog chỉnh sửa (cần triển khai) */}
    </div>
  );
};

export default DisasterDataFieldPage;
