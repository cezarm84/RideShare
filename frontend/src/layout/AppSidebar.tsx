import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

// Assume these icons are imported from an icon library
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  DocsIcon,
  EnvelopeIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  QuestionIcon,
  TableIcon,
  UserCircleIcon,
  UserIcon,
  ChatIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <CalenderIcon />,
    name: "Calendar",
    path: "/calendar",
  },
  {
    icon: <UserCircleIcon />,
    name: "My Profile",
    path: "/profile",
  },
  {
    icon: <ListIcon />,
    name: "Rides",
    path: "/rides",
  },
  {
    icon: <TableIcon />,
    name: "Bookings",
    path: "/bookings",
  },

  {
    icon: <BoxCubeIcon />,
    name: "Hubs",
    path: "/hubs",
  },
  {
    icon: <PageIcon />,
    name: "Enterprises",
    path: "/enterprises",
  },
  {
    icon: <QuestionIcon />,
    name: "FAQ",
    path: "/faq",
  },
  {
    icon: <EnvelopeIcon />,
    name: "Contact Us",
    path: "/contact",
  },
  {
    icon: <ChatIcon />,
    name: "Community",
    path: "/community/forums",
  },
];

const othersItems: NavItem[] = [
  {
    icon: <UserCircleIcon />,
    name: "Driver",
    subItems: [
      { name: "Dashboard", path: "/driver", pro: false },
      { name: "Schedule", path: "/driver/schedule", pro: false },
      { name: "Time Off", path: "/driver/time-off", pro: false },
      { name: "Report Issue", path: "/driver/issues/new", pro: false },
      { name: "Profile", path: "/driver/profile", pro: false },
      { name: "Documents", path: "/driver/documents", pro: false },
      { name: "Messages", path: "/driver/messages", pro: false },
    ],
  },
  {
    icon: <PieChartIcon />,
    name: "Analytics",
    subItems: [
      { name: "Ride Statistics", path: "/analytics/rides", pro: false },
      { name: "User Activity", path: "/analytics/users", pro: false },
    ],
  },
  {
    icon: <ListIcon />,
    name: "Admin",
    subItems: [
      { name: "Dashboard", path: "/admin", pro: false },
      { name: "Hubs", path: "/admin/hubs", pro: false },
      { name: "Destinations", path: "/admin/destinations", pro: false },
      { name: "Vehicle Types", path: "/admin/vehicle-types", pro: false },
      { name: "Enterprises", path: "/admin/enterprises", pro: false },
      { name: "Users", path: "/admin/users", pro: false },
      { name: "Drivers", path: "/admin/drivers", pro: false },
      { name: "Rides", path: "/admin/rides", pro: false },
      { name: "Email Verification", path: "/admin/email-verification", pro: false },
      { name: "Test Emails", path: "/admin/test-emails", pro: false },
      { name: "Email Domains", path: "/admin/email-domains", pro: false },
      { name: "Email Inbox", path: "/admin/email-inbox", pro: false },
      { name: "Fake Enterprise Users", path: "/admin/fake-enterprise-users", pro: false },
      { name: "Messaging", path: "/admin/messaging", pro: false },
      { name: "Settings", path: "/admin/settings", pro: false },
    ],
  },
  {
    icon: <UserIcon />,
    name: "Account",
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
    ],
  },
  {
    icon: <DocsIcon />,
    name: "Documentation",
    subItems: [
      { name: "Getting Started", path: "/docs/index", pro: false },
      { name: "API Reference", path: "/docs/api_consolidated", pro: false },
      { name: "User Guides", path: "/docs/user_preferences", pro: false },
      { name: "Development", path: "/docs/roadmap", pro: false },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => {
    return (
      <ul className="flex flex-col gap-4">
        {items.map((nav, index) => {
          // Skip the Account menu if user is authenticated
          if (nav.name === "Account" && isAuthenticated) {
            return null;
          }

          // We'll show the Admin menu to all users, but the routes will be protected
          // Admin routes will redirect to login if not authenticated
          // and to dashboard if authenticated but not admin

          return (
            <li key={nav.name}>
              {nav.subItems ? (
                <button
                  onClick={() => handleSubmenuToggle(index, menuType)}
                  className={`menu-item group ${
                    openSubmenu?.type === menuType && openSubmenu?.index === index
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  } cursor-pointer ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "lg:justify-start"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size  ${
                      openSubmenu?.type === menuType && openSubmenu?.index === index
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    {nav.icon}
                  </span>
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <span className="menu-item-text">{nav.name}</span>
                  )}
                  {(isExpanded || isHovered || isMobileOpen) && (
                    <ChevronDownIcon
                      className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                        openSubmenu?.type === menuType &&
                        openSubmenu?.index === index
                          ? "rotate-180 text-brand-500"
                          : ""
                      }`}
                    />
                  )}
                </button>
              ) : (
                nav.path && (
                  <Link
                    to={nav.path}
                    className={`menu-item group ${
                      isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                    }`}
                  >
                    <span
                      className={`menu-item-icon-size ${
                        isActive(nav.path)
                          ? "menu-item-icon-active"
                          : "menu-item-icon-inactive"
                      }`}
                    >
                      {nav.icon}
                    </span>
                    {(isExpanded || isHovered || isMobileOpen) && (
                      <span className="menu-item-text">{nav.name}</span>
                    )}
                  </Link>
                )
              )}
              {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
                <div
                  ref={(el) => {
                    subMenuRefs.current[`${menuType}-${index}`] = el;
                  }}
                  className="overflow-hidden transition-all duration-300"
                  style={{
                    height:
                      openSubmenu?.type === menuType && openSubmenu?.index === index
                        ? `${subMenuHeight[`${menuType}-${index}`]}px`
                        : "0px",
                  }}
                >
                  <ul className="mt-2 space-y-1 ml-9">
                    {nav.subItems.map((subItem) => (
                      <li key={subItem.name}>
                        <Link
                          to={subItem.path}
                          className={`menu-dropdown-item ${
                            isActive(subItem.path)
                              ? "menu-dropdown-item-active"
                              : "menu-dropdown-item-inactive"
                          }`}
                        >
                          {subItem.name}
                          <span className="flex items-center gap-1 ml-auto">
                            {subItem.new && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                new
                              </span>
                            )}
                            {subItem.pro && (
                              <span
                                className={`ml-auto ${
                                  isActive(subItem.path)
                                    ? "menu-dropdown-badge-active"
                                    : "menu-dropdown-badge-inactive"
                                } menu-dropdown-badge`}
                              >
                                pro
                              </span>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <aside
      className={
        `fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-gray-50 dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
              ? "w-[290px]"
              : "w-[90px]"
        } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`
      }
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <img
              className="h-8 w-auto"
              src={theme === 'dark' ? "/images/logo/rideshare-logo-light.svg" : "/images/logo/rideshare-logo-dark.svg"}
              alt="RideShare Logo"
            />
          ) : (
            <div className="text-2xl font-bold text-brand-500 dark:text-white">
              RS
            </div>
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Others"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div>
          </div>
        </nav>
        {isExpanded || isHovered || isMobileOpen ? <SidebarWidget /> : null}
      </div>
    </aside>
  );
};

export default AppSidebar;
