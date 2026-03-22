import React from "react";
import Sidebar from "../components/SideBar/Sidebar";
import { useTheme } from "../theme/Theme";
import { Outlet, useLocation } from "react-router-dom";
import { useThemeStore } from "../stores/useThemeStore";

const MainLayout = () => {
  const theme = useTheme();
  const location = useLocation();
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  const isChatDetailPage = location.pathname.startsWith("/chat/");

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${theme.bg} ${theme.text} transition-colors duration-300`}
    >
      <div className={isChatDetailPage && "hidden md:block"}>
        <Sidebar />
      </div>
      <main className="flex-1 h-full relative flex">
        <div className="flex-1 flex items-center justify-center h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
