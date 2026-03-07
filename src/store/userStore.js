import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { logEvent, logError } from '../lib/logger';

const defaultUserProfile = {
  lifeStage: 'adult',
  currentMood: 50,
  dietaryIntents: [],
  cravings: [],
  allergies: [],
  heightCm: '',
  weightKg: '',
  healthGoals: [],
};

const getUserId = (state) => state.user?.id || null;

const toNumber = (value) => Number(value) || 0;

const toIntOrNull = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};

const hashString = (input) => {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash)}`;
};

const makeClientId = (prefix, payload) => {
  const raw = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return `${prefix}-${hashString(raw)}-${Date.now()}`;
};

const mapDietaryIntentsToDb = (dietaryIntents) => {
  const set = new Set(Array.isArray(dietaryIntents) ? dietaryIntents : []);
  return {
    plant_based: set.has('plant_based'),
    glucose_control: set.has('sugar_control'),
    high_performance: set.has('high_protein'),
  };
};

const mapDietaryIntentsFromDb = (dietaryIntents) => {
  const db = dietaryIntents && typeof dietaryIntents === 'object' ? dietaryIntents : {};
  const intents = [];
  if (db.plant_based) intents.push('plant_based');
  if (db.glucose_control) intents.push('sugar_control');
  if (db.high_performance) intents.push('high_protein');
  return intents;
};

const mapLifeStageToDb = (lifeStage) => {
  if (lifeStage === 'infant') return 'Infant';
  if (lifeStage === 'child' || lifeStage === 'teen' || lifeStage === 'toddler') return 'Student';
  if (lifeStage === 'senior') return 'Senior';
  if (lifeStage === 'adult') return 'Active';
  return 'Active';
};

const mapLifeStageFromDb = (lifeStage) => {
  if (lifeStage === 'Infant') return 'infant';
  if (lifeStage === 'Student') return 'teen';
  if (lifeStage === 'Senior') return 'senior';
  if (lifeStage === 'Pro') return 'adult';
  if (lifeStage === 'Active') return 'adult';
  return defaultUserProfile.lifeStage;
};

const toNutrientsFromMeal = (meal) => {
  if (meal.nutrients && typeof meal.nutrients === 'object') {
    return meal.nutrients;
  }

  return {
    calcium: toNumber(meal.calcium),
    iron: toNumber(meal.iron),
    folate: toNumber(meal.folate),
    vitaminD: toNumber(meal.vitaminD),
  };
};

const mapMealRow = (meal) => ({
  id: meal.id,
  clientId: meal.client_id || null,
  name: meal.name || meal.dish_name || meal.notes || 'Meal',
  calories: toNumber(meal.calories),
  protein: toNumber(meal.protein),
  calcium: toNumber(meal.nutrients?.calcium),
  iron: toNumber(meal.nutrients?.iron),
  folate: toNumber(meal.nutrients?.folate),
  vitaminD: toNumber(meal.nutrients?.vitaminD),
  nutrients: meal.nutrients || {},
  recipe: meal.recipe || {},
  timestamp: meal.eaten_at,
  synced: true,
});

const mapFavoriteRow = (fav) => {
  if (fav.dish && typeof fav.dish === 'object') {
    return {
      id: fav.id,
      dishId: fav.dish_id,
      title: fav.dish.name_zh || fav.dish.name,
      imageUrl: fav.dish.image_url,
      tags: Array.isArray(fav.dish.tags) ? fav.dish.tags : [],
      recipe: {
        suggestion: fav.dish.name_zh || fav.dish.name,
        reasoning: fav.dish.quote || fav.dish.description || '',
        ingredients: Array.isArray(fav.dish.ingredients) ? fav.dish.ingredients : [],
        steps: Array.isArray(fav.dish.steps) ? fav.dish.steps : [],
        nutrients: fav.dish.nutrients || {},
        prepTime: fav.dish.prep_time_mins ? `${fav.dish.prep_time_mins} min` : '',
      },
      createdAt: fav.created_at,
      synced: true,
    };
  }

  const recipe = fav.recipe && typeof fav.recipe === 'object' ? fav.recipe : {};
  return {
    id: fav.id,
    dishId: fav.dish_id || null,
    title: fav.title || recipe.suggestion || 'Recipe',
    imageUrl: fav.image_url || null,
    tags: Array.isArray(fav.tags) ? fav.tags : [],
    recipe,
    createdAt: fav.created_at,
    synced: true,
    clientId: fav.client_id || null,
  };
};

const mapMealToDbInsert = (meal, userId) => ({
  user_id: userId,
  dish_id: null,
  meal_type: 'Lunch',
  calories: toNumber(meal.calories),
  eaten_at: meal.timestamp,
  name: meal.name,
  protein: toNumber(meal.protein),
  nutrients: meal.nutrients || {},
  recipe: meal.recipe || {},
  client_id: meal.clientId,
});

export const useUserStore = create(
  persist(
    (set, get) => ({
      userProfile: defaultUserProfile,
      accountProfile: null,
      isDarkMode: false,
      dailyMeals: [],
      favorites: [],
      isLoading: false,
      user: null,
      session: null,
      setUser: (user, session) => set({ user, session }),
      clearUserData: () => {
        set({
          user: null,
          session: null,
          isLoading: false,
          accountProfile: null,
        });
      },
      signOut: async () => {
        const userId = getUserId(get());
        try {
          const { error } = await supabase.auth.signOut();
          if (error) {
            logError('auth_sign_out_fail', error, { scene: 'store', user_id: userId, status: 'fail' });
            return { ok: false, errorCode: error.code || 'SIGN_OUT_FAILED' };
          }
          get().clearUserData();
          logEvent('auth_sign_out_success', { scene: 'store', user_id: userId, status: 'success' });
          return { ok: true };
        } catch (error) {
          logError('auth_sign_out_fail', error, { scene: 'store', user_id: userId, status: 'fail', error_code: 'SIGN_OUT_FAILED' });
          return { ok: false, errorCode: 'SIGN_OUT_FAILED' };
        }
      },
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      updateUserProfile: async (updates) => {
        const userId = getUserId(get());
        const previousProfile = get().userProfile;

        set((state) => ({
          userProfile: { ...state.userProfile, ...updates },
        }));

        if (!userId) {
          logEvent('profile_update_guest', { scene: 'store', status: 'success' });
          return { ok: true, guest: true };
        }

        const merged = { ...previousProfile, ...updates };
        const payload = {
          user_id: userId,
          mood_value: merged.currentMood,
          craving_vibes: Array.isArray(merged.cravings) ? merged.cravings : [],
          life_stage: mapLifeStageToDb(merged.lifeStage),
          dietary_intents: mapDietaryIntentsToDb(merged.dietaryIntents),
          allergies: Array.isArray(merged.allergies) ? merged.allergies : [],
          height_cm: toIntOrNull(merged.heightCm),
          weight_kg: toIntOrNull(merged.weightKg),
          health_goals: Array.isArray(merged.healthGoals) ? merged.healthGoals : [],
          updated_at: new Date().toISOString(),
        };

        try {
          const { error } = await supabase.from('user_preferences').upsert(payload, { onConflict: 'user_id' });
          if (error) {
            set({ userProfile: previousProfile });
            logError('profile_update_fail', error, { scene: 'store', user_id: userId, status: 'fail' });
            return { ok: false, errorCode: error.code || 'PROFILE_UPDATE_FAILED' };
          }

          logEvent('profile_update_success', { scene: 'store', user_id: userId, status: 'success' });
          return { ok: true };
        } catch (error) {
          set({ userProfile: previousProfile });
          logError('profile_update_fail', error, { scene: 'store', user_id: userId, status: 'fail', error_code: 'PROFILE_UPDATE_FAILED' });
          return { ok: false, errorCode: 'PROFILE_UPDATE_FAILED' };
        }
      },
      addMeal: async (meal) => {
        const userId = getUserId(get());
        const timestamp = new Date().toISOString();
        const nutrients = toNutrientsFromMeal(meal);
        const tempId = `temp-${Date.now()}`;
        const clientId = makeClientId('meal', { timestamp, name: meal.name, calories: meal.calories, protein: meal.protein });

        const optimisticMeal = {
          id: tempId,
          clientId,
          name: meal.name,
          calories: toNumber(meal.calories),
          protein: toNumber(meal.protein),
          calcium: toNumber(nutrients.calcium),
          iron: toNumber(nutrients.iron),
          folate: toNumber(nutrients.folate),
          vitaminD: toNumber(nutrients.vitaminD),
          nutrients,
          recipe: meal.recipe || {},
          timestamp,
          synced: false,
        };

        set((state) => ({
          dailyMeals: [...state.dailyMeals, optimisticMeal],
        }));

        if (!userId) {
          logEvent('meal_create_guest', { scene: 'store', status: 'success' });
          return { ok: true, id: tempId, guest: true };
        }

        try {
          const { data, error } = await supabase
            .from('meal_history')
            .insert(mapMealToDbInsert(optimisticMeal, userId))
            .select('*')
            .single();

          if (error) {
            set((state) => ({
              dailyMeals: state.dailyMeals.filter((m) => m.id !== tempId),
            }));
            logError('meal_create_fail', error, { scene: 'store', user_id: userId, status: 'fail' });
            return { ok: false, errorCode: error.code || 'MEAL_CREATE_FAILED' };
          }

          set((state) => ({
            dailyMeals: state.dailyMeals.map((m) => (m.id === tempId ? mapMealRow(data) : m)),
          }));
          logEvent('meal_create_success', { scene: 'store', user_id: userId, status: 'success', meal_id: data.id });
          return { ok: true, id: data.id };
        } catch (error) {
          set((state) => ({
            dailyMeals: state.dailyMeals.filter((m) => m.id !== tempId),
          }));
          logError('meal_create_fail', error, { scene: 'store', user_id: userId, status: 'fail', error_code: 'MEAL_CREATE_FAILED' });
          return { ok: false, errorCode: 'MEAL_CREATE_FAILED' };
        }
      },
      removeMeal: async (mealId) => {
        const userId = getUserId(get());
        const removedMeal = get().dailyMeals.find((m) => m.id === mealId);
        if (!removedMeal) {
          return { ok: false, errorCode: 'MEAL_NOT_FOUND' };
        }

        set((state) => ({
          dailyMeals: state.dailyMeals.filter((m) => m.id !== mealId),
        }));

        if (!userId || String(mealId).startsWith('temp-')) {
          logEvent('meal_delete_guest', { scene: 'store', status: 'success', meal_id: mealId });
          return { ok: true, guest: !userId };
        }

        try {
          const { error } = await supabase.from('meal_history').delete().eq('id', mealId).eq('user_id', userId);
          if (error) {
            set((state) => ({
              dailyMeals: [removedMeal, ...state.dailyMeals].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
            }));
            logError('meal_delete_fail', error, { scene: 'store', user_id: userId, status: 'fail', meal_id: mealId });
            return { ok: false, errorCode: error.code || 'MEAL_DELETE_FAILED' };
          }
          logEvent('meal_delete_success', { scene: 'store', user_id: userId, status: 'success', meal_id: mealId });
          return { ok: true };
        } catch (error) {
          set((state) => ({
            dailyMeals: [removedMeal, ...state.dailyMeals].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
          }));
          logError('meal_delete_fail', error, { scene: 'store', user_id: userId, status: 'fail', meal_id: mealId, error_code: 'MEAL_DELETE_FAILED' });
          return { ok: false, errorCode: 'MEAL_DELETE_FAILED' };
        }
      },
      updateMeal: async (mealId, updates) => {
        const userId = getUserId(get());
        const oldMeal = get().dailyMeals.find((m) => m.id === mealId);
        if (!oldMeal) {
          return { ok: false, errorCode: 'MEAL_NOT_FOUND' };
        }

        const mergedMeal = { ...oldMeal, ...updates };
        set((state) => ({
          dailyMeals: state.dailyMeals.map((m) => (m.id === mealId ? mergedMeal : m)),
        }));

        const nutrients = toNutrientsFromMeal(mergedMeal);
        const payload = {
          name: mergedMeal.name,
          calories: toNumber(mergedMeal.calories),
          protein: toNumber(mergedMeal.protein),
          nutrients,
          recipe: mergedMeal.recipe || {},
          eaten_at: mergedMeal.timestamp,
        };

        if (!userId || String(mealId).startsWith('temp-')) {
          logEvent('meal_update_guest', { scene: 'store', status: 'success', meal_id: mealId });
          return { ok: true, guest: !userId };
        }

        try {
          const { data, error } = await supabase
            .from('meal_history')
            .update(payload)
            .eq('id', mealId)
            .eq('user_id', userId)
            .select('*')
            .single();

          if (error) {
            set((state) => ({
              dailyMeals: state.dailyMeals.map((m) => (m.id === mealId ? oldMeal : m)),
            }));
            logError('meal_update_fail', error, { scene: 'store', user_id: userId, status: 'fail', meal_id: mealId });
            return { ok: false, errorCode: error.code || 'MEAL_UPDATE_FAILED' };
          }

          set((state) => ({
            dailyMeals: state.dailyMeals.map((m) => (m.id === mealId ? mapMealRow(data) : m)),
          }));
          logEvent('meal_update_success', { scene: 'store', user_id: userId, status: 'success', meal_id: mealId });
          return { ok: true };
        } catch (error) {
          set((state) => ({
            dailyMeals: state.dailyMeals.map((m) => (m.id === mealId ? oldMeal : m)),
          }));
          logError('meal_update_fail', error, { scene: 'store', user_id: userId, status: 'fail', meal_id: mealId, error_code: 'MEAL_UPDATE_FAILED' });
          return { ok: false, errorCode: 'MEAL_UPDATE_FAILED' };
        }
      },
      clearHistory: () => set({ dailyMeals: [] }),
      hydrateFavorites: async () => {
        const userId = getUserId(get());
        if (!userId) {
          return { ok: true, guest: true };
        }

        try {
          const { data, error } = await supabase
            .from('favorites')
            .select('*, dish:dishes(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

          if (error) {
            logError('favorites_hydrate_fail', error, { scene: 'store', user_id: userId, status: 'fail' });
            return { ok: false, errorCode: error.code || 'FAVORITES_HYDRATE_FAILED' };
          }

          set({ favorites: (data || []).map(mapFavoriteRow) });
          return { ok: true };
        } catch (error) {
          logError('favorites_hydrate_fail', error, { scene: 'store', user_id: userId, status: 'fail', error_code: 'FAVORITES_HYDRATE_FAILED' });
          return { ok: false, errorCode: 'FAVORITES_HYDRATE_FAILED' };
        }
      },
      isRecipeFavorited: (recipe) => {
        const key = recipe?.suggestion || '';
        return get().favorites.some((f) => (f.recipe?.suggestion || f.title) === key);
      },
      toggleFavorite: async (recipe, options = {}) => {
        const userId = getUserId(get());
        const title = recipe?.suggestion || options.title || 'Recipe';
        const imageUrl = options.imageUrl || null;
        const tags = Array.isArray(options.tags) ? options.tags : [];
        const recipeKey = title;

        const existing = get().favorites.find((f) => (f.recipe?.suggestion || f.title) === recipeKey);
        if (existing) {
          set((state) => ({ favorites: state.favorites.filter((f) => f.id !== existing.id) }));
          if (!userId || String(existing.id).startsWith('temp-')) {
            return { ok: true, removed: true, guest: !userId };
          }
          try {
            const { error } = await supabase.from('favorites').delete().eq('id', existing.id).eq('user_id', userId);
            if (error) {
              set((state) => ({ favorites: [existing, ...state.favorites] }));
              logError('favorite_delete_fail', error, { scene: 'store', user_id: userId, status: 'fail' });
              return { ok: false, errorCode: error.code || 'FAVORITE_DELETE_FAILED' };
            }
            return { ok: true, removed: true };
          } catch (error) {
            set((state) => ({ favorites: [existing, ...state.favorites] }));
            logError('favorite_delete_fail', error, { scene: 'store', user_id: userId, status: 'fail', error_code: 'FAVORITE_DELETE_FAILED' });
            return { ok: false, errorCode: 'FAVORITE_DELETE_FAILED' };
          }
        }

        const tempId = `temp-${Date.now()}`;
        const clientId = makeClientId('fav', { title, tags });
        const optimistic = {
          id: tempId,
          dishId: null,
          title,
          imageUrl,
          tags,
          recipe,
          createdAt: new Date().toISOString(),
          synced: false,
          clientId,
        };

        set((state) => ({ favorites: [optimistic, ...state.favorites] }));

        if (!userId) {
          return { ok: true, guest: true, added: true };
        }

        try {
          const { data, error } = await supabase
            .from('favorites')
            .insert({
              user_id: userId,
              dish_id: null,
              title,
              image_url: imageUrl,
              tags,
              recipe,
              client_id: clientId,
            })
            .select('*, dish:dishes(*)')
            .single();

          if (error) {
            set((state) => ({ favorites: state.favorites.filter((f) => f.id !== tempId) }));
            logError('favorite_create_fail', error, { scene: 'store', user_id: userId, status: 'fail' });
            return { ok: false, errorCode: error.code || 'FAVORITE_CREATE_FAILED' };
          }

          const mapped = mapFavoriteRow(data);
          set((state) => ({ favorites: state.favorites.map((f) => (f.id === tempId ? mapped : f)) }));
          return { ok: true, added: true, id: data.id };
        } catch (error) {
          set((state) => ({ favorites: state.favorites.filter((f) => f.id !== tempId) }));
          logError('favorite_create_fail', error, { scene: 'store', user_id: userId, status: 'fail', error_code: 'FAVORITE_CREATE_FAILED' });
          return { ok: false, errorCode: 'FAVORITE_CREATE_FAILED' };
        }
      },
      syncPendingMeals: async () => {
        const userId = getUserId(get());
        if (!userId) return { ok: true, guest: true };

        const pending = get().dailyMeals.filter((m) => !m.synced && m.clientId);
        if (pending.length === 0) return { ok: true };

        const payload = pending.map((m) => mapMealToDbInsert(m, userId));
        try {
          const { data, error } = await supabase
            .from('meal_history')
            .upsert(payload, { onConflict: 'client_id' })
            .select('*');

          if (error) {
            logError('meal_sync_fail', error, { scene: 'store', user_id: userId, status: 'fail' });
            return { ok: false, errorCode: error.code || 'MEAL_SYNC_FAILED' };
          }

          const mappedByClient = new Map((data || []).map((row) => [row.client_id, mapMealRow(row)]));
          set((state) => ({
            dailyMeals: state.dailyMeals.map((m) => (mappedByClient.has(m.clientId) ? mappedByClient.get(m.clientId) : m)),
          }));
          return { ok: true };
        } catch (error) {
          logError('meal_sync_fail', error, { scene: 'store', user_id: userId, status: 'fail', error_code: 'MEAL_SYNC_FAILED' });
          return { ok: false, errorCode: 'MEAL_SYNC_FAILED' };
        }
      },
      hydrateFromSupabase: async () => {
        const userId = getUserId(get());
        if (!userId) {
          set({ isLoading: false });
          return { ok: false, errorCode: 'AUTH_REQUIRED' };
        }

        logEvent('history_hydrate_start', { scene: 'store', user_id: userId, status: 'start' });
        set({ isLoading: true });
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (profileError) {
            throw profileError;
          }

          const { data: preferences, error: preferencesError } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (preferencesError) {
            throw preferencesError;
          }

          await get().syncPendingMeals();

          const { data: meals, error: mealsError } = await supabase
            .from('meal_history')
            .select('*')
            .eq('user_id', userId)
            .order('eaten_at', { ascending: false });

          if (mealsError) {
            throw mealsError;
          }

          set((state) => ({
            accountProfile: profile || null,
            userProfile: preferences
              ? {
                  ...state.userProfile,
                  lifeStage: mapLifeStageFromDb(preferences.life_stage),
                  currentMood: preferences.mood_value ?? defaultUserProfile.currentMood,
                  dietaryIntents: mapDietaryIntentsFromDb(preferences.dietary_intents),
                  cravings: Array.isArray(preferences.craving_vibes) ? preferences.craving_vibes : [],
                  allergies: Array.isArray(preferences.allergies) ? preferences.allergies : [],
                  heightCm: preferences.height_cm ?? '',
                  weightKg: preferences.weight_kg ?? '',
                  healthGoals: Array.isArray(preferences.health_goals) ? preferences.health_goals : [],
                }
              : state.userProfile,
            dailyMeals: (meals || []).map(mapMealRow),
            isLoading: false,
          }));

          await get().hydrateFavorites();

          logEvent('history_hydrate_success', { scene: 'store', user_id: userId, status: 'success' });
          return { ok: true };
        } catch (error) {
          set({ isLoading: false });
          logError('history_hydrate_fail', error, { scene: 'store', user_id: userId, status: 'fail', error_code: error?.code || 'HYDRATE_FAILED' });
          return { ok: false, errorCode: error?.code || 'HYDRATE_FAILED' };
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        userProfile: state.userProfile,
        accountProfile: state.accountProfile,
        dailyMeals: state.dailyMeals,
        favorites: state.favorites,
        isDarkMode: state.isDarkMode,
      }),
    },
  ),
);
