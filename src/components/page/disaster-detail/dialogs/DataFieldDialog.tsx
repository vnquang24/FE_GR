import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import HierarchicalSelect, { DataFieldNode } from '@/components/wrapper/hierarchical-select';
import { DataFieldWithOptimistic } from '@/hooks/disaster-detail/useDataFields';

type DataFieldDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDataField: string;
  setSelectedDataField: (value: string) => void;
  newDataFieldValue: string;
  setNewDataFieldValue: (value: string) => void;
  activeTab: string;
  addDataField: () => void;
  availableDataFields: DataFieldWithOptimistic[] | undefined;
  existingDataFieldIds: string[];
  getDataFieldHierarchyName: (dataFieldId: string, availableDataFields: DataFieldWithOptimistic[]) => { name: string, hierarchyPath: { id: string; name: string }[] };
};

const DataFieldDialog: React.FC<DataFieldDialogProps> = ({
  open,
  onOpenChange,
  selectedDataField,
  setSelectedDataField,
  newDataFieldValue,
  setNewDataFieldValue,
  activeTab,
  addDataField,
  availableDataFields,
  existingDataFieldIds,
  getDataFieldHierarchyName
}) => {
  // Chuyển đổi availableDataFields sang định dạng DataFieldNode
  const convertToDataFieldNodes = (): DataFieldNode[] => {
    if (!availableDataFields) return [];
    return availableDataFields.map((field: DataFieldWithOptimistic) => ({
      id: field.id,
      name: field.name,
      code: field.code,
      unit: field.unit,
      parentId: field.parentId,
      dataFieldGroup: field.dataFieldGroup,
      $optimistic: field.$optimistic
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>
            {activeTab === 'disasterData'
              ? 'Thêm số liệu thảm họa'
              : activeTab === 'damageData'
                ? 'Thêm dữ liệu thiệt hại'
                : 'Thêm trường dữ liệu'}
          </DialogTitle>
          <DialogDescription>
            {activeTab === 'disasterData'
              ? 'Chọn trường dữ liệu và nhập giá trị số liệu thảm họa'
              : activeTab === 'damageData'
                ? 'Chọn trường dữ liệu và nhập giá trị thiệt hại'
                : 'Chọn trường dữ liệu và nhập giá trị để thêm vào thảm họa'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="dataField">Trường dữ liệu</Label>
            {activeTab === 'disasterData' && (
              <div className="text-xs text-blue-500 bg-blue-50 p-2 rounded-md mb-2">
                <AlertCircle className="h-3 w-3 inline-block mr-1" />
                Chỉ hiển thị các trường dữ liệu thuộc nhóm "Thảm họa"
              </div>
            )}
            {activeTab === 'damageData' && (
              <div className="text-xs text-orange-500 bg-orange-50 p-2 rounded-md mb-2">
                <AlertCircle className="h-3 w-3 inline-block mr-1" />
                Chỉ hiển thị các trường dữ liệu thuộc nhóm "Thiệt hại chung"
              </div>
            )}
            <Select
              value={selectedDataField}
              onValueChange={setSelectedDataField}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Chọn trường dữ liệu">
                  {selectedDataField && availableDataFields && 
                    getDataFieldHierarchyName(selectedDataField, availableDataFields).name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white max-h-[300px] overflow-y-auto">
                <HierarchicalSelect
                  dataFields={convertToDataFieldNodes()}
                  existingFieldIds={existingDataFieldIds}
                  emptyMessage="Không có trường dữ liệu khả dụng"
                  rootGroupLabel="Trường dữ liệu cấp 1"
                  onSelectNode={setSelectedDataField}
                  filterFunction={(node) => {
                    // Nếu đang ở tab "Số liệu thảm họa", chỉ hiển thị các trường có nhóm "disaster"
                    if (activeTab === 'disasterData') {
                      return node.dataFieldGroup?.toLowerCase() === 'disaster';
                    }

                    // Nếu đang ở tab "Thiệt hại từ thảm họa", chỉ hiển thị các trường có nhóm "common" 
                    if (activeTab === 'damageData') {
                      return node.dataFieldGroup?.toLowerCase() === 'common';
                    }

                    // Mặc định hiển thị tất cả
                    return true;
                  }}
                />
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Giá trị</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="value"
                type="number"
                value={newDataFieldValue}
                onChange={(e) => setNewDataFieldValue(e.target.value)}
                className="bg-white"
                placeholder="Nhập giá trị"
              />
              <span className="text-gray-500">
                {selectedDataField && availableDataFields?.find(f => f.id === selectedDataField)?.unit}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            variant="default"
            onClick={addDataField}
            disabled={!selectedDataField || !newDataFieldValue}
          >
            Thêm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DataFieldDialog; 