import React from "react";
import { ThemeToggleButton } from "../../components/common/ThemeToggleButton";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}
        <div className="items-center hidden w-full h-full lg:w-1/2 bg-brand-950 dark:bg-white/5 lg:grid" style={{ backgroundImage: 'url(/images/logo/auth-bg.svg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="relative flex items-center justify-center z-1">
            <div className="flex flex-col items-center max-w-xs mt-32"> {/* Added mt-32 to move it down */}
              <div className="py-4 px-6 rounded-lg bg-amber-600/70 dark:bg-amber-800/70"> {/* Made background darker */}
                <p className="text-center text-white dark:text-white font-semibold text-lg"> {/* Made text bolder and darker */}
                  Modern ride-sharing platform with enterprise support and intelligent matching
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeToggleButton />
        </div>
      </div>
    </div>
  );
}
