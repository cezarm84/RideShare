import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  HomeIcon, 
  UserIcon, 
  Cog6ToothIcon, 
  MapIcon, 
  ClockIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon },
    { name: 'Find Rides', href: '/find-rides', icon: MapIcon },
    { name: 'My Rides', href: '/my-rides', icon: ClockIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
    { name: 'Preferences', href: '/preferences', icon: Cog6ToothIcon },
  ];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu */}
      <div className="lg:hidden">
        <div className="fixed inset-0 flex z-40">
          {/* Overlay */}
          {isMobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-gray-600 bg-opacity-75" 
              onClick={toggleMobileMenu}
              aria-hidden="true"
            ></div>
          )}
          
          {/* Mobile menu sidebar */}
          <div 
            className={`
              fixed inset-y-0 left-0 flex flex-col w-64 max-w-xs bg-white transform transition ease-in-out duration-300
              ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
              <div className="flex items-center">
                <span className="text-xl font-semibold text-blue-600">RideShare</span>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pt-5 pb-4">
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = router.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        group flex items-center px-2 py-2 text-base font-medium rounded-md
                        ${isActive
                          ? 'bg-gray-100 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                      `}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <item.icon
                        className={`
                          mr-4 h-6 w-6 flex-shrink-0
                          ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                        `}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            {isAuthenticated && (
              <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <UserIcon className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-base font-medium text-gray-700">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <button
                      onClick={handleLogout}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center"
                      aria-label="Log out"
                    >
                      <ArrowRightOnRectangleIcon className="mr-1 h-4 w-4" />
                      Log out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-gray-200 bg-white overflow-y-auto">
          <div className="flex items-center h-16 flex-shrink-0 px-4 border-b border-gray-200">
            <span className="text-xl font-semibold text-blue-600">RideShare</span>
          </div>
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = router.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      ${isActive
                        ? 'bg-gray-100 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon
                      className={`
                        mr-3 h-5 w-5 flex-shrink-0
                        ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                      `}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          {isAuthenticated && (
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-9 w-9 rounded-full bg-gray-300 flex items-center justify-center">
                    <UserIcon className="h-5 w-5 text-gray-600" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 flex items-center"
                    aria-label="Log out"
                  >
                    <ArrowRightOnRectangleIcon className="mr-1 h-3 w-3" />
                    Log out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between h-16 bg-white border-b border-gray-200 px-4">
          <button
            onClick={toggleMobileMenu}
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            aria-label="Open menu"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          <div className="flex-1 flex justify-center">
            <span className="text-xl font-semibold text-blue-600">RideShare</span>
          </div>
          <div className="w-6"></div> {/* Spacer to center the logo */}
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
