"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { MenuItemProps } from './type';
import clsx from 'clsx';
import { useStoreState } from '@/lib/redux/hook';

const MenuItemComponent: React.FC<MenuItemProps> = ({ item, depth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isShowSidebar = useStoreState(state => state.appState.isShowSidebar);
  
  // Tính toán kích thước icon dựa trên độ sâu
  const getIconSize = (depth: number) => {
    // Menu chính: 20px, Submenu cấp 1: 16px, Submenu cấp 2+: 14px
    if (depth === 0) return 20;
    if (depth === 1) return 10;
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

  return (
    <li>
      {/* Nếu có submenu, làm cho toàn bộ div có thể click để mở/đóng */}
      {item.subMenu && item.subMenu.length > 0 ? (
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
                  depth > 0 && "text-black" // Màu nhạt hơn cho submenu
                )}
              />
            )}
            {!isShowSidebar && <span className="truncate">{item.label}</span>}
          </div>
          {!isShowSidebar && item.subMenu && item.subMenu.length > 0 && (
            <div className="text-gray-500 flex-shrink-0">
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          )}
        </div>
      ) : (
        // Nếu không có submenu, sử dụng Link bình thường
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
        </Link>
      )}

      {/* Hiển thị submenu nếu có và đang mở */}
      {!isShowSidebar && isOpen && item.subMenu && (
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
    </li>
  );
};

export default MenuItemComponent;