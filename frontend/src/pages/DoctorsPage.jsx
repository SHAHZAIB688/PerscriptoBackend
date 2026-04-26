import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import client from "../api/client";
import Dropdown from "../components/Dropdown";

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await client.get("/doctors");
        setDoctors(data || []);
        setFilteredDoctors(data || []);
      } catch (error) {
        toast.error("Unable to load doctors");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  useEffect(() => {
    let result = doctors;
    if (category !== "All") {
      result = result.filter(doc => doc.specialization === category);
    }
    if (search) {
      result = result.filter(doc =>
        doc.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        doc.specialization?.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFilteredDoctors(result);
  }, [search, category, doctors]);

  const categories = ["All", ...new Set(doctors.map(doc => doc.specialization))];
  const IMAGE_BASE_URL = "http://localhost:5000";

  return (
    <div className="space-y-8 pb-12">
      <section className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between pt-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">Find Your Specialist</h1>
          <p className="mt-2 text-slate-600">Search through our verified network of expert doctors.</p>
        </div>
        <div className="flex w-full max-w-4xl flex-col gap-0 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 sm:flex-row sm:items-center">
          <div className="relative flex-1 group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name, specialty or clinic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent py-5 pl-14 pr-5 text-sm font-medium outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="hidden h-8 w-px bg-slate-100 sm:block" />

          <div className="min-w-[220px]">
            <Dropdown
              options={categories}
              value={category}
              onChange={setCategory}
              placeholder="All Specialties"
              className="px-5 py-2 border-none"
            />
          </div>

          <button className="hidden bg-brand-600 px-8 py-5 text-sm font-bold text-white transition-all hover:bg-brand-700 sm:block">
            Search
          </button>
        </div>
      </section>

      {loading ? (
        <div className="flex h-80 items-center justify-center rounded-[2.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
            <p className="text-sm font-medium text-slate-500">Fetching verified doctors...</p>
          </div>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="rounded-[2.5rem] border border-dashed border-slate-300 bg-white p-24 text-center shadow-sm">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-4xl shadow-inner mb-6">
            👨‍⚕️
          </div>
          <h3 className="text-2xl font-bold text-slate-900">No doctors match your criteria</h3>
          <p className="mt-3 text-slate-500 max-w-md mx-auto">We couldn't find any specialists matching your search. Try changing the category or clearing your search.</p>
          <button
            onClick={() => { setSearch(""); setCategory("All"); }}
            className="mt-8 rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-200 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredDoctors.map((doctor) => (
            <article key={doctor._id} className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
              <div className="relative h-60 overflow-hidden rounded-[1.5rem] bg-slate-50 border border-slate-100">
                <img
                  src={doctor.image ? `${IMAGE_BASE_URL}${doctor.image}` : `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(doctor.user?.name || "Doctor")}`}
                  alt={doctor.user?.name || "Doctor"}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-1.5 text-xs font-bold text-emerald-600 backdrop-blur shadow-sm flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Verified Professional
                </div>
              </div>
              <div className="mt-8 flex flex-col flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">Dr. {doctor.user?.name}</h3>
                    <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-brand-500">{doctor.specialization}</p>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-xl bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-600 border border-amber-100">
                    ★ 4.8
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4 border-y border-slate-100 py-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Experience</p>
                    <p className="text-sm font-bold text-slate-700">{doctor.experienceYears || 5}+ Years</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Availability</p>
                    <p className="text-sm font-bold text-slate-700 text-emerald-600">Mon - Fri</p>
                  </div>
                </div>

                <div className="mt-auto pt-6">
                  <Link to="/dashboard" className="flex items-center justify-center gap-2 w-full rounded-2xl bg-brand-600 py-4 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:bg-brand-700 active:scale-[0.98] group-hover:shadow-brand-200">
                    Book Appointment
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default DoctorsPage;
