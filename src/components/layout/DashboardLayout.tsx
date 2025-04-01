"use client";

import { AnimatePresence } from "motion/react";
import { Sidebar } from "./Sidebar";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import DashboardNavbar from "./DashboardNavbar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 1024);
      
      if (width < 768) {
        setSidebarCollapsed(true);
        // On very small screens, hide sidebar initially but keep it accessible
        setSidebarVisible(false);
      } else if (width < 1024) {
        setSidebarCollapsed(true);
        setSidebarVisible(true);
      } else {
        setSidebarCollapsed(false);
        setSidebarVisible(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarVisible(!sidebarVisible);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };


  return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 overflow-hidden">
          {/* Mobile overlay */}
          <AnimatePresence>
            {sidebarVisible && isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 dark:bg-black/70 z-30 transition-opacity duration-300 ease-in-out lg:hidden"
                onClick={() => setSidebarVisible(false)}
              ></motion.div>
            )}
          </AnimatePresence>
          {/* Sidebar */}
          <div className={`${isMobile ? "fixed z-40" : "relative"} h-screen`}>
            <Sidebar
              className="h-full"
              collapsed={sidebarCollapsed}
              onToggle={toggleSidebar}
              isMobile={isMobile}
              visible={sidebarVisible}
            />
          </div>
          
          <motion.div
            className="flex-1 flex flex-col w-full h-screen overflow-hidden"
            initial={false}
            animate={{
              width: !isMobile ? `calc(100% - ${sidebarCollapsed ? 70 : 250}px)` : "100%"
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <DashboardNavbar onMenuClick={toggleSidebar} />
            <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
              <div className="h-full px-3 sm:px-6 py-4 sm:py-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  {children}
                </motion.div>
              </div>
            </main>
          </motion.div>
        </div>
  );
}