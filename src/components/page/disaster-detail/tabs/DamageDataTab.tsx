import React from 'react';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TableWrapper, TableRow, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { DataFieldWithOptimistic } from '@/hooks/disaster-detail/useDataFields';

type DamageDataTabProps = {
  dataFields: any[];
  dataFieldValues: { [key: string]: number };
  availableDataFields: DataFieldWithOptimistic[] | undefined;
  handleDataFieldValueChange: (id: string, value: string) => void;
  handleDeleteDataField: (id: string) => void;
  getDataFieldHierarchyName: (dataFieldId: string, availableDataFields: DataFieldWithOptimistic[]) => { name: string, hierarchyPath: { id: string; name: string }[] };
  setShowAddDataFieldDialog: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
};

const DamageDataTab: React.FC<DamageDataTabProps> = ({
  dataFields,
  dataFieldValues,
  availableDataFields,
  handleDataFieldValueChange,
  handleDeleteDataField,
  getDataFieldHierarchyName,
  setShowAddDataFieldDialog,
  setActiveTab
}) => {
  // Lọc các trường dữ liệu thuộc nhóm 'common' (thiệt hại chung)
  const filteredDataFields = dataFields.filter(field => {
    const dataField = availableDataFields?.find(df => df.id === field.dataFieldId);
    return dataField?.dataFieldGroup?.toLowerCase() === 'common' && !field.deleted;
  });

  // Sắp xếp theo tên phân cấp
  const sortedDataFields = filteredDataFields.sort((a, b) => {
    if (!availableDataFields) return 0;
    const aName = getDataFieldHierarchyName(a.dataFieldId, availableDataFields).name;
    const bName = getDataFieldHierarchyName(b.dataFieldId, availableDataFields).name;
    return aName.localeCompare(bName);
  });

  // Chuyển đổi dữ liệu sang định dạng hiển thị
  const tableData = sortedDataFields.map(field => {
    const dataField = availableDataFields?.find(df => df.id === field.dataFieldId);
    const hierarchyName = availableDataFields 
      ? getDataFieldHierarchyName(field.dataFieldId, availableDataFields).name
      : '';
    
    return {
      id: field.id,
      value: field.value,
      hierarchyName,
      unit: dataField?.unit || '',
      dataFieldId: field.dataFieldId
    };
  });

  return (
    <Card className="shadow">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-orange-50 py-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
            Thiệt hại từ thảm họa
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="text-orange-500 border-orange-200 bg-orange-50 hover:bg-orange-100"
            onClick={() => {
              setActiveTab('damageData');
              setShowAddDataFieldDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Thêm số liệu thiệt hại
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <TableWrapper
          variant="border"
          spacing="md"
          columns={[
            {
              header: "Tên trường dữ liệu",
              accessorKey: "name",
              className: "w-[40%]",
              cell: (item) => <span className="font-medium">{item.hierarchyName}</span>
            },
            {
              header: "Giá trị",
              accessorKey: "value",
              cell: (item) => (
                <div className="flex items-center">
                  <Input
                    type="number"
                    value={dataFieldValues[item.id] !== undefined ? dataFieldValues[item.id] : item.value}
                    onChange={(e) => handleDataFieldValueChange(item.id, e.target.value)}
                    className="w-36"
                  />
                  <span className="ml-2 text-gray-500">{item.unit}</span>
                </div>
              )
            },
            {
              header: "Thao tác",
              cell: (item) => (
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDataField(item.id)}
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              ),
              className: "text-center"
            }
          ]}
          data={tableData}
          emptyState={
            <TableRow>
              <TableCell colSpan={3} className="h-[300px]">
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <AlertTriangle className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-2">Không có số liệu thiệt hại</p>
                  <p className="text-sm text-gray-400 mb-4">Chưa có số liệu thiệt hại nào được thêm vào thảm họa này</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveTab('damageData');
                      setShowAddDataFieldDialog(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Thêm số liệu thiệt hại
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

export default DamageDataTab; 