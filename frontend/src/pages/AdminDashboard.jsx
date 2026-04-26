import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import toast from "react-hot-toast";
import client from "../api/client";
import DashboardShell from "../components/DashboardShell";
import {
  AppointmentIcon,
  DashboardIcon,
  DoctorIcon,
  FileIcon,
  IconWrapper,
  UsersIcon,
} from "../components/icons";
import { useMemo } from "react";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#dc2626", "#9333ea"];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [approvedDoctors, setApprovedDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartKey, setChartKey] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const [
        { data: statData },
        { data: usersData },
        { data: applicationsData },
        { data: approvedDoctorsData },
        { data: appointmentsData },
      ] = await Promise.all([
        client.get("/admin/stats"),
        client.get("/admin/users"),
        client.get("/admin/doctor-applications"),
        client.get("/admin/approved-doctors"),
        client.get("/admin/appointments"),
      ]);
      setStats(statData);
      setUsers(usersData);
      setApplications(applicationsData);
      setApprovedDoctors(approvedDoctorsData);
      setAppointments(appointmentsData);
      setChartKey((prev) => prev + 1);
    } catch (error) {
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateApplicationStatus = async (id, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this doctor?`)) return;
    await client.patch(`/admin/doctor-applications/${id}/status`, { status });
    toast.success(`Application ${status}`);
    load();
  };

  const blockDoctor = async (id) => {
    if (!window.confirm("Block this approved doctor?")) return;
    await client.patch(`/admin/approved-doctors/${id}/block`);
    toast.success("Doctor blocked");
    load();
  };

  const statusBadge = (status) => {
    if (status === "approved") return "bg-emerald-100 text-emerald-700";
    if (status === "rejected") return "bg-rose-100 text-rose-700";
    return "bg-amber-100 text-amber-700";
  };

  const verificationChartData = useMemo(() => {
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
    const now = new Date();
    const months = Array.from({ length: 5 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (4 - index), 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        month: monthFormatter.format(date).toUpperCase(),
        approved: 0,
        rejected: 0,
      };
    });
    const monthMap = Object.fromEntries(months.map((m) => [m.key, m]));

    [...applications, ...approvedDoctors].forEach((item) => {
      if (!item?.createdAt) return;
      const date = new Date(item.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthMap[key]) return;
      if (item.status === "approved") monthMap[key].approved += 1;
      if (item.status === "rejected") monthMap[key].rejected += 1;
    });

    return months;
  }, [applications, approvedDoctors]);

  const coreStatsCards = useMemo(
    () => [
      { label: "Total Revenue", value: `$${stats?.totalRevenue ?? 0}`, icon: FileIcon },
      { label: "Active Doctors", value: stats?.activeDoctors ?? 0, icon: DoctorIcon },
      { label: "Inactive Doctors", value: stats?.inactiveDoctors ?? 0, icon: DoctorIcon },
    ],
    [stats]
  );

  const appointmentDonutData = useMemo(() => {
    const base = stats?.statusAnalytics || [];
    return base.length
      ? base.map((item, index) => ({ ...item, fill: COLORS[index % COLORS.length] }))
      : [{ status: "No Data", count: 1, fill: "#cbd5e1" }];
  }, [stats]);

  const attendanceData = useMemo(() => {
    const approved = approvedDoctors.length;
    const rejected = applications.filter((app) => app.status === "rejected").length;
    const total = approved + rejected;
    const present = total > 0 ? Math.round((approved / total) * 100) : 0;
    return {
      percent: present,
      chart: [
        { name: "Present", value: present, fill: "#5B3F99" },
        { name: "Absent", value: 100 - present, fill: "#F1692F" },
      ],
    };
  }, [approvedDoctors, applications]);

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="Control doctor verification and system operations."
      navItems={[
        { id: "dashboard", label: "Dashboard", icon: DashboardIcon },
        { id: "applications", label: "Doctor Applications", icon: FileIcon },
        { id: "approved", label: "Doctors (Approved)", icon: DoctorIcon },
        { id: "users", label: "Users", icon: UsersIcon },
        { id: "appointments", label: "Appointments", icon: AppointmentIcon },
      ]}
    >
      {(activeTab) => (
      <>
        {loading && <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm">Loading...</div>}

        {!loading && activeTab === "dashboard" && (
          <div className="grid gap-4">
            {stats && (
              <section>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {coreStatsCards.map((item) => (
                    <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
                </div>
              </section>
            )}
            <section className="grid gap-4 lg:grid-cols-3">
              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Appointment</h3>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart key={`status-${chartKey}`}>
                      <Pie
                        data={appointmentDonutData}
                        dataKey="count"
                        nameKey="status"
                        outerRadius={95}
                        innerRadius={62}
                        isAnimationActive
                        animationDuration={900}
                      >
                        {appointmentDonutData.map((entry, index) => (
                          <Cell key={`${entry.status}-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Assiduity</h3>
                </div>
                <div className="mb-2 flex items-center gap-4 text-sm">
                  <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#5B3F99]" />Present</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#F1692F]" />Absent</span>
                </div>
                <div style={{ width: "100%", height: 235 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={attendanceData.chart}
                        dataKey="value"
                        outerRadius={90}
                        innerRadius={60}
                        isAnimationActive
                        animationDuration={1000}
                      >
                        {attendanceData.chart.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <p className="-mt-28 text-center text-3xl font-semibold text-slate-900">{attendanceData.percent}%</p>
              </article>

              <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-slate-900">Performance</h3>
                <div style={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <BarChart data={verificationChartData} margin={{ left: -18, right: 0, top: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="approved" name="Approved" fill="#5B3F99" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="rejected" name="Rejected" fill="#F1692F" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Patient Analytics</h3>
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex justify-between rounded-lg bg-slate-100 p-2"><span>New Patients (Today)</span><b>{stats.patientAnalytics?.newPatientsToday ?? 0}</b></div>
                  <div className="flex justify-between rounded-lg bg-slate-100 p-2"><span>New Patients (Month)</span><b>{stats.patientAnalytics?.newPatientsMonth ?? 0}</b></div>
                  <div className="flex justify-between rounded-lg bg-slate-100 p-2"><span>Returning Patients</span><b>{stats.patientAnalytics?.returningPatients ?? 0}</b></div>
                  <div className="flex justify-between rounded-lg bg-slate-100 p-2"><span>Patient Growth Rate</span><b>{stats.patientAnalytics?.growthRate ?? 0}%</b></div>
                  <div className="flex justify-between rounded-lg bg-slate-100 p-2"><span>Gender Distribution</span><b>M {stats.patientAnalytics?.genderDistribution?.male ?? 0} / F {stats.patientAnalytics?.genderDistribution?.female ?? 0}</b></div>
                  <div className="flex justify-between rounded-lg bg-slate-100 p-2"><span>Age Groups</span><b>Under 18 / 18-35 / 36-55 / 55+</b></div>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Doctor Performance</h3>
                <div className="mt-3 grid gap-2 text-sm">
                  <div className="flex justify-between rounded-lg bg-slate-100 p-2"><span>Average Rating</span><b>{stats.doctorPerformance?.averageDoctorRating ?? 0}</b></div>
                  <div className="flex justify-between rounded-lg bg-slate-100 p-2"><span>Availability</span><b>{stats.doctorPerformance?.doctorAvailabilityStatus?.availableDoctors ?? 0} Available</b></div>
                  <div className="flex justify-between rounded-lg bg-slate-100 p-2"><span>Pending Verifications</span><b>{stats.doctorPerformance?.pendingDoctorVerifications ?? 0}</b></div>
                  {(stats.doctorPerformance?.topPerformingDoctors || []).slice(0, 3).map((doc) => (
                    <div key={doc.doctorId} className="flex justify-between rounded-lg bg-slate-100 p-2">
                      <span>{doc.name}</span>
                      <b>{doc.count} appts</b>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="grid gap-4 xl:grid-cols-2">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Monthly Appointment Trend</h3>
                <div style={{ width: "100%", height: 250 }}>
                  <ResponsiveContainer>
                    <LineChart data={stats.monthlyAppointmentTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="appointments" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">Revenue Growth Chart</h3>
                <div style={{ width: "100%", height: 250 }}>
                  <ResponsiveContainer>
                    <AreaChart data={stats.monthlyEarningsTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="earnings" stroke="#16a34a" fill="#86efac" fillOpacity={0.4} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </section>

            <section className="grid gap-4 xl:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Appointment Insights</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="rounded-lg bg-slate-100 p-2">Peak Booking Hours: <b>{stats.appointmentInsights?.peakBookingHour || "N/A"}</b></p>
                  <p className="rounded-lg bg-slate-100 p-2">Most Booked Specialization: <b>{stats.appointmentInsights?.mostBookedSpecialization || "N/A"}</b></p>
                  <p className="rounded-lg bg-slate-100 p-2">Avg Duration: <b>{stats.appointmentInsights?.averageAppointmentDuration || 0} mins</b></p>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">Financial Stats</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="rounded-lg bg-slate-100 p-2">Daily Earnings: <b>${stats.financialStats?.dailyEarnings || 0}</b></p>
                  <p className="rounded-lg bg-slate-100 p-2">Monthly Earnings: <b>${stats.financialStats?.monthlyEarnings || 0}</b></p>
                  <p className="rounded-lg bg-slate-100 p-2">Cash / Online: <b>{stats.financialStats?.paymentMethods?.cash || 0}/{stats.financialStats?.paymentMethods?.online || 0}</b></p>
                  <p className="rounded-lg bg-slate-100 p-2">Pending Payments: <b>{stats.financialStats?.pendingPayments || 0}</b></p>
                </div>
              </article>

              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900">System Activity</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <p className="rounded-lg bg-slate-100 p-2">Logins Today: <b>{stats.systemActivity?.totalLoginsToday || 0}</b></p>
                  <p className="rounded-lg bg-slate-100 p-2">Active Users: <b>{stats.systemActivity?.activeUsersRightNow || 0}</b></p>
                  <p className="rounded-lg bg-slate-100 p-2">Failed Logins: <b>{stats.systemActivity?.failedLoginAttempts || 0}</b></p>
                  <p className="rounded-lg bg-slate-100 p-2">Notifications Sent: <b>{stats.systemActivity?.notificationsSent || 0}</b></p>
                </div>
              </article>
            </section>
          </div>
        )}

        {!loading && activeTab === "applications" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Doctor Applications</h3>
            {applications.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No applications found.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-100 text-slate-700">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Specialization</th>
                      <th className="px-4 py-3">Degree File</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((item) => (
                      <tr key={item._id} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-3">{item.user?.name}</td>
                        <td className="px-4 py-3">{item.user?.email}</td>
                        <td className="px-4 py-3">{item.specialization}</td>
                        <td className="px-4 py-3">
                          <a className="text-brand-700 underline" href={`http://localhost:5000${item.degreeFile}`} target="_blank" rel="noreferrer">View</a>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(item.status)}`}>{item.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button type="button" className="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white" onClick={() => updateApplicationStatus(item._id, "approved")}>Approve</button>
                            <button type="button" className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white" onClick={() => updateApplicationStatus(item._id, "rejected")}>Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!loading && activeTab === "approved" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Approved Doctors</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Specialization</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedDoctors.map((item) => (
                    <tr key={item._id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3">{item.user?.name}</td>
                      <td className="px-4 py-3">{item.user?.email}</td>
                      <td className="px-4 py-3">{item.specialization}</td>
                      <td className="px-4 py-3"><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">approved</span></td>
                      <td className="px-4 py-3">
                        <button type="button" className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white" onClick={() => blockDoctor(item._id)}>Block</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === "users" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Users</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3">{u.name}</td>
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === "appointments" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Appointments</h3>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr><th className="px-4 py-3">Patient</th><th className="px-4 py-3">Doctor</th><th className="px-4 py-3">Date/Time</th><th className="px-4 py-3">Status</th></tr>
                </thead>
                <tbody>
                  {appointments.map((a) => (
                    <tr key={a._id} className="border-b hover:bg-slate-50">
                      <td className="px-4 py-3">{a.patient?.name}</td>
                      <td className="px-4 py-3">{a.doctor?.name}</td>
                      <td className="px-4 py-3">{a.date} {a.timeSlot}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(a.status)}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </>
      )}
    </DashboardShell>
  );
};

export default AdminDashboard;
