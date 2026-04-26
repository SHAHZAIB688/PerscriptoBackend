import { useState } from "react";
import { useAuth } from "../state/AuthContext";
import DashboardSidebar from "./DashboardSidebar";
import { BellIcon } from "./icons";

const DashboardShell = ({ title, subtitle, navItems, children, defaultTab = "dashboard" }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [hasNotifications] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden ${isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <DashboardSidebar
        navItems={navItems}
        activeTab={activeTab}
        onTabChange={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }}
        onLogout={logout}
        isOpen={isSidebarOpen}
      />

      <section className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-md lg:px-8 lg:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              </button>
              <div className="truncate">
                <h2 className="text-base font-semibold tracking-tight text-[#2b3546] sm:text-xl truncate">{title}</h2>
                <p className="hidden text-[10px] font-medium text-slate-500 sm:block">{subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-6 shrink-0">
              <button className="relative text-slate-400 transition-colors hover:text-brand-600">
                <BellIcon />
                {hasNotifications && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
                  </span>
                )}
              </button>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold text-slate-900 leading-none">{user?.name}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">{user?.role}</p>
                </div>
                <img 
                  src={`https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user?.name || "User")}`}
                  className="h-8 w-8 rounded-full border-2 border-white shadow-sm ring-1 ring-slate-100 sm:h-10 sm:w-10"
                  alt="Avatar"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children(activeTab, setActiveTab)}
        </main>
      </section>
    </div>
  );
};

export default DashboardShell;
