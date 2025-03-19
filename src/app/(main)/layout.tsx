"use client";
import Footer from "@/components/panel/footer";
import Header from "@/components/panel/header";
import Sidebar from "@/components/panel/side-bars";
import { menuItems } from "@/lib/menu-data";
import { usePathname } from "next/navigation";
// import  {getUser}  from "@/utils/auth";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // const user = getUser();

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
  const user = {
    name: "Admin",
    icon: null,
  };
  return (
    <div className="min-h-screen bg-slate-100 flex gap-4 pr-4">
      <Sidebar />
      <div className="flex-1 flex flex-col gap-4 pt-2 max-h-screen">
        <Header pathName={findMenuLabel(pathname)} user={user} />
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