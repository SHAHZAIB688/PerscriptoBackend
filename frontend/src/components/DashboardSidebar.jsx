import { LogoutIcon } from "./icons";
import sidebarLogo from "../assets/logo.png";

const DashboardSidebar = ({ navItems, activeTab, onTabChange, onLogout, isOpen }) => (
  <aside 
    className={`fixed inset-y-0 left-0 z-50 flex w-[280px] transform flex-col bg-gradient-to-b from-[#257ea3] to-[#29add1] px-4 py-7 text-white shadow-2xl transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:z-0 lg:flex lg:h-screen lg:w-[300px] lg:translate-x-0 ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    <div className="flex h-full flex-col">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center justify-center gap-0">
          <img src={sidebarLogo} alt="Prescripto logo" className="h-10 w-10 object-contain" />
          <span className="-ml-1 text-[26px] font-bold leading-none tracking-tight">Prescripto</span>
        </div>
      </div>

      <div className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[18px] leading-6 transition ${
              activeTab === item.id
                ? "bg-white text-[#1980aa] font-semibold"
                : "text-white font-medium hover:bg-[#2b8db2]/70"
            }`}
          >
            {item.icon ? <item.icon /> : null}
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-auto pt-4">
        <div className="mb-4 border-t border-cyan-200/50" />
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl bg-rose-600 px-3 py-2.5 text-left text-[18px] font-semibold text-white"
        >
          <LogoutIcon />
          Logout
        </button>
      </div>
    </div>
  </aside>
);

export default DashboardSidebar;
