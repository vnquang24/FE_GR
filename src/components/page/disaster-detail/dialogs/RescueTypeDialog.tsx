import React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import DateTimePickerWrapper from '@/components/wrapper/date-time-picker';
import HierarchicalSelect, { DataFieldNode } from '@/components/wrapper/hierarchical-select';
import { DataFieldWithOptimistic } from '@/hooks/disaster-detail/useDataFields';
import { RescueTypeFormState } from '@/hooks/disaster-detail/useRescueTypes';

type RescueTypeOption = {
  value: string;
  label: string;
};

type RescueTypeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rescueTypeForm: RescueTypeFormState;
  updateFormField: (field: string, value: any) => void;
  resetRescueTypeForm: () => void;
  addOrUpdateRescue: () => void;
  rescueTypeOptions: RescueTypeOption[];
  availableDataFields: DataFieldWithOptimistic[] | undefined;
};

const RescueTypeDialog: React.FC<RescueTypeDialogProps> = ({
  open,
  onOpenChange,
  rescueTypeForm,
  updateFormField,
  resetRescueTypeForm,
  addOrUpdateRescue,
  rescueTypeOptions,
  availableDataFields
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
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetRescueTypeForm();
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle>{rescueTypeForm.id ? 'Cập nhật thông tin cứu hộ' : 'Thêm mới thông tin cứu hộ'}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          {rescueTypeForm.id ? 'Cập nhật thông tin chi tiết cho loại cứu hộ.' : 'Thêm thông tin cứu hộ mới cho thảm họa này.'}
        </DialogDescription>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rescueTypeId" className="text-xs text-gray-500 mb-1 block">Loại cứu hộ <span className="text-red-500">*</span></Label>
            <Select
              value={rescueTypeForm.rescueTypeId}
              onValueChange={(value) => updateFormField('rescueTypeId', value)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Chọn loại cứu hộ" />
              </SelectTrigger>
              <SelectContent className="bg-white max-h-[300px] overflow-y-auto">
                {rescueTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="unitId" className="text-xs text-gray-500 mb-1 block">Đơn vị <span className="text-red-500">*</span></Label>
            <Select
              value={rescueTypeForm.unitId}
              onValueChange={(value) => updateFormField('unitId', value)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Chọn đơn vị">
                  {rescueTypeForm.unitId && availableDataFields?.find((df) => df.id === rescueTypeForm.unitId)?.name + " (" + availableDataFields?.find((df) => df.id === rescueTypeForm.unitId)?.unit + ")"} 
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white max-h-[300px] overflow-y-auto">
                <HierarchicalSelect
                  dataFields={convertToDataFieldNodes()}
                  existingFieldIds={[]}
                  emptyMessage="Không có đơn vị nào khả dụng"
                  rootGroupLabel="Đơn vị cấp 1"
                  onSelectNode={(nodeId) => updateFormField('unitId', nodeId)}
                />
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="value" className="text-xs text-gray-500 mb-1 block">Số lượng <span className="text-red-500">*</span></Label>
            <Input
              id="value"
              type="number"
              value={rescueTypeForm.value || ''}
              onChange={(e) => updateFormField('value', parseFloat(e.target.value) || 0)}
              placeholder="Nhập số lượng"
              className="w-full"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-xs text-gray-500 mb-1 block">Ngày bắt đầu:</Label>
              <DateTimePickerWrapper
                value={rescueTypeForm.startDate}
                onChange={(date) => updateFormField('startDate', date)}
                showTime={true}
                showClear={true}
                placeHolder="Chọn thời gian bắt đầu"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-xs text-gray-500 mb-1 block">Ngày kết thúc:</Label>
              <DateTimePickerWrapper
                value={rescueTypeForm.endDate}
                onChange={(date) => updateFormField('endDate', date)}
                showTime={true}
                showClear={true}
                placeHolder="Chọn thời gian kết thúc"
                className="w-full"
                minDate={rescueTypeForm.startDate}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="source" className="text-xs text-gray-500 mb-1 block">Nguồn gốc:</Label>
            <Textarea
              id="source"
              value={rescueTypeForm.source || ''}
              onChange={(e) => updateFormField('source', e.target.value)}
              placeholder="Nhập thông tin về nguồn gốc của nguồn lực cứu hộ"
              className="w-full resize-none"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              resetRescueTypeForm();
              onOpenChange(false);
            }}
          >
            Hủy
          </Button>
          <Button 
            variant="default" 
            onClick={addOrUpdateRescue} 
            disabled={!rescueTypeForm.rescueTypeId || !rescueTypeForm.unitId}
          >
            {rescueTypeForm.id ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RescueTypeDialog; 