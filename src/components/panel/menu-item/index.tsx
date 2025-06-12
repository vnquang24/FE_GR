"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { MenuItemProps } from './type';
import clsx from 'clsx';
import { useStoreState } from '@/lib/redux/hook';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

const MenuItemComponent: React.FC<MenuItemProps> = ({ item, depth, hidden }) => {
  const pathname = usePathname();
  const isShowSidebar = useStoreState(state => state.appState.isShowSidebar);

  // Recursively check if any child menu item is active
  const hasActiveChild = React.useCallback((menuItem: MenuItemProps['item']): boolean => {
    if (!menuItem.subMenu) {
      return false;
    }
    return menuItem.subMenu.some(
      (sub) => (sub.pathname && pathname.startsWith(sub.pathname)) || hasActiveChild(sub)
    );
  }, [pathname]);

  const [isOpen, setIsOpen] = useState(hasActiveChild(item));
  
  // Update open state when path changes
  useEffect(() => {
    if (!isShowSidebar) {
      setIsOpen(hasActiveChild(item));
    }
  }, [pathname, item, hasActiveChild, isShowSidebar]);
  
  // Kiểm tra hidden để quyết định có render hay không
  if (hidden || item.hidden) {
    return null;
  }
  
  // An item is active if its path is a prefix of the current path
  const isActive = item.pathname ? pathname.startsWith(item.pathname) : false;
  // An item is a parent of an active item if it has an active child
  const isParentOfActive = hasActiveChild(item);

  // Tính toán kích thước icon dựa trên độ sâu
  const getIconSize = (depth: number) => {
    // Menu chính: 20px, Submenu cấp 1: 16px, Submenu cấp 2+: 14px
    if (depth === 0) return 22;
    if (depth === 1) return 9;
    return 14;
  };

  // Xử lý click vào mục menu
  const handleItemClick = (e: React.MouseEvent) => {
    // Chỉ xử lý mở/đóng submenu nếu có submenu
    if (item.subMenu && item.subMenu.length > 0) {
      e.preventDefault(); // Ngăn chặn hành vi mặc định của Link
      setIsOpen(!isOpen);
    }
  };

  // Tạo nội dung menu item
  const menuItemContent = (
    <div
      className={clsx(
        "flex items-center gap-3 text-sm",
        isShowSidebar ? "justify-center" : "w-48",
        "overflow-hidden"
      )}
    >
      {item.icon && (
        <item.icon
          size={getIconSize(depth)}
          className={clsx(
            "flex-shrink-0",
            depth > 0 && "text-gray-500", // Màu nhạt hơn cho submenu
            (isActive || (isParentOfActive && isShowSidebar)) && "text-blue-600"
          )}
        />
      )}
      {!isShowSidebar && <span className="truncate">{item.label}</span>}
    </div>
  );

  // Tạo menu item dựa vào loại (có submenu hay không)
  const menuItemElement = item.subMenu && item.subMenu.length > 0 ? (
    <div
      onClick={handleItemClick}
      className={clsx(
        "flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-all duration-200 ease-in-out cursor-pointer",
        {
          "justify-between": !isShowSidebar,
          "justify-center w-10": isShowSidebar,
          "ml-4": !isShowSidebar && depth === 1,
          "ml-8": !isShowSidebar && depth === 2,
          "ml-12": !isShowSidebar && depth === 3,
          "ml-16": !isShowSidebar && depth >= 4,
          // Style for parent of active. No background, just text color and font weight.
          "text-blue-600 font-medium": !isShowSidebar && isParentOfActive,
          "bg-blue-50": isShowSidebar && isParentOfActive
        }
      )}
    >
      {menuItemContent}
      {!isShowSidebar && item.subMenu && item.subMenu.length > 0 && (
        <div className="text-gray-500 flex-shrink-0">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      )}
    </div>
  ) : (
    <Link
      href={item.pathname}
      className={clsx(
        "flex items-center p-2 rounded-md hover:bg-gray-50 transition-all duration-200 ease-in-out",
        {
          "justify-between": !isShowSidebar,
          "justify-center w-10": isShowSidebar,
          "ml-4": !isShowSidebar && depth === 1,
          "ml-8": !isShowSidebar && depth === 2,
          "ml-12": !isShowSidebar && depth === 3,
          "ml-16": !isShowSidebar && depth >= 4,
          // Add style for active item
          "bg-blue-50 text-blue-600 font-medium": isActive,
        }
      )}
    >
      {menuItemContent}
    </Link>
  );

  return (
    <div>
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          {menuItemElement}
        </HoverCardTrigger>
        <HoverCardContent
          side="right"
          align="start"
          className="p-1 min-w-[100px]"
          hidden={!isShowSidebar}
        >
          <div className="flex flex-col gap-2">
            <div className="font-medium text-sm">{item.label}</div>
          </div>
        </HoverCardContent>
      </HoverCard>
      
      {isOpen && !isShowSidebar && item.subMenu && (
        <ul className="mt-0.5">
          {item.subMenu
            .filter(subItem => !subItem.hidden) // Filter ra các subItem bị ẩn
            .map((subItem) => (
              <MenuItemComponent
                key={subItem.label}
                item={subItem}
                depth={depth + 1}
                hidden={subItem.hidden}
              />
            ))}
        </ul>
      )}
    </div>
  );
};

export default MenuItemComponent;