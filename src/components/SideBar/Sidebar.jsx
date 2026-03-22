import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Users as UsersIcon,
  Settings,
  UserCircle,
  MessageSquareText,
  CircleFadingPlus,
  MoreVertical,
} from "lucide-react";
import { motion, LayoutGroup } from "motion/react";
import { useTheme } from "../../theme/Theme";
import { useThemeStore } from "../../stores/useThemeStore";
import { Image } from "../../assets/image";
import useAuthStore from "../../stores/useAuthStore";
import useChatStore from "../../stores/useChatStore";
import toast from "react-hot-toast";
import SettingsModal from "../Chat/SettingsModal";
import MobileMenu from "../Chat/MobileMenu";

const Sidebar = () => {
  const theme = useTheme();
  const location = useLocation();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { reSetSelectedChat } = useChatStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    const res = logout();
    if (res) toast.success("Logout Successfully !!");
  };

  const navItems = [
    {
      id: "chat",
      icon: MessageSquareText,
      label: "Chats",
      path: "/",
      onClick: reSetSelectedChat,
    },
    {
      id: "status",
      icon: CircleFadingPlus,
      label: "Status",
      path: "/status",
    },
    // {
    //   id: "groups",
    //   icon: UsersIcon,
    //   label: "Groups",
    //   path: "/group",
    // },
    {
      id: "profile",
      icon: UserCircle,
      label: "Profile",
      path: "/profile",
    },
  ];

  const isActivePath = (item) => {
    if (item.id === "chat") {
      return location.pathname === "/" || location.pathname.startsWith("/chat");
    }
    return location.pathname === item.path;
  };

  /* ---------------- DESKTOP BUTTON ---------------- */

  const DesktopNavButton = ({ item, onClick, isActionActive }) => {
    const isActive = item.path ? isActivePath(item) : isActionActive;
    const MotionLink = motion.create(Link);
    const MotionButton = motion.button;

    const baseClass = `
      relative group flex flex-col items-center justify-center
      w-12 h-12 rounded-xl cursor-pointer
      ${isActive ? theme.sidebarIconActive : theme.sidebarIconInactive}
    `;

    const TapProps = {
      whileTap: { scale: 0.92 },
      transition: { type: "spring", stiffness: 500, damping: 30 },
    };

    const Content = (
      <>
        {item.id === "profile" ? (
          <img
            src={user?.avatar || Image.defaultUser}
            alt="Profile"
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <item.icon size={22} strokeWidth={2} />
        )}

        {isActive && (
          <motion.span
            layoutId="desktop-active-indicator"
            className="absolute -right-2 w-1 h-8 bg-cyan-500 rounded-l-full"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </>
    );

    if (item.path) {
      return (
        <MotionLink
          to={item.path}
          onClick={item.onClick}
          className={baseClass}
          {...TapProps}
        >
          {Content}
        </MotionLink>
      );
    }

    return (
      <MotionButton onClick={onClick} className={baseClass} {...TapProps}>
        {Content}
      </MotionButton>
    );
  };

  /* ---------------- MOBILE BUTTON ---------------- */

  const MobileNavLink = ({ item }) => {
    const MotionLink = motion.create(Link);
    const active = isActivePath(item);

    return (
      <MotionLink
        to={item.path}
        onClick={item.onClick}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`
          relative flex flex-col items-center justify-center
          w-full h-full py-2
          ${active ? "text-cyan-500" : theme.textMuted}
        `}
      >
        {item.id === "profile" ? (
          <img
            src={user?.avatar || Image.defaultUser}
            alt="Profile"
            className="w-6 h-6 rounded-full object-cover"
          />
        ) : (
          <item.icon size={24} strokeWidth={2} />
        )}

        {active && (
          <motion.span
            layoutId="mobile-active-indicator"
            className="absolute top-0 w-8 h-1 bg-cyan-500 rounded-b-full"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
      </MotionLink>
    );
  };

  return (
    <>
      {/* ---------------- DESKTOP SIDEBAR ---------------- */}
      <aside
        className={`hidden md:flex flex-col justify-between w-20 h-full py-6 ${theme.bg} border-r ${theme.divider}`}
      >
        <div className="flex flex-col items-center gap-8">
          <img src={Image.logo} className="h-12 w-12" alt="Logo" />

          <LayoutGroup>
            <div className="flex flex-col gap-4">
              {navItems
                .filter((i) => i.id !== "profile")
                .map((item) => (
                  <DesktopNavButton key={item.id} item={item} />
                ))}
            </div>
          </LayoutGroup>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className={`w-10 border-t ${theme.divider}`} />

          <DesktopNavButton
            item={{ icon: Settings, label: "Settings" }}
            onClick={() => setIsSettingsOpen(true)}
            isActionActive={isSettingsOpen}
          />

          <DesktopNavButton item={navItems.at(-1)} />
        </div>
      </aside>

      {/* ---------------- MOBILE BOTTOM NAV ---------------- */}
      {!location.pathname.startsWith("/chat") && (
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 h-16 z-40
          ${theme.bg} border-t ${theme.divider}`}
        >
          <LayoutGroup>
            <div className="flex items-center justify-around h-full">
              {navItems.map((item) => (
                <MobileNavLink key={item.id} item={item} />
              ))}
            </div>
          </LayoutGroup>
        </div>
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

export default Sidebar;
