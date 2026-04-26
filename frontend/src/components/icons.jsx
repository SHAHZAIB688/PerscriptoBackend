export const IconWrapper = ({ children }) => (
  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
    {children}
  </span>
);

const Svg = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
    {children}
  </svg>
);

export const DashboardIcon = () => <Svg><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="5" rx="1" /><rect x="13" y="10" width="8" height="11" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /></Svg>;
export const DoctorIcon = () => <Svg><path d="M12 2v8" /><path d="M8 6h8" /><circle cx="12" cy="14" r="4" /><path d="M4 22c1.5-3 4-4 8-4s6.5 1 8 4" /></Svg>;
export const AppointmentIcon = () => <Svg><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M8 2v4M16 2v4M3 10h18" /></Svg>;
export const UsersIcon = () => <Svg><circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M3 20c1.5-3 4-4.5 6-4.5S13.5 17 15 20" /><path d="M14 19c1-1.8 2.6-2.8 4.2-2.8 1.4 0 2.7.7 3.8 2.1" /></Svg>;
export const FileIcon = () => <Svg><path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" /><path d="M14 2v5h5" /><path d="M9 13h6M9 17h6" /></Svg>;
export const ProfileIcon = () => <Svg><circle cx="12" cy="8" r="4" /><path d="M4 21c2-4 5-6 8-6s6 2 8 6" /></Svg>;
export const LogoutIcon = () => <Svg><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 3v18" /></Svg>;
export const BellIcon = () => <Svg><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></Svg>;
