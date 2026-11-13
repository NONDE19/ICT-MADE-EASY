import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { FormLevelProvider } from './contexts/FormLevelContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { AppShell, NavRoute } from './layouts/AppShell.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { PupilDashboard } from './dashboards/PupilDashboard.tsx';
import { TeacherDashboard } from './dashboards/TeacherDashboard.tsx';
import { AdminDashboard } from './dashboards/AdminDashboard.tsx';
import { ModulesHub } from './modules/ModulesHub.tsx';
import { SyllabusToolsGallery } from './modules/SyllabusToolsGallery.tsx';
import { Module2HardwareLab } from './modules/Module2HardwareLab.tsx';
import { VirtualDesktop } from './simulations/VirtualDesktop.tsx';
import { Module9Networking } from './modules/Module9Networking.tsx';
import { Module10Cybersecurity } from './modules/Module10Cybersecurity.tsx';
import { Module11AssessmentCenter } from './modules/Module11AssessmentCenter.tsx';
import { OfflineArchitecturePage } from './modules/OfflineArchitecturePage.tsx';

const ROUTE_TITLES: Record<NavRoute, string> = {
  dashboard: 'Dashboard',
  modules: 'Zambian Form 1–4 ICT Modules',
  'tools-gallery': 'ICT Tools Visual Guide (Form 1–4)',
  'hardware-lab': 'Computer Hardware Laboratory',
  'virtual-desktop': 'Virtual Computer Desktop',
  assessments: 'Practical Assessment Centre',
  networking: 'Internet & Networking Lab',
  cybersecurity: 'Cybersecurity & Digital Safety',
  'offline-guide': 'Offline & Local Server Sync',
  'admin-panel': 'School & Platform Administration',
  'teacher-panel': 'Teacher Class & Performance Reports',
};

const AuthenticatedWorkspace: React.FC = () => {
  const { user, loading } = useAuth();
  const [route, setRoute] = useState<NavRoute>('dashboard');
  const [selectedModuleSlug, setSelectedModuleSlug] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-sm font-medium text-slate-600 dark:text-slate-300">
        Loading ICT Made Easy workspace...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleOpenModule = (slug: string) => {
    setSelectedModuleSlug(slug);
    setRoute('modules');
  };

  const handleNavigate = (nextRoute: NavRoute) => {
    if (nextRoute !== 'modules') {
      setSelectedModuleSlug(null);
    }
    setRoute(nextRoute);
  };

  const renderDashboardByRole = () => {
    if (user.role === 'ADMIN') return <AdminDashboard />;
    if (user.role === 'TEACHER') return <TeacherDashboard />;
    return <PupilDashboard onNavigate={handleNavigate} onOpenModule={handleOpenModule} />;
  };

  return (
    <AppShell
      activeRoute={route}
      onNavigate={handleNavigate}
      pageTitle={ROUTE_TITLES[route]}
    >
      {route === 'dashboard' && renderDashboardByRole()}
      {route === 'admin-panel' && user.role === 'ADMIN' && <AdminDashboard />}
      {route === 'teacher-panel' && (user.role === 'TEACHER' || user.role === 'ADMIN') && (
        <TeacherDashboard />
      )}
      {route === 'modules' && (
        <ModulesHub initialSlug={selectedModuleSlug} onNavigate={handleNavigate} />
      )}
      {route === 'tools-gallery' && <SyllabusToolsGallery onNavigate={handleNavigate} />}
      {route === 'hardware-lab' && <Module2HardwareLab />}
      {route === 'virtual-desktop' && <VirtualDesktop />}
      {route === 'assessments' && <Module11AssessmentCenter />}
      {route === 'networking' && <Module9Networking />}
      {route === 'cybersecurity' && <Module10Cybersecurity />}
      {route === 'offline-guide' && <OfflineArchitecturePage />}
    </AppShell>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <FormLevelProvider>
        <AuthProvider>
          <AuthenticatedWorkspace />
        </AuthProvider>
      </FormLevelProvider>
    </ThemeProvider>
  );
}
