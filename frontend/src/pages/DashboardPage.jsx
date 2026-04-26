import { useAuth } from "../state/AuthContext";
import PatientDashboard from "./PatientDashboard";
import DoctorDashboard from "./DoctorDashboard";
import AdminDashboard from "./AdminDashboard";

const DashboardPage = () => {
  const { user } = useAuth();
  if (!user) return null;

  if (user.role === "doctor") return <DoctorDashboard />;
  if (user.role === "admin") return <AdminDashboard />;
  return <PatientDashboard />;
};

export default DashboardPage;
