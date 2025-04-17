'use client';
import React, { useState, useEffect } from 'react';
import { useFindManyProvince } from '@/generated/hooks/province';
import { useFindManyDistrict } from '@/generated/hooks/district';
import { useFindManyCommune } from '@/generated/hooks/commune';
import { useUpdateProvince } from '@/generated/hooks/province';
import { useUpdateDistrict } from '@/generated/hooks/district';
import { useUpdateCommune } from '@/generated/hooks/commune';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Search, Edit, Check, X, MapPin, Building2, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const AdministrativeUnitPage: React.FC = () => {
  // State cho dữ liệu
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [selectedCommuneId, setSelectedCommuneId] = useState<string | null>(null);
  
  // State cho thông tin đã chọn
  const [selectedProvinceName, setSelectedProvinceName] = useState<string | null>(null);
  const [selectedDistrictName, setSelectedDistrictName] = useState<string | null>(null);
  const [selectedCommuneName, setSelectedCommuneName] = useState<string | null>(null);
  
  // State cho tìm kiếm
  const [provinceSearch, setProvinceSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [communeSearch, setCommuneSearch] = useState('');
  
  // State cho chỉnh sửa
  const [editingProvinceId, setEditingProvinceId] = useState<string | null>(null);
  const [editingDistrictId, setEditingDistrictId] = useState<string | null>(null);
  const [editingCommuneId, setEditingCommuneId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  // State cho phân trang
  const [provincePage, setProvincePage] = useState(0);
  const [districtPage, setDistrictPage] = useState(0);
  const [communePage, setCommunePage] = useState(0);
  const ITEMS_PER_PAGE = 10;
  
  // Lấy dữ liệu tỉnh/thành phố
  const { data: provinces = [], isLoading: isLoadingProvinces } = useFindManyProvince({
    where: {
      name: {
        contains: provinceSearch,
        mode: 'insensitive'
      }
    },
    orderBy: {
      name: 'asc'
    },
    skip: provincePage * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE
  });
  
  // Lấy dữ liệu quận/huyện dựa trên tỉnh đã chọn
  const { data: districts = [], isLoading: isLoadingDistricts } = useFindManyDistrict({
    where: {
      provinceId: selectedProvinceId || undefined,
      name: {
        contains: districtSearch,
        mode: 'insensitive'
      }
    },
    orderBy: {
      name: 'asc'
    },
    skip: districtPage * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE
  }, {
    enabled: !!selectedProvinceId
  });
  
  // Lấy dữ liệu phường/xã dựa trên quận/huyện đã chọn
  const { data: communes = [], isLoading: isLoadingCommunes } = useFindManyCommune({
    where: {
      districtId: selectedDistrictId || undefined,
      name: {
        contains: communeSearch,
        mode: 'insensitive'
      }
    },
    orderBy: {
      name: 'asc'
    },
    skip: communePage * ITEMS_PER_PAGE,
    take: ITEMS_PER_PAGE
  }, {
    enabled: !!selectedDistrictId
  });
  
  // Mutation để cập nhật tên
  const updateProvinceMutation = useUpdateProvince();
  const updateDistrictMutation = useUpdateDistrict();
  const updateCommuneMutation = useUpdateCommune();
  
  // Xử lý khi chọn tỉnh/thành phố
  const handleProvinceSelect = (provinceId: string, provinceName: string) => {
    setSelectedProvinceId(provinceId);
    setSelectedProvinceName(provinceName);
    setSelectedDistrictId(null);
    setSelectedDistrictName(null);
    setSelectedCommuneId(null);
    setSelectedCommuneName(null);
    setDistrictPage(0);
    setCommunePage(0);
  };
  
  // Xử lý khi chọn quận/huyện
  const handleDistrictSelect = (districtId: string, districtName: string) => {
    setSelectedDistrictId(districtId);
    setSelectedDistrictName(districtName);
    setSelectedCommuneId(null);
    setSelectedCommuneName(null);
    setCommunePage(0);
  };
  
  // Xử lý khi chọn phường/xã
  const handleCommuneSelect = (communeId: string, communeName: string) => {
    setSelectedCommuneId(communeId);
    setSelectedCommuneName(communeName);
  };
  
  // Xử lý khi bắt đầu chỉnh sửa
  const handleStartEdit = (id: string, type: 'province' | 'district' | 'commune', name: string) => {
    setEditingName(name);
    
    if (type === 'province') {
      setEditingProvinceId(id);
      setEditingDistrictId(null);
      setEditingCommuneId(null);
    } else if (type === 'district') {
      setEditingProvinceId(null);
      setEditingDistrictId(id);
      setEditingCommuneId(null);
    } else {
      setEditingProvinceId(null);
      setEditingDistrictId(null);
      setEditingCommuneId(id);
    }
  };
  
  // Xử lý khi lưu chỉnh sửa
  const handleSaveEdit = async () => {
    try {
      if (editingProvinceId) {
        await updateProvinceMutation.mutateAsync({
          where: { id: editingProvinceId },
          data: { name: editingName }
        });
        
        // Cập nhật tên đã chọn nếu đang chỉnh sửa tỉnh đã chọn
        if (selectedProvinceId === editingProvinceId) {
          setSelectedProvinceName(editingName);
        }
      } else if (editingDistrictId) {
        await updateDistrictMutation.mutateAsync({
          where: { id: editingDistrictId },
          data: { name: editingName }
        });
        
        // Cập nhật tên đã chọn nếu đang chỉnh sửa quận/huyện đã chọn
        if (selectedDistrictId === editingDistrictId) {
          setSelectedDistrictName(editingName);
        }
      } else if (editingCommuneId) {
        await updateCommuneMutation.mutateAsync({
          where: { id: editingCommuneId },
          data: { name: editingName }
        });
        
        // Cập nhật tên đã chọn nếu đang chỉnh sửa phường/xã đã chọn
        if (selectedCommuneId === editingCommuneId) {
          setSelectedCommuneName(editingName);
        }
      }
      
      // Reset trạng thái chỉnh sửa
      setEditingProvinceId(null);
      setEditingDistrictId(null);
      setEditingCommuneId(null);
      setEditingName('');
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
    }
  };
  
  // Xử lý khi hủy chỉnh sửa
  const handleCancelEdit = () => {
    setEditingProvinceId(null);
    setEditingDistrictId(null);
    setEditingCommuneId(null);
    setEditingName('');
  };
  
  // Xử lý chuyển trang trước
  const handlePreviousPage = (type: 'province' | 'district' | 'commune') => {
    if (type === 'province' && provincePage > 0) {
      setProvincePage(provincePage - 1);
    } else if (type === 'district' && districtPage > 0) {
      setDistrictPage(districtPage - 1);
    } else if (type === 'commune' && communePage > 0) {
      setCommunePage(communePage - 1);
    }
  };
  
  // Xử lý chuyển trang sau
  const handleNextPage = (type: 'province' | 'district' | 'commune') => {
    if (type === 'province' && provinces.length === ITEMS_PER_PAGE) {
      setProvincePage(provincePage + 1);
    } else if (type === 'district' && districts.length === ITEMS_PER_PAGE) {
      setDistrictPage(districtPage + 1);
    } else if (type === 'commune' && communes.length === ITEMS_PER_PAGE) {
      setCommunePage(communePage + 1);
    }
  };
  
  // Reset trang khi thay đổi tìm kiếm
  useEffect(() => {
    setProvincePage(0);
  }, [provinceSearch]);
  
  useEffect(() => {
    setDistrictPage(0);
  }, [districtSearch]);
  
  useEffect(() => {
    setCommunePage(0);
  }, [communeSearch]);
  
  return (
    <div className="container mx-auto py-3">
      {/* Header với thông tin đã chọn */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-lg mb-3 shadow-lg">
        <h1 className="text-2xl font-bold text-white mb-2">Quản lý Đơn vị Hành chính</h1>
        <div className="flex items-center space-x-2 text-white">
          {selectedProvinceName ? (
            <>
              <Badge variant="outline" className="bg-blue-600 text-white border-blue-400 px-3 py-1 flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                {selectedProvinceName}
              </Badge>
              
              {selectedDistrictName && (
                <>
                  <ChevronRight className="h-4 w-4 text-blue-200" />
                  <Badge variant="outline" className="bg-indigo-600 text-white border-indigo-400 px-3 py-1 flex items-center">
                    <Building2 className="h-3 w-3 mr-1" />
                    {selectedDistrictName}
                  </Badge>
                </>
              )}
              
              {selectedCommuneName && (
                <>
                  <ChevronRight className="h-4 w-4 text-blue-200" />
                  <Badge variant="outline" className="bg-purple-600 text-white border-purple-400 px-3 py-1 flex items-center">
                    <Home className="h-3 w-3 mr-1" />
                    {selectedCommuneName}
                  </Badge>
                </>
              )}
            </>
          ) : (
            <span className="text-blue-100">Vui lòng chọn đơn vị hành chính</span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {/* Cột Tỉnh/Thành phố */}
        <Card className="border-blue-200 shadow-md hover:shadow-lg transition-shadow duration-300">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="flex items-center text-blue-700 mb-2">
              <MapPin className="h-5 w-5 mr-2" />
              Tỉnh/Thành phố
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm tỉnh/thành phố..."
                className="pl-8 border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                value={provinceSearch}
                onChange={(e) => setProvinceSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="h-[60vh] overflow-y-auto p-0">
            {isLoadingProvinces ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : provinces.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {provinces.map((province) => (
                  <li 
                    key={province.id}
                    className={`p-3 flex justify-between items-center cursor-pointer transition-colors duration-200 ${
                      selectedProvinceId === province.id 
                        ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-500' 
                        : 'hover:bg-blue-50'
                    }`}
                    onClick={() => handleProvinceSelect(province.id, province.name)}
                  >
                    {editingProvinceId === province.id ? (
                      <div className="flex items-center w-full">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="mr-2 border-blue-300"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 hover:bg-green-50">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="text-red-600 hover:text-red-800 hover:bg-red-50">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 truncate">{province.name}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(province.id, 'province', province.name);
                          }}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Không tìm thấy tỉnh/thành phố nào
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-3 bg-gradient-to-r from-blue-50 to-blue-100">
            <div className="text-sm text-blue-700 font-medium">
              Trang {provincePage + 1}
            </div>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handlePreviousPage('province')}
                disabled={provincePage === 0}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleNextPage('province')}
                disabled={provinces.length < ITEMS_PER_PAGE}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {/* Cột Quận/Huyện */}
        <Card className={`border-indigo-200 shadow-md hover:shadow-lg transition-shadow duration-300 ${!selectedProvinceId ? 'opacity-75' : ''}`}>
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100 border-b">
            <CardTitle className="flex items-center text-indigo-700 mb-2">
              <Building2 className="h-5 w-5 mr-2" />
              Quận/Huyện
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm quận/huyện..."
                className="pl-8 border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400"
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                disabled={!selectedProvinceId}
              />
            </div>
          </CardHeader>
          <CardContent className="h-[60vh] overflow-y-auto p-0">
            {!selectedProvinceId ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                <Building2 className="h-12 w-12 text-indigo-200 mb-2" />
                <p>Vui lòng chọn tỉnh/thành phố để xem danh sách quận/huyện</p>
              </div>
            ) : isLoadingDistricts ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            ) : districts.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {districts.map((district) => (
                  <li 
                    key={district.id}
                    className={`p-3 flex justify-between items-center cursor-pointer transition-colors duration-200 ${
                      selectedDistrictId === district.id 
                        ? 'bg-indigo-100 text-indigo-800 border-l-4 border-indigo-500' 
                        : 'hover:bg-indigo-50'
                    }`}
                    onClick={() => handleDistrictSelect(district.id, district.name)}
                  >
                    {editingDistrictId === district.id ? (
                      <div className="flex items-center w-full">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="mr-2 border-indigo-300"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 hover:bg-green-50">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="text-red-600 hover:text-red-800 hover:bg-red-50">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 truncate">{district.name}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(district.id, 'district', district.name);
                          }}
                          className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Không tìm thấy quận/huyện nào
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-3 bg-gradient-to-r from-indigo-50 to-indigo-100">
            <div className="text-sm text-indigo-700 font-medium">
              {selectedProvinceId ? `Trang ${districtPage + 1}` : "Chưa chọn tỉnh/thành phố"}
            </div>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handlePreviousPage('district')}
                disabled={!selectedProvinceId || districtPage === 0}
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleNextPage('district')}
                disabled={!selectedProvinceId || districts.length < ITEMS_PER_PAGE}
                className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        {/* Cột Phường/Xã */}
        <Card className={`border-purple-200 shadow-md hover:shadow-lg transition-shadow duration-300 ${!selectedDistrictId ? 'opacity-75' : ''}`}>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="flex items-center text-purple-700 mb-2">
              <Home className="h-5 w-5 mr-2" />
              Phường/Xã/Thị trấn
            </CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm phường/xã..."
                className="pl-8 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                value={communeSearch}
                onChange={(e) => setCommuneSearch(e.target.value)}
                disabled={!selectedDistrictId}
              />
            </div>
          </CardHeader>
          <CardContent className="h-[60vh] overflow-y-auto p-0">
            {!selectedDistrictId ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
                <Home className="h-12 w-12 text-purple-200 mb-2" />
                <p>Vui lòng chọn quận/huyện để xem danh sách phường/xã</p>
              </div>
            ) : isLoadingCommunes ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : communes.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {communes.map((commune) => (
                  <li 
                    key={commune.id}
                    className={`p-3 flex justify-between items-center cursor-pointer transition-colors duration-200 ${
                      selectedCommuneId === commune.id 
                        ? 'bg-purple-100 text-purple-800 border-l-4 border-purple-500' 
                        : 'hover:bg-purple-50'
                    }`}
                    onClick={() => handleCommuneSelect(commune.id, commune.name)}
                  >
                    {editingCommuneId === commune.id ? (
                      <div className="flex items-center w-full"> 
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="mr-2 border-purple-300"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" onClick={handleSaveEdit} className="text-green-600 hover:text-green-800 hover:bg-green-50">
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="text-red-600 hover:text-red-800 hover:bg-red-50">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 truncate">{commune.name}</span>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(commune.id, 'commune', commune.name);
                          }}
                          className="text-purple-600 hover:text-purple-800 hover:bg-purple-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Không tìm thấy phường/xã nào
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-3 bg-gradient-to-r from-purple-50 to-purple-100">
            <div className="text-sm text-purple-700 font-medium">
              {selectedDistrictId ? `Trang ${communePage + 1}` : "Chưa chọn quận/huyện"}
            </div>
            <div className="flex space-x-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handlePreviousPage('commune')}
                disabled={!selectedDistrictId || communePage === 0}
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleNextPage('commune')}
                disabled={!selectedDistrictId || communes.length < ITEMS_PER_PAGE}
                className="border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AdministrativeUnitPage;