'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';

interface MapProps {
  disaster?: any;
  dataFields?: any[];
  isFullScreen?: boolean;
}

const Map: React.FC<MapProps> = ({ disaster, dataFields, isFullScreen = false }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  // Khởi tạo map chỉ khi đã mount và có dữ liệu
  useEffect(() => {
    if (!disaster?.coordinate) return;

    // Đảm bảo mã này chỉ chạy ở phía client
    if (typeof window === 'undefined') return;

    if (!initialized) {
      // Xóa instance map hiện tại nếu có
      if (mapInstance) {
        mapInstance.remove();
      }

      // Dynamic import Leaflet ở phía client
      import('leaflet').then((L) => {
        if (!mapRef.current) return;

        // Nếu đã có map ở container, xóa nó đi
        if (mapRef.current.innerHTML !== '') {
          mapRef.current.innerHTML = '';
        }

        // Fix Leaflet icons
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
        });

        // Tạo map mới
        const map = L.map(mapRef.current).setView(
          [disaster.coordinate.lat, disaster.coordinate.lng], 
          12
        );
        
        // Lưu instance map để có thể quản lý
        setMapInstance(map);
        setInitialized(true);

        // Thêm tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // Thêm marker vị trí thảm họa
        const marker = L.marker([disaster.coordinate.lat, disaster.coordinate.lng])
          .addTo(map)
          .bindPopup(`<b>${disaster.name}</b><br>${disaster.disasterType?.name || ''}`)
          .openPopup();

        // Thêm vùng ảnh hưởng nếu có zone data
        if (disaster.zone && disaster.zone.length > 0) {
          disaster.zone.forEach((zone: any) => {
            try {
              if (zone.boundary) {
                const boundary = typeof zone.boundary === 'string' 
                  ? JSON.parse(zone.boundary) 
                  : zone.boundary;
                
                if (Array.isArray(boundary)) {
                  L.polygon(boundary, { color: 'red', fillOpacity: 0.3 })
                    .addTo(map)
                    .bindPopup(zone.name || 'Vùng ảnh hưởng');
                }
              }
            } catch (error) {
              console.error('Error parsing zone boundary:', error);
            }
          });
        }
        // Nếu không có zone data, có thể vẽ vòng tròn mô phỏng vùng ảnh hưởng dựa trên mức độ khẩn cấp
        else {
          // Mức độ khẩn cấp có thể quyết định bán kính vùng ảnh hưởng
          const radiusMapping: Record<string, number> = {
            'low': 1000,     // 1km
            'medium': 3000,  // 3km
            'high': 5000,    // 5km
            'critical': 10000 // 10km
          };

          // Mặc định là 2km nếu không xác định được mức độ
          const radius = radiusMapping[disaster.emergencyLevel?.name?.toLowerCase() || ''] || 2000;
          
          L.circle([disaster.coordinate.lat, disaster.coordinate.lng], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.2,
            radius: radius
          }).addTo(map);
        }

        // Thêm các điểm dữ liệu quan trọng lên bản đồ nếu có
        if (dataFields && dataFields.length > 0) {
          // Lọc ra các dataField có vị trí đo đạc
          const dataFieldsWithLocations = dataFields.filter(field => {
            const location = field.dataField?.metadata?.location;
            return location && location.lat && location.lng;
          });

          // Thêm markers cho các điểm dữ liệu
          dataFieldsWithLocations.forEach(field => {
            const location = field.dataField.metadata.location;
            const iconUrl = getIconForDataField(field.dataField.code);
            
            const customIcon = L.icon({
              iconUrl,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
              popupAnchor: [0, -12]
            });

            L.marker([location.lat, location.lng], { icon: customIcon })
              .addTo(map)
              .bindPopup(`
                <b>${field.dataField.name}</b><br>
                Giá trị: ${field.value} ${field.dataField.unit}<br>
              `);
          });
        }

        // Đảm bảo map được render đúng sau khi component mount
        setTimeout(() => {
          map.invalidateSize();
        }, 100);
      }).catch(err => {
        console.error('Lỗi khi khởi tạo bản đồ:', err);
      });
    }
  }, [disaster, initialized]);

  // Xử lý việc thay đổi kích thước khi vào chế độ toàn màn hình
  useEffect(() => {
    if (mapInstance) {
      setTimeout(() => {
        mapInstance.invalidateSize();
      }, 200);
    }
  }, [mapInstance, isFullScreen]);

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [mapInstance]);

  // Nếu không có disaster data, hiển thị thông báo
  if (!disaster) {
    return (
      <div className="flex justify-center items-center h-[70vh] bg-gray-50">
        <p>Vui lòng chọn thảm họa để hiển thị bản đồ</p>
      </div>
    );
  }

  return (
    <Card className={`overflow-hidden ${isFullScreen ? 'h-screen w-screen border-0 rounded-none' : 'h-[70vh]'}`}>
      <div 
        ref={mapRef} 
        id="map" 
        className="h-full w-full" 
        style={{ zIndex: 1 }} 
      />
    </Card>
  );
};

// Hàm hỗ trợ lấy icon phù hợp cho từng loại dữ liệu
function getIconForDataField(code: string): string {
  const defaultIcon = 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png';
  
  // Mapping từ mã code sang icon (có thể thay thế bằng các icon thật sau)
  const iconMapping: Record<string, string> = {
    'water_level': 'https://cdn-icons-png.flaticon.com/512/2757/2757298.png',
    'rain_volume': 'https://cdn-icons-png.flaticon.com/512/2679/2679137.png',
    'wind_speed': 'https://cdn-icons-png.flaticon.com/512/1779/1779950.png',
    'temp': 'https://cdn-icons-png.flaticon.com/512/3815/3815449.png',
    'seismic': 'https://cdn-icons-png.flaticon.com/512/6699/6699262.png',
  };
  
  return iconMapping[code] || defaultIcon;
}

export default Map; 