import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path ? "text-primary font-bold" : "text-gray-500 dark:text-gray-400 hover:text-primary";

  // Don't show navigation on landing page
  if (location.pathname === '/') return null;

  // Pages where the user might feel trapped on Desktop (Sections)
  const showDesktopBack = ['/community', '/routines', '/history', '/profile', '/favorites'].includes(location.pathname);

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-surface-light dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 py-3 px-6 z-[90] flex justify-between items-center md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <Link to="/home" className={`flex flex-col items-center gap-1 ${isActive('/home')}`}>
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px]">Inicio</span>
        </Link>
        <Link to="/community" className={`flex flex-col items-center gap-1 ${isActive('/community')}`}>
          <span className="material-symbols-outlined">diversity_1</span>
          <span className="text-[10px]">Comunidad</span>
        </Link>
        <Link to="/routines" className={`flex flex-col items-center gap-1 ${isActive('/routines')}`}>
          <span className="material-symbols-outlined">calendar_today</span>
          <span className="text-[10px]">Rutinas</span>
        </Link>
        <Link to="/history" className={`flex flex-col items-center gap-1 ${isActive('/history')}`}>
          <span className="material-symbols-outlined">history</span>
          <span className="text-[10px]">Historial</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1 ${isActive('/profile')}`}>
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px]">Perfil</span>
        </Link>
      </nav>

      {/* Desktop Navigation - Back Button for Sections */}
      {showDesktopBack && (
        <button
          onClick={() => navigate('/home')}
          className="hidden md:flex fixed top-8 left-8 z-[90] bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 hover:text-primary dark:hover:text-primary py-3 px-5 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-x-1 items-center gap-3 font-bold group animate-in fade-in slide-in-from-left-10 duration-500"
        >
          <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">arrow_back</span>
          <span className="text-sm">Inicio</span>
        </button>
      )}
    </>
  );
};

export default Navigation;