import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SidebarWidget() {
  const { isAuthenticated } = useAuth();

  return (
    <div
      className={`
        mx-auto mb-10 w-full max-w-60 rounded-2xl bg-gray-50 px-4 py-5 text-center dark:bg-white/[0.03]`}
    >
      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
        RideShare Platform
      </h3>
      <p className="mb-4 text-gray-500 text-theme-sm dark:text-gray-400">
        {isAuthenticated
          ? "Welcome back! Manage your rides and bookings from the dashboard."
          : "Modern ride-sharing solution with enterprise support and intelligent matching."}
      </p>
      {!isAuthenticated && (
        <Link
          to="/signin"
          className="flex items-center justify-center p-3 font-medium text-white rounded-lg bg-brand-500 text-theme-sm hover:bg-brand-600"
        >
          Sign In
        </Link>
      )}
    </div>
  );
}
