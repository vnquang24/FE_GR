'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  useFindUniqueDisaster, 
  useFindManyDisasterType, 
  useFindManyPriorityLevel, 
  useFindManyEmergencyLevel, 
  useFindManyProvince, 
  useFindManyDistrict, 
  useFindManyCommune, 
  useFindManyDataField,
  useFindManyRescueType
} from '@/generated/hooks';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Calendar, Globe, Info, MapPin, ArrowLeft, Image, Activity, Shield, Map, Save, Plus, Edit } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { getUserId } from '@/utils/auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';


// Import custom hooks
import { 
  useDisasterInfo, 
  useDataFields, 
  useRescueTypes, 
  useCoordinate 
} from '@/hooks/disaster-detail';

// Import components
import BasicInfoSection from '@/components/page/disaster-detail/BasicInfoSection';
import TimeLocationSection from '@/components/page/disaster-detail/TimeLocationSection';
import DisasterDataTab from '@/components/page/disaster-detail/tabs/DisasterDataTab';
import DataFieldDialog from '@/components/page/disaster-detail/dialogs/DataFieldDialog';
import DamageDataTab from '@/components/page/disaster-detail/tabs/DamageDataTab';
import RescueTypesTab from '@/components/page/disaster-detail/tabs/RescueTypesTab';
import ZonesTab from '@/components/page/disaster-detail/tabs/ZonesTab';
import RescueTypeDialog from '@/components/page/disaster-detail/dialogs/RescueTypeDialog';
import MediaTab from '@/components/page/disaster-detail/tabs/MediaTab';
import CoordinateDialog from '@/components/page/disaster-detail/dialogs/CoordinateDialog';
import ConfirmDialog from '@/components/common/dialog-confirm';

const DisasterDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const disasterId = params.id as string;
  const userID = getUserId();
  
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showMediaUploadDialog, setShowMediaUploadDialog] = useState(false);
  // Query prisma
  const { data: disaster, isLoading, error, refetch } = useFindUniqueDisaster({
    where: { id: disasterId },
    include: {
      disasterType: true,
      priorityLevel: true,
      emergencyLevel: true,
      coordinate: true,
      province: true,
      district: true,
      commune: true,
      zone: true,
      media: {
        include: {
          coordinates: true,
          user: true,
        }
      },
      dataFields: {
        include: {
          dataField: true
        }
      },
      rescueTypes: {
        include: {
          rescueType: true,
          unit: true
        }
      }
    }
  });

   const { data: disasterTypes } = useFindManyDisasterType({
    select: { id: true, name: true },
    where: { deleted: null }
  });

  const { data: priorityLevels } = useFindManyPriorityLevel({
    select: { id: true, name: true },
    where: { deleted: null }
  });

  const { data: emergencyLevels } = useFindManyEmergencyLevel({
    select: { id: true, name: true },
    where: { deleted: null }
  });

  const { data: provinces } = useFindManyProvince({
    select: { id: true, name: true },
    where: { deleted: null }
  });

  // Custom hook
  const {
    basicInfo,
    classification,
    timeData,
    adminData,
    handleInputChange,
    handleSelectChange,
    handleDateChange,
    handleProvincesChange,
    handleDistrictsChange,
    handleCommunesChange,
    saveChanges,
    resetForm
  } = useDisasterInfo(disasterId, disaster);

  const {
    dataFieldValues,
    showAddDataFieldDialog,
    setShowAddDataFieldDialog,
    selectedDataField,
    setSelectedDataField,
    newDataFieldValue,
    setNewDataFieldValue,
    activeTab,
    setActiveTab,
    handleDataFieldValueChange,
    addDataField,
    deleteDataField,
    saveAllDataFieldChanges,
    getDataFieldHierarchyName,
    showDeleteConfirmDialog,
    setShowDeleteConfirmDialog,
    deletingDataFieldId,
    confirmDeleteDataField
  } = useDataFields(disasterId, disaster?.dataFields || [], refetch);

  const {
    rescueTypeForm,
    showAddRescueDialog,
    setShowAddRescueDialog,
    resetRescueTypeForm,
    updateFormField,
    addOrUpdateRescue,
    editRescue,
    deleteRescue,
    getSortedRescueTypes
  } = useRescueTypes(disasterId, disaster?.rescueTypes || [], refetch);

  const {
    coordinateData,
    isCoordinateModalOpen,
    setIsCoordinateModalOpen,
    handleCoordinateChange,
    saveCoordinateChanges
  } = useCoordinate(disaster?.coordinate || null, refetch);

  // Function to handle media refresh after upload
  const handleMediaUploadSuccess = () => {
    refetch();
  };

 
  
  const districtQueryParams = useMemo(() => {
    const provinceIds = adminData.selectedProvinces || [];
    const initialDistrictIds = disaster?.district?.map(d => d.id) || [];
    const districtIds = [...new Set([...(disaster?.district?.map(d => d.provinceId) || []), ...provinceIds])]

    return {
        select: { id: true, name: true, provinceId: true },
        where: {
            deleted: null,
            OR: [
              { provinceId: { in: districtIds.length > 0 ? districtIds : undefined } },
              { id: { in: initialDistrictIds.length > 0 ? initialDistrictIds : undefined } }
            ]
        }
    };
  }, [adminData.selectedProvinces, disaster]);

  const communeQueryParams = useMemo(() => {
    const districtIds = adminData.selectedDistricts || [];
    const initialCommuneIds = disaster?.commune?.map(c => c.id) || [];
    const parentDistrictIds = [...new Set([...(disaster?.commune?.map(c => c.districtId) || []), ...districtIds])]
    
    return {
        select: { id: true, name: true, districtId: true },
        where: {
            deleted: null,
            OR: [
              { districtId: { in: parentDistrictIds.length > 0 ? parentDistrictIds : undefined } },
              { id: { in: initialCommuneIds.length > 0 ? initialCommuneIds : undefined } }
            ]
        }
    };
  }, [adminData.selectedDistricts, disaster]);

  const { data: districts, isLoading: isLoadingDistricts } = useFindManyDistrict(districtQueryParams, {
    enabled: !!disaster
  });
  const { data: communes, isLoading: isLoadingCommunes } = useFindManyCommune(communeQueryParams, {
    enabled: !!disaster
  });
  
  const { data: availableDataFields } = useFindManyDataField({
    where: { deleted: null },
    select: { id: true, name: true, code: true, unit: true, dataFieldGroup: true, parentId: true },
    orderBy: {
      dataFieldGroup: 'asc',
    }
  });

  const { data: rescueTypes } = useFindManyRescueType({
    select: { id: true, name: true },
    where: { deleted: null }
  });

  const disasterTypeOptions = useMemo(() =>
    disasterTypes?.map(type => ({ value: type.id, label: type.name })) || [],
    [disasterTypes]
  );

  const priorityLevelOptions = useMemo(() =>
    priorityLevels?.map(level => ({ value: level.id, label: level.name })) || [],
    [priorityLevels]
  );

  const emergencyLevelOptions = useMemo(() =>
    emergencyLevels?.map(level => ({ value: level.id, label: level.name })) || [],
    [emergencyLevels]
  );

  const provinceOptions = useMemo(() =>
    provinces?.map(province => ({ value: province.id, label: province.name })) || [],
    [provinces]
  );

  const districtOptions = useMemo(() =>
    districts?.map(district => ({ value: district.id, label: district.name })) || [],
    [districts]
  );

  const communeOptions = useMemo(() =>
    communes?.map(commune => ({ value: commune.id, label: commune.name })) || [],
    [communes]
  );

  const rescueTypeOptions = useMemo(() =>
    rescueTypes?.map(type => ({ value: type.id, label: type.name })) || [],
    [rescueTypes]
  );
  
  const handleSaveAllChanges = async () => {
    try {
      const basicInfoSaved = await saveChanges();
      const dataFieldsSaved = await saveAllDataFieldChanges();
      if (basicInfoSaved && dataFieldsSaved) {
        toast.success({
          title: "Thành công",
          description: "Đã cập nhật tất cả thông tin thảm họa"
        });
      }
    } catch (error: any) {
      console.error("Lỗi khi cập nhật dữ liệu:", error);
      toast.error({
        title: "Lỗi",
        description: `Không thể cập nhật: ${error.message || 'Đã xảy ra lỗi'}`
      });
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    setShowConfirmDialog(false);
  };

  const handleBack = () => {
    router.push('/operation/disaster');
  };

  const existingDataFieldIds = disaster?.dataFields?.map(field => field.dataFieldId) || [];

  const getStatusIndicator = (disaster: any) => {
    const now = new Date();
    const start = disaster.startDateTime ? new Date(disaster.startDateTime) : null;
    const end = disaster.endDateTime ? new Date(disaster.endDateTime) : null;

    if (!start) {
      return <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm">Chưa bắt đầu</span>;
    } else if (!end) {
      return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm">Đang diễn ra</span>;
    } else if (end < now) {
      return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">Đã kết thúc</span>;
    } else {
      return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">Kết thúc dự kiến</span>;
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-lg text-gray-700">Đang tải thông tin thảm họa...</span>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-red-500">
        <AlertTriangle className="h-16 w-16 mb-4" />
        <div className="text-xl font-semibold">Đã xảy ra lỗi</div>
        <div className="mt-2">{error.message}</div>
        <Button
          variant="outline"
          className="mt-6"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
      </div>
    );
  }

  // Render not found state
  if (!disaster) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-yellow-500">
        <AlertTriangle className="h-16 w-16 mb-4" />
        <div className="text-xl font-semibold">Không tìm thấy thảm họa</div>
        <div className="mt-2">Thảm họa với ID này không tồn tại hoặc đã bị xóa.</div>
        <Button
          variant="outline"
          className="mt-6"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
        </Button>
      </div>
    );
  }

  // Main render
  return (
    <div className="w-full mx-auto p-2 sm:p-4">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="mr-4"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <h1 className="text-2xl font-bold text-gray-800 flex-1">
          <div className="font-bold text-xl">
            {basicInfo.name}
          </div>
        </h1>
        <Button
          variant={"default"}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white ml-2"
          onClick={handleSaveAllChanges}
        >
          <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
        </Button>
      </div>

      <Card className="shadow-md rounded-lg mb-4">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-3 rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-blue-500 mr-2" />
              <CardTitle className="text-lg text-gray-800">Thông tin cơ bản</CardTitle>
            </div>
            <div>{getStatusIndicator(disaster)}</div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 pb-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
            <BasicInfoSection 
              basicInfo={basicInfo}
              classification={classification}
              disasterTypeOptions={disasterTypeOptions}
              priorityLevelOptions={priorityLevelOptions}
              emergencyLevelOptions={emergencyLevelOptions}
              handleInputChange={handleInputChange}
              handleSelectChange={handleSelectChange}
            />

            <TimeLocationSection 
              timeData={timeData}
              adminData={adminData}
              coordinateData={coordinateData}
              disaster={disaster}
              provinceOptions={provinceOptions}
              districtOptions={districtOptions}
              communeOptions={communeOptions}
              handleDateChange={handleDateChange}
              handleProvincesChange={handleProvincesChange}
              handleDistrictsChange={handleDistrictsChange}
              handleCommunesChange={handleCommunesChange}
              openCoordinateModal={() => setIsCoordinateModalOpen(true)}
              isLoadingDistricts={isLoadingDistricts}
              isLoadingCommunes={isLoadingCommunes}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="disasterData" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-5 gap-2 mb-4">
          <TabsTrigger 
            value="disasterData" 
            className="flex items-center bg-blue-300 text-black rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white transition-colors text-base font-medium"
          >
            <Activity className="h-4 w-4 mr-2" /> Số liệu thảm họa
          </TabsTrigger>
          <TabsTrigger 
            value="damageData" 
            className="flex items-center bg-orange-300 text-black rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-colors text-base font-medium"
          >
            <AlertTriangle className="h-4 w-4 mr-2" /> Thiệt hại từ thảm họa
          </TabsTrigger>
          <TabsTrigger 
            value="rescueTypes" 
            className="flex items-center bg-green-300 text-black rounded-lg data-[state=active]:bg-green-500 data-[state=active]:text-white transition-colors text-base font-medium"
          >
            <Shield className="h-4 w-4 mr-2" /> Thông tin cứu hộ
          </TabsTrigger>
          <TabsTrigger 
            value="media" 
            className="flex items-center bg-red-300 text-black rounded-lg data-[state=active]:bg-red-500 data-[state=active]:text-white transition-colors text-base font-medium"
          >
            <Image className="h-4 w-4 mr-2" /> Hình ảnh & Media
          </TabsTrigger>
          <TabsTrigger 
            value="zones" 
            className="flex items-center bg-purple-300 text-black rounded-lg data-[state=active]:bg-purple-500 data-[state=active]:text-white transition-colors text-base font-medium"
          >
            <Map className="h-4 w-4 mr-2" /> Khu vực & Vùng ảnh hưởng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="disasterData">
          <DisasterDataTab 
            dataFields={disaster.dataFields || []}
            dataFieldValues={dataFieldValues}
            availableDataFields={availableDataFields}
            handleDataFieldValueChange={handleDataFieldValueChange}
            handleDeleteDataField={deleteDataField}
            getDataFieldHierarchyName={(id) => getDataFieldHierarchyName(id, availableDataFields || [])}
            setShowAddDataFieldDialog={setShowAddDataFieldDialog}
            setActiveTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="damageData">
          <DamageDataTab 
            dataFields={disaster.dataFields || []}
            dataFieldValues={dataFieldValues}
            availableDataFields={availableDataFields}
            handleDataFieldValueChange={handleDataFieldValueChange}
            handleDeleteDataField={deleteDataField}
            getDataFieldHierarchyName={(id) => getDataFieldHierarchyName(id, availableDataFields || [])}
            setShowAddDataFieldDialog={setShowAddDataFieldDialog}
            setActiveTab={setActiveTab}
          />
        </TabsContent>

        <TabsContent value="rescueTypes">
          <RescueTypesTab 
            rescueTypes={getSortedRescueTypes()}
            handleAddRescue={() => setShowAddRescueDialog(true)}
            handleEditRescue={editRescue}
            handleDeleteRescue={deleteRescue}
          />
        </TabsContent>

        <TabsContent value="media">
          <MediaTab 
            disaster={disaster}
            userID={userID || ''}
            showMediaUploadDialog={showMediaUploadDialog}
            setShowMediaUploadDialog={setShowMediaUploadDialog}
            handleMediaUploadSuccess={handleMediaUploadSuccess}
          />
        </TabsContent>

        <TabsContent value="zones">
          <ZonesTab 
            zones={disaster.zone || []}
            onNavigateToZoneManagement={() => router.push('/operation/zone')}
          />
        </TabsContent>
      </Tabs>

      <div className="mt-4 border-t pt-3 pb-2 flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
        </Button>
      </div>

      {/* DataField Dialog */}
      <DataFieldDialog 
        open={showAddDataFieldDialog}
        onOpenChange={setShowAddDataFieldDialog}
        selectedDataField={selectedDataField}
        setSelectedDataField={setSelectedDataField}
        newDataFieldValue={newDataFieldValue}
        setNewDataFieldValue={setNewDataFieldValue}
        activeTab={activeTab}
        addDataField={addDataField}
        availableDataFields={availableDataFields}
        existingDataFieldIds={existingDataFieldIds}
        getDataFieldHierarchyName={(id) => getDataFieldHierarchyName(id, availableDataFields || [])}
      />

      {/* Dialog xác nhận khi hủy chỉnh sửa */}
      <ConfirmDialog 
        type="warning"
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Xác nhận hủy chỉnh sửa"
        description="Bạn có chắc chắn muốn hủy các thay đổi? Mọi thay đổi sẽ không được lưu."
        onConfirm={handleCancelEdit}
        confirmText="Hủy thay đổi"
        cancelText="Tiếp tục chỉnh sửa"
      />

      {/* Dialog chỉnh sửa tọa độ */}
      <CoordinateDialog 
        open={isCoordinateModalOpen}
        onOpenChange={setIsCoordinateModalOpen}
        coordinateData={coordinateData}
        onCoordinateChange={handleCoordinateChange}
        onSave={saveCoordinateChanges}
      />

      {/* Rescue Type Dialog */}
      <RescueTypeDialog 
        open={showAddRescueDialog}
        onOpenChange={setShowAddRescueDialog}
        rescueTypeForm={rescueTypeForm}
        updateFormField={updateFormField}
        resetRescueTypeForm={resetRescueTypeForm}
        addOrUpdateRescue={addOrUpdateRescue}
        rescueTypeOptions={rescueTypeOptions}
        availableDataFields={availableDataFields}
      />

      {/* Dialog xác nhận xóa data field */}
      <ConfirmDialog 
        type="delete"
        open={showDeleteConfirmDialog}
        onOpenChange={setShowDeleteConfirmDialog}
        title="Xác nhận xóa trường dữ liệu"
        description="Bạn có chắc chắn muốn xóa trường dữ liệu này? Hành động này không thể hoàn tác."
        onConfirm={confirmDeleteDataField}
        confirmText="Xóa"
        cancelText="Hủy"
      />
    </div>
  );
};

export default DisasterDetailPage;
