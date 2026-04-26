import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import client from "../api/client";
import DashboardShell from "../components/DashboardShell";
import { DashboardIcon, DoctorIcon, AppointmentIcon, FileIcon } from "../components/icons";

const PatientDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [filters, setFilters] = useState({ search: "", specialization: "" });
  const [form, setForm] = useState({ doctorProfileId: "", date: "", timeSlot: "", reason: "" });

  const fetchDoctors = async () => {
    const { data } = await client.get("/doctors", { params: filters });
    setDoctors(data);
  };

  const fetchAppointments = async () => {
    const { data } = await client.get("/appointments/my");
    setAppointments(data);
  };

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();
  }, []);

  const book = async (e) => {
    e.preventDefault();
    try {
      await client.post("/appointments", form);
      toast.success("Appointment booked and WhatsApp sent");
      setForm({ doctorProfileId: "", date: "", timeSlot: "", reason: "" });
      fetchAppointments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking failed");
    }
  };

  const cancel = async (id) => {
    await client.put(`/appointments/${id}/cancel`);
    fetchAppointments();
  };

  const reschedule = async (id) => {
    const date = window.prompt("Enter new date (YYYY-MM-DD)");
    const timeSlot = window.prompt("Enter new time slot (HH:mm)");
    if (!date || !timeSlot) return;
    await client.put(`/appointments/${id}/reschedule`, { date, timeSlot });
    fetchAppointments();
  };

  return (
    <DashboardShell
      title="Patient Dashboard"
      subtitle="Manage appointments and find trusted doctors."
      navItems={[
        { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
        { id: "doctors", label: "Find Doctors", icon: DoctorIcon },
        { id: "book", label: "Book Appointment", icon: AppointmentIcon },
        { id: "history", label: "Appointment History", icon: FileIcon },
      ]}
    >
      {(activeTab) => (
        <div className="grid gap-4 lg:grid-cols-2">
          {(activeTab === "dashboard" || activeTab === "doctors") && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Find Doctors</h3>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input placeholder="Search specialization..." value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} />
                <button onClick={fetchDoctors} type="button" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Search</button>
              </div>
              <ul className="mt-4 space-y-2">
                {doctors.map((d) => (
                  <li key={d._id} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
                    <strong>{d.user?.name}</strong> - {d.specialization}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {(activeTab === "dashboard" || activeTab === "book") && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Book Appointment</h3>
              <form className="mt-3 grid gap-3" onSubmit={book}>
                <select required value={form.doctorProfileId} onChange={(e) => setForm((p) => ({ ...p, doctorProfileId: e.target.value }))}>
                  <option value="">Select doctor</option>
                  {doctors.map((d) => <option key={d._id} value={d._id}>{d.user?.name} - {d.specialization}</option>)}
                </select>
                <input type="date" required value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
                <input placeholder="Time slot (e.g. 10:30)" required value={form.timeSlot} onChange={(e) => setForm((p) => ({ ...p, timeSlot: e.target.value }))} />
                <textarea placeholder="Reason" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} />
                <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Book</button>
              </form>
            </section>
          )}

          {(activeTab === "dashboard" || activeTab === "history") && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
              <h3 className="text-lg font-semibold text-slate-900">Appointment History</h3>
              <ul className="mt-3 space-y-2">
                {appointments.map((a) => (
                  <li key={a._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-sm">
                    <span>Dr. {a.doctor?.name} ({a.doctorProfile?.specialization}) - {a.date} {a.timeSlot} - {a.status}</span>
                    {a.status !== "cancelled" && a.status !== "completed" && (
                      <div className="flex gap-2">
                        <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => reschedule(a._id)}>Reschedule</button>
                        <button type="button" className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700" onClick={() => cancel(a._id)}>Cancel</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </DashboardShell>
  );
};

export default PatientDashboard;
