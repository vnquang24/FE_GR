'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PanelsTopLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import MenuItemComponent from '../menu-item';
import { menuItems } from '@/lib/menu-data';
import { useStoreState, useStoreActions } from '@/lib/redux/hook';

const Sidebar: React.FC = () => {
  // Sử dụng local state để tránh hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState('w-64');
  
  const isShowSidebar = useStoreState(state => state.appState.isShowSidebar);
  const setIsShowSidebar = useStoreActions(actions => actions.appState.setIsShowSidebar);
  
  // Chỉ cập nhật UI sau khi component mount ở client
  useEffect(() => {
    setMounted(true);
    setSidebarWidth(isShowSidebar ? 'w-16' : 'w-64');
  }, [isShowSidebar]);

  // Xử lý toggle sidebar
  const handleToggleSidebar = () => {
    setIsShowSidebar(!isShowSidebar);
  };
  
  // Render placeholder ban đầu để tránh hydration error
  if (!mounted) {
    return (
      <div className="w-64 h-screen bg-white transition-all duration-300 relative flex flex-col">
        {/* Placeholder content */}
      </div>
    );
  }
  
  return (
    <div className={`${sidebarWidth} h-screen bg-white transition-all duration-300 relative flex flex-col`}>
      <Link 
        href="/statistical/disaster" 
        className={`flex items-center ${
          isShowSidebar ? 'justify-center' : 'gap-3'
        } mb-4 px-6 pb-3 pt-7 flex-shrink-0`}
      >
        <PanelsTopLeft size={32} className="text-blue-600 flex-shrink-0" />
        {!isShowSidebar && (
          <h1 className="text-xl font-bold text-gray-800 truncate">Cứu hộ cứu nạn</h1>
        )}
      </Link>
      
      {/* Container cho menu có thể cuộn riêng biệt */}
      <div className="flex-1 overflow-y-auto pr-0 h-0 pb-5 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {/* Menu Items */}
        <ul className="space-y-1 px-4 pb-5">
          {menuItems.map((item) => (
            <MenuItemComponent 
              key={item.label}
              item={item}
              depth={0}
            />
          ))}
        </ul>
      </div>

      {/* Toggle Button */}
      <button
        onClick={handleToggleSidebar}
        className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white p-1 rounded-full shadow-md hover:bg-gray-50 z-10"
      >
        {isShowSidebar ? (
          <ChevronRight size={20} className="text-gray-600" />
        ) : (
          <ChevronLeft size={20} className="text-gray-600" />
        )}
      </button>
    </div>
  );
};

export default Sidebar;