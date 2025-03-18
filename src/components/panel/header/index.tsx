import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { HeaderProps } from './type';

const Header: React.FC<HeaderProps> = ({ pathName, user }) => {
  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-md rounded-xl">
      <div className="text-blue-500 text-xl font-bold">{pathName}</div>
      <div className="flex items-center space-x-3">
        <span className="text-gray-700 text-sm">{user.name}</span>
        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
        {user.icon ? (
            <img
              src={user.icon as string}
              alt="User Avatar"
              className="w-4/5 h-4/5 rounded-full object-cover"
            />
          ) : (
            <UserIcon className="w-4/5 h-4/5 text-gray-500" />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
