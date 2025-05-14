'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  useFindManyDisaster,
  useFindManyDisasterType,
  useFindManyProvince,
  useFindManyDataField,
  useFindManyEmergencyLevel,
  useFindManyPriorityLevel,
} from '@/generated/hooks';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { TableWrapper } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultiSelect } from '@/components/ui/multi-select';
import { Badge } from '@/components/ui/badge';
import DateTimePickerWrapper from '@/components/wrapper/date-time-picker';
import { Label } from '@/components/ui/label';
import {
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Info,
  Loader2,
  Calendar,
  MapPin,
  Filter,
  RefreshCw,
  Siren,
  BarChart,
  PieChart,
  LineChart,
  Building,
  AlertCircle,
  Shield,
  UserRound,
  Home,
  X,
  Clock
} from 'lucide-react';
import { format, subMonths, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';

// Type definitions for statistics
type DisasterSummary = {
  total: number;
  active: number;
  completed: number;
  pending: number;
  trend: number; // Percentage change
};

type DisasterTypeData = {
  name: string;
  count: number;
  color: string;
};

type ProvinceData = {
  id: string;
  name: string;
  count: number;
};

type TimelineData = {
  date: string;
  count: number;
};

type ImpactMetrics = {
  affected: number;
  casualties: number;
  evacuated: number;
  damagedStructures: number;
  economicLoss: number;
};

// Định nghĩa kiểu dữ liệu cho điều kiện tìm kiếm
interface DisasterSearchCondition {
  deleted: null | boolean;
  AND?: Array<{
    startDateTime?: { gte?: Date } | { lte?: Date };
    disasterTypeId?: { in: string[] };
    province?: { some: { id: { in: string[] } } };
    emergencyLevelId?: { in: string[] };
    priorityLevelId?: { in: string[] };
  }>;
}

// Helper function to generate random color - will be replaced with your color scheme
const getRandomColor = (): string => {
  const colors = [
    'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500',
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Mảng màu cố định cho các loại thảm họa
const DISASTER_TYPE_COLORS = [
  'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500',
  'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500',
  'bg-orange-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-lime-500',
  'bg-fuchsia-500', 'bg-rose-500', 'bg-amber-500', 'bg-sky-500'
];

// Hàm lấy màu dựa vào id của loại thảm họa
const getDisasterTypeColor = (disasterTypeId: string): string => {
  // Sử dụng hàm hash đơn giản để chuyển đổi id thành số nguyên
  let hashNum = 0;
  for (let i = 0; i < disasterTypeId.length; i++) {
    hashNum += disasterTypeId.charCodeAt(i);
  }
  return DISASTER_TYPE_COLORS[hashNum % DISASTER_TYPE_COLORS.length];
};

const DisasterStatisticsPage: React.FC = () => {
  // State for filters
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [timeRange, setTimeRange] = useState<string>('all'); // Default 30 days -> Đã sửa thành 'all'
  const [startDate, setStartDate] = useState<Date | undefined>(undefined); // Sửa thành undefined để lấy tất cả dữ liệu
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedDisasterTypes, setSelectedDisasterTypes] = useState<string[]>([]);
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([]);
  const [selectedEmergencyLevels, setSelectedEmergencyLevels] = useState<string[]>([]);
  const [selectedPriorityLevels, setSelectedPriorityLevels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Cài đặt thời gian cho biểu đồ diễn biến
  const [chartTimeRange, setChartTimeRange] = useState<string>('months'); // 'months', 'weeks', 'days', 'custom'
  const [chartMonthCount, setChartMonthCount] = useState<number>(12);
  const [chartCustomStartDate, setChartCustomStartDate] = useState<Date | undefined>(subMonths(new Date(), 3));
  const [chartCustomEndDate, setChartCustomEndDate] = useState<Date | undefined>(new Date());
  const [showChartDatePicker, setShowChartDatePicker] = useState<boolean>(false);

  // Function to handle chart time range change
  const handleChartTimeRangeChange = (value: string) => {
    setChartTimeRange(value);
    if (value === 'custom') {
      setShowChartDatePicker(true);
    } else {
      setShowChartDatePicker(false);
    }
  };

  // Build filter conditions
  const searchCondition = useMemo(() => {
    const condition: DisasterSearchCondition = { deleted: null };

    // Add date filters
    if (startDate) {
      condition.AND = condition.AND || [];
      condition.AND.push({
        startDateTime: { gte: startDate }
      });
    }

    if (endDate) {
      condition.AND = condition.AND || [];
      condition.AND.push({
        startDateTime: { lte: endDate }
      });
    }

    // Add disaster type filter
    if (selectedDisasterTypes.length > 0) {
      condition.AND = condition.AND || [];
      condition.AND.push({
        disasterTypeId: { in: selectedDisasterTypes }
      });
    }

    // Add provinces filter
    if (selectedProvinces.length > 0) {
      condition.AND = condition.AND || [];
      condition.AND.push({
        province: {
          some: {
            id: { in: selectedProvinces }
          }
        }
      });
    }

    // Add emergency level filter
    if (selectedEmergencyLevels.length > 0) {
      condition.AND = condition.AND || [];
      condition.AND.push({
        emergencyLevelId: { in: selectedEmergencyLevels }
      });
    }

    // Add priority level filter
    if (selectedPriorityLevels.length > 0) {
      condition.AND = condition.AND || [];
      condition.AND.push({
        priorityLevelId: { in: selectedPriorityLevels }
      });
    }

    return condition;
  }, [startDate, endDate, selectedDisasterTypes, selectedProvinces, selectedEmergencyLevels, selectedPriorityLevels]);

  // Fetch disasters with filters
  const { data: disasters, isLoading: isLoadingDisasters, refetch: refetchDisasters } = useFindManyDisaster({
    where: {
      ...searchCondition,
      deleted: null,
    },
    include: {
      disasterType: true,
      priorityLevel: true,
      emergencyLevel: true,
      province: true,
      dataFields: {
        include: {
          dataField: true
        }
      }
    }
  });

  // Fetch reference data
  const { data: disasterTypes } = useFindManyDisasterType({
    where: { deleted: null }
  });

  const { data: provinces } = useFindManyProvince({
    where: { deleted: null }
  });

  const { data: emergencyLevels } = useFindManyEmergencyLevel({
    where: { deleted: null }
  });

  const { data: priorityLevels } = useFindManyPriorityLevel({
    where: { deleted: null }
  });

  // Fetch all data fields
  const { data: dataFields } = useFindManyDataField({
    where: {
      dataFieldGroup: "disaster",
      deleted: null
    }
  });

  // Calculate disaster summary statistics
  const disasterSummary: DisasterSummary = useMemo(() => {
    if (!disasters) {
      return {
        total: 0,
        active: 0,
        completed: 0,
        pending: 0,
        trend: 0
      };
    }

    const now = new Date();
    const active = disasters.filter(d =>
      d.startDateTime && (!d.endDateTime || new Date(d.endDateTime) > now)
    ).length;

    const completed = disasters.filter(d =>
      d.endDateTime && new Date(d.endDateTime) <= now
    ).length;

    const pending = disasters.filter(d =>
      !d.startDateTime || new Date(d.startDateTime) > now
    ).length;

    // Calculate trend (percentage change in last month)
    const oneMonthAgo = subMonths(now, 1);
    const twoMonthsAgo = subMonths(now, 2);

    const disastersLastMonth = disasters.filter(d =>
      d.startDateTime && new Date(d.startDateTime) >= oneMonthAgo && new Date(d.startDateTime) <= now
    ).length;

    const disastersPreviousMonth = disasters.filter(d =>
      d.startDateTime && new Date(d.startDateTime) >= twoMonthsAgo && new Date(d.startDateTime) < oneMonthAgo
    ).length;

    let trend = 0;
    if (disastersPreviousMonth > 0) {
      trend = ((disastersLastMonth - disastersPreviousMonth) / disastersPreviousMonth) * 100;
    } else if (disastersLastMonth > 0) {
      trend = 100;
    }

    return {
      total: disasters.length,
      active,
      completed,
      pending,
      trend
    };
  }, [disasters]);

  // Calculate disaster type statistics
  const disasterTypeStats: DisasterTypeData[] = useMemo(() => {
    if (!disasters || !disasterTypes) {
      return [];
    }

    const counts: Record<string, { name: string; count: number; color: string }> = {};

    disasterTypes.forEach(type => {
      counts[type.id] = {
        name: type.name,
        count: 0,
        color: getDisasterTypeColor(type.id)
      };
    });

    disasters.forEach(disaster => {
      if (disaster.disasterTypeId && counts[disaster.disasterTypeId]) {
        counts[disaster.disasterTypeId].count += 1;
      }
    });

    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [disasters, disasterTypes]);

  // Calculate province statistics
  const provinceStats: ProvinceData[] = useMemo(() => {
    if (!disasters || !provinces) {
      return [];
    }

    const counts: Record<string, { id: string, name: string; count: number }> = {};

    provinces.forEach(province => {
      counts[province.id] = {
        id: province.id,
        name: province.name,
        count: 0
      };
    });

    disasters.forEach(disaster => {
      if (disaster.province) {
        disaster.province.forEach(province => {
          if (counts[province.id]) {
            counts[province.id].count += 1;
          }
        });
      }
    });

    return Object.values(counts)
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [disasters, provinces]);

  // Calculate timeline data based on selected time range
  const timelineData: TimelineData[] = useMemo(() => {
    if (!disasters) {
      return [];
    }
    
    const now = new Date();
    const timeData: Record<string, number> = {};
    let format_str = '';
    let startPoint: Date;
    let endPoint = now;
    let interval: 'day' | 'week' | 'month' = 'month';
    
    // Xác định khoảng thời gian và định dạng hiển thị
    if (chartTimeRange === 'months') {
      format_str = 'yyyy-MM';
      startPoint = subMonths(now, chartMonthCount - 1);
      interval = 'month';
    } else if (chartTimeRange === 'weeks') {
      // Sửa định dạng tuần để tránh lỗi unescaped character
      format_str = 'yyyy-MM-ww'; // Sử dụng định dạng năm-tháng-tuần thay vì có ký tự W
      startPoint = new Date(now.getTime() - 11 * 7 * 24 * 60 * 60 * 1000); // 12 tuần (0-11)
      interval = 'week';
    } else if (chartTimeRange === 'days') {
      format_str = 'yyyy-MM-dd';
      startPoint = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000); // 30 ngày (0-29)
      interval = 'day';
    } else if (chartTimeRange === 'custom' && chartCustomStartDate && chartCustomEndDate) {
      // Xác định khoảng cách giữa 2 ngày để chọn format phù hợp
      const dayDiff = differenceInDays(chartCustomEndDate, chartCustomStartDate);
      
      if (dayDiff <= 60) { // Khoảng thời gian ≤ 60 ngày -> hiển thị theo ngày
        format_str = 'yyyy-MM-dd';
        interval = 'day';
      } else if (dayDiff <= 180) { // Khoảng thời gian ≤ 180 ngày -> hiển thị theo tuần
        // Sửa định dạng tuần để tránh lỗi unescaped character
        format_str = 'yyyy-MM-ww';
        interval = 'week';
      } else { // Khoảng thời gian > 180 ngày -> hiển thị theo tháng
        format_str = 'yyyy-MM';
        interval = 'month';
      }
      
      startPoint = chartCustomStartDate;
      endPoint = chartCustomEndDate;
    } else {
      // Mặc định nếu không có điều kiện nào phù hợp
      format_str = 'yyyy-MM';
      startPoint = subMonths(now, 11); // 12 tháng (0-11)
      interval = 'month';
    }
    
    // Tạo mảng các điểm thời gian cần hiển thị
    const timePoints: Date[] = [];
    const currentPoint = new Date(startPoint);
    
    while (currentPoint <= endPoint) {
      timePoints.push(new Date(currentPoint));
      
      // Tăng thời gian theo khoảng
      if (interval === 'day') {
        currentPoint.setDate(currentPoint.getDate() + 1);
      } else if (interval === 'week') {
        currentPoint.setDate(currentPoint.getDate() + 7);
      } else { // month
        currentPoint.setMonth(currentPoint.getMonth() + 1);
      }
    }
    
    // Khởi tạo dữ liệu với số lượng 0
    timePoints.forEach(point => {
      const key = format(point, format_str);
      timeData[key] = 0;
    });
    
    // Đếm số thảm họa theo thời gian
    disasters.forEach(disaster => {
      if (disaster.startDateTime) {
        const date = new Date(disaster.startDateTime);
        // Chỉ tính những thảm họa nằm trong khoảng thời gian đã chọn
        if (date >= startPoint && date <= endPoint) {
          const key = format(date, format_str);
          if (timeData[key] !== undefined) {
            timeData[key] += 1;
          }
        }
      }
    });
    
    // Chuyển đổi sang định dạng hiển thị cho biểu đồ
    const displayFormat = interval === 'month' ? 'MM/yyyy' 
                        : interval === 'week' ? "'Tuần' ww, MM/yyyy" // Sửa định dạng hiển thị của tuần
                        : 'dd/MM';
    
    return Object.entries(timeData).map(([key, count]) => {
      // Chuyển đổi key thành ngày để định dạng lại
      let date;
      if (interval === 'month') {
        date = new Date(key + "-01"); // Thêm ngày 01 để parse đúng
      } else if (interval === 'week') {
        // Xử lý đặc biệt cho định dạng tuần
        const [year, month, weekPart] = key.split('-');
        const weekNum = parseInt(weekPart, 10);
        
        // Tạo ngày từ số tuần và năm - cách đơn giản
        date = new Date(parseInt(year), parseInt(month) - 1, 1 + ((weekNum - 1) * 7));
      } else { // days
        date = new Date(key);
      }
      
      return {
        date: format(date, displayFormat, { locale: vi }),
        count,
        originalDate: date // Lưu lại để sắp xếp
      };
    }).sort((a, b) => (a.originalDate.getTime() - b.originalDate.getTime()));
  }, [disasters, chartTimeRange, chartMonthCount, chartCustomStartDate, chartCustomEndDate]);

  // Calculate impact metrics
  const impactMetrics: ImpactMetrics = useMemo(() => {
    if (!disasters || !dataFields) {
      return {
        affected: 0,
        casualties: 0,
        evacuated: 0,
        damagedStructures: 0,
        economicLoss: 0
      };
    }

    let affected = 0;
    let casualties = 0;
    let evacuated = 0;
    let damagedStructures = 0;
    let economicLoss = 0;

    // Map data field codes to their values
    disasters.forEach(disaster => {
      if (disaster.dataFields && disaster.dataFields.length > 0) {
        disaster.dataFields.forEach(field => {
          // Check field.dataField for commonly tracked metrics
          const fieldCode = field.dataField?.code?.toLowerCase() || '';
          const fieldName = field.dataField?.name?.toLowerCase() || '';

          // Match fields based on code or name patterns
          if (fieldCode.includes('affected') || fieldName.includes('người bị ảnh hưởng')) {
            affected += field.value || 0;
          } else if (fieldCode.includes('casualties') || fieldName.includes('tử vong')) {
            casualties += field.value || 0;
          } else if (fieldCode.includes('evacuated') || fieldName.includes('sơ tán')) {
            evacuated += field.value || 0;
          } else if (fieldCode.includes('damaged') || fieldName.includes('thiệt hại')) {
            damagedStructures += field.value || 0;
          } else if (fieldCode.includes('loss') || fieldName.includes('thiệt hại kinh tế')) {
            economicLoss += field.value || 0;
          }
        });
      }
    });

    return {
      affected,
      casualties,
      evacuated,
      damagedStructures,
      economicLoss
    };
  }, [disasters, dataFields]);

  // Format numbers for display
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  // Format currency for display
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  };

  // Handle time range change
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    const now = new Date();

    if (value === 'all') {
      setStartDate(undefined);
      setEndDate(now);
    } else if (value === 'custom') {
      // Keep current custom range
      if (!startDate) {
        // Nếu chọn tùy chỉnh nhưng chưa có startDate, đặt mặc định là 1 tháng trước
        setStartDate(subMonths(now, 1));
      }
    } else {
      // Convert days to number
      const days = parseInt(value, 10);
      setStartDate(new Date(now.getTime() - days * 24 * 60 * 60 * 1000));
      setEndDate(now);
    }
  };

  // Apply filters
  const handleApplyFilters = () => {
    refetchDisasters();
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedDisasterTypes([]);
    setSelectedProvinces([]);
    setSelectedEmergencyLevels([]);
    setSelectedPriorityLevels([]);
    setTimeRange('all');
    setStartDate(undefined);
    setEndDate(new Date());
    refetchDisasters();
  };

  // Tự động tải dữ liệu khi trang được khởi tạo
  useEffect(() => {
    // Đảm bảo chỉ chạy một lần khi trang được tải
    refetchDisasters();
  }, []); // Thêm mảng rỗng để useEffect chỉ chạy một lần
  
  // Update loading state based on data fetching
  useEffect(() => {
    setIsLoading(isLoadingDisasters);
  }, [isLoadingDisasters]);

  // Convert data for select components
  const disasterTypeOptions = useMemo(() =>
    disasterTypes?.map(type => ({ value: type.id, label: type.name })) || [],
    [disasterTypes]
  );

  const provinceOptions = useMemo(() =>
    provinces?.map(province => ({ value: province.id, label: province.name })) || [],
    [provinces]
  );

  const emergencyLevelOptions = useMemo(() =>
    emergencyLevels?.map(level => ({ value: level.id, label: level.name })) || [],
    [emergencyLevels]
  );

  const priorityLevelOptions = useMemo(() =>
    priorityLevels?.map(level => ({ value: level.id, label: level.name })) || [],
    [priorityLevels]
  );

  return (
    <div className="w-full p-4 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Thống kê thảm họa</h1>
          <p className="text-gray-600 text-sm">
            Phân tích dữ liệu thảm họa từ {startDate ? format(startDate, 'dd/MM/yyyy', { locale: vi }) : 'tất cả'}
            đến {endDate ? format(endDate, 'dd/MM/yyyy', { locale: vi }) : 'nay'}
          </p>
        </div>

        <div className="flex gap-2 mt-2 sm:mt-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleApplyFilters}
            className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Cập nhật dữ liệu
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleResetFilters}
            className="bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
          >
            <X className="mr-2 h-4 w-4" /> Đặt lại bộ lọc
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium flex items-center text-gray-700">
            <Filter className="h-5 w-5 mr-2 text-blue-500" /> Bộ lọc dữ liệu
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Khoảng thời gian</Label>
              <Select
                value={timeRange}
                onValueChange={handleTimeRangeChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn khoảng thời gian" />
                </SelectTrigger>
                <SelectContent className="bg-white"
                >
                  <SelectItem value="7">7 ngày qua</SelectItem>
                  <SelectItem value="30">30 ngày qua</SelectItem>
                  <SelectItem value="90">3 tháng qua</SelectItem>
                  <SelectItem value="180">6 tháng qua</SelectItem>
                  <SelectItem value="365">1 năm qua</SelectItem>
                  <SelectItem value="custom">Tùy chỉnh</SelectItem>
                  <SelectItem value="all">Tất cả</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {timeRange === 'custom' && (
              <>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Từ ngày</Label>
                  <DateTimePickerWrapper
                    value={startDate}
                    onChange={(date) => setStartDate(date)}
                    maxDate={endDate}
                    showTime={false}
                    className="w-full bg-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 mb-1 block">Đến ngày</Label>
                  <DateTimePickerWrapper
                    value={endDate}
                    onChange={(date) => setEndDate(date)}
                    minDate={startDate}
                    showTime={false}
                    className="w-full bg-white"
                  />
                </div>
              </>
            )}

            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Loại thảm họa</Label>
              <MultiSelect
                data={disasterTypeOptions}
                value={selectedDisasterTypes}
                variant="default"
                onValueChange={(options) => setSelectedDisasterTypes(options.map(o => o.value))}
                placeholder="Chọn loại thảm họa"
                className="w-full bg-white"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Tỉnh/Thành phố</Label>
              <MultiSelect
                data={provinceOptions}
                value={selectedProvinces}
                variant="default"
                onValueChange={(options) => setSelectedProvinces(options.map(o => o.value))}
                placeholder="Chọn tỉnh/thành phố"
                className="w-full bg-white"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Mức độ khẩn cấp</Label>
              <MultiSelect
                data={emergencyLevelOptions}
                value={selectedEmergencyLevels}
                variant="default"
                onValueChange={(options) => setSelectedEmergencyLevels(options.map(o => o.value))}
                placeholder="Chọn mức độ khẩn cấp"
                className="w-full bg-white"
              />
            </div>

            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Mức độ ưu tiên</Label>
              <MultiSelect
                data={priorityLevelOptions}
                value={selectedPriorityLevels}
                variant="default"
                onValueChange={(options) => setSelectedPriorityLevels(options.map(o => o.value))}
                placeholder="Chọn mức độ ưu tiên"
                className="w-full bg-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 bg-white shadow-sm border w-full flex justify-start overflow-x-auto">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart className="h-4 w-4 mr-2" /> Tổng quan
          </TabsTrigger>
          <TabsTrigger value="regions" className="flex items-center">
            <MapPin className="h-4 w-4 mr-2" /> Phân bổ địa lý
          </TabsTrigger>
          <TabsTrigger value="impact" className="flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" /> Tác động
          </TabsTrigger>
          <TabsTrigger value="response" className="flex items-center">
            <Shield className="h-4 w-4 mr-2" /> Ứng phó
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="ml-3 text-lg text-gray-600">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white border-l-4 border-l-blue-600 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium text-gray-600">Tổng số thảm họa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-3xl font-bold text-gray-800">{formatNumber(disasterSummary.total)}</div>
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs ${disasterSummary.trend > 0 ? 'bg-red-100 text-red-700' : disasterSummary.trend < 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {disasterSummary.trend > 0 ? (
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                        ) : disasterSummary.trend < 0 ? (
                          <ArrowDownRight className="h-3 w-3 mr-1" />
                        ) : null}
                        {Math.abs(disasterSummary.trend).toFixed(1)}%
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">so với tháng trước</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-l-yellow-500 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium text-gray-600">Đang diễn ra</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-3xl font-bold text-gray-800">{formatNumber(disasterSummary.active)}</div>
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">{((disasterSummary.active / disasterSummary.total) * 100).toFixed(1)}%</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">của tổng số thảm họa</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-l-green-600 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium text-gray-600">Đã kết thúc</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-3xl font-bold text-gray-800">{formatNumber(disasterSummary.completed)}</div>
                      <Badge className="bg-green-100 text-green-800 border-green-300">{((disasterSummary.completed / disasterSummary.total) * 100).toFixed(1)}%</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">của tổng số thảm họa</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-l-purple-600 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium text-gray-600">Chưa diễn ra</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-3xl font-bold text-gray-800">{formatNumber(disasterSummary.pending)}</div>
                      <Badge className="bg-purple-100 text-purple-800 border-purple-300">{((disasterSummary.pending / disasterSummary.total) * 100).toFixed(1)}%</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">dự kiến sắp diễn ra</p>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Timeline Chart */}
                <Card className="bg-white shadow-sm">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-md font-medium text-gray-600 flex items-center">
                      <LineChart className="h-4 w-4 mr-2 text-blue-500" />
                      Diễn biến theo thời gian
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Select
                        value={chartTimeRange}
                        onValueChange={handleChartTimeRangeChange}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs bg-white">
                          <SelectValue placeholder="Chọn khoảng thời gian" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="days">30 ngày gần đây</SelectItem>
                          <SelectItem value="weeks">12 tuần gần đây</SelectItem>
                          <SelectItem value="months">12 tháng gần đây</SelectItem>
                          <SelectItem value="custom">Tùy chỉnh</SelectItem>
                        </SelectContent>
                      </Select>
                      {chartTimeRange === 'months' && (
                        <Select
                          value={chartMonthCount.toString()}
                          onValueChange={(value) => setChartMonthCount(parseInt(value, 10))}
                        >
                          <SelectTrigger className="w-[100px] h-8 text-xs bg-white">
                            <SelectValue placeholder="Số tháng" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="6">6 tháng</SelectItem>
                            <SelectItem value="12">12 tháng</SelectItem>
                            <SelectItem value="24">24 tháng</SelectItem>
                            <SelectItem value="36">36 tháng</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </CardHeader>
                  {showChartDatePicker && (
                    <div className="px-6 py-2 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2 items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-500">Từ ngày:</Label>
                        <DateTimePickerWrapper
                          value={chartCustomStartDate}
                          onChange={(date) => setChartCustomStartDate(date)}
                          maxDate={chartCustomEndDate}
                          showTime={false}
                          className="w-36 bg-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-gray-500">Đến ngày:</Label>
                        <DateTimePickerWrapper
                          value={chartCustomEndDate}
                          onChange={(date) => setChartCustomEndDate(date)}
                          minDate={chartCustomStartDate}
                          showTime={false}
                          className="w-36 bg-white"
                        />
                      </div>
                      <Button 
                        size="sm"
                        variant="outline" 
                        onClick={() => {
                          // Cập nhật biểu đồ khi thay đổi khoảng thời gian tùy chỉnh
                          console.log("Custom date range applied:", { chartCustomStartDate, chartCustomEndDate });
                        }}
                        className="bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 h-8 text-xs"
                      >
                        Áp dụng
                      </Button>
                    </div>
                  )}
                  <CardContent>
                    <div className="h-80 flex items-center justify-center">
                      {timelineData.length > 0 ? (
                        <div className="w-full h-full">
                          {/* This is where you'd integrate your chart library */}
                          {/* For now, displaying as a simple visualization */}
                          <div className="flex flex-col h-full">
                            <div className="grid grid-cols-12 text-xs text-gray-500 mb-1">
                              {timelineData.map((item, index) => (
                                <div key={index} className="col-span-1 text-center">
                                  {item.date}
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-12 gap-1 items-end h-full">
                              {timelineData.map((item, index) => {
                                const maxCount = Math.max(...timelineData.map(d => d.count), 1);
                                const height = `${Math.max((item.count / maxCount) * 100, 5)}%`;

                                return (
                                  <div key={index} className="col-span-1">
                                    <div
                                      className="bg-blue-500 rounded-t-md relative group cursor-pointer hover:bg-blue-600 transition-colors w-full"
                                      style={{ height }}
                                    >
                                      <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {item.count} thảm họa
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500">Không có dữ liệu</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Disaster Types Breakdown */}
                <Card className="bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-md font-medium text-gray-600 flex items-center">
                      <PieChart className="h-4 w-4 mr-2 text-blue-500" />
                      Phân loại theo kiểu thảm họa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex justify-center overflow-y-auto">
                      {disasterTypeStats.length > 0 ? (
                        <div className="w-full">
                          {/* For now, displaying as a bar chart */}
                          <div className="flex items-start h-full w-full">
                            <div className="flex flex-col flex-1 space-y-3 my-2 w-full">
                              {disasterTypeStats.slice(0, 15).map((type, i) => (
                                <div key={i} className="flex items-center">
                                  <span className="text-sm min-w-[120px] w-1/4 truncate font-medium" title={type.name}>
                                    {type.name}
                                  </span>
                                  <div className="flex-1 ml-2">
                                    <div className="h-7 bg-gray-100 rounded-md relative">
                                      <div
                                        className={`absolute top-0 left-0 h-full rounded-md ${type.color}`}
                                        style={{
                                          width: `${Math.min((type.count / Math.max(...disasterTypeStats.map(d => d.count), 1)) * 100, 100)}%`
                                        }}
                                      >
                                        <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-xs font-bold">
                                          {type.count}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* {disasterTypeStats.length > 10 && (
                                <div className="text-xs text-gray-500 text-center mt-2 pt-2 border-t">
                                  Hiển thị 10/{disasterTypeStats.length} loại thảm họa
                                </div>
                              )} */}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500">Không có dữ liệu</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Disasters */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md font-medium text-gray-600 flex items-center">
                    <Siren className="h-4 w-4 mr-2 text-blue-500" />
                    Các thảm họa gần đây
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {disasters && disasters.length > 0 ? (
                    <TableWrapper
                      variant="border"
                      spacing="sm"
                      columns={[
                        {
                          header: "Tên thảm họa",
                          accessorKey: "name",
                          cell: (item) => (
                            <div className="flex flex-col">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-xs text-gray-500">
                                {item.disasterType?.name}
                              </span>
                            </div>
                          )
                        },
                        {
                          header: "Vị trí",
                          cell: (item) => (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                              <span className="truncate max-w-[200px]" title={item.province && item.province.length > 0 ? item.province.map((p: { name: string; id: string }) => p.name).join(', ') : "Không xác định"}>
                                {item.province && item.province.length > 0
                                  ? item.province.map((p: { name: string; id: string }) => p.name).join(', ')
                                  : "Không xác định"
                                }
                              </span>
                            </div>
                          )
                        },
                        {
                          header: "Thời gian bắt đầu",
                          cell: (item) => (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                              <span>
                                {item.startDateTime
                                  ? format(new Date(item.startDateTime), 'dd/MM/yyyy', { locale: vi })
                                  : "Chưa xác định"
                                }
                              </span>
                            </div>
                          )
                        },
                        {
                          header: "Trạng thái",
                          cell: (item) => {
                            const now = new Date();
                            let statusText = "Chưa bắt đầu";
                            let statusClass = "bg-gray-100 text-gray-700";

                            if (item.startDateTime) {
                              const startDate = new Date(item.startDateTime);
                              if (startDate <= now) {
                                if (item.endDateTime) {
                                  const endDate = new Date(item.endDateTime);
                                  if (endDate <= now) {
                                    statusText = "Đã kết thúc";
                                    statusClass = "bg-green-100 text-green-800";
                                  } else {
                                    statusText = "Đang diễn ra";
                                    statusClass = "bg-yellow-100 text-yellow-800";
                                  }
                                } else {
                                  statusText = "Đang diễn ra";
                                  statusClass = "bg-yellow-100 text-yellow-800";
                                }
                              } else {
                                statusText = "Chưa bắt đầu";
                                statusClass = "bg-purple-100 text-purple-800";
                              }
                            }

                            return (
                              <span className={`${statusClass} px-2 py-1 rounded-full text-xs`}>
                                {statusText}
                              </span>
                            );
                          }
                        }
                      ]}
                      data={disasters.slice(0, 5)}
                      emptyState={<div>Không có dữ liệu thảm họa</div>}
                    />
                  ) : (
                    <div className="text-gray-500 p-6 text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      <p>Không có dữ liệu thảm họa gần đây</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-gray-500">
                    Hiển thị 5 thảm họa gần đây nhất, tổng cộng {disasters?.length || 0} thảm họa
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Geographic Tab */}
            <TabsContent value="regions" className="space-y-6">
              {/* Province-based statistics */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md font-medium text-gray-600 flex items-center">
                    <Building className="h-4 w-4 mr-2 text-blue-500" />
                    Các tỉnh/thành phố bị ảnh hưởng nhiều nhất
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Map visualization would go here */}
                    <div className="h-80 border rounded-md flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <p className="text-gray-500">Bản đồ phân bố thảm họa</p>
                        <p className="text-xs text-gray-400 mt-1">Tính năng bản đồ sẽ được phát triển trong phiên bản sau</p>
                      </div>
                    </div>

                    {/* Top affected provinces */}
                    <div>
                      <div className="mb-2 text-sm font-medium text-gray-700">Top 10 tỉnh/thành bị ảnh hưởng</div>
                      <div className="space-y-3">
                        {provinceStats.slice(0, 10).map((province, index) => (
                          <div key={province.id} className="flex items-center">
                            <div className="w-5 text-xs text-gray-500">{index + 1}.</div>
                            <div className="flex-1 text-sm">{province.name}</div>
                            <div className="w-12 text-right font-medium">{province.count}</div>
                            <div className="ml-2 w-24">
                              <div className="bg-gray-200 h-2 rounded-full">
                                <div
                                  className="bg-blue-500 h-2 rounded-full"
                                  style={{
                                    width: `${(province.count / Math.max(...provinceStats.slice(0, 10).map(p => p.count), 1)) * 100}%`
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        {provinceStats.length === 0 && (
                          <div className="text-gray-500 text-center py-6">
                            <Building className="h-6 w-6 mx-auto mb-2" />
                            <p>Không có dữ liệu tỉnh/thành phố</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Regional breakdown table */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md font-medium text-gray-600 flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                    Thống kê chi tiết theo vùng địa lý
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {provinceStats.length > 0 ? (
                    <TableWrapper
                      variant="border"
                      spacing="sm"
                      columns={[
                        {
                          header: "Tỉnh/Thành phố",
                          accessorKey: "name",
                          cell: (item) => <span className="font-medium">{item.name}</span>
                        },
                        {
                          header: "Số thảm họa",
                          accessorKey: "count",
                          cell: (item) => <span className="font-medium text-center block">{item.count}</span>,
                          className: "text-center w-24"
                        },
                        {
                          header: "Tỷ lệ",
                          cell: (item) => (
                            <div className="flex items-center">
                              <div className="flex-1 mr-2">
                                <div className="h-2 w-full bg-gray-200 rounded-full">
                                  <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${(item.count / disasterSummary.total * 100).toFixed(1)}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-sm w-16 text-right">
                                {(item.count / disasterSummary.total * 100).toFixed(1)}%
                              </span>
                            </div>
                          ),
                          className: "min-w-[180px]"
                        }
                      ]}
                      data={provinceStats.filter(p => p.count > 0)}
                      emptyState={<div>Không có dữ liệu phân bố địa lý</div>}
                      className="overflow-x-auto"
                    />
                  ) : (
                    <div className="text-gray-500 p-6 text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      <p>Không có dữ liệu phân bố địa lý</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <p className="text-xs text-gray-500">
                    Hiển thị {provinceStats.filter(p => p.count > 0).length} tỉnh/thành phố bị ảnh hưởng bởi thảm họa
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Impact Tab */}
            <TabsContent value="impact" className="space-y-6">
              {/* Impact Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-gray-500">Người bị ảnh hưởng</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <UserRound className="h-5 w-5 mr-3 text-blue-500" />
                      <div className="text-2xl font-bold text-gray-800">{formatNumber(impactMetrics.affected)}</div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">người</p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-gray-500">Thương vong</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-3 text-red-500" />
                      <div className="text-2xl font-bold text-gray-800">{formatNumber(impactMetrics.casualties)}</div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">người</p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-gray-500">Người sơ tán</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 mr-3 text-yellow-500" />
                      <div className="text-2xl font-bold text-gray-800">{formatNumber(impactMetrics.evacuated)}</div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">người</p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-gray-500">Công trình bị hư hại</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Home className="h-5 w-5 mr-3 text-purple-500" />
                      <div className="text-2xl font-bold text-gray-800">{formatNumber(impactMetrics.damagedStructures)}</div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">công trình</p>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-medium text-gray-500">Thiệt hại kinh tế</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 mr-3 text-orange-500" />
                      <div className="text-2xl font-bold text-gray-800" title={formatCurrency(impactMetrics.economicLoss)}>
                        {impactMetrics.economicLoss > 999999999
                          ? `${(impactMetrics.economicLoss / 1000000000).toFixed(1)} tỷ`
                          : formatCurrency(impactMetrics.economicLoss)
                        }
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">VNĐ</p>
                  </CardContent>
                </Card>
              </div>

              {/* Impact by Disaster Type */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md font-medium text-gray-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-blue-500" />
                    Tác động theo loại thảm họa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <BarChart className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-gray-500">Biểu đồ tác động theo loại thảm họa</p>
                      <p className="text-xs text-gray-400 mt-1">Dữ liệu đang được tổng hợp và phân tích</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Temporal analysis of impact */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md font-medium text-gray-600 flex items-center">
                    <LineChart className="h-4 w-4 mr-2 text-blue-500" />
                    Mức độ ảnh hưởng theo thời gian
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <LineChart className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-gray-500">Biểu đồ mức độ ảnh hưởng theo thời gian</p>
                      <p className="text-xs text-gray-400 mt-1">Dữ liệu đang được tổng hợp và phân tích</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Response Tab */}
            <TabsContent value="response" className="space-y-6">
              {/* Resource Allocation */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md font-medium text-gray-600 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-blue-500" />
                    Phân bổ nguồn lực cứu hộ
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 flex items-center justify-center">
                    <div className="text-center">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-gray-500">Thông tin phân bổ nguồn lực cứu hộ</p>
                      <p className="text-xs text-gray-400 mt-1">Dữ liệu đang được tổng hợp từ các đơn vị cứu hộ</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response Time Analysis */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-md font-medium text-gray-600 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    Thời gian phản ứng trung bình
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center">
                      <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-gray-500">Phân tích thời gian phản ứng</p>
                      <p className="text-xs text-gray-400 mt-1">Dữ liệu đang được tổng hợp và phân tích</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Disclaimer and Data Info */}
      <div className="border-t pt-4 mt-6">
        <div className="flex items-start">
          <Info className="h-5 w-5 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-500">
            <p className="font-medium">Thông tin về dữ liệu:</p>
            <p className="mt-1">
              Dữ liệu thống kê được tổng hợp từ các sự kiện thảm họa được ghi nhận trong hệ thống.
              Một số dữ liệu có thể chưa được cập nhật đầy đủ hoặc đang trong quá trình xác minh.
            </p>
            <p className="mt-1">
              Cập nhật lần cuối: {format(new Date(), 'HH:mm - dd/MM/yyyy', { locale: vi })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DisasterStatisticsPage;