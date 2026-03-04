import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

// Helper to get user ID, preferring authenticated user
const getUserId = (state) => {
  return state.user?.id || localStorage.getItem('what2eat_user_id') || 'anon';
};

export const useUserStore = create(
  persist(
    (set, get) => ({
      userProfile: {
        lifeStage: 'adult', // Default to adult
        currentMood: 50,    // 0-100 scale
        dietaryIntents: [], // e.g., ['sugar_control', 'plant_based']
      },
      isDarkMode: false, // Default to light mode
      dailyMeals: [], // Array of meal objects
      isLoading: false,
      
      // Auth State
      user: null,
      session: null,

      // Auth Actions
      setUser: (user, session) => set({ user, session }),
      
      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, dailyMeals: [], userProfile: { lifeStage: 'adult', currentMood: 50, dietaryIntents: [] } });
        localStorage.removeItem('what2eat_user_id'); // Clear local ID on logout
      },

      // Actions
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      updateUserProfile: async (updates) => {
        // Optimistic update
        set((state) => ({
          userProfile: { ...state.userProfile, ...updates }
        }));

        // Sync to Supabase
        const userId = getUserId(get());
        // Don't sync if strictly anon and no ID (though we usually have one)
        if (userId === 'anon') return;

        const { error } = await supabase
          .from('profiles')
          .upsert({ 
            user_id: userId,
            life_stage: updates.lifeStage || get().userProfile.lifeStage,
            mood: updates.currentMood !== undefined ? updates.currentMood : get().userProfile.currentMood,
            dietary_intents: updates.dietaryIntents || get().userProfile.dietaryIntents,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
        
        if (error) console.error('Supabase profile sync error:', error);
      },
      
      addMeal: async (meal) => {
        const newMeal = { ...meal, id: Date.now(), timestamp: new Date().toISOString() };
        
        // Optimistic update
        set((state) => ({
          dailyMeals: [...state.dailyMeals, newMeal]
        }));

        // Sync to Supabase
        const userId = getUserId(get());
        if (userId === 'anon') return;

        const { error } = await supabase
          .from('meals')
          .insert({
            user_id: userId,
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            nutrients: meal.nutrients || {},
            eaten_at: newMeal.timestamp
          });

        if (error) console.error('Supabase meal sync error:', error);
      },
      
      removeMeal: async (mealId) => {
        set((state) => ({
          dailyMeals: state.dailyMeals.filter((m) => m.id !== mealId)
        }));
      },
      
      clearHistory: () => set({ dailyMeals: [] }),

      // Initialize/Fetch from Supabase
      hydrateFromSupabase: async () => {
        const userId = getUserId(get());
        if (userId === 'anon') return;

        set({ isLoading: true });
        
        // Fetch Profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (profile) {
          set((state) => ({
            userProfile: {
              ...state.userProfile,
              lifeStage: profile.life_stage || 'adult',
              currentMood: profile.mood || 50,
              dietaryIntents: profile.dietary_intents || []
            }
          }));
        }

        // Fetch Meals
        const { data: meals } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', userId)
          .order('eaten_at', { ascending: false });

        if (meals) {
          set({
            dailyMeals: meals.map(m => ({
              id: m.id,
              name: m.name,
              calories: m.calories,
              protein: m.protein,
              timestamp: m.eaten_at
            }))
          });
        }
        set({ isLoading: false });
      }
    }),
    {
      name: 'user-storage', // unique name for localStorage key
      partialize: (state) => ({ 
        userProfile: state.userProfile, 
        dailyMeals: state.dailyMeals,
        isDarkMode: state.isDarkMode,
        // Don't persist user/session here if we rely on supabase's own persistence, 
        // but for simplicity we can let supabase js handle session recovery and we just sync it.
        // Actually, let's not persist 'user' and 'session' in zustand persist to avoid conflicts with Supabase's auto-refresh.
        // We will set them on mount.
      }), 
    }
  )
);
