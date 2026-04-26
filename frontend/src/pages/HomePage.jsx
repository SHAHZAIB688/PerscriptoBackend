import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import client from "../api/client";

const HomePage = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await client.get("/doctors");
        setDoctors(data || []);
      } catch (error) {
        toast.error("Unable to load doctors");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const IMAGE_BASE_URL = "http://localhost:5000";

  return (
    <div className="space-y-16 pb-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-brand-700 via-brand-600 to-cyan-600 px-6 py-12 text-white shadow-xl lg:px-12">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-100">Trusted Digital Care</p>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">Book Appointments with Trusted Doctors</h1>
            <p className="mt-4 max-w-xl text-base text-cyan-50 md:text-lg">
              Find specialists, book in seconds, and stay updated with secure healthcare reminders and notifications.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/doctors" className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-brand-700 shadow hover:bg-cyan-50">Find Doctors</Link>
              <Link to="/dashboard" className="rounded-xl border border-white/60 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">Book Appointment</Link>
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?auto=format&fit=crop&w=900&q=80"
              alt="Doctor consultation"
              className="h-72 w-full max-w-md rounded-2xl object-cover shadow-2xl ring-4 ring-white/20"
            />
          </div>
        </div>
      </section>

      <section id="doctors" className="space-y-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Find Top Doctors</h2>
            <p className="mt-1 text-sm text-slate-600">Browse verified specialists and book instantly.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="text-lg font-semibold text-slate-900">No doctors found</h3>
            <p className="mt-1 text-sm text-slate-500">Please check again later or update your filters.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {doctors.map((doctor) => (
              <article key={doctor._id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <img
                  src={doctor.image ? `${IMAGE_BASE_URL}${doctor.image}` : `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(doctor.user?.name || "Doctor")}`}
                  alt={doctor.user?.name || "Doctor"}
                  className="h-44 w-full rounded-xl bg-slate-100 object-cover"
                />
                <h3 className="mt-4 text-lg font-bold text-slate-900">Dr. {doctor.user?.name}</h3>
                <p className="text-sm text-brand-700">{doctor.specialization}</p>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p>Experience: {doctor.experienceYears || 5}+ years</p>
                  <p>Rating: 4.8 / 5.0</p>
                </div>
                <Link to="/dashboard" className="mt-4 inline-block w-full rounded-xl bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-700">
                  Book Now
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-12 py-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">What Our Patients Say</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Real stories from people who have experienced a better way to manage their healthcare with Prescripto.
          </p>
        </div>
        <div className="relative overflow-hidden before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-20 before:bg-gradient-to-r before:from-slate-50 before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-20 after:bg-gradient-to-l after:from-slate-50 after:to-transparent">
          <div className="animate-marquee flex gap-8 py-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-8">
                {[
                  {
                    "name": "Ali Raza",
                    "role": "Patient",
                    "image": "https://randomuser.me/api/portraits/men/32.jpg",
                    "content": "Prescripto ne meri appointments manage karna bohat easy bana diya hai. Ab line mein wait nahi karna parta aur doctors bhi bohat professional hain.",
                    "rating": 5
                  },
                  {
                    "name": "Fatima Ahmed",
                    "role": "Patient",
                    "image": "https://randomuser.me/api/portraits/women/44.jpg",
                    "content": "Mujhe WhatsApp notifications ka feature bohat pasand aaya. Har appointment ka reminder mil jata hai, jo bohat helpful hai.",
                    "rating": 5
                  },
                  {
                    "name": "Usman Khan",
                    "role": "Patient",
                    "image": "https://randomuser.me/api/portraits/men/76.jpg",
                    "content": "Interface simple aur user-friendly hai. Main easily apni family ke liye appointments book kar leta hoon. Bohat acha system hai.",
                    "rating": 4
                  },
                  {
                    "name": "Ayesha Malik",
                    "role": "Patient",
                    "image": "https://randomuser.me/api/portraits/women/68.jpg",
                    "content": "Security features dekh kar mujhe confidence mila ke meri personal information safe hai. Yeh ek modern aur reliable healthcare platform hai.",
                    "rating": 5
                  },
                  {
                    "name": "Hassan Ali",
                    "role": "Patient",
                    "image": "https://randomuser.me/api/portraits/men/51.jpg",
                    "content": "Online booking system bohat fast hai aur doctors ka selection bhi wide hai. Time aur effort dono bach jate hain.",
                    "rating": 4
                  }
                ].map((item, index) => (
                  <div key={index} className="group relative flex w-[350px] flex-shrink-0 flex-col rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                    <div className="absolute -top-4 -right-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-2xl text-white opacity-0 transition-opacity group-hover:opacity-100">
                      "
                    </div>
                    <div className="flex items-center gap-4">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-2xl object-cover ring-4 ring-brand-50 transition-transform group-hover:scale-105"
                      />
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">{item.name}</h4>
                        <p className="text-sm font-medium text-brand-600">{item.role}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex gap-1 text-amber-400">
                      {[...Array(item.rating)].map((_, i) => (
                        <span key={i} className="text-xl">★</span>
                      ))}
                    </div>
                    <p className="mt-4 text-slate-600 leading-relaxed italic">
                      "{item.content}"
                    </p>
                    <div className="mt-6 h-1 w-12 rounded-full bg-brand-100 transition-all group-hover:w-full group-hover:bg-brand-600"></div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
