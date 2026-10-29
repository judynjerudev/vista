import { useState } from "react";
import {
  Dashboard as DashboardIcon,
  Folders as FoldersIcon,
  Group as GroupIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
} from "@carbon/icons-react";

import type { NavigationItem } from "./components/layout/Sidebar";
import { Layout } from "./components/layout/Layout";
import { SignInScreen, useAuth } from "./features/auth";
import { Dashboard } from "./pages/Dashboard";
import { Projects } from "./pages/Projects";

const navigationItems: NavigationItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: <HomeIcon size={16} />,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: <FoldersIcon size={16} />,
  },
  {
    label: "Team",
    href: "/team",
    icon: <GroupIcon size={16} />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <SettingsIcon size={16} />,
  },
];

const pageTitles: Record<string, string> = {
  "/": "Overview",
  "/projects": "Projects",
  "/team": "Team",
  "/settings": "Settings",
};

const App = () => {
  const auth = useAuth();
  const [currentPath, setCurrentPath] = useState("/");

  if (auth.status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f4ef] text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (auth.status !== "signedIn") {
    return <SignInScreen />;
  }

  return (
    <Layout
      user={auth.user}
      onSignOut={auth.signOut}
      title={pageTitles[currentPath]}
      sidebarTitle="Dashboard"
      sidebarLogo={<DashboardIcon size={24} className="text-indigo-600" />}
      navigationItems={navigationItems.map((item) => {
        return { ...item, isActive: item.href === currentPath };
      })}
      onNavigate={setCurrentPath}
    >
      {currentPath === "/" && (
        <Dashboard onNavigateToProjects={() => setCurrentPath("/projects")} />
      )}
      {currentPath === "/projects" && <Projects />}
      {currentPath === "/team" && (
        <p className="text-gray-500">Team page coming soon.</p>
      )}
      {currentPath === "/settings" && (
        <p className="text-gray-500">Settings page coming soon.</p>
      )}
    </Layout>
  );
};

export default App;
