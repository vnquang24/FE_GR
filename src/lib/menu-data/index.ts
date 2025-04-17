import {
    Home,
    LayoutDashboard,
    Users,
    Settings,
    FileText,
    Presentation,
    Database,
    ChartArea,
    CircleDot,
    Activity,
    Siren,
    MonitorCog,
  } from 'lucide-react';
  import { MenuItem } from '@/components/panel/menu-item/type';
  
  export const menuItems: MenuItem[] = [
    {
      icon: Presentation, 
      label: 'Báo cáo và trình chiếu',
      pathname: '/report',
    },
    {
      icon: ChartArea,
      label: 'Thống kê và phân tích thảm họa',
      pathname: '',
      subMenu: [
        { 
          label: 'Tổng hợp về sự cố', 
          pathname: '/statistical/disaster',
          icon: CircleDot
        },
        { 
          label: 'Tổng hợp về các trường thông tin', 
          pathname: '/statistical/data-field',
          icon: CircleDot
        }
      ],
    },
    {
      icon: Siren,
      label: 'Quản lý thảm họa và cứu nạn',
      pathname: '',
      subMenu: [
        { 
          label: 'Sự cố, thảm họa', 
          pathname: '/operation/disaster',
          icon: CircleDot,
        },
        { 
          label: 'Nguồn lực cứu nạn',
          pathname: '/operation/rescue-resource', 
          icon: CircleDot,
        }
      ],
    },  
    {
      icon: Users,
      label: 'Người dùng và phân quyền',
      pathname: '',
      subMenu: [
        { 
          label: 'Tài khoản người dùng', 
          pathname: '/system/user',
          icon: CircleDot,
        },
        { 
          label: 'Vai trò',
          pathname: '/system/role', 
          icon: CircleDot
        },
        {
          label: 'Phân quyền',
          pathname: '/system/permission',
          icon: CircleDot
        }
      ],
    }, 
    {
      icon: Database,
      label: 'Danh mục dùng chung',
      pathname: '',
      subMenu: [
        { 
          label: 'Loại sự cố thảm họa', 
          pathname: '/common/disaster-type',
          icon: CircleDot,
        },
        { 
          label: 'Loại mức độ ưu tiên',
          pathname: '/common/priority-level', 
          icon: CircleDot,
        },
        {
          label: 'Loại tình trạng khẩn cấp',
          pathname: '/common/emergency-level',
          icon: CircleDot
        },
        {
          label: 'Loại nguồn lực cứu hộ cứu nạn',
          pathname: '/common/rescue-resource-type',
          icon: CircleDot
        },
        {
          label: 'Đơn vị hành chính',
          pathname: '/common/administrative-unit',
          icon: CircleDot
        },
        {
          label: 'Trường thông tin thảm họa',
          pathname: '/common/disaster-data-field',
          icon: CircleDot
        },
        {
          label: 'Trường thông tin dữ liệu',
          pathname: '/common/data-field',
          icon: CircleDot
        }
      ],
    },  
    {
      icon: MonitorCog,
      label: 'Nhật ký hệ thống',
      pathname: '',
      subMenu: [
        { 
          label: 'Hệ thống, người dùng', 
          pathname: '/log/system-log',
          icon: CircleDot,
        }
      ],
    }  
];