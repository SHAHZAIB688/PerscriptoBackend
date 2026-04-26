import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import LogoImg from "../assets/logo2.jpeg";
import { useAuth } from "../state/AuthContext";
import { DashboardIcon, LogoutIcon, ChevronDownIcon } from "../icons";

const Header = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const isHideRoute = location.pathname.startsWith("/dashboard") || 
                     location.pathname === "/login" || 
                     location.pathname === "/signup";

  if (isHideRoute) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex items-center gap-2">
          <img src={LogoImg} alt="Prescripto Logo" className="h-10 w-10 rounded-lg" />
          <Link to="/" className="text-xl font-extrabold tracking-tight text-brand-700">Prescripto</Link>
        </div>
        <nav className="hidden items-center gap-7 md:flex">
          <NavLink className="text-sm font-medium text-slate-600 hover:text-brand-700" to="/" end>Home</NavLink>
          <NavLink className="text-sm font-medium text-slate-600 hover:text-brand-700" to="/doctors">Find Doctors</NavLink>
          <NavLink className="text-sm font-medium text-slate-600 hover:text-brand-700" to="/about">About</NavLink>
          <NavLink className="text-sm font-medium text-slate-600 hover:text-brand-700" to="/contact">Contact</NavLink>
          {user && <NavLink className="text-sm font-medium text-slate-600 hover:text-brand-700" to="/dashboard">Dashboard</NavLink>}
        </nav>
        <div className="flex items-center gap-4">
          {!user ? (
            <>
              <Link to="/login" className="hidden text-sm font-bold text-slate-600 hover:text-brand-600 md:block transition-colors">
                Login
              </Link>
              <Link to="/signup" className="rounded-2xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-100 transition-all hover:bg-brand-700 hover:-translate-y-0.5 active:translate-y-0">
                Join Now
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white pl-1.5 pr-4 py-1.5 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-brand-600 hover:shadow-md active:scale-95"
                onClick={() => setOpen((prev) => !prev)}
              >
                <div className="h-8 w-8 rounded-xl bg-brand-600 flex items-center justify-center text-white text-xs font-bold uppercase">
                  {user.name?.[0]}
                </div>
                <span className="max-w-[100px] truncate">{user.name}</span>
                <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
              </button>
              {open && (
                <div className="absolute right-0 mt-3 w-64 overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-slate-50 mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Account</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{user.email || 'User Account'}</p>
                  </div>
                  <Link 
                    to="/dashboard" 
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition-all group"
                    onClick={() => setOpen(false)}
                  >
                    <DashboardIcon className="h-5 w-5 text-slate-400 group-hover:text-brand-600" />
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => { logout(); setOpen(false); }}
                    className="mt-1 flex items-center gap-3 w-full rounded-2xl px-4 py-3 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all group"
                  >
                    <LogoutIcon className="h-5 w-5 text-rose-400 group-hover:text-rose-600" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
