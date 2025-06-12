import React from 'react';
import { Clock, MapPin, Building, Edit } from 'lucide-react';
import { Label } from '@/components/ui/label';
import DateTimePickerWrapper from '@/components/wrapper/date-time-picker';
import { MultiSelect } from '@/components/ui/multi-select';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { TimeDataState, AdminDataState } from '@/hooks/disaster-detail/useDisasterInfo';
import { CoordinateData } from '@/hooks/disaster-detail/useCoordinate';

type SelectOption = {
  value: string;
  label: string;
};

type TimeLocationSectionProps = {
  timeData: TimeDataState;
  adminData: AdminDataState;
  coordinateData: CoordinateData | null;
  disaster: any; // Thông tin thảm họa từ API
  provinceOptions: SelectOption[];
  districtOptions: SelectOption[];
  communeOptions: SelectOption[];
  handleDateChange: (name: string, value: Date | undefined) => void;
  handleProvincesChange: (selectedOptions: Array<SelectOption>) => void;
  handleDistrictsChange: (selectedOptions: Array<SelectOption>) => void;
  handleCommunesChange: (selectedOptions: Array<SelectOption>) => void;
  openCoordinateModal: () => void;
  isLoadingDistricts: boolean;
  isLoadingCommunes: boolean;
};

const TimeLocationSection: React.FC<TimeLocationSectionProps> = ({
  timeData,
  adminData,
  coordinateData,
  disaster,
  provinceOptions,
  districtOptions,
  communeOptions,
  handleDateChange,
  handleProvincesChange,
  handleDistrictsChange,
  handleCommunesChange,
  openCoordinateModal,
  isLoadingDistricts,
  isLoadingCommunes,
}) => {
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return 'Chưa xác định';
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium text-gray-500 flex items-center mb-2">
          <Clock className="h-4 w-4 mr-1" /> Thời gian
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Thời gian bắt đầu:</Label>
            <DateTimePickerWrapper
              value={timeData.startDateTime}
              onChange={(value) => handleDateChange('startDateTime', value)}
              showTime={true}
              showClear={true}
              placeHolder="Chọn thời gian bắt đầu"
              className="w-full bg-white mb-3"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Thời gian kết thúc:</Label>
            <DateTimePickerWrapper
              value={timeData.endDateTime}
              onChange={(value) => handleDateChange('endDateTime', value)}
              showTime={true}
              showClear={true}
              placeHolder="Chọn thời gian kết thúc"
              className="w-full bg-white mb-3"
              minDate={timeData.startDateTime}
            />
            {timeData.endDateTime && timeData.startDateTime && timeData.endDateTime < timeData.startDateTime && (
              <p className="text-red-500 text-xs mt-1 mb-3">
                Thời gian kết thúc phải sau thời gian bắt đầu
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500">Thời gian tạo:</p>
            <p className="text-gray-800">{disaster ? formatDate(disaster.createdAt) : "-"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Cập nhật lần cuối:</p>
            <p className="text-gray-800">{disaster ? formatDate(disaster.updatedAt) : "-"}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 flex items-center mb-2">
          <MapPin className="h-4 w-4 mr-1" /> Vị trí
        </h3>
        {coordinateData && (
          <div className="mb-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs text-gray-500 mb-1">Tọa độ:</p>
                <p className="text-gray-800 font-medium">
                  {coordinateData.lat.toFixed(6)}, {coordinateData.lng.toFixed(6)}
                </p>
                <p className="text-xs text-gray-500 mt-1 mb-1">Địa chỉ:</p>
                <p className="text-gray-800">{coordinateData.address || "Không có địa chỉ"}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-500 border-blue-200 bg-blue-50 hover:bg-blue-100"
                onClick={openCoordinateModal}
              >
                <Edit className="h-3.5 w-3.5 mr-1" /> Sửa tọa độ
              </Button>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 flex items-center mb-2">
          <Building className="h-4 w-4 mr-1" /> Phạm vi hành chính
        </h3>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Tỉnh/Thành phố:</Label>
            <MultiSelect
              data={provinceOptions}
              value={adminData.selectedProvinces}
              onValueChange={handleProvincesChange}
              placeholder="Chọn tỉnh/thành phố"
              className="bg-white"
              popoverContentClassName="bg-white shadow-md"
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">Quận/Huyện:</Label>
            <MultiSelect
              data={districtOptions}
              value={adminData.selectedDistricts}
              onValueChange={handleDistrictsChange}
              placeholder={isLoadingDistricts ? "Đang tải..." : "Chọn quận/huyện"}
              className="bg-white"
              popoverContentClassName="bg-white shadow-md"
              disabled={adminData.selectedProvinces.length === 0 || isLoadingDistricts}
            />
          </div>
          <div className="pb-3">
            <Label className="text-xs text-gray-500 mb-1 block">Xã/Phường:</Label>
            <MultiSelect
              data={communeOptions}
              value={adminData.selectedCommunes}
              onValueChange={handleCommunesChange}
              placeholder={isLoadingCommunes ? "Đang tải..." : "Chọn xã/phường"}
              className="bg-white"
              popoverContentClassName="bg-white shadow-md"
              disabled={adminData.selectedDistricts.length === 0 || isLoadingCommunes}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeLocationSection; 