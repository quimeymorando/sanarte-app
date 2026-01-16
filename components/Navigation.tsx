import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path ? "text-primary font-bold" : "text-gray-500 dark:text-gray-400 hover:text-primary";

  // Don't show navigation on landing page
  if (location.pathname === '/') return null;

  // Pages where the user might feel trapped on Desktop (Sections)
  const showDesktopBack = ['/community', '/routines', '/journal', '/profile', '/favorites'].includes(location.pathname);

  return (
    <>
      {/* Desktop Navigation Header */}
      <nav className="hidden md:flex fixed top-0 w-full bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 py-4 px-8 z-[90] justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/home')}>
          <span className="material-symbols-outlined text-3xl text-primary animate-pulse-slow">spa</span>
          <span className="text-xl font-heading font-bold text-gray-900 dark:text-white tracking-tight">San<span className="text-primary italic">Arte</span></span>
        </div>

        <div className="flex items-center gap-8">
          <Link to="/home" className={`flex items-center gap-2 text-sm font-bold transition-colors ${isActive('/home')}`}>
            <span className="material-symbols-outlined text-lg">home</span>
            Inicio
          </Link>
          <Link to="/community" className={`flex items-center gap-2 text-sm font-bold transition-colors ${isActive('/community')}`}>
            <span className="material-symbols-outlined text-lg">diversity_1</span>
            Comunidad
          </Link>
          <Link to="/routines" className={`flex items-center gap-2 text-sm font-bold transition-colors ${isActive('/routines')}`}>
            <span className="material-symbols-outlined text-lg">calendar_today</span>
            Rutinas
          </Link>
          <Link to="/journal" className={`flex items-center gap-2 text-sm font-bold transition-colors ${isActive('/journal')}`}>
            <span className="material-symbols-outlined text-lg">book_2</span>
            Diario
          </Link>
          <Link to="/profile" className={`flex items-center gap-2 text-sm font-bold transition-colors ${isActive('/profile')}`}>
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">person</span>
            </div>
            Perfil
          </Link>
        </div>
      </nav>

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
        <Link to="/journal" className={`flex flex-col items-center gap-1 ${isActive('/journal')}`}>
          <span className="material-symbols-outlined">book_2</span>
          <span className="text-[10px]">Diario</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center gap-1 ${isActive('/profile')}`}>
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px]">Perfil</span>
        </Link>
      </nav>
    </>
  );
};

export default Navigation;