"use client";
import Footer from "@/components/panel/footer";
import Header from "@/components/panel/header";
import Sidebar from "@/components/panel/side-bars";
import { menuItems } from "@/lib/menu-data";
import { usePathname } from "next/navigation";
import { getUserId } from "@/utils/auth";
import { useFindUniqueUser } from "@/generated/hooks";
import { useEffect, useState } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [userData, setUserData] = useState({ name: "Đang tải...", icon: null });
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Ngăn chặn thanh cuộn trên body và html
  useEffect(() => {
    // Thêm class để ẩn thanh cuộn
    document.body.classList.add('overflow-hidden');
    document.documentElement.classList.add('overflow-hidden');
    
    // Cleanup khi component unmount
    return () => {
      document.body.classList.remove('overflow-hidden');
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, []);
  
  // Lấy userId khi component mount
  useEffect(() => {
    setMounted(true);
    const id = getUserId();
    setUserId(id || '');
    if (!id) {
      setIsLoading(false);
    }
  }, []);
  
  // Fetch user data dựa vào userId từ access token
  const { data: user } = useFindUniqueUser(
    {
      where: { id: userId },
      select: { name: true, email: true, role: true }
    },
    {
      // Chỉ gọi API khi userId có giá trị
      enabled: !!userId
    }
  );

  // Cập nhật userData khi user data được tải về
  useEffect(() => {
    if (user) {
      setUserData({ name: user.name, icon: null });
      setIsLoading(false);
    }
  }, [user]);

  // Sử dụng mounted để tránh hydration error
  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-100 flex gap-4 pr-4">
        <div className="w-64 h-screen bg-white"></div>
        <div className="flex-1"></div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
  }

  // Early return nếu không có userId
  if (!userId) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
  }

  // Function to find menu item label by pathname
  const findMenuLabel = (path: string): string => {
    // Check main menu items
    const mainItem = menuItems.find(item => item.pathname === path);
    if (mainItem) return mainItem.label;

    // Check submenu items
    for (const item of menuItems) {
      if (item.subMenu) {
        const subItem = item.subMenu.find(sub => sub.pathname === path);
        if (subItem) return subItem.label;
      }
    }

    return 'Trang chủ'; // Default fallback
  };

  return (
    <div className="min-h-screen bg-slate-100 flex gap-4 pr-4">
      <Sidebar />
      <div className="flex-1 flex flex-col gap-4 pt-2 max-h-screen">
        <Header pathName={findMenuLabel(pathname)} user={userData} />
        <main className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="p-4 rounded-xl bg-white shadow-sm min-h-full">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}