import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import LogoImg from "../assets/logo2.jpeg";
import { useAuth } from "../state/AuthContext";
import { HourglassIcon } from "../icons";
import VerificationModal from "../components/VerificationModal";
import Dropdown from "../components/Dropdown";

const SPECIALIZATIONS = [
  "Cardiologist",
  "Dermatologist",
  "Neurologist",
  "Orthopedic",
  "Pediatrician",
  "General Physician",
];

const ROLES = [
  { value: "patient", label: "Join as Patient" },
  { value: "doctor", label: "Join as Healthcare Professional" },
];

const SignupPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "patient",
    specialization: "General Physician",
    experience: "",
    degreeFile: null,
  });
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onChange = (e) => {
    const name = e.target.name;
    const file = e.target.files ? e.target.files[0] : null;

    if (name === "image" && file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const ratio = img.width / img.height;
        if (img.width < 400 || img.height < 400) {
          toast.error("Image must be at least 400x400 pixels");
          e.target.value = "";
          return;
        }
        if (ratio < 0.7 || ratio > 1.3) {
          toast.error("Please upload a square or portrait image (Aspect Ratio 1:1 or 4:5)");
          e.target.value = "";
          return;
        }
        setForm((p) => ({ ...p, [name]: file }));
      };
      return;
    }

    const value = e.target.type === "file" ? e.target.files[0] : e.target.value;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onDropdownChange = (name, value) => {
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      if (form.role === "doctor") {
        setShowVerificationModal(true);
      } else {
        toast.success("Welcome to Prescripto");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
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
            <h2 className="text-3xl font-extrabold text-slate-900">Sign Up</h2>
            <div className="mt-2 h-1 w-10 rounded-full bg-brand-600" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                name="name"
                placeholder="Full Name"
                onChange={onChange}
                required
                className="w-full border-b border-slate-200 py-2 text-sm outline-none transition-colors focus:border-brand-600"
              />
              <input
                name="phone"
                placeholder="Phone Number"
                onChange={onChange}
                required
                className="w-full border-b border-slate-200 py-2 text-sm outline-none transition-colors focus:border-brand-600"
              />
            </div>

            <input
              name="email"
              type="email"
              placeholder="Enter your email"
              onChange={onChange}
              required
              className="w-full border-b border-slate-200 py-2 text-sm outline-none transition-colors focus:border-brand-600"
            />

            <input
              name="password"
              type="password"
              placeholder="Choose Password"
              onChange={onChange}
              required
              className="w-full border-b border-slate-200 py-2 text-sm outline-none transition-colors focus:border-brand-600"
            />

            <Dropdown
              options={ROLES}
              value={form.role}
              onChange={(val) => onDropdownChange("role", val)}
              placeholder="Select Role"
            />

            {form.role === "doctor" && (
              <div className="grid gap-4 animate-in slide-in-from-left-2">
                <Dropdown
                  options={SPECIALIZATIONS}
                  value={form.specialization}
                  onChange={(val) => onDropdownChange("specialization", val)}
                  placeholder="Select Specialization"
                />
                <input
                  name="experience"
                  type="number"
                  placeholder="Years of Experience"
                  onChange={onChange}
                  required
                  className="w-full border-b border-slate-200 py-2 text-sm outline-none transition-colors focus:border-brand-600"
                />
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Professional Photo (Headshot)</p>
                  <input name="image" type="file" accept="image/*" onChange={onChange} required className="text-xs text-slate-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Certification (PDF/Image)</p>
                  <input name="degreeFile" type="file" accept=".pdf,image/*" onChange={onChange} required className="text-xs text-slate-500" />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <input type="checkbox" required id="terms" className="h-4 w-4 rounded border-slate-300 text-brand-600" />
              <label htmlFor="terms" className="text-xs text-slate-500">
                Agreed to <Link to="/terms" className="font-bold text-brand-600 hover:underline">Terms and Conditions</Link>
              </label>
            </div>

            <div className="pt-4">
              <button
                disabled={loading}
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 py-4 text-sm font-bold text-white shadow-xl shadow-brand-100 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Processing..." : "Register"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-slate-500">
            <p>
              Already a member?{" "}
              <Link to="/login" className="font-bold text-brand-600 hover:underline">Login</Link>
            </p>
          </div>
        </div>
      </div>

      <VerificationModal
        isOpen={showVerificationModal}
        onAction={() => navigate("/login")}
      />
    </div>
  );
};

export default SignupPage;
