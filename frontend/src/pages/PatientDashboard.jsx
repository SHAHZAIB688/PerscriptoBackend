import { useEffect, useState, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import client from "../api/client";
import DashboardShell from "../components/DashboardShell";
import { DashboardIcon, DoctorIcon, AppointmentIcon, FileIcon } from "../components/icons";
import { generatePDF } from "../utils/generatePDF";

const PatientDashboard = () => {
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [filters, setFilters] = useState({ search: "", specialization: "" });
  const [form, setForm] = useState({ doctorProfileId: "", date: "", timeSlot: "", reason: "" });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ isOpen: false, appointmentId: null, doctorName: "", method: "stripe", details: "" });
  const [reviewModal, setReviewModal] = useState({ isOpen: false, appointmentId: null, doctorName: "", rating: 5, comment: "" });
  const prevAppointmentsRef = useRef([]);

  const fetchDoctors = async () => {
    const { data } = await client.get("/doctors", { params: filters });
    setDoctors(data);
  };

  const fetchAppointments = async () => {
    try {
      const { data } = await client.get("/appointments/my");

      if (prevAppointmentsRef.current.length > 0) {
        data.forEach(newAppt => {
          const oldAppt = prevAppointmentsRef.current.find(a => a._id === newAppt._id);
          if (oldAppt && oldAppt.status !== "in-progress" && newAppt.status === "in-progress") {
            toast.success(`Dr. ${newAppt.doctor?.name || ''} has started your video call!`, { duration: 8000 });
          }
        });
      }
      prevAppointmentsRef.current = data;
      setAppointments(data);
    } catch (err) {
      console.error("Failed to fetch appointments");
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchAppointments();

    const intervalId = setInterval(fetchAppointments, 10000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!form.doctorProfileId || !form.date) {
        setAvailableSlots([]);
        return;
      }

      setLoadingSlots(true);
      try {
        const { data } = await client.get(`/doctors/available-slots/${form.doctorProfileId}`, {
          params: { date: form.date },
        });
        setAvailableSlots(Array.isArray(data) ? data : []);
      } catch (error) {
        setAvailableSlots([]);
        toast.error("Failed to load available time slots");
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [form.doctorProfileId, form.date]);

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

  const handleVideoCall = (appointment) => {
    const appointmentTime = new Date(`${appointment.date}T${appointment.timeSlot}:00`);
    const now = new Date();

    const diffMs = appointmentTime - now;
    const diffMins = diffMs / (1000 * 60);

    if (diffMins > 5) {
      toast.error(`Please wait. You can only join the call 5 mins before scheduled time.`);
      return;
    }

    window.open(`https://meet.jit.si/Prescripto-Appt-${appointment._id}`, "_blank");
  };

  const openPaymentModal = (id, doctorName) => {
    setPaymentModal({ isOpen: true, appointmentId: id, doctorName, method: "stripe", details: "" });
  };

  const processPayment = async (e) => {
    e.preventDefault();
    if (!paymentModal.details) {
      toast.error("Please enter your account details.");
      return;
    }
    try {
      await client.put(`/appointments/${paymentModal.appointmentId}/pay`);
      toast.success(`Payment successful via ${paymentModal.method.toUpperCase()}! Meeting is now completed.`);
      fetchAppointments();
      const currentId = paymentModal.appointmentId;
      const currentDoc = paymentModal.doctorName;
      setPaymentModal({ isOpen: false, appointmentId: null, doctorName: "", method: "stripe", details: "" });

      // Open review modal after a short delay
      setTimeout(() => {
        setReviewModal({ isOpen: true, appointmentId: currentId, doctorName: currentDoc, rating: 5, comment: "" });
      }, 800);
    } catch (err) {
      toast.error("Payment failed. Please try again.");
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await client.post("/reviews", {
        appointmentId: reviewModal.appointmentId,
        rating: reviewModal.rating,
        comment: reviewModal.comment
      });
      toast.success("Thank you for your feedback!");
      setReviewModal({ isOpen: false, appointmentId: null, doctorName: "", rating: 5, comment: "" });
      fetchDoctors(); // Refresh doctor ratings
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    }
  };

  const notifications = useMemo(() => {
    const list = [];
    appointments.forEach(a => {
      if (a.status === "accepted") {
        list.push({ id: `accepted-${a._id}`, title: "Request Accepted!", message: `Dr. ${a.doctor?.name} accepted your appointment. You can join the call now.`, type: "info", linkTab: "history" });
      }
      if (a.status === "in-progress") {
        list.push({ id: `call-${a._id}`, title: "Call In-Progress", message: `Dr. ${a.doctor?.name} is waiting for you.`, type: "alert", linkTab: "history" });
      }
      if (a.status === "awaiting-payment") {
        list.push({ id: `pay-${a._id}`, title: "Payment Pending", message: `Please pay Rs. ${a.doctorProfile?.consultationFee || 2000} to complete your visit.`, type: "info", linkTab: "history" });
      }
      if (a.prescription) {
        list.push({ id: `rx-${a._id}`, title: "New Prescription", message: `Dr. ${a.doctor?.name} has sent you a prescription.`, type: "info", linkTab: "history" });
      }
      if (a.review?.doctorResponse) {
        list.push({ id: `rev-${a._id}`, title: "Doctor Replied", message: `Dr. ${a.doctor?.name} responded to your feedback.`, type: "info", linkTab: "history" });
      }
    });
    return list;
  }, [appointments]);

  return (
    <>
      <DashboardShell
        title="Patient Dashboard"
        subtitle="Manage appointments and find trusted doctors."
        notifications={notifications}
        navItems={[
          { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
          { id: "doctors", label: "Find Doctors", icon: DoctorIcon },
          { id: "book", label: "Book Appointment", icon: AppointmentIcon },
          { id: "history", label: "Appointment History", icon: FileIcon, hasNotification: appointments.some((a) => a.status === "accepted" || a.status === "in-progress" || a.status === "awaiting-payment") },
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
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {doctors.map((d) => (
                    <div key={d._id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-brand-300 hover:shadow-md">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                          <DoctorIcon />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors">Dr. {d.user?.name}</h4>
                          <p className="text-xs text-slate-500">{d.specialization}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500">
                              ★ {d.averageRating?.toFixed(1) || "5.0"}
                            </span>
                            <span className="text-[10px] text-slate-400">({d.numReviews || 0} reviews)</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Fee</div>
                        <div className="text-sm font-bold text-brand-600">Rs. {d.consultationFee || 2000}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(activeTab === "dashboard" || activeTab === "book") && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Book Appointment</h3>
                <form className="mt-3 grid gap-3" onSubmit={book}>
                  <select required value={form.doctorProfileId} onChange={(e) => {
                    setForm((p) => ({ ...p, doctorProfileId: e.target.value, timeSlot: "" }));
                    setAvailableSlots([]);
                  }}>
                    <option value="">Select doctor</option>
                    {doctors.map((d) => <option key={d._id} value={d._id}>{d.user?.name} - {d.specialization}</option>)}
                  </select>
                  <input type="date" required value={form.date} min={new Date().toISOString().split("T")[0]} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value, timeSlot: "" }))} />
                  
                  <select 
                    required 
                    value={form.timeSlot} 
                    onChange={(e) => setForm((p) => ({ ...p, timeSlot: e.target.value }))}
                    disabled={!form.date || !form.doctorProfileId || loadingSlots}
                  >
                    <option value="">{loadingSlots ? "Loading slots..." : availableSlots.length > 0 ? "Select time slot" : "No slots available"}</option>
                    {availableSlots.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>

                  <textarea placeholder="Reason" value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} />
                  <button type="submit" className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Book</button>
                </form>
              </section>
            )}

            {(activeTab === "dashboard" || activeTab === "history") && (
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                <h3 className="text-lg font-semibold text-slate-900">Appointment History</h3>
                <ul className="mt-3 space-y-3">
                  {appointments.map((a) => (
                    <li key={a._id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 text-sm bg-white shadow-sm transition-all hover:border-brand-200">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                            <DoctorIcon />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">Dr. {a.doctor?.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{a.doctorProfile?.specialization} • {a.date} {a.timeSlot}</p>
                          </div>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${a.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : a.status === 'accepted' || a.status === 'in-progress' ? 'bg-brand-100 text-brand-700 border border-brand-200' : 'bg-slate-100 text-slate-600'}`}>{a.status}</span>
                      </div>

                      {a.status !== "cancelled" && a.status !== "completed" && a.status !== "rejected" && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {a.status === "awaiting-payment" && (
                            <button type="button" className="animate-bounce rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200" onClick={() => openPaymentModal(a._id, a.doctor?.name)}>Pay Now</button>
                          )}
                          {(a.status === "accepted" || a.status === "in-progress") && (
                            <button type="button" className="animate-pulse rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200" onClick={() => handleVideoCall(a)}>
                              {a.status === "accepted" ? "Join Call Now" : "Join In-Progress Call"}
                            </button>
                          )}
                          {a.status === "pending" && (
                            <>
                              <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => reschedule(a._id)}>Reschedule</button>
                              <button type="button" className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700" onClick={() => cancel(a._id)}>Cancel</button>
                            </>
                          )}
                        </div>
                      )}

                      {a.prescription && (
                        <div className="flex flex-wrap gap-2 mt-2">
                           <button 
                             type="button" 
                             onClick={() => generatePDF(a.prescription, a.doctor?.name, a.doctorProfile?.specialization)}
                             className="flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors"
                           >
                             <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                             Download Prescription
                           </button>
                        </div>
                      )}

                      {a.review?.doctorResponse && (
                        <div className="mt-2 rounded-xl bg-brand-50 border border-brand-100 p-3 animate-in fade-in slide-in-from-top-2 duration-500">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold text-brand-700 uppercase tracking-widest flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-500"></span>
                              Doctor's Reply
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 italic">"{a.review.doctorResponse}"</p>
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

      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Complete Payment</h3>
            <p className="text-sm text-slate-500 mb-6">Send consultation fee to Dr. {paymentModal.doctorName}</p>

            <form onSubmit={processPayment} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Payment Method</label>
                <select
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  value={paymentModal.method}
                  onChange={(e) => setPaymentModal({ ...paymentModal, method: e.target.value })}
                >
                  <option value="stripe">Stripe</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  {paymentModal.method === "bank" ? "Bank Account Number / IBAN" : "Mobile Number"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={paymentModal.method === "bank" ? "PKXX BANK..." : "03XX XXXXXXX"}
                  className="w-full rounded-xl border border-slate-300 p-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                  value={paymentModal.details}
                  onChange={(e) => setPaymentModal({ ...paymentModal, details: e.target.value })}
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentModal({ isOpen: false, appointmentId: null, doctorName: "", method: "stripe", details: "" })}
                  className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-800 mb-1">Rate Your Experience</h3>
            <p className="text-sm text-slate-500 mb-6">How was your consultation with Dr. {reviewModal.doctorName}?</p>

            <form onSubmit={submitReview} className="space-y-5">
              <div className="flex justify-center gap-2 text-3xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewModal({ ...reviewModal, rating: star })}
                    className={`transition-transform hover:scale-110 ${reviewModal.rating >= star ? "text-amber-400" : "text-slate-200"}`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Comments (Optional)</label>
                <textarea
                  rows="3"
                  placeholder="Share your feedback..."
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
                  value={reviewModal.comment}
                  onChange={(e) => setReviewModal({ ...reviewModal, comment: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setReviewModal({ isOpen: false, appointmentId: null, doctorName: "", rating: 5, comment: "" })}
                  className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Skip
                </button>
                <button
                  type="submit"
                  className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-md shadow-brand-200"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PatientDashboard;
