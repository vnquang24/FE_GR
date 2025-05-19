'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFindManyDisaster } from '@/generated/hooks/disaster';
import { useFindManyDataFieldOnDisaster } from '@/generated/hooks/data-field-on-disaster';
import dynamic from 'next/dynamic';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Định nghĩa các interface
interface Province {
  id: string;
  name: string;
}

interface District {
  id: string;
  name: string;
}

interface Commune {
  id: string;
  name: string;
}

interface DataField {
  id: string;
  code: string;
  name: string;
  unit: string;
  dataFieldGroup: string;
}

interface DataFieldOnDisaster {
  id: string;
  dataField: DataField;
  value: number;
}

// Dynamically import the Map component with no SSR
const MapWithNoSSR = dynamic(() => import('./components/map'), { 
  ssr: false,
  loading: () => <div className="h-[70vh] flex items-center justify-center bg-gray-100">
    <div className="animate-pulse h-[70vh] w-full bg-gray-200"></div>
  </div>
});

const ReportPage: React.FC = () => {
  const [selectedDisasterId, setSelectedDisasterId] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('map');

  // Fetch disasters for selection
  const { data: disasters, isLoading: isLoadingDisasters } = useFindManyDisaster({
    include: {
      disasterType: true,
      priorityLevel: true,
      emergencyLevel: true,
      coordinate: true,
      province: true,
      district: true,
      commune: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    where: {
      deleted: null,
    }
  });

  // Fetch data fields for selected disaster
  const { data: dataFields, isLoading: isLoadingDataFields } = useFindManyDataFieldOnDisaster({
    where: {
      disasterId: selectedDisasterId,
      deleted: null,
    },
    include: {
      dataField: true,
    }
  }, {
    enabled: !!selectedDisasterId,
  });

  const selectedDisaster = disasters?.find(disaster => disaster.id === selectedDisasterId);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen(prev => !prev);
  }, []);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullScreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={`transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Header with controls - hide in fullscreen except for exit button */}
      <div className={`p-4 flex flex-col gap-4 ${isFullScreen ? 'absolute right-4 top-4 z-10' : ''}`}>
        {!isFullScreen && (
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Báo Cáo Thảm Họa</h1>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                <label className="block mb-2 text-sm font-medium">Chọn thảm họa cần báo cáo</label>
                <Select 
                  value={selectedDisasterId} 
                  onValueChange={setSelectedDisasterId}
                  disabled={isLoadingDisasters}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thảm họa" />
                  </SelectTrigger>
                  <SelectContent>
                    {disasters?.map(disaster => (
                      <SelectItem key={disaster.id} value={disaster.id}>
                        {disaster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={toggleFullScreen} disabled={!selectedDisasterId}>
                  {isFullScreen ? 'Thoát Toàn Màn Hình' : 'Xem Toàn Màn Hình'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {isFullScreen && (
          <Button 
            variant="outline" 
            onClick={toggleFullScreen}
            className="bg-white"
          >
            Thoát Toàn Màn Hình
          </Button>
        )}
      </div>

      {/* Main content */}
      {selectedDisasterId ? (
        <div className={`${isFullScreen ? 'pt-0' : 'pt-4'}`}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className={isFullScreen ? 'hidden' : ''}>
            <TabsList className="mb-4">
              <TabsTrigger value="map">Bản đồ</TabsTrigger>
              <TabsTrigger value="details">Chi tiết thảm họa</TabsTrigger>
              <TabsTrigger value="data">Dữ liệu đo lường</TabsTrigger>
            </TabsList>
            
            <TabsContent value="map" className="pt-2">
              <MapWithNoSSR disaster={selectedDisaster} dataFields={dataFields} />
            </TabsContent>
            
            <TabsContent value="details" className="pt-2">
              <DisasterDetails disaster={selectedDisaster} />
            </TabsContent>
            
            <TabsContent value="data" className="pt-2">
              <DataFieldsTable dataFields={dataFields} isLoading={isLoadingDataFields} />
            </TabsContent>
          </Tabs>

          {/* Full screen mode - show map and overlay info */}
          {isFullScreen && (
            <div className="h-screen w-screen overflow-hidden relative">
              <MapWithNoSSR disaster={selectedDisaster} dataFields={dataFields} isFullScreen={true} />
              
              {/* Overlay with disaster info */}
              <div className="absolute left-4 top-4 w-96 max-w-[calc(100vw-32px)] bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                  {selectedDisaster?.name}
                  <Badge className="ml-2">{selectedDisaster?.disasterType?.name}</Badge>
                </h2>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Mức độ ưu tiên</p>
                    <p>{selectedDisaster?.priorityLevel?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Mức độ khẩn cấp</p>
                    <p>{selectedDisaster?.emergencyLevel?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Bắt đầu</p>
                    <p>{selectedDisaster?.startDateTime 
                      ? new Date(selectedDisaster.startDateTime).toLocaleString('vi-VN')
                      : 'Chưa xác định'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Kết thúc</p>
                    <p>{selectedDisaster?.endDateTime 
                      ? new Date(selectedDisaster.endDateTime).toLocaleString('vi-VN') 
                      : 'Đang diễn ra'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Dữ liệu quan trọng</p>
                  <div className="flex flex-wrap gap-2">
                    {dataFields?.slice(0, 3).map(field => (
                      <Badge key={field.id} variant="outline" className="flex items-center gap-1">
                        <span>{field.dataField.name}:</span>
                        <span className="font-bold">{field.value} {field.dataField.unit}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <p className="text-gray-500 mb-4">Vui lòng chọn một thảm họa để tiếp tục</p>
        </div>
      )}
    </div>
  );
};

// Component hiển thị chi tiết thảm họa
const DisasterDetails: React.FC<{ disaster: any }> = ({ disaster }) => {
  if (!disaster) return null;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Thông tin chung</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-4">
                <p className="text-gray-500">Tên thảm họa:</p>
                <p className="col-span-2 font-medium">{disaster.name}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <p className="text-gray-500">Loại thảm họa:</p>
                <p className="col-span-2">{disaster.disasterType?.name}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <p className="text-gray-500">Mức độ ưu tiên:</p>
                <p className="col-span-2">{disaster.priorityLevel?.name}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <p className="text-gray-500">Mức độ khẩn cấp:</p>
                <p className="col-span-2">{disaster.emergencyLevel?.name}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <p className="text-gray-500">Thời gian bắt đầu:</p>
                <p className="col-span-2">
                  {disaster.startDateTime 
                    ? new Date(disaster.startDateTime).toLocaleString('vi-VN')
                    : 'Chưa xác định'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <p className="text-gray-500">Thời gian kết thúc:</p>
                <p className="col-span-2">
                  {disaster.endDateTime 
                    ? new Date(disaster.endDateTime).toLocaleString('vi-VN')
                    : 'Đang diễn ra'}
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Thông tin vị trí</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-4">
                <p className="text-gray-500">Tọa độ:</p>
                <p className="col-span-2">
                  {disaster.coordinate ? `${disaster.coordinate.lat}, ${disaster.coordinate.lng}` : 'Không có'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <p className="text-gray-500">Địa chỉ:</p>
                <p className="col-span-2">{disaster.coordinate?.address || 'Không có'}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <p className="text-gray-500">Tỉnh/Thành phố:</p>
                <div className="col-span-2">
                  {disaster.province?.length > 0 
                    ? disaster.province.map((p: Province) => p.name).join(', ')
                    : 'Không có'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <p className="text-gray-500">Quận/Huyện:</p>
                <div className="col-span-2">
                  {disaster.district?.length > 0 
                    ? disaster.district.map((d: District) => d.name).join(', ')
                    : 'Không có'}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <p className="text-gray-500">Phường/Xã:</p>
                <div className="col-span-2">
                  {disaster.commune?.length > 0 
                    ? disaster.commune.map((c: Commune) => c.name).join(', ')
                    : 'Không có'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Component hiển thị dữ liệu đo lường
const DataFieldsTable: React.FC<{ dataFields: DataFieldOnDisaster[] | undefined, isLoading: boolean }> = ({ dataFields, isLoading }) => {
  if (isLoading) {
    return <div className="flex justify-center p-8"><span>Đang tải dữ liệu...</span></div>;
  }

  if (!dataFields || dataFields.length === 0) {
    return <div className="text-center p-8 text-gray-500">Không có dữ liệu đo lường cho thảm họa này</div>;
  }

  // Nhóm dữ liệu theo nhóm
  const groupedData = dataFields.reduce((acc: Record<string, DataFieldOnDisaster[]>, field: DataFieldOnDisaster) => {
    const group = field.dataField.dataFieldGroup || 'Khác';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(field);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groupedData).map(([group, fields]) => (
        <Card key={group}>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">{group}</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Mã</th>
                    <th className="py-2 px-4 text-left">Tên trường dữ liệu</th>
                    <th className="py-2 px-4 text-right">Giá trị</th>
                    <th className="py-2 px-4 text-left">Đơn vị</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field: DataFieldOnDisaster) => (
                    <tr key={field.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{field.dataField.code}</td>
                      <td className="py-2 px-4">{field.dataField.name}</td>
                      <td className="py-2 px-4 text-right font-medium">{field.value}</td>
                      <td className="py-2 px-4">{field.dataField.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ReportPage;