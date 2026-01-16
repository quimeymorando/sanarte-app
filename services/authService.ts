
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';

const XP_PER_LEVEL = 500;
const FREE_MESSAGE_LIMIT = 5;

// Ayuda a transformar los datos crudos de DB al tipo UserProfile de Typescript
const mapProfileToUser = (profile: any): UserProfile => ({
  id: profile.id,
  name: profile.name || profile.email?.split('@')[0] || 'Sanador',
  email: profile.email || '',
  avatar: profile.avatar_url,
  joinDate: profile.join_date,
  isPremium: profile.is_premium,
  xp: profile.xp,
  level: profile.level,
  role: profile.role || 'user',
  badges: profile.badges || [],
  dailyMessageCount: profile.daily_message_count,
  lastMessageDate: profile.last_message_date,
  currentStreak: profile.current_streak || 0,
  longestStreak: profile.longest_streak || 0,
  healingMoments: profile.healing_moments || 0,
  lastActiveDate: profile.last_active_at || new Date().toISOString()
});

const safePromise = <T>(promise: Promise<T>, timeoutMs = 4000, fallbackValue: any = null): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((resolve, reject) => setTimeout(() => {
      // FIX: Use the 'resolve' callback from the Promise constructor, not the global/helper function
      if (fallbackValue !== undefined) resolve(fallbackValue);
      else reject(new Error("Timeout en operación de Supabase"));
    }, timeoutMs))
  ]) as Promise<T>;
};

// Modificamos reject por resolve con null para evitar unhandled rejections que rompan la app
function resolve(value: any) { return Promise.resolve(value); }

export const authService = {
  // Login: Ahora usa Supabase Auth
  login: async (email: string, password?: string): Promise<UserProfile | null> => {
    // Nota: Para simplificar la migración, si la UI vieja no enviaba password, 
    // deberás actualizar la UI para pedirlo o usar un password por defecto temporal para demos (no recomendado en prod)
    if (!password) {
      throw new Error("Se requiere contraseña para iniciar sesión.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error en login:', error.message);
      throw error;
    }

    if (data.user) {
      return await authService.getUser();
    }
    return null;
  },

  // Registro: Crea usuario en Auth y el Trigger crea el Profile
  register: async (name: string, email: string, password?: string): Promise<UserProfile | null> => {
    if (!password) {
      password = "temp-password-123";
      console.warn("Usando contraseña temporal. Actualiza tu UI para pedir contraseña.");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }, // Esto lo usa el Trigger para llenar la tabla profiles
        emailRedirectTo: window.location.origin // Ensure redirection back to the app
      }
    });


    if (error) {
      // Fallback: Si el usuario ya existe, intentamos login
      if (error.message.includes("already registered") || error.status === 422 || error.status === 400) {

        return authService.login(email, password);
      }
      throw error;
    }

    if (data.user) {
      if (!data.session) {
        // CASO CRÍTICO: Usuario creado pero sin sesión (requiere confirmación de email)
        throw new Error("Registro exitoso. Por favor revisa tu correo para confirmar tu cuenta antes de ingresar.");
      }

      // Login exitoso completo
      return {
        id: data.user.id,
        name,
        email,
        joinDate: new Date().toISOString(),
        isPremium: false,
        xp: 0,
        level: 1,
        badges: [],
        dailyMessageCount: 0,
        lastMessageDate: new Date().toDateString(),
        currentStreak: 1,
        longestStreak: 1,
        healingMoments: 0,
        lastActiveDate: new Date().toISOString()
      };
    }
    return null;
  },

  logout: async () => {
    if (localStorage.getItem('guest_mode')) {
      localStorage.removeItem('guest_mode');
      return;
    }
    await supabase.auth.signOut();
    localStorage.removeItem('sanarte_user_session'); // Limpieza legacy
  },

  getUser: async (): Promise<UserProfile | null> => {
    let user = null;

    // GUEST BYPASS FOR DEV/TESTING
    if (localStorage.getItem('guest_mode') === 'true') {
      return {
        id: 'guest-123',
        name: 'Invitado Sanador',
        email: 'invitado@sanarte.app',
        joinDate: new Date().toISOString(),
        isPremium: true, // Enable all features for testing
        xp: 100,
        level: 5,
        badges: ['Despertar'],
        dailyMessageCount: 0,
        lastMessageDate: new Date().toDateString(),
        currentStreak: 1,
        longestStreak: 1,
        healingMoments: 5,
        lastActiveDate: new Date().toISOString()
      };
    }

    try {
      const { data } = await safePromise(
        supabase.auth.getUser(),
        3000,
        { data: { user: null } }
      ) as any;
      user = data?.user;
    } catch (e) {
      console.warn("GetUser timeout/error", e);
      return null;
    }

    if (!user) return null;

    // Buscamos el perfil extendido en la tabla 'profiles'
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // RETRY LOGIC: Race condition with trigger
    if (!profile) {

      await new Promise(r => setTimeout(r, 1000));
      const retry = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      profile = retry.data;
      error = retry.error;
    }

    if (error || !profile) {
      console.error("Error fetching profile:", error);
      return null;
    }

    // --- LOGICA DE ACTUALIZACIÓN ---
    const today = new Date();
    const lastActive = profile.last_active_at ? new Date(profile.last_active_at) : new Date(0);
    const lastMessageDateStr = profile.last_message_date;
    const todayDateStr = today.toDateString();

    let needsUpdate = false;
    let updates: any = {};

    // 1. Reseteo diario de mensajes
    if (lastMessageDateStr !== todayDateStr) {
      updates.daily_message_count = 0;
      updates.last_message_date = todayDateStr;
      needsUpdate = true;
    }

    // 2. Cálculo de Rachas (Streak)
    // Diferencia en días
    const diffTime = Math.abs(today.getTime() - lastActive.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Solo actualizamos racha si es un día nuevo
    if (today.getDate() !== lastActive.getDate() || today.getMonth() !== lastActive.getMonth() || today.getFullYear() !== lastActive.getFullYear()) {
      // Si fue ayer (1 día de diferencia aprox, o simplemente el día anterior del calendario), sumamos
      // Una forma simple es ver si la última vez fue "ayer".
      // Para ser mas robustos:
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const wasYesterday = lastActive.getDate() === yesterday.getDate() &&
        lastActive.getMonth() === yesterday.getMonth() &&
        lastActive.getFullYear() === yesterday.getFullYear();

      if (wasYesterday) {
        const newStreak = (profile.current_streak || 0) + 1;
        updates.current_streak = newStreak;
        updates.longest_streak = Math.max(newStreak, profile.longest_streak || 0);
      } else if (today > lastActive) { // Si pasó más tiempo y no es hoy, resetear
        updates.current_streak = 1;
        // Longest se mantiene
      }

      updates.last_active_at = today.toISOString();
      needsUpdate = true;
    }


    // 3. Lógica de Desbloqueo de Insignias (Badges)
    let newBadges = [...(profile.badges || [])];
    let badgesChanged = false;

    // Badge: "Despertar" (Por unirse - default)
    if (!newBadges.includes("Despertar")) {
      newBadges.push("Despertar");
      badgesChanged = true;
    }

    // Badge: "Constancia" (Racha > 2 días)
    if ((updates.current_streak || profile.current_streak) > 2 && !newBadges.includes("Constancia")) {
      newBadges.push("Constancia");
      badgesChanged = true;
    }

    // Badge: "Sabiduría" (Nivel >= 5)
    if (profile.level >= 5 && !newBadges.includes("Sabiduría")) {
      newBadges.push("Sabiduría");
      badgesChanged = true;
    }

    if (badgesChanged) {
      updates.badges = newBadges;
      needsUpdate = true;
    }


    // Aplicar actualizaciones si son necesarias
    if (needsUpdate) {
      await supabase.from('profiles').update(updates).eq('id', user.id);
      // Actualizamos el objeto local para retornarlo actualizado
      if (updates.daily_message_count !== undefined) profile.daily_message_count = updates.daily_message_count;
      if (updates.last_message_date !== undefined) profile.last_message_date = updates.last_message_date;
      if (updates.current_streak !== undefined) profile.current_streak = updates.current_streak;
      if (updates.longest_streak !== undefined) profile.longest_streak = updates.longest_streak;
      if (updates.last_active_at !== undefined) profile.last_active_at = updates.last_active_at;
      if (updates.badges !== undefined) profile.badges = updates.badges;
    }


    // SELF-HEAL: Update profile if it has placeholder data or mismatch
    if (profile && user.email && (profile.email === 'usuario@sanarte.app' || profile.email !== user.email)) {

      const syncUpdates: any = { email: user.email };

      // Also try to sync name if it's the generic one and we have metadata
      if (profile.name === 'Usuario' && user.user_metadata?.name) {
        syncUpdates.name = user.user_metadata.name;
      }

      await supabase.from('profiles').update(syncUpdates).eq('id', user.id);

      // Update local object to reflect changes immediately
      profile.email = syncUpdates.email;
      if (syncUpdates.name) profile.name = syncUpdates.name;
    }

    return mapProfileToUser(profile);
  },

  isAuthenticated: async (): Promise<boolean> => {
    if (localStorage.getItem('guest_mode') === 'true') return true;
    try {
      const { data: { session } } = await safePromise(
        supabase.auth.getSession(),
        3000,
        { data: { session: null } }
      ) as any;
      return !!session;
    } catch (e) {
      return false;
    }
  },

  loginAsGuest: async (): Promise<void> => {
    localStorage.setItem('guest_mode', 'true');
    // Generar un XP ganado para el feedback inicial
    window.dispatchEvent(new CustomEvent('xp-gained', { detail: { amount: 10, levelUp: false } }));
  },

  // Métodos de lógica de negocio (XP, Premium, etc)
  upgradeToPremium: async (): Promise<boolean> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: true })
      .eq('id', user.id);

    return !error;
  },

  incrementMessageCount: async (): Promise<boolean> => {
    const user = await authService.getUser();
    if (!user) return false;

    if (user.isPremium) return true;
    if (user.dailyMessageCount >= FREE_MESSAGE_LIMIT) return false;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;

    const { error } = await supabase
      .from('profiles')
      .update({ daily_message_count: user.dailyMessageCount + 1 })
      .eq('id', session.user.id);

    return !error;
  },

  addXP: async (amount: number): Promise<UserProfile | null> => {
    const currentProfile = await authService.getUser();
    if (!currentProfile) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const newXp = currentProfile.xp + amount;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;

    const updates: any = { xp: newXp };
    if (newLevel > currentProfile.level) {
      updates.level = newLevel;
    }

    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) return null;

    // Dispatch Event for UI (Toast)
    if (amount > 0) {
      window.dispatchEvent(new CustomEvent('xp-gained', { detail: { amount, levelUp: newLevel > currentProfile.level } }));
    }

    return mapProfileToUser(updatedProfile);
  },

  resendConfirmationEmail: async (email: string): Promise<boolean> => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    return !error;
  },

  updateAvatar: async (file: File): Promise<string | null> => {
    const user = await authService.getUser();
    if (!user) return null;

    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      return null;
    }

    // 2. Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // 3. Update Profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile avatar:', updateError);
      return null;
    }

    return publicUrl;
  },

  incrementHealingMoments: async (): Promise<void> => {
    const user = await authService.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ healing_moments: (user.healingMoments || 0) + 1 })
      .eq('id', user.id);

    if (error) console.error("Error incrementing healing moments:", error);
  }
} as const;
