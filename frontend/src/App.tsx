import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, createBrowserRouter, RouterProvider } from "react-router-dom";
import { UNSAFE_DataRouterContext, UNSAFE_DataRouterStateContext } from "react-router";

// Configure future flags for React Router
UNSAFE_DataRouterContext.displayName = 'DataRouterContext';
UNSAFE_DataRouterStateContext.displayName = 'DataRouterStateContext';

// Set future flags
window.REACT_ROUTER_FUTURE = {
  v7_startTransition: true,
  v7_relativeSplatPath: true
};
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
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
import Terms from "./pages/Terms";

// Admin pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import HubsManagement from "./pages/Admin/HubsManagement";
import DestinationsManagement from "./pages/Admin/DestinationsManagement";
import VehicleTypesManagement from "./pages/Admin/VehicleTypesManagement";
import EnterprisesManagement from "./pages/Admin/EnterprisesManagement";
import UsersManagement from "./pages/Admin/UsersManagement";
import DriversManagement from "./pages/Admin/DriversManagement";
import RidesManagement from "./pages/Admin/RidesManagement";
import SystemSettings from "./pages/Admin/SystemSettings";

// Documentation pages
import { DocumentationPage } from "./pages/Documentation";

// Context providers
import { AuthProvider, useAuth } from "./context/AuthContext";
import { UserProfileProvider } from "./context/UserProfileContext";

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
          <UserProfileProvider>
            <ScrollToTop />
          <Routes>
          {/* Public Routes with App Layout */}
          <Route path="/" element={<PublicLayoutRoute><Dashboard /></PublicLayoutRoute>} />
          <Route path="/rides" element={<PublicLayoutRoute><Rides /></PublicLayoutRoute>} />
          <Route path="/rides/create" element={<PublicLayoutRoute><CreateRide /></PublicLayoutRoute>} />
          <Route path="/hubs" element={<PublicLayoutRoute><Hubs /></PublicLayoutRoute>} />
          <Route path="/faq" element={<PublicLayoutRoute><FAQ /></PublicLayoutRoute>} />
          <Route path="/contact" element={<PublicLayoutRoute><Contact /></PublicLayoutRoute>} />
          <Route path="/terms" element={<PublicLayoutRoute><Terms /></PublicLayoutRoute>} />

          {/* Protected Routes with App Layout */}
          <Route path="/bookings" element={<ProtectedRoute><AppLayout><Bookings /></AppLayout></ProtectedRoute>} />
          <Route path="/bookings/create" element={<ProtectedRoute><AppLayout><CreateBooking /></AppLayout></ProtectedRoute>} />
          <Route path="/bookings/confirmation" element={<ProtectedRoute><AppLayout><BookingConfirmation /></AppLayout></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><AppLayout><RideShareCalendar /></AppLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AppLayout><UserProfiles /></AppLayout></ProtectedRoute>} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={<ProtectedRoute><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/hubs" element={<ProtectedRoute><AppLayout><HubsManagement /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/destinations" element={<ProtectedRoute><AppLayout><DestinationsManagement /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/vehicle-types" element={<ProtectedRoute><AppLayout><VehicleTypesManagement /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/enterprises" element={<ProtectedRoute><AppLayout><EnterprisesManagement /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AppLayout><UsersManagement /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/drivers" element={<ProtectedRoute><AppLayout><DriversManagement /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/rides" element={<ProtectedRoute><AppLayout><RidesManagement /></AppLayout></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute><AppLayout><SystemSettings /></AppLayout></ProtectedRoute>} />

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
          </UserProfileProvider>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
