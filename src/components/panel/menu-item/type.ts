import { LucideIcon } from 'lucide-react';

export type MenuItemProps = {
    item: MenuItem,
    depth: number,
    hidden?: boolean;
}

export interface MenuItem {
  icon?: LucideIcon;
  label: string;
  pathname: string;
  subMenu?: MenuItem[];
  hidden?: boolean;
}