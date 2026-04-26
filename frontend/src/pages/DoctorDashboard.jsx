import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import client from "../api/client";
import DashboardShell from "../components/DashboardShell";
import VerificationModal from "../components/VerificationModal";
import { DashboardIcon, AppointmentIcon, FileIcon, ProfileIcon, IconWrapper } from "../components/icons";

const DoctorDashboard = () => {
  const [availability, setAvailability] = useState([{ day: "monday", start: "09:00", end: "17:00" }]);
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadProfile = async () => {
    try {
      const { data } = await client.get("/doctors/profile");
      setProfile(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load profile");
    }
  };

  const fetchAppointments = async () => {
    try {
      const { data } = await client.get("/doctors/appointments");
      setAppointments(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load appointments");
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadProfile();
      await fetchAppointments();
      setLoading(false);
    };
    init();
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    
    return {
      today: appointments.filter(a => a.date === today).length,
      week: appointments.filter(a => new Date(a.date) >= startOfWeek).length,
      cancelled: appointments.filter(a => a.status === "cancelled").length,
      completed: appointments.filter(a => a.status === "completed").length,
    };
  }, [appointments]);

  const saveAvailability = async () => {
    await client.put("/doctors/availability", { availability });
    toast.success("Availability updated");
  };

  const updateStatus = async (id, status) => {
    await client.put(`/doctors/appointments/${id}/status`, { status });
    toast.success("Appointment updated");
    fetchAppointments();
  };

  const statusBadge = (status) => {
    if (status === "approved") return "bg-emerald-100 text-emerald-700";
    if (status === "rejected") return "bg-rose-100 text-rose-700";
    if (status === "completed") return "bg-blue-100 text-blue-700";
    return "bg-amber-100 text-amber-700";
  };

  if (loading) {
    return <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Loading...</div>;
  }

  if (profile?.status !== "approved") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <VerificationModal 
          isOpen={true} 
          onAction={() => navigate("/")} 
        />
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-400">Access Restricted</h2>
          <p className="mt-2 text-sm text-slate-400">Please wait for admin approval.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Today Appointments", value: stats.today, icon: AppointmentIcon },
    { label: "This Week Appointments", value: stats.week, icon: AppointmentIcon },
    { label: "Cancelled", value: stats.cancelled, icon: AppointmentIcon },
    { label: "Completed", value: stats.completed, icon: AppointmentIcon },
  ];

  return (
    <DashboardShell
      title="Doctor Dashboard"
      subtitle="Manage appointments, profile, and verification status."
      navItems={[
        { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
        { id: "appointments", label: "Appointments", icon: AppointmentIcon },
        { id: "applications", label: "Applications", icon: FileIcon },
        { id: "profile", label: "Profile", icon: ProfileIcon },
      ]}
    >
      {(activeTab) => (
      <>
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map((item) => (
                <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <IconWrapper>
                      <item.icon />
                    </IconWrapper>
                    <div>
                      <p className="text-2xl font-bold text-cyan-700">{item.value}</p>
                      <p className="text-xs text-slate-600">{item.label}</p>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Manage Availability</h3>
              {availability.map((slot, idx) => (
                <div className="mt-3 flex flex-wrap gap-2" key={idx}>
                  <input value={slot.day} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-600" onChange={(e) => setAvailability((p) => p.map((s, i) => i === idx ? { ...s, day: e.target.value } : s))} />
                  <input value={slot.start} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-600" onChange={(e) => setAvailability((p) => p.map((s, i) => i === idx ? { ...s, start: e.target.value } : s))} />
                  <input value={slot.end} className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-600" onChange={(e) => setAvailability((p) => p.map((s, i) => i === idx ? { ...s, end: e.target.value } : s))} />
                </div>
              ))}
              <button type="button" className="mt-4 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700 transition-colors" onClick={saveAvailability}>Save Availability</button>
            </section>
          </div>
        )}

        {activeTab === "appointments" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Appointments</h3>
            {appointments.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No appointments assigned.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Date/Time</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a._id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3">{a.patient?.name}</td>
                        <td className="px-4 py-3">{a.date} {a.timeSlot}</td>
                        <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(a.status)}`}>{a.status}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white" type="button" onClick={() => updateStatus(a._id, "accepted")}>Accept</button>
                            <button className="rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white" type="button" onClick={() => updateStatus(a._id, "rejected")}>Reject</button>
                            <button className="rounded bg-brand-600 px-2 py-1 text-xs font-semibold text-white" type="button" onClick={() => updateStatus(a._id, "completed")}>Complete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {activeTab === "applications" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Application Status</h3>
            <p className="mt-2 text-sm text-slate-600">Current status:</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(profile?.status)}`}>{profile?.status}</span>
          </section>
        )}

        {activeTab === "profile" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">My Profile</h3>
            <div className="mt-3 grid gap-2 text-sm text-slate-700">
              <p><strong>Name:</strong> {profile?.user?.name}</p>
              <p><strong>Email:</strong> {profile?.user?.email}</p>
              <p><strong>Specialization:</strong> {profile?.specialization}</p>
              <p><strong>Experience:</strong> {profile?.experienceYears} years</p>
              <p><strong>Status:</strong> {profile?.status}</p>
            </div>
          </section>
        )}
      </>
      )}
    </DashboardShell>
  );
};

export default DoctorDashboard;
