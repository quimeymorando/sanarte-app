
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check for errors in URL (Supabase redirect)
    const hash = window.location.hash;
    if (hash && hash.includes('error_description')) {
      const params = new URLSearchParams(hash.substring(1));
      const errorDesc = params.get('error_description');
      if (errorDesc) {
        setAuthError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
        setShowAuthModal(true);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    // Validation
    if (!email.includes('@') || password.length < 6) {
      setAuthError('Por favor verifica el correo y la contraseña (mínimo 6 caracteres).');
      return;
    }

    if (authMode === 'register') {
      if (name.length < 2) {
        setAuthError('Por favor ingresa un nombre válido.');
        return;
      }
      if (password !== confirmPassword) {
        setAuthError('Las contraseñas no coinciden.');
        return;
      }
    }

    setIsLoggingIn(true);

    try {
      let user;
      if (authMode === 'login') {
        user = await authService.login(email, password);
      } else {
        user = await authService.register(name, email, password);
      }

      if (user) {
        setShowAuthModal(false);
        navigate('/home');
      }
    } catch (e: any) {
      console.error(e);
      let msg = e.message || 'Hubo un error al conectar.';
      if (msg.includes('Invalid login credentials')) msg = 'Correo o contraseña incorrectos.';
      if (msg.includes('User already registered')) msg = 'Este correo ya está registrado. Intenta iniciar sesión.';
      setAuthError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const openAuth = async () => {
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        navigate('/home');
      } else {
        setShowAuthModal(true);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      // Fallback: Si falla la verificación (ej. problemas de conexión), mostramos el modal igual
      setShowAuthModal(true);
    }
  };

  return (
    <div className="relative w-full overflow-hidden bg-surface-light dark:bg-[#0a0f12] text-gray-900 dark:text-gray-100 font-sans selection:bg-primary/30">

      {/* --- NAVBAR --- */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-sm py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo(0, 0)}>
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-[15px] group-hover:bg-primary/40 transition-all"></div>
              {/* Nuevo Logo Sagrado - Integrado como una gema profesional */}
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center relative z-10 animate-float overflow-hidden shadow-lg border border-white/20">
                <img
                  src="/logo_futuro.png"
                  alt="SanArte Logo"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <span className="text-2xl font-black font-heading tracking-tighter text-white neo-glow">SanArte</span>
          </div>
          <button
            onClick={openAuth}
            className="px-6 py-2 rounded-full glass-panel border border-white/20 font-black text-sm hover:scale-105 transition-all text-white hover:shadow-glow-primary"
          >
            Entrar
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-primary/20 backdrop-blur-sm">
            <span className="text-xs font-bold text-primary uppercase tracking-widest">Descubre el mensaje de tu alma</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9]">
            Sanar es un<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-secondary animate-shimmer bg-[length:200%_auto]">
              Viaje al Futuro.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
            Tu cuerpo no te ataca, te habla. Traduce tus síntomas, libera emociones atrapadas y recupera tu bienestar integral.
          </p>

          <button
            onClick={openAuth}
            className="mt-4 px-8 py-4 bg-primary hover:bg-primary-hover text-white text-lg font-bold rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 hover:shadow-2xl transition-all flex items-center gap-2"
          >
            <span>Comenzar mi Viaje</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>

          {/* Indicador de Scroll Minimalista */}
          {!scrolled && (
            <div
              className="flex flex-col items-center gap-0.5 animate-bounce opacity-60 cursor-pointer group mt-[-8px] hover:opacity-100 transition-opacity"
              onClick={() => window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' })}
            >
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-primary neo-glow">Desliza</span>
              <span className="material-symbols-outlined text-primary text-xl neo-glow">keyboard_arrow_down</span>
            </div>
          )}

          <div className="flex flex-col items-center justify-center gap-4 mt-4 opacity-70">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 border-2 border-white dark:border-black flex items-center justify-center text-xs font-bold">
                  👤
                </div>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-400">
              Unite a +2,400 almas sanando hoy
            </span>
          </div>
        </div>
      </section>

      {/* --- THE PAIN (EMOTIONAL CONNECTION) --- */}
      <section className="py-24 bg-white dark:bg-black/20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent rounded-[3rem] blur-2xl -z-10"></div>
            <div className="bg-gray-100 dark:bg-gray-900 rounded-[3rem] h-[500px] flex items-center justify-center p-8 relative overflow-hidden shadow-2xl skew-y-1">
              {/* Abstract illustration of pain/blockage */}
              <div className="absolute w-[120%] h-[120%] bg-[url('https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover opacity-20 dark:opacity-40 grayscale mix-blend-overlay"></div>
              <div className="relative z-10 text-center">
                <span className="text-6xl mb-4 block animate-bounce">🌩️</span>
                <h3 className="text-2xl font-bold">"¿Por qué me duele siempre?"</h3>
                <p className="text-gray-500 mt-2">Migrañas, gastritis, ansiedad...</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-4xl font-black leading-tight text-gray-900 dark:text-white">
              El cuerpo grita lo que <span className="text-primary underline decoration-wavy decoration-2">el alma calla</span>.
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Vivimos desconectados. Tomamos una pastilla para silenciar el síntoma, pero ignoramos el mensaje.
              La <strong>Biodescodificación</strong> nos enseña que cada dolor físico tiene una raíz emocional no resuelta.
            </p>
            <ul className="space-y-4">
              {[
                "Estrés no gestionado se vuelve tensión.",
                "Miedo al futuro se vuelve ansiedad.",
                "Palabras no dichas se vuelven dolor de garganta."
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-200 font-medium">
                  <span className="material-symbols-outlined text-green-500">check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* --- THE SOLUTION (3 PILLARS) --- */}
      <section className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6 text-center mb-16">
          <span className="text-primary font-black tracking-widest uppercase text-sm mb-2 block">El Método SanArte</span>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">Tu camino hacia la plenitud</h2>
        </div>

        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-8">
          {[
            { icon: "psychology", color: "text-primary", title: "Entender", desc: "Descubre el conflicto emocional detrás de tu síntoma y su mensaje para ti." },
            { icon: "self_improvement", color: "text-secondary", title: "Sanar", desc: "Meditaciones guiadas y afirmaciones holográficas para reprogramar tu mente." },
            { icon: "local_florist", color: "text-accent", title: "Cuidar", desc: "Remedios naturales y medicina cuántica para apoyar a tu biología." }
          ].map((card, i) => (
            <div key={i} className="glass-card bg-white/50 dark:bg-white/5 p-10 rounded-[3rem] border border-gray-100 dark:border-white/5 hover:border-primary/50 transition-all hover:shadow-glow-primary group">
              <div className={`w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-glass`}>
                <span className={`material-symbols-outlined text-5xl ${card.color} neo-glow`}>{card.icon}</span>
              </div>
              <h3 className="text-3xl font-black mb-4 text-gray-900 dark:text-white group-hover:text-primary transition-colors">{card.title}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- CTA FINAL --- */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10 dark:bg-primary/5"></div>
        <div className="absolute top-[-50%] left-[-20%] w-[1000px] h-[1000px] bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-[150px] animate-pulse-slow"></div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center bg-white/40 dark:bg-white/5 backdrop-blur-xl p-12 md:p-20 rounded-[3rem] border border-white/50 dark:border-white/10 shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-6">¿Listo para escuchar a tu cuerpo?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
            Deja de luchar contra los síntomas. Empieza a entenderlos y transformarlos hoy mismo.
          </p>
          <button
            onClick={openAuth}
            className="px-10 py-5 bg-gradient-to-r from-primary to-purple-600 hover:scale-105 text-white text-xl font-black rounded-2xl shadow-xl shadow-primary/40 transition-all w-full md:w-auto"
          >
            Crear mi Espacio de Sanación
          </button>
          <p className="mt-6 text-sm text-gray-500 font-bold opacity-70">
            Empieza gratis. Sin tarjeta de crédito.
          </p>
        </div>
      </section>

      <footer className="py-12 text-center text-gray-400 text-sm">
        <p>© 2025 SanArte. Hecho con ❤️ y conciencia.</p>
      </footer>

      {showAuthModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAuthModal(false)}></div>
          <div className="relative bg-white dark:bg-surface-dark w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 transform">
            <div className={`px-8 py-8 text-center relative overflow-hidden transition-colors duration-500 ${authMode === 'login' ? 'bg-indigo-600' : 'bg-primary'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full -mr-10 -mt-10 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10 blur-xl"></div>

              <h3 className="text-3xl font-black text-white relative z-10">
                {authMode === 'login' ? 'Te damos la bienvenida' : 'Únete a SanArte'}
              </h3>
              <p className="text-white/80 font-medium mt-2 relative z-10">
                {authMode === 'login' ? 'Tu espacio de sanación te espera' : 'Tu viaje de sanación comienza aquí'}
              </p>
            </div>

            <div className="p-8">
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">

                {/* NAME FIELD - REGISTER ONLY */}
                {authMode === 'register' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Nombre</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="¿Cómo te gusta que te llamen?"
                      className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                      required
                    />
                  </div>
                )}

                {/* EMAIL FIELD */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    required
                  />
                </div>

                {/* PASSWORD FIELD */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-2xl px-5 py-3 focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    required
                    minLength={6}
                  />
                </div>

                {/* CONFIRM PASSWORD - REGISTER ONLY */}
                {authMode === 'register' && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 ml-1">Repetir Contraseña</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full bg-gray-50 dark:bg-black/20 border rounded-2xl px-5 py-3 focus:ring-4 outline-none transition-all font-medium ${confirmPassword && password !== confirmPassword
                        ? 'border-red-300 focus:ring-red-200 focus:border-red-500'
                        : 'border-gray-200 dark:border-gray-700 focus:ring-primary/20 focus:border-primary'
                        }`}
                      required
                      minLength={6}
                    />
                  </div>
                )}

                {authMode === 'register' && (
                  <div className="flex items-start gap-3 mt-2 px-1">
                    <input type="checkbox" required className="mt-1 w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-normal">
                      Acepto guardar mi progreso y recibir actualizaciones.
                    </p>
                  </div>
                )}

                {authError && (
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl text-center">
                    <p className="text-red-500 text-sm font-bold mb-2">{authError}</p>
                    {(authError.includes("revisa tu correo") || authError.includes("no confirmado")) && (
                      <button
                        type="button"
                        onClick={async () => {
                          const sent = await authService.resendConfirmationEmail(email);
                          if (sent) setAuthError("¡Correo reenviado!");
                          else setAuthError("Error al reenviar.");
                        }}
                        className="text-xs text-primary hover:underline font-black"
                      >
                        Reenviar correo
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className={`mt-2 w-full bg-gradient-to-r hover:scale-[1.02] text-white font-black py-4 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2 ${isLoggingIn ? 'opacity-70 cursor-wait' : ''
                    } ${authMode === 'login' ? 'from-indigo-600 to-blue-600' : 'from-primary to-purple-600'}`}
                >
                  {isLoggingIn ? (
                    <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                  ) : (
                    <>
                      <span>{authMode === 'login' ? 'Ingresar' : 'Crear Cuenta'}</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await authService.loginAsGuest();
                    navigate('/home');
                  }}
                  className="mt-3 w-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary font-bold py-3 rounded-2xl text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors"
                >
                  Ingresar como Invitado (Modo Demo)
                </button>
              </form>

              {/* TOGGLE MODE */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode(authMode === 'login' ? 'register' : 'login');
                    setAuthError('');
                  }}
                  className="group relative inline-block"
                >
                  <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent font-black tracking-wide text-sm group-hover:opacity-80 transition-opacity">
                    {authMode === 'login' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Ingresa aquí'}
                  </span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-purple-500 transition-all group-hover:w-full"></span>
                </button>
              </div>

              <button
                onClick={() => !isLoggingIn && setShowAuthModal(false)}
                className="w-full text-center mt-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-bold uppercase tracking-widest"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;