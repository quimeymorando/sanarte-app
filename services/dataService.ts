
import { supabase } from '../supabaseClient';
import { Routine, SymptomLogEntry } from '../types';

// --- RUTINAS ---
export const routineService = {
    getRoutines: async (): Promise<Routine[]> => {
        const { data, error } = await supabase
            .from('routines')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching routines:", error);
            return [];
        }
        return data || [];
    },

    addRoutine: async (routine: Omit<Routine, 'id'>): Promise<Routine | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuario no autenticado');

        const { data, error } = await supabase
            .from('routines')
            .insert({ ...routine, user_id: user.id })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    toggleRoutine: async (id: string, completed: boolean): Promise<void> => {
        const { error } = await supabase
            .from('routines')
            .update({ completed })
            .eq('id', id);
        if (error) throw error;
    },

    deleteRoutine: async (id: string): Promise<void> => {
        const { error } = await supabase.from('routines').delete().eq('id', id);
        if (error) throw error;
    }
};

// --- COMUNIDAD (INTENCIONES) ---
export interface IntentionData {
    id: string;
    text: string;
    authorName: string;
    candles: number;
    loves: number;
    isUser: boolean;
    user_id?: string; // Exposed for client-side ownership checks
    theme: 'healing' | 'gratitude' | 'release' | 'feedback';
    timestamp: Date;
    comments?: any[];
}

export const communityService = {
    getIntentions: async (): Promise<IntentionData[]> => {
        const { data: { user } } = await supabase.auth.getUser();

        // Obtenemos intenciones y cargamos sus comentarios también
        const { data, error } = await supabase
            .from('intentions')
            .select('*, comments(*)');

        if (error) {
            console.error(error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id,
            text: item.text,
            authorName: item.author_name || 'Anónimo',
            candles: item.candles,
            loves: item.loves,
            isUser: user ? item.user_id === user.id : false,
            user_id: item.user_id, // Map the ID
            theme: item.theme,
            timestamp: new Date(item.created_at),
            comments: item.comments || []
        }));
    },

    createIntention: async (text: string, theme: string, authorName: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Debes iniciar sesión');

        const { data, error } = await supabase
            .from('intentions')
            .insert({
                user_id: user.id,
                text,
                theme,
                author_name: authorName
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    lightCandle: async (id: string) => {
        // Leemos valor actual y sumamos 1 (simple)
        const { data } = await supabase.from('intentions').select('candles').eq('id', id).single();
        if (data) {
            await supabase
                .from('intentions')
                .update({ candles: data.candles + 1 })
                .eq('id', id);
        }
    },

    sendLove: async (id: string) => {
        const { data } = await supabase.from('intentions').select('loves').eq('id', id).single();
        if (data) {
            await supabase
                .from('intentions')
                .update({ loves: data.loves + 1 })
                .eq('id', id);
        }
    },

    addComment: async (intentionId: string, text: string, authorName: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Debes iniciar sesión');

        const { data, error } = await supabase
            .from('comments')
            .insert({
                intention_id: intentionId,
                user_id: user.id,
                text,
                author_name: authorName
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    deleteComment: async (commentId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Debes iniciar sesión');

        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', user.id); // Security: only delete own comments

        if (error) throw error;
    },

    deleteIntention: async (intentionId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Debes iniciar sesión');

        const { error } = await supabase
            .from('intentions')
            .delete()
            .eq('id', intentionId)
            .eq('user_id', user.id);

        if (error) throw error;
    }
};

// --- HISTORIAL Y FAVORITOS ---

export const historyService = {
    saveSymptomLog: async (log: Omit<SymptomLogEntry, 'id'>) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No autenticado');

        const { error } = await supabase
            .from('symptom_logs')
            .insert({ ...log, user_id: user.id });

        if (error) throw error;
    },

    getHistory: async (): Promise<SymptomLogEntry[]> => {
        const { data, error } = await supabase
            .from('symptom_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Mapeo simple si las columnas difieren ligeramente o retorno directo
        return data.map((d: any) => ({
            id: d.id,
            date: d.date,
            intensity: d.intensity,
            duration: d.duration,
            notes: d.notes
        }));
    },

    deleteLog: async (id: string) => {
        const { error } = await supabase.from('symptom_logs').delete().eq('id', id);
        if (error) throw error;
    },

    toggleFavorite: async (symptomName: string, description: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Verificar si ya existe
        const { data: existing } = await supabase
            .from('favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('symptom_name', symptomName)
            .single();

        if (existing) {
            await supabase.from('favorites').delete().eq('id', existing.id);
        } else {
            await supabase.from('favorites').insert({
                user_id: user.id,
                symptom_name: symptomName,
                description
            });
        }
    },

    getFavorites: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            // Try to get from local storage if no user (or offline check passed implicitly by failure above if session persisted but network fail)
            // But actually supabase.auth.getUser() might work from local session.
            // If we are truly offline, supabase.from will fail.
        }

        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('*');

            if (error) throw error;

            // Cache successful response
            if (data) {
                localStorage.setItem('sanarte_favorites_cache', JSON.stringify(data));
            }
            return data;
        } catch (error) {
            // console.log("Network error or offline, serving cached favorites", error);
            const cached = localStorage.getItem('sanarte_favorites_cache');
            if (cached) {
                return JSON.parse(cached);
            }
            return []; // No cache and error
        }
    },
    deleteFavoriteById: async (id: string) => {
        const { error } = await supabase.from('favorites').delete().eq('id', id);
        if (error) throw error;
    }
};
