import React from 'react';
import { Shield, Plus, Trash2, Edit } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableWrapper, TableRow, TableCell } from '@/components/ui/table';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { RescueTypeOnDisaster } from '@/hooks/disaster-detail/useRescueTypes';

type RescueTypesTabProps = {
  rescueTypes: RescueTypeOnDisaster[];
  handleAddRescue: () => void;
  handleEditRescue: (rescueType: RescueTypeOnDisaster) => void;
  handleDeleteRescue: (id: string) => void;
};

const RescueTypesTab: React.FC<RescueTypesTabProps> = ({
  rescueTypes,
  handleAddRescue,
  handleEditRescue,
  handleDeleteRescue
}) => {
  return (
    <Card className="shadow">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 py-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Shield className="h-5 w-5 text-green-500 mr-2" />
            Thông tin cứu hộ
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100"
            onClick={handleAddRescue}
          >
            <Plus className="h-4 w-4 mr-1" /> Quản lý cứu hộ
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <TableWrapper
          variant="border"
          columns={[
            {
              header: "Loại cứu hộ",
              accessorKey: "name",
              className: "w-[20%]",
              cell: (item) => <span className="font-medium">{item.name}</span>
            },
            {
              header: "Số lượng",
              accessorKey: "value",
              cell: (item) => (
                <div className="text-sm">{item.value}</div>
              )
            },
            {
              header: "Đơn vị",
              accessorKey: "unit",
              cell: (item) => <div className="text-sm">{item.unitName || "Không có đơn vị"}</div>
            },
            {
              header: "Thời gian bắt đầu",
              accessorKey: "startDate",
              cell: (item) => (
                <div className="text-sm">{item.startDate ? format(new Date(item.startDate), 'dd/MM/yyyy HH:mm', { locale: vi }) : "-"}</div>
              )
            },
            {
              header: "Thời gian kết thúc",
              accessorKey: "endDate",
              cell: (item) => (
                <div className="text-sm">{item.endDate ? format(new Date(item.endDate), 'dd/MM/yyyy HH:mm', { locale: vi }) : "-"}</div>
              )
            },
            {
              header: "Nguồn gốc",
              accessorKey: "source",
              cell: (item) => <div className="text-sm">{item.source || "-"}</div>
            },
            {
              header: "Thao tác",
              cell: (item) => (
                <div className="text-center flex justify-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditRescue(item)}
                    className="h-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-1" /> Sửa
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRescue(item.id)}
                    className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Xóa
                  </Button>
                </div>
              ),
              className: "text-center"
            }
          ]}
          data={rescueTypes.map(rescueType => ({
            ...rescueType,
            name: rescueType.rescueType?.name || "Không xác định",
            unitName: rescueType.unit?.name || ""
          }))}
          emptyState={
            <TableRow>
              <TableCell colSpan={7} className="h-[300px]">
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <Shield className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">Không có thông tin cứu hộ</p>
                  <p className="text-sm text-gray-400 mb-4">Thảm họa này chưa có thông tin cứu hộ nào được thêm vào</p>
                  <Button
                    variant="outline"
                    className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                    onClick={handleAddRescue}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Thêm thông tin cứu hộ
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          }
        />
      </CardContent>
    </Card>
  );
};

export default RescueTypesTab; 