import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import LogoImg from "../assets/logo2.jpeg";
import { useAuth } from "../state/AuthContext";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      toast.success("Welcome back to Prescripto");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 md:p-12">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl md:flex-row min-h-fit">
        {/* Left Side - Brand Panel */}
        <div className="relative flex w-full flex-col justify-between bg-[#2e324d] p-8 text-white md:w-[40%] lg:p-10">
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <img src={LogoImg} alt="Logo" className="h-10 w-10 rounded-xl bg-white/10 p-1" />
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

          <div className="absolute -right-20 top-1/4 h-64 w-64 rounded-full bg-brand-500/10 blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]" />
        </div>

        {/* Right Side - Form Panel */}
        <div className="flex w-full flex-col justify-center px-8 md:px-12 py-8 md:w-[60%]">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-slate-900">Sign In</h2>
            <div className="mt-2 h-1 w-10 rounded-full bg-brand-600" />
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
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
                placeholder="Enter your Password"
                onChange={onChange}
                required
                className="w-full border-b border-slate-200 py-3 text-sm outline-none transition-colors focus:border-brand-600"
              />
            </div>

            <div className="pt-4">
              <button
                disabled={loading}
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 py-4 text-sm font-bold text-white shadow-xl shadow-brand-100 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Processing..." : "Sign In"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-slate-500">
            <p>
              Not a member?{" "}
              <Link to="/signup" className="font-bold text-brand-600 hover:underline">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
