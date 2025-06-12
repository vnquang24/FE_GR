import React from 'react';
import { FileText, FileType } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BasicInfoState, ClassificationState } from '@/hooks/disaster-detail/useDisasterInfo';

type DisasterTypeOption = {
  value: string;
  label: string;
};

type BasicInfoSectionProps = {
  basicInfo: BasicInfoState;
  classification: ClassificationState;
  disasterTypeOptions: DisasterTypeOption[];
  priorityLevelOptions: DisasterTypeOption[];
  emergencyLevelOptions: DisasterTypeOption[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
};

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  basicInfo,
  classification,
  disasterTypeOptions,
  priorityLevelOptions,
  emergencyLevelOptions,
  handleInputChange,
  handleSelectChange
}) => {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
          <FileText className="h-4 w-4 mr-1" /> Mô tả
        </h3>
        <Textarea
          name="description"
          value={basicInfo.description}
          onChange={handleInputChange}
          rows={4}
          className="resize-none w-full"
          placeholder="Nhập mô tả thảm họa"
        />
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center ">
          <FileType className="h-4 w-4 mr-1" /> Phân loại
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Loại thảm họa:</Label>
            <Select
              value={classification.disasterTypeId}
              onValueChange={(value) => handleSelectChange('disasterTypeId', value)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Chọn loại thảm họa" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {disasterTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Mức độ khẩn cấp:</Label>
            <Select
              value={classification.emergencyLevelId}
              onValueChange={(value) => handleSelectChange('emergencyLevelId', value)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Chọn mức độ khẩn cấp" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {emergencyLevelOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Mức độ ưu tiên:</Label>
            <Select
              value={classification.priorityLevelId}
              onValueChange={(value) => handleSelectChange('priorityLevelId', value)}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Chọn mức độ ưu tiên" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {priorityLevelOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoSection; 