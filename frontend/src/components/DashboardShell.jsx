import { useState, useRef, useEffect } from "react";
import { useAuth } from "../state/AuthContext";
import DashboardSidebar from "./DashboardSidebar";
import { BellIcon } from "./icons";

const DashboardShell = ({ title, subtitle, navItems, children, notifications, defaultTab = "dashboard" }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    const saved = localStorage.getItem("readNotifications");
    return saved ? JSON.parse(saved) : [];
  });
  const notificationRef = useRef(null);

  const unreadNotifications = notifications?.filter(n => !readIds.includes(n.id)) || [];
  const hasUnread = unreadNotifications.length > 0 || navItems?.some(item => item.hasNotification);

  useEffect(() => {
    localStorage.setItem("readNotifications", JSON.stringify(readIds));
  }, [readIds]);

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      setReadIds(prev => [...prev, id]);
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications?.map(n => n.id) || [];
    setReadIds(prev => [...new Set([...prev, ...allIds])]);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationsOpen]);

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden ${isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <DashboardSidebar
        navItems={navItems?.map(item => ({ ...item, hasNotification: item.hasNotification && hasUnread }))}
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
      <div className="relative" ref={notificationRef}>
        <button 
          onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
          className="relative p-2 text-slate-400 transition-colors hover:text-brand-600 rounded-full hover:bg-slate-100"
        >
          <BellIcon />
          {hasUnread && (
            <span className="absolute right-2 top-2 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500"></span>
            </span>
          )}
        </button>

        {isNotificationsOpen && (
          <div className="absolute right-0 mt-3 w-80 origin-top-right rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl ring-1 ring-black/5 focus:outline-none">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadNotifications.length > 0 && (
                  <button onClick={markAllAsRead} className="text-[10px] font-bold text-slate-400 hover:text-brand-600 transition-colors">Mark all read</button>
                )}
                <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{unreadNotifications.length} New</span>
              </div>
            </div>
            <div className="mt-2 max-h-96 overflow-y-auto custom-scrollbar">
              {notifications?.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-slate-300 mb-3">
                    <BellIcon />
                  </div>
                  <p className="text-xs font-medium text-slate-500">All caught up!</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => {
                      markAsRead(notif.id);
                      if (notif.linkTab) setActiveTab(notif.linkTab);
                      setIsNotificationsOpen(false);
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-slate-50 ${readIds.includes(notif.id) ? 'opacity-60' : ''}`}
                  >
                    <div className={`mt-1 flex h-2 w-2 shrink-0 rounded-full ${readIds.includes(notif.id) ? 'bg-slate-300' : notif.type === 'alert' ? 'bg-rose-500' : 'bg-brand-500'}`} />
                    <div className="flex-1 overflow-hidden">
                      <p className={`text-xs font-bold text-slate-900 truncate ${readIds.includes(notif.id) ? 'font-medium' : ''}`}>{notif.title}</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 line-clamp-2">{notif.message}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
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
