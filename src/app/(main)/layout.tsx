"use client";
import Footer from "@/components/panel/footer";
import Header from "@/components/panel/header";
import Sidebar from "@/components/panel/side-bars";
import { menuItems } from "@/lib/menu-data";
import { usePathname } from "next/navigation";
import { getUserId } from "@/utils/auth";
import { useFindUniqueUser } from "@/generated/hooks";
import { useEffect, useState } from "react";
import { useStoreState } from "@/lib/redux/hook";

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
  const isUpdateAbility = useStoreState(
    (state) => state.appState.isUpdateAbility
)
  useEffect(() => {
    document.body.classList.add('overflow-hidden');
    document.documentElement.classList.add('overflow-hidden');
    
    return () => {
      document.body.classList.remove('overflow-hidden');
      document.documentElement.classList.remove('overflow-hidden');
    };
  }, []);
  
  useEffect(() => {
    setMounted(true);
    const id = getUserId();
    setUserId(id || '');
    if (!id) {
      setIsLoading(false);
    }
  }, []);
  
  const { data: user } = useFindUniqueUser(
    {
      where: { id: userId },
      select: { name: true, email: true, role: true }
    },
    {
      enabled: !!userId
    }
  );

  useEffect(() => {
    if (user) {
      setUserData({ name: user.name, icon: null });
      setIsLoading(false);
    }
  }, [user]);

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

  if (!userId) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
  }

  const findMenuLabel = (path: string): string => {
    // Exact match first
    for (const item of menuItems) {
      if (item.pathname === path) return item.label;
      if (item.subMenu) {
        for (const sub of item.subMenu) {
          if (sub.pathname === path) return sub.label;
        }
      }
    }

    // Handle dynamic paths
    if (path.startsWith('/operation/disaster/')) {
      return 'Chi tiết thiên tai';
    }
    if (path.startsWith('/operation/rescue-resource/')) {
      return 'Chi tiết phương tiện, thiết bị';
    }
    if (path.startsWith('/system/role/')) {
      return 'Chi tiết vai trò';
    }
    if (path.startsWith('/system/user/')) {
      return 'Chi tiết người dùng';
    }
    
    // Fallback to partial match
    let bestMatch = '';
    for (const item of menuItems) {
      if (item.pathname && path.startsWith(item.pathname) && item.pathname.length > bestMatch.length) {
        bestMatch = item.label;
      }
      if (item.subMenu) {
        for (const sub of item.subMenu) {
          if (sub.pathname && path.startsWith(sub.pathname) && sub.pathname.length > bestMatch.length) {
            bestMatch = sub.label;
          }
        }
      }
    }
    if (bestMatch) return bestMatch;

    return 'Trang chủ';
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