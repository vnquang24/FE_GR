"use client";
import Footer from "@/components/panel/footer";
import Header from "@/components/panel/header";

// import  {getUser}  from "@/utils/auth";

export default function DevicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = {
    name: "Admin",
    icon: null,
  };
  return (
    <div className="min-h-screen bg-slate-100 flex gap-4 pr-4 pl-4">
      <div className="flex-1 flex flex-col gap-4 pt-2 max-h-screen">
        <Header pathName="Quản lý thiết bị" user={user} />
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