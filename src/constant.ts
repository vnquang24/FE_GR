export const BASE_URL = 'http://localhost:8000';
// PermissionName enum đầy đủ
export const PERMISSION_NAMES: Record<string, string> = {
    AdministrativeUnit: 'AdministrativeUnit',
    Category: 'Category',
    Disaster: 'Disaster',
    Media: 'Media',
    RescueTypeOnDisaster: 'RescueTypeOnDisaster'
  };
  
  // Bản dịch tiếng Việt cho tên các quyền
export const PERMISSION_NAMES_VI: Record<string, string> = {
    AdministrativeUnit: 'Đơn vị hành chính',
    Category: 'Danh mục',
    Disaster: 'Thảm họa',
    Media: 'Phương tiện',
    RescueTypeOnDisaster: 'Phương thức cứu trợ'
  };
  
  // Bản dịch tiếng Việt cho loại quyền
export const PERMISSION_TYPES_VI: Record<string, string> = {
    CREATE: 'Tạo mới',
    READ: 'Xem',
    UPDATE: 'Cập nhật',
    DELETE: 'Xóa'
  };