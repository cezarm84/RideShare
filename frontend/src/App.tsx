import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import CreateRide from "./pages/RideShare/CreateRide";
import CreateBooking from "./pages/RideShare/CreateBooking";
import BookingConfirmation from "./pages/RideShare/BookingConfirmation";
import Bookings from "./pages/RideShare/Bookings";
import RideShareCalendar from "./pages/RideShare/Calendar";
import Drivers from "./pages/RideShare/Drivers";
import Hubs from "./pages/RideShare/Hubs";
import Enterprises from "./pages/RideShare/Enterprises";
import FAQ from "./pages/FAQ/FAQ";
import Contact from "./pages/Contact/Contact";

// Documentation pages
import { DocumentationPage } from "./pages/Documentation";

// Context providers
import { AuthProvider, useAuth } from "./context/AuthContext";

// Import the LoadingSpinner component
import LoadingSpinner from "./components/common/LoadingSpinner";

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen size="lg" message="Loading your profile..." />;
  }

  return isAuthenticated ?
    <>{children}</> :
    <Navigate to="/signin" state={{ from: location }} replace />;
};

// Public route with layout
const PublicLayoutRoute = ({ children }: { children: React.ReactNode }) => {
  return <AppLayout>{children}</AppLayout>;
};

// Import the ErrorBoundary component
import ErrorBoundary from "./components/common/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
          {/* Public Routes with App Layout */}
          <Route path="/" element={<PublicLayoutRoute><Dashboard /></PublicLayoutRoute>} />
          <Route path="/rides" element={<PublicLayoutRoute><Rides /></PublicLayoutRoute>} />
          <Route path="/rides/create" element={<PublicLayoutRoute><CreateRide /></PublicLayoutRoute>} />
          <Route path="/hubs" element={<PublicLayoutRoute><Hubs /></PublicLayoutRoute>} />
          <Route path="/faq" element={<PublicLayoutRoute><FAQ /></PublicLayoutRoute>} />
          <Route path="/contact" element={<PublicLayoutRoute><Contact /></PublicLayoutRoute>} />

          {/* Protected Routes with App Layout */}
          <Route path="/bookings" element={<ProtectedRoute><AppLayout><Bookings /></AppLayout></ProtectedRoute>} />
          <Route path="/bookings/create" element={<ProtectedRoute><AppLayout><CreateBooking /></AppLayout></ProtectedRoute>} />
          <Route path="/bookings/confirmation" element={<ProtectedRoute><AppLayout><BookingConfirmation /></AppLayout></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><AppLayout><RideShareCalendar /></AppLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppLayout><UserProfiles /></AppLayout></ProtectedRoute>} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="drivers" element={<Drivers />} />
            <Route path="enterprises" element={<Enterprises />} />
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
    </ErrorBoundary>
  );
}
