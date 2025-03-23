import React from 'react';
import { User as UserIcon, Settings, LogOut, Info } from 'lucide-react';
import { HeaderProps } from './type';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { logout } from '@/utils/auth';
import { useRouter } from 'next/navigation';

const Header: React.FC<HeaderProps> = ({ pathName, user }) => {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleProfileClick = () => {
    router.push('/profile');
  };

  const handleDevicesClick = () => {
    router.push('/devices');
  };

  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-md rounded-xl">
      <div className="text-blue-500 text-xl font-bold">{pathName}</div>
      <div className="flex items-center space-x-3">
        <span className="text-gray-700 text-sm">{user.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="w-9 h-9 rounded-full  bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
              <UserIcon className="w-4/5 h-4/5 text-gray-500" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white rounded-md shadow-lg">
            <div className="flex flex-col items-center py-3 border-b">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                <UserIcon className="w-4/5 h-4/5 text-gray-500" />
              </div>
              <p className="font-medium">{user.name}</p>
            </div>
            
            <DropdownMenuItem className="cursor-pointer" onClick={handleProfileClick}>
              <Info className="mr-2 h-4 w-4" />
              <span>Thông tin chi tiết tài khoản</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="cursor-pointer" onClick={handleDevicesClick}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Quản lý thiết bị</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="cursor-pointer text-red-500 focus:text-red-500" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;