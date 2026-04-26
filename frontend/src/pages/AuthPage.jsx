import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../state/AuthContext";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "patient",
  specialization: "General Physician",
  experience: "",
  degreeFile: null,
};

const SPECIALIZATIONS = [
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedic",
  "Pediatrician",
  "General Physician",
];

const AuthPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
  };

  const onChange = (e) => {
    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;
    setForm((p) => ({ ...p, [e.target.name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") await login({ email: form.email, password: form.password });
      else {
        await register(form);
        toast.success(form.role === "doctor" ? "Application submitted for verification" : "Welcome to Prescripto");
      }
      if (mode === "login") toast.success("Welcome back to Prescripto");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 md:p-12">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl md:flex-row min-h-fit">
        {/* Left Side - Brand Panel */}
        <div className="relative flex w-full flex-col justify-between bg-[#2e324d] p-8 text-white md:w-[40%] lg:p-10">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <img src="./src/assets/logo2.jpeg" alt="Logo" className="h-10 w-10 rounded-xl bg-white/10 p-1" />
              <div>
                <h2 className="text-xl font-bold tracking-tight">Prescripto</h2>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Slogan here</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 space-y-4 my-10">
            <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
              Start our <br /> journey
            </h1>
            <p className="text-xs leading-relaxed text-slate-400">
              Join thousands of healthcare professionals and patients who trust Prescripto for their medical appointments.
            </p>
          </div>

          <div className="relative z-10">
            <div className="h-1 w-12 rounded-full bg-brand-500" />
          </div>

          {/* Abstract Decorations */}
          <div className="absolute -right-20 top-1/4 h-64 w-64 rounded-full bg-brand-500/10 blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]" />
        </div>

        {/* Right Side - Form Panel */}
        <div className="flex w-full flex-col justify-center px-8 md:px-12 py-8 md:w-[60%]">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-slate-900">
              {mode === "login" ? "Sign In" : "Sign Up"}
            </h2>
            <div className="mt-2 h-1 w-10 rounded-full bg-brand-600" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "register" && (
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="relative">
                  <input
                    name="name"
                    type="text"
                    placeholder="Full Name"
                    onChange={onChange}
                    required
                    className="w-full border-b border-slate-200 py-3 text-sm outline-none transition-colors focus:border-brand-600"
                  />
                </div>
                <div className="relative">
                  <input
                    name="phone"
                    type="text"
                    placeholder="Phone Number"
                    onChange={onChange}
                    required
                    className="w-full border-b border-slate-200 py-3 text-sm outline-none transition-colors focus:border-brand-600"
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                onChange={onChange}
                required
                className="w-full border-b border-slate-200 py-3 text-sm outline-none transition-colors focus:border-brand-600"
              />
            </div>

            <div className="relative">
              <input
                name="password"
                type="password"
                placeholder="Choose Password"
                onChange={onChange}
                required
                className="w-full border-b border-slate-200 py-3 text-sm outline-none transition-colors focus:border-brand-600"
              />
            </div>

            {mode === "register" && (
              <div className="space-y-6 pt-2">
                <div className="relative group">
                  <select
                    name="role"
                    onChange={onChange}
                    value={form.role}
                    className="w-full appearance-none border-b border-slate-200 bg-transparent py-3 text-sm text-slate-600 outline-none transition-colors focus:border-brand-600 cursor-pointer pr-8"
                  >
                    <option value="patient">Join as Patient</option>
                    <option value="doctor">Join as Healthcare Professional</option>
                    <option value="admin">System Administrator</option>
                  </select>
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 group-focus-within:text-brand-600 transition-transform group-focus-within:rotate-180">
                    ▼
                  </div>
                </div>

                {form.role === "doctor" && (
                  <div className="grid gap-6 animate-in slide-in-from-left-2 duration-300">
                    <div className="relative group">
                      <select
                        name="specialization"
                        onChange={onChange}
                        value={form.specialization}
                        required
                        className="w-full appearance-none border-b border-slate-200 bg-transparent py-3 text-sm text-slate-600 outline-none transition-colors focus:border-brand-600 cursor-pointer pr-8"
                      >
                        {SPECIALIZATIONS.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 group-focus-within:text-brand-600 transition-transform group-focus-within:rotate-180">
                        ▼
                      </div>
                    </div>
                    <input
                      name="experience"
                      type="number"
                      placeholder="Years of Experience"
                      onChange={onChange}
                      required
                      className="w-full border-b border-slate-200 py-3 text-sm outline-none transition-colors focus:border-brand-600"
                    />
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Upload Certification (PDF/Image)</p>
                      <input name="degreeFile" type="file" accept=".pdf,image/*" onChange={onChange} required className="text-xs text-slate-500" />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" required id="terms" className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
              <label htmlFor="terms" className="text-xs text-slate-500">
                Agreed to <Link to="/terms" className="font-bold text-brand-600 hover:underline">Terms and Conditions</Link>
              </label>
            </div>

            <div className="pt-2">
              <button
                disabled={loading}
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 py-3 text-sm font-bold text-white shadow-xl shadow-brand-100 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    Processing...
                  </span>
                ) : (
                  mode === "login" ? "Sign In" : "Register"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm font-medium text-slate-500">
            {mode === "login" ? (
              <p>
                Not a member?{" "}
                <button
                  onClick={() => handleModeChange("register")}
                  className="font-bold text-brand-600 hover:underline"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p>
                Already a member?{" "}
                <button
                  onClick={() => handleModeChange("login")}
                  className="font-bold text-brand-600 hover:underline"
                >
                  Login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
