import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import client from "../api/client";
import DashboardShell from "../components/DashboardShell";
import VerificationModal from "../components/VerificationModal";
import PrescriptionForm from "../components/PrescriptionForm";
import { DashboardIcon, AppointmentIcon, FileIcon, ProfileIcon, IconWrapper } from "../components/icons";

const WEEKDAY_OPTIONS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const DEFAULT_SLOT = { start: "09:00", end: "17:00" };

const normalizeSingleAvailability = (slots = []) => {
  const matched = slots.find((slot) => WEEKDAY_OPTIONS.includes((slot?.day || "").trim().toLowerCase()));
  const matchedRange = slots.find(
    (slot) =>
      WEEKDAY_OPTIONS.includes((slot?.startDay || "").trim().toLowerCase()) &&
      WEEKDAY_OPTIONS.includes((slot?.endDay || "").trim().toLowerCase())
  );
  return [{
    startDay: (matchedRange?.startDay || matched?.day || "monday").toLowerCase(),
    endDay: (matchedRange?.endDay || matched?.day || "friday").toLowerCase(),
    start: matched?.start || DEFAULT_SLOT.start,
    end: matched?.end || DEFAULT_SLOT.end,
  }];
};

const DoctorDashboard = () => {
  const [availability, setAvailability] = useState(normalizeSingleAvailability());
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ consultationFee: 0, bio: "", experienceYears: 0 });
  const [reviews, setReviews] = useState([]);
  const [replyModal, setReplyModal] = useState({ isOpen: false, reviewId: null, response: "" });
  const [prescriptionModal, setPrescriptionModal] = useState({ isOpen: false, appointment: null });
  const navigate = useNavigate();

  const loadProfile = async () => {
    try {
      const { data } = await client.get("/doctors/profile");
      setProfile(data);
      setEditForm({
        consultationFee: data.consultationFee || 0,
        bio: data.bio || "",
        experienceYears: data.experienceYears || 0
      });
      setAvailability(normalizeSingleAvailability(data.availability || []));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load profile");
    }
  };

  const saveProfile = async () => {
    try {
      await client.put("/doctors/profile", editForm);
      toast.success("Profile updated successfully");
      setEditMode(false);
      loadProfile();
    } catch (error) {
      toast.error("Failed to update profile");
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

  const fetchReviews = async () => {
    try {
      const { data } = await client.get(`/reviews/doctor/${profile?.user?._id || 'me'}`);
      setReviews(data);
    } catch (error) {
      console.error("Failed to fetch reviews");
    }
  };

  const submitResponse = async (e) => {
    e.preventDefault();
    try {
      await client.put(`/reviews/${replyModal.reviewId}/respond`, { response: replyModal.response });
      toast.success("Response sent!");
      setReplyModal({ isOpen: false, reviewId: null, response: "" });
      fetchReviews();
    } catch (error) {
      toast.error("Failed to send response");
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

    // Polling for live updates every 10 seconds
    const interval = setInterval(fetchAppointments, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (profile) fetchReviews();
  }, [profile]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    return {
      today: appointments.filter(a => {
        const appDate = new Date(a.date);
        return appDate.getFullYear() === now.getFullYear() &&
               appDate.getMonth() === now.getMonth() &&
               appDate.getDate() === now.getDate();
      }).length,
      week: appointments.filter(a => {
        const appDate = new Date(a.date);
        return appDate >= startOfWeek;
      }).length,
      cancelled: appointments.filter(a => a.status === "cancelled" || a.status === "rejected").length,
      completed: appointments.filter(a => a.status === "completed").length,
    };
  }, [appointments]);

  const statCards = [
    { label: "Today Appointments", value: stats.today, icon: AppointmentIcon },
    { label: "This Week Appointments", value: stats.week, icon: AppointmentIcon },
    { label: "Cancelled", value: stats.cancelled, icon: AppointmentIcon },
    { label: "Completed", value: stats.completed, icon: AppointmentIcon },
  ];

  const notifications = useMemo(() => {
    const list = [];
    appointments.forEach(a => {
      if (a.status === "pending") {
        list.push({ id: `new-${a._id}`, title: "New Appointment", message: `${a.patient?.name} requested a consultation.`, type: "alert", linkTab: "appointments" });
      }
    });
    reviews.forEach(r => {
      if (!r.doctorResponse) {
        list.push({ id: `rev-${r._id}`, title: "New Review", message: `${r.patient?.name} left a ${r.rating}-star rating.`, type: "info", linkTab: "reviews" });
      }
    });
    return list;
  }, [appointments, reviews]);

  const saveAvailability = async () => {
    try {
      await client.put("/doctors/availability", { availability });
      toast.success("Availability updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update availability");
    }
  };

  const updateStatus = async (id, status) => {
    await client.put(`/doctors/appointments/${id}/status`, { status });
    toast.success("Appointment updated");
    fetchAppointments();
  };

  const handleVideoCall = async (appointment) => {
    const appointmentTime = new Date(`${appointment.date}T${appointment.timeSlot}:00`);
    const now = new Date();
    
    // Calculate minutes difference
    const diffMs = appointmentTime - now;
    const diffMins = diffMs / (1000 * 60);

    // If it's more than 5 minutes before the scheduled time
    if (diffMins > 5) {
      toast.error(`Please wait. Call can only be started 5 mins before scheduled time.`);
      return;
    }

    if (appointment.status === "accepted") {
      await updateStatus(appointment._id, "in-progress");
    }

    // Open Jitsi Meet
    window.open(`https://meet.jit.si/Prescripto-Appt-${appointment._id}`, "_blank");
  };

  const statusBadge = (status) => {
    if (status === "approved" || status === "accepted") return "bg-emerald-100 text-emerald-700";
    if (status === "in-progress") return "bg-indigo-100 text-indigo-700";
    if (status === "awaiting-payment") return "bg-orange-100 text-orange-700";
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

  return (
    <>
    <DashboardShell
      title="Doctor Dashboard"
      subtitle="Manage appointments, profile, and verification status."
      notifications={notifications}
      navItems={[
        { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
        { id: "appointments", label: "Appointments", icon: AppointmentIcon, hasNotification: appointments.some((a) => a.status === "pending") },
        { id: "reviews", label: "Patient Reviews", icon: FileIcon },
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

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">Manage Availability</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50">
                  <input
                    type="text"
                    list="start-day-options"
                    value={availability[0]?.startDay || "monday"}
                    className="w-[150px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-brand-600"
                    onChange={(e) => setAvailability((p) => [{ ...(p[0] || DEFAULT_SLOT), startDay: e.target.value.toLowerCase() }])}
                  />
                  <span className="text-slate-400 text-xs font-bold">TO</span>
                  <input
                    type="text"
                    list="end-day-options"
                    value={availability[0]?.endDay || "friday"}
                    className="w-[150px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm capitalize outline-none focus:border-brand-600"
                    onChange={(e) => setAvailability((p) => [{ ...(p[0] || DEFAULT_SLOT), endDay: e.target.value.toLowerCase() }])}
                  />
                  <datalist id="start-day-options">
                    {WEEKDAY_OPTIONS.map((d) => (
                      <option key={`start-${d}`} value={d} />
                    ))}
                  </datalist>
                  <datalist id="end-day-options">
                    {WEEKDAY_OPTIONS.map((d) => (
                      <option key={`end-${d}`} value={d} />
                    ))}
                  </datalist>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={availability[0]?.start || DEFAULT_SLOT.start}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
                      onChange={(e) => setAvailability((p) => [{ ...(p[0] || { day: "monday" }), start: e.target.value }])}
                    />
                    <span className="text-slate-400 text-xs font-bold">TO</span>
                    <input
                      type="time"
                      value={availability[0]?.end || DEFAULT_SLOT.end}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-600"
                      onChange={(e) => setAvailability((p) => [{ ...(p[0] || { day: "monday" }), end: e.target.value }])}
                    />
                  </div>
                </div>
              </div>
              
              <button 
                type="button" 
                className="mt-6 w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white hover:bg-brand-700 transition-all shadow-lg shadow-brand-100" 
                onClick={saveAvailability}
              >
                Save Availability Settings
              </button>
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
                          <div className="flex flex-wrap gap-2">
                            {a.status === "pending" && (
                              <>
                                <button className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white" type="button" onClick={() => updateStatus(a._id, "accepted")}>Accept</button>
                                <button className="rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white" type="button" onClick={() => updateStatus(a._id, "rejected")}>Reject</button>
                              </>
                            )}
                            {(a.status === "accepted" || a.status === "in-progress") && (
                              <>
                                <button className="rounded bg-indigo-600 px-2 py-1 text-xs font-semibold text-white" type="button" onClick={() => handleVideoCall(a)}>
                                  {a.status === "in-progress" ? "Rejoin Call" : "Video Call"}
                                </button>
                                <button className={`rounded px-2 py-1 text-xs font-semibold text-white ${a.status === "in-progress" ? "bg-rose-600" : "bg-brand-600"}`} type="button" onClick={() => updateStatus(a._id, "awaiting-payment")}>
                                  {a.status === "in-progress" ? "End Call" : "Complete"}
                                </button>
                                <button className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white" type="button" onClick={() => setPrescriptionModal({ isOpen: true, appointment: a })}>
                                  Rx Prescription
                                </button>
                              </>
                            )}
                            {a.status === "completed" && (
                              <>
                                <button className="cursor-default rounded bg-emerald-100 border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700" type="button">
                                  ✓ Payment Received
                                </button>
                                <button className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white" type="button" onClick={() => setPrescriptionModal({ isOpen: true, appointment: a })}>
                                  Rx Prescription
                                </button>
                              </>
                            )}
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
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">My Profile</h3>
              {!editMode ? (
                <button 
                  onClick={() => setEditMode(true)} 
                  className="rounded-lg bg-indigo-50 text-indigo-600 px-4 py-2 text-sm font-semibold hover:bg-indigo-100 transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditMode(false);
                      setEditForm({
                        consultationFee: profile?.consultationFee || 0,
                        bio: profile?.bio || "",
                        experienceYears: profile?.experienceYears || 0
                      });
                    }} 
                    className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={saveProfile} 
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Basic Information</h4>
                  <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                    <p className="text-sm"><span className="font-semibold text-slate-700">Name:</span> {profile?.user?.name}</p>
                    <p className="text-sm mt-2"><span className="font-semibold text-slate-700">Email:</span> {profile?.user?.email}</p>
                    <p className="text-sm mt-2"><span className="font-semibold text-slate-700">Specialization:</span> {profile?.specialization}</p>
                    <div className="flex items-center mt-2">
                      <span className="font-semibold text-slate-700 text-sm mr-2">Account Status:</span>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(profile?.status)}`}>{profile?.status}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Consultation Details</h4>
                  <div className="rounded-xl border border-slate-200 p-4">
                    {!editMode ? (
                      <>
                        <p className="text-sm"><span className="font-semibold text-slate-700">Experience:</span> {profile?.experienceYears} years</p>
                        <p className="text-sm mt-2"><span className="font-semibold text-slate-700">Consultation Fee:</span> Rs. {profile?.consultationFee || 0}</p>
                      </>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Experience (Years)</label>
                          <input 
                            type="number" 
                            className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                            value={editForm.experienceYears}
                            onChange={(e) => setEditForm({...editForm, experienceYears: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Consultation Fee (Rs.)</label>
                          <input 
                            type="number" 
                            className="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                            value={editForm.consultationFee}
                            onChange={(e) => setEditForm({...editForm, consultationFee: e.target.value})}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Professional Bio</h4>
                <div className="rounded-xl border border-slate-200 p-4 h-[calc(100%-1.5rem)]">
                  {!editMode ? (
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{profile?.bio || "No bio added yet."}</p>
                  ) : (
                    <textarea 
                      className="w-full h-full min-h-[150px] rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
                      placeholder="Write a brief professional biography..."
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                    />
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "reviews" && (
          <section className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Patient Feedback</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-amber-500">★ {profile?.averageRating?.toFixed(1) || "5.0"}</span>
                <span className="text-sm text-slate-500">({profile?.numReviews || 0} total reviews)</span>
              </div>
            </div>

            <div className="grid gap-4">
              {reviews.length === 0 ? (
                <div className="rounded-2xl bg-white p-12 text-center text-sm text-slate-500 shadow-sm border border-slate-200">
                  No reviews received yet.
                </div>
              ) : (
                reviews.map((rev) => (
                  <article key={rev._id} className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900">{rev.patient?.name}</h4>
                        <div className="flex text-amber-400 text-xs mt-0.5">
                          {[...Array(rev.rating)].map((_, i) => <span key={i}>★</span>)}
                          {[...Array(5 - rev.rating)].map((_, i) => <span key={i} className="text-slate-200">★</span>)}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-xl">"{rev.patientComment || "No comment provided."}"</p>
                    
                    {rev.doctorResponse ? (
                      <div className="mt-4 ml-6 border-l-2 border-brand-200 pl-4 py-1">
                        <p className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1">Your Response</p>
                        <p className="text-sm text-slate-700">{rev.doctorResponse}</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setReplyModal({ isOpen: true, reviewId: rev._id, response: "" })}
                        className="mt-4 text-xs font-bold text-brand-600 hover:text-brand-700 transition-colors"
                      >
                        + Write a response
                      </button>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        )}
      </>
      )}
    </DashboardShell>

    {replyModal.isOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
          <h3 className="text-xl font-bold text-slate-800 mb-1">Reply to Feedback</h3>
          <p className="text-sm text-slate-500 mb-6">Your response will be visible to the patient.</p>
          
          <form onSubmit={submitResponse} className="space-y-5">
            <textarea 
              rows="4"
              required
              placeholder="Type your response here..."
              className="w-full rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 resize-none"
              value={replyModal.response}
              onChange={(e) => setReplyModal({ ...replyModal, response: e.target.value })}
            />

            <div className="flex gap-3">
              <button 
                type="button" 
                onClick={() => setReplyModal({ isOpen: false, reviewId: null, response: "" })}
                className="w-full rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-lg shadow-brand-200"
              >
                Send Response
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {prescriptionModal.isOpen && (
      <PrescriptionForm 
        appointment={prescriptionModal.appointment}
        onClose={() => setPrescriptionModal({ isOpen: false, appointment: null })}
        onSubmitSuccess={(data) => {
          setPrescriptionModal({ isOpen: false, appointment: null });
        }}
      />
    )}
    </>
  );
};

export default DoctorDashboard;
