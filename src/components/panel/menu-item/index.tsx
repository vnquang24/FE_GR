"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { MenuItemProps } from './type';
import clsx from 'clsx';
import { useStoreState } from '@/lib/redux/hook';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

const MenuItemComponent: React.FC<MenuItemProps> = ({ item, depth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isShowSidebar = useStoreState(state => state.appState.isShowSidebar);

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
            depth > 0 && "text-gray-500" // Màu nhạt hơn cho submenu
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
        >
          <div className="flex flex-col gap-2">
            <div className="font-medium text-sm">{item.label}</div>
          </div>
        </HoverCardContent>
      </HoverCard>
      
      {isOpen && item.subMenu && (
        <ul className="mt-0.5">
          {item.subMenu.map((subItem) => (
            <MenuItemComponent
              key={subItem.label}
              item={subItem}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default MenuItemComponent;