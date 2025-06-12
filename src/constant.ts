export const BASE_URL = 'http://localhost:8000';
// PermissionName enum đầy đủ (cập nhật theo zmodel mới)
export const PERMISSION_NAMES: Record<string, string> = {
    // Core permissions
    AdministrativeUnit: 'AdministrativeUnit',
    Category: 'Category',
    Disaster: 'Disaster',
    Media: 'Media',
    RescueTypeOnDisaster: 'RescueTypeOnDisaster',
    
    // Administrative units - specific permissions
    Province: 'Province',
    District: 'District', 
    Commune: 'Commune',
    
    // Category entities - specific permissions
    DisasterType: 'DisasterType',
    PriorityLevel: 'PriorityLevel',
    EmergencyLevel: 'EmergencyLevel',
    DataField: 'DataField',
    RescueType: 'RescueType',
    
    // User management
    User: 'User',
    UserGroup: 'UserGroup',
    Permission: 'Permission',
    
    // Geographic entities
    Zone: 'Zone',
    Coordinate: 'Coordinate',
    
    // System entities
    Device: 'Device',
    RefreshToken: 'RefreshToken'
  };
  
  // Bản dịch tiếng Việt cho tên các quyền (đầy đủ)
export const PERMISSION_NAMES_VI: Record<string, string> = {
    // Core permissions
    AdministrativeUnit: 'Đơn vị hành chính',
    Category: 'Danh mục',
    Disaster: 'Thảm họa',
    Media: 'Phương tiện',
    RescueTypeOnDisaster: 'Phương thức cứu trợ',
    
    // Administrative units - specific permissions
    Province: 'Tỉnh/Thành phố',
    District: 'Quận/Huyện',
    Commune: 'Phường/Xã',
    
    // Category entities - specific permissions
    DisasterType: 'Loại thảm họa',
    PriorityLevel: 'Mức độ ưu tiên',
    EmergencyLevel: 'Cấp độ khẩn cấp',
    DataField: 'Trường dữ liệu',
    RescueType: 'Loại cứu trợ',
    
    // User management
    User: 'Người dùng',
    UserGroup: 'Nhóm người dùng',
    Permission: 'Phân quyền',
    
    // Geographic entities
    Zone: 'Khu vực',
    Coordinate: 'Tọa độ',
    
    // System entities
    Device: 'Thiết bị',
    RefreshToken: 'Token làm mới'
  };
  
  // Bản dịch tiếng Việt cho loại quyền
export const PERMISSION_TYPES_VI: Record<string, string> = {
    CREATE: 'Tạo mới',
    READ: 'Xem',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa'
  };