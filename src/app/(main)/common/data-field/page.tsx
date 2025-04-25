"use client"
import React, { useMemo, useState, useRef, useCallback } from "react";
import { useFindManyDataField, useDeleteDataField } from "@/generated/hooks";
import {
    Loader2,
    Plus,
    Edit,
    Trash2,
    HardDriveUpload,
    ChevronRight,
    ChevronDown,
    Search,
    AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmDialog, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import DialogCreateUpdateDataField, { DataFieldFormValues } from "@/components/common/dialog-create-update-data-filed";
import _ from 'lodash';

type DataField = {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    unit?: string;
    code?: string;
    dataFieldGroup: string;
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
                                <p>Không có dữ liệu trường thông tin</p>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

const DataFieldPage: React.FC = () => {
    const [searchText, setSearchText] = useState<string>('')
    const debouncedSearchText = _.debounce(setSearchText, 500)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedDataField, setSelectedDataField] = useState<DataFieldFormValues | null>(null);
    const [parentIdForCreate, setParentIdForCreate] = useState<string>("");

    const { data, isLoading, refetch } = useFindManyDataField({
        select: {
            id: true,
            name: true,
            description: true,
            parentId: true,
            unit: true,
            code: true,
            dataFieldGroup: true
        },
        where: {
            dataFieldGroup: "common",
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
                description: "Đã xóa trường dữ liệu"
            });
            setIsDeleteModalOpen(false);
            refetch();
        },
        onError: (error) => {
            toast.error({
                title: "Lỗi",
                description: "Không thể xóa trường dữ liệu. Vui lòng thử lại sau."
            });
            console.error("Lỗi khi xóa trường dữ liệu:", error);
        }
    });

    const dataFieldsTree = useMemo(() => {
        if (!data) return [];
        return convertDataFieldsToTree(data);
    }, [data]);

    // Tối ưu hóa các hàm xử lý để tránh vòng lặp cập nhật
    const handleAddChild = useCallback((parentId: string) => {
        setParentIdForCreate(parentId);
        setIsAddModalOpen(true);
    }, []);

    const handleAddRoot = useCallback(() => {
        setParentIdForCreate("");
        setIsAddModalOpen(true);
    }, []);

    const handleEditNode = useCallback((nodeId: string) => {
        const node = data?.find(item => item.id === nodeId);
        if (node) {
            setSelectedDataField({
                id: node.id,
                name: node.name,
                description: node.description || '',
                unit: node.unit || '',
                code: node.code || '',
                parentId: node.parentId || '',
                dataFieldGroup: node.dataFieldGroup || 'common'
            });
            setIsEditModalOpen(true);
        }
    }, [data]);

    const handleDeleteNode = useCallback((id: string) => {
        const node = data?.find(item => item.id === id);
        if (node) {
            setSelectedDataField({
                id: node.id,
                name: node.name,
                description: node.description || '',
                unit: node.unit || '',
                code: node.code || '',
                parentId: node.parentId || '',
                dataFieldGroup: node.dataFieldGroup || 'common'
            });
            setIsDeleteModalOpen(true);
        }
    }, [data]);

    const handleConfirmDelete = useCallback(async () => {
        if (selectedDataField?.id) {
            await deleteDataFieldMutation.mutateAsync({
                where: { id: selectedDataField.id }
            });
        }
    }, [selectedDataField?.id, deleteDataFieldMutation]);

    // Callback để xử lý đóng modal Add
    const handleCloseAddModal = useCallback(() => {
        setIsAddModalOpen(false);
    }, []);

    // Callback để xử lý đóng modal Edit
    const handleCloseEditModal = useCallback(() => {
        setIsEditModalOpen(false);
    }, []);

    // Callback cho onSuccess
    const handleSuccess = useCallback(() => {
        refetch();
    }, [refetch]);

    const rootNodeIds = dataFieldsTree
        .filter((node) => node.parent === "0")
        .map((node) => node.id);

    return (
        <div className="w-full mx-auto p-2">
            <Card className="shadow-lg border-t-4 border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 flex flex-row items-center justify-between">
                    <CardTitle className="text-xl text-gray-800">
                        Quản lý trường thông tin dữ liệu
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

            {/* Modal Thêm mới */}
            {isAddModalOpen && (
                <DialogCreateUpdateDataField
                    key="add-dialog"
                    open={isAddModalOpen}
                    setOpen={handleCloseAddModal}
                    onSuccess={handleSuccess}
                    mode="create"
                    parentId={parentIdForCreate}
                />
            )}

            {/* Modal Chỉnh sửa */}
            {isEditModalOpen && selectedDataField && (
                <DialogCreateUpdateDataField
                    key="edit-dialog"
                    open={isEditModalOpen}
                    setOpen={handleCloseEditModal}
                    initialData={selectedDataField}
                    onSuccess={handleSuccess}
                    mode="update"
                />
            )}

            {/* Modal Xác Nhận Xóa */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="text-center text-xl">Xác Nhận Xóa</DialogTitle>
                        <DialogDescription className="text-center">
                            Bạn có chắc chắn muốn xóa trường dữ liệu này không?
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4 text-center">
                        <p className="font-medium text-lg text-gray-800">{selectedDataField?.name}</p>
                        <p className="text-gray-600 mt-2">{selectedDataField?.description || "Không có mô tả"}</p>
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

export default DataFieldPage;