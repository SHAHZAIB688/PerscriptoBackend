import { Link, useLocation } from "react-router-dom";
import Header from "./Header";
import LogoImg from "../assets/logo2.jpeg";
import { MailIcon, PhoneIcon, MapPinIcon, FacebookIcon, LinkedInIcon, XIcon } from "../icons";

const Layout = ({ children }) => {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/signup";
  const hideLayout = isDashboardRoute || isAuthRoute;

  return (
    <div className="flex min-h-screen flex-col">
      {!hideLayout && <Header />}
      <main className={hideLayout ? "w-full flex-1 p-0 m-0" : "mx-auto w-full max-w-7xl flex-1 px-4 py-6 lg:px-8"}>
        {children}
      </main>
      {!hideLayout && (
        <footer id="contact" className="mt-auto border-t border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 pt-16 pb-8 lg:px-8">
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
              {/* Brand Column */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <img src={LogoImg} alt="Prescripto Logo" className="h-10 w-10 rounded-lg" />
                  <span className="text-xl font-extrabold tracking-tight text-brand-700">Prescripto</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-600">
                  Modern healthcare booking platform for secure, fast, and reliable doctor appointment management. Making healthcare accessible for everyone.
                </p>
                <div className="flex gap-4">
                  {[
                    { icon: FacebookIcon, label: "Facebook" },
                    { icon: LinkedInIcon, label: "LinkedIn" },
                    { icon: XIcon, label: "X" }
                  ].map((item) => (
                    <a key={item.label} href="#" className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-500 transition-all hover:bg-brand-600 hover:text-white hover:-translate-y-1">
                      <item.icon className="h-5 w-5" />
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900">Platform</h4>
                <ul className="mt-6 space-y-4">
                  <li><Link to="/" className="text-sm text-slate-600 hover:text-brand-600 transition-colors">Home</Link></li>
                  <li><Link to="/doctors" className="text-sm text-slate-600 hover:text-brand-600 transition-colors">Find Doctors</Link></li>
                  <li><Link to="/dashboard" className="text-sm text-slate-600 hover:text-brand-600 transition-colors">Book Appointment</Link></li>
                  <li><Link to="/auth" className="text-sm text-slate-600 hover:text-brand-600 transition-colors">Login / Register</Link></li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900">Company</h4>
                <ul className="mt-6 space-y-4">
                  <li><Link to="/about" className="text-sm text-slate-600 hover:text-brand-600 transition-colors">About Us</Link></li>
                  <li><Link to="/terms" className="text-sm text-slate-600 hover:text-brand-600 transition-colors">Terms of Service</Link></li>
                  <li><Link to="/terms" className="text-sm text-slate-600 hover:text-brand-600 transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/contact" className="text-sm text-slate-600 hover:text-brand-600 transition-colors">Contact Support</Link></li>
                </ul>
              </div>

              {/* Newsletter/Contact */}
              <div className="space-y-6">
                <h4 className="text-sm font-bold uppercase tracking-widest text-slate-900">Contact Us</h4>
                <div className="space-y-3">
                  <p className="flex items-center gap-3 text-sm text-slate-600">
                    <MailIcon className="h-4 w-4 text-brand-600" />
                    mawaisacu@gmail.com
                  </p>
                  <p className="flex items-center gap-3 text-sm text-slate-600">
                    <PhoneIcon className="h-4 w-4 text-brand-600" />
                    +92 308 1830956
                  </p>
                  <p className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPinIcon className="h-4 w-4 text-brand-600" />
                    Tufail Road Saddar Lahore Cantt.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-16 border-t border-slate-100 pt-8 flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-xs font-medium text-slate-500">
                © 2026 Prescripto. All rights reserved.
              </p>
              <div className="flex gap-6">
                <Link to="/terms" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Terms</Link>
                <Link to="/terms" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Privacy</Link>
                <Link to="/terms" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Cookies</Link>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
