import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank"; // eslint-disable-line @typescript-eslint/no-unused-vars
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import Dashboard from "./pages/Dashboard/Dashboard";
import TestPage from "./pages/TestPage";

// RideShare specific pages
import Rides from "./pages/RideShare/Rides";
import Bookings from "./pages/RideShare/Bookings";
import Drivers from "./pages/RideShare/Drivers";
import Hubs from "./pages/RideShare/Hubs";
import Enterprises from "./pages/RideShare/Enterprises";

// Documentation pages
import { DocumentationPage } from "./pages/Documentation";

// Context providers
import { AuthProvider, useAuth } from "./context/AuthContext";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" />;
};

// Public route with layout
const PublicLayoutRoute = ({ children }: { children: React.ReactNode }) => {
  return <AppLayout>{children}</AppLayout>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes with App Layout */}
          <Route path="/" element={<PublicLayoutRoute><Dashboard /></PublicLayoutRoute>} />
          <Route path="/rides" element={<PublicLayoutRoute><Rides /></PublicLayoutRoute>} />
          <Route path="/hubs" element={<PublicLayoutRoute><Hubs /></PublicLayoutRoute>} />

          {/* Protected Routes with App Layout */}
          <Route path="/bookings" element={<ProtectedRoute><AppLayout><Bookings /></AppLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppLayout><UserProfiles /></AppLayout></ProtectedRoute>} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="drivers" element={<Drivers />} />
            <Route path="enterprises" element={<Enterprises />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="form-elements" element={<FormElements />} />
            <Route path="basic-tables" element={<BasicTables />} />
          </Route>

          {/* Documentation Routes */}
          <Route path="/docs" element={<AppLayout><DocumentationPage /></AppLayout>} />
          <Route path="/docs/:docId" element={<AppLayout><DocumentationPage /></AppLayout>} />

          {/* Auth Layout - Public Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Test Page for Cypress */}
          <Route path="/test" element={<TestPage />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
