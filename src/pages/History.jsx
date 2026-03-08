import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, X, Edit2, Check, Trash2 } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import { RDA_DATA, calculateNutrientDeviation, getAIInsight, filterMealsByWindow } from '../logic/dietaryGuidelines';
import { useHeaderMotion } from '../lib/useHeaderMotion';

const CalorieDashboard = ({ deviation, dailyMeals, userProfile, timeWindow, selectedDate }) => {
  const { t } = useTranslation();

  // 1. Calculate Score
  const scores = Object.values(deviation).map(v => Math.abs(v));
  const avgDeviation = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  const healthScore = Math.max(0, Math.round(100 - avgDeviation));
  
  // 2. Calculate Actual Calories vs Target
  // Use filterMealsByWindow logic to get consistent calorie data
  const filteredMeals = useMemo(() => {
     return filterMealsByWindow(dailyMeals, timeWindow === 'week' ? 'week' : 'date', timeWindow === 'week' ? undefined : selectedDate);
  }, [dailyMeals, timeWindow, selectedDate]);

  const totalCalories = filteredMeals.reduce((sum, m) => sum + (Number(m.calories) || 0), 0);

  const lifeStage = userProfile.lifeStage || 'adult';
  const targetData = RDA_DATA[lifeStage] || RDA_DATA.adult;
  const targetCalories = targetData.calories; // e.g. 2000
  
  // For week view, we want Average Daily Calories
  const displayCalories = timeWindow === 'week' 
    ? Math.round(totalCalories / 7) 
    : Math.round(totalCalories);

  // Visuals
  const percentage = Math.min(100, Math.max(0, (displayCalories / targetCalories) * 100));
  const isOver = displayCalories > targetCalories;
  
  // Circle config
  const size = 220;
  const strokeWidth = 15;
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center justify-center py-6">
      <div className="relative size-[220px] flex items-center justify-center">
        {/* Background Circle */}
        <svg className="size-full transform -rotate-90">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-100 dark:text-gray-800"
          />
          {/* Progress Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={isOver ? '#ef4444' : '#22c55e'} // Red if over, Green if under/target
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center">
             <span className="text-xs font-bold text-muted-ui uppercase tracking-wider mb-1">
               {timeWindow === 'week' ? t('history_average_calories', { defaultValue: 'Avg Calories' }) : t('recipe_calories')}
             </span>
             <span className="text-4xl font-extrabold text-deep-charcoal dark:text-off-white">
               {displayCalories}
             </span>
             <span className="text-xs font-medium text-gray-400 mt-1">
               / {targetCalories} {t('history_kcal_unit')}
             </span>
          </div>
        </div>
        
        {/* Score Badge (Floating) */}
        <div className="absolute -bottom-2 bg-white dark:bg-gray-800 shadow-md border border-gray-100 dark:border-gray-700 rounded-full px-4 py-1 flex items-center gap-2">
           <div className={`w-2 h-2 rounded-full ${healthScore > 80 ? 'bg-green-500' : healthScore > 50 ? 'bg-orange-500' : 'bg-red-500'}`}></div>
           <span className="text-sm font-bold text-deep-charcoal dark:text-off-white">
             {healthScore} <span className="text-[10px] text-muted-ui font-normal">{t('history_health_score')}</span>
           </span>
        </div>
      </div>
      
      {/* Summary Text */}
      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6 max-w-xs mx-auto">
        {isOver 
          ? t('history_status_over', { defaultValue: 'You are over your daily calorie limit.' }) 
          : t('history_status_good', { defaultValue: 'You are doing great with your calorie intake.' })
        }
      </p>
    </div>
  );
};

const WeeklyTrendChart = ({ dailyMeals }) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US';
  
  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    return days;
  }, []);

  const chartData = useMemo(() => {
    return last7Days.map(day => {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
      const dayEnd = dayStart + 86400000;
      
      const cals = dailyMeals
        .filter(m => {
          const t = new Date(m.timestamp).getTime();
          return t >= dayStart && t < dayEnd;
        })
        .reduce((sum, m) => sum + (Number(m.calories) || 0), 0);
        
      return {
        dayName: day.toLocaleDateString(locale, { weekday: 'narrow' }),
        calories: cals,
        date: day.getDate()
      };
    });
  }, [dailyMeals, last7Days, locale]);

  const maxCals = Math.max(...chartData.map(d => d.calories), 2000); // Minimum scale 2000 to avoid huge bars for small meals

  return (
    <div className="surface-card rounded-3xl p-6 shadow-sm border mb-6 transition-colors">
      <h2 className="text-lg font-bold mb-4 dark:text-off-white">{t('history_weekly_trend')}</h2>
      <div className="flex items-end justify-between h-32 gap-2">
        {chartData.map((d, i) => {
          const heightPct = Math.min(100, (d.calories / maxCals) * 100);
          const isToday = i === 6;
          
          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
              <div className="w-full relative flex items-end h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                <div 
                  className={`w-full transition-all duration-500 ease-out ${isToday ? 'bg-primary' : 'bg-primary/40'}`}
                  style={{ height: `${heightPct}%` }}
                ></div>
                {/* Tooltip */}
                <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-[10px] text-center py-1">
                  {d.calories}
                </div>
              </div>
              <span className={`text-xs font-medium ${isToday ? 'text-primary font-bold' : 'text-gray-400'}`}>
                {d.dayName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CalendarView = ({ currentDate, onDateSelect, dailyMeals }) => {
  const { t, i18n } = useTranslation();
  const [viewDate, setViewDate] = useState(new Date(currentDate));
  const locale = i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US';

  // Sync viewDate when currentDate changes
  React.useEffect(() => { setViewDate(new Date(currentDate)); }, [currentDate]);

  const daysInMonth = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Add padding for previous month days to align grid
    const startDay = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [viewDate]);

  // Calculate health score for a specific date to determine dot color
  const getDateStatus = (date) => {
    if (!date) return null;
    
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayEnd = dayStart + 86400000;
    
    const mealsForDay = dailyMeals.filter(meal => {
      const t = new Date(meal.timestamp).getTime();
      return t >= dayStart && t < dayEnd;
    });

    if (mealsForDay.length === 0) return null;

    // Calculate deviation for this day
    // We can reuse the logic but need to be careful not to trigger infinite loops or heavy calc
    // Simplified score logic for the dot:
    // Just check calories and maybe protein balance roughly
    
    // Rough check: if calories are within 1200-2500 (very rough), it's okay? 
    // Or better, let's use the actual calculation if possible, or just color based on "logged" for now
    // Let's do a simple calorie check against a standard 2000 for now, 
    // or if we have access to RDA, use that.
    
    // We can use a simple heuristic for the dot color:
    // Green: Meals logged
    // We could make it more complex later.
    
    return 'logged';
  };
  
  const isSelected = (date) => {
    if (!date) return false;
    return date.getDate() === currentDate.getDate() &&
           date.getMonth() === currentDate.getMonth() &&
           date.getFullYear() === currentDate.getFullYear();
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const nextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };
  
  const goToToday = () => {
    const today = new Date();
    setViewDate(today);
    onDateSelect(today);
  };

  const weekDays = useMemo(() => {
    const base = new Date(2024, 0, 7);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return new Intl.DateTimeFormat(locale, { weekday: 'narrow' }).format(d);
    });
  }, [locale]);

  return (
    <div className="surface-card rounded-3xl p-6 shadow-sm border mb-6 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold dark:text-off-white capitalize">
          {new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(viewDate)}
        </h2>
        <div className="flex gap-2 items-center">
          <button 
            onClick={goToToday}
            className="text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded-md transition-colors mr-1"
          >
            {t('history_calendar_today', { defaultValue: 'Today' })}
          </button>
          <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft size={20} className="text-deep-charcoal dark:text-off-white" />
          </button>
          <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronRight size={20} className="text-deep-charcoal dark:text-off-white" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map((d, index) => (
          <div key={`${d}-${index}`} className="text-xs font-medium text-muted-ui">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {daysInMonth.map((date, i) => {
           const status = getDateStatus(date);
           return (
          <div key={i} className="aspect-square flex items-center justify-center relative">
            {date && (
              <button
                onClick={() => onDateSelect(date)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all relative
                  ${isSelected(date) 
                    ? 'bg-primary text-white font-bold shadow-md' 
                    : isToday(date)
                      ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-off-white text-deep-charcoal'
                  }
                `}
              >
                {date.getDate()}
                {status === 'logged' && !isSelected(date) && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-green-500"></div>
                )}
              </button>
            )}
          </div>
        )})}
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-ui">
          <div className="flex items-center gap-1">
             <div className="w-2 h-2 rounded-full bg-green-500"></div>
             <span>{t('history_calendar_logged', { defaultValue: 'Logged' })}</span>
          </div>
      </div>
    </div>
  );
};

const MealItem = ({ meal, onDelete, onUpdate }) => {
  const { t, i18n } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editValues, setEditValues] = useState({
    name: meal.name,
    calories: meal.calories,
    protein: meal.protein,
  });

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    const locale = i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const result = await onUpdate(meal.id, {
      ...meal,
      name: editValues.name,
      calories: Number(editValues.calories),
      protein: Number(editValues.protein),
      nutrients: {
        ...meal.nutrients,
        calories: Number(editValues.calories),
        protein: Number(editValues.protein)
      }
    });
    setIsSubmitting(false);
    if (result?.ok) {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="surface-card p-4 rounded-2xl border shadow-sm transition-colors space-y-3">
        <div className="flex flex-col gap-2">
           <input 
             type="text" 
             value={editValues.name}
             onChange={(e) => setEditValues({...editValues, name: e.target.value})}
             className="w-full bg-gray-50 dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm font-bold text-deep-charcoal dark:text-off-white focus:outline-none focus:ring-2 focus:ring-primary/50"
             placeholder={t('history_edit_name', { defaultValue: 'Meal Name' })}
           />
           <div className="flex gap-2">
             <div className="flex-1">
               <label className="text-[10px] text-muted-ui uppercase font-bold pl-1">{t('recipe_calories')}</label>
               <input 
                 type="number" 
                 value={editValues.calories}
                 onChange={(e) => setEditValues({...editValues, calories: e.target.value})}
                 className="w-full bg-gray-50 dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm text-deep-charcoal dark:text-off-white focus:outline-none focus:ring-2 focus:ring-primary/50"
               />
             </div>
             <div className="flex-1">
               <label className="text-[10px] text-muted-ui uppercase font-bold pl-1">{t('recipe_protein')}</label>
               <input 
                 type="number" 
                 value={editValues.protein}
                 onChange={(e) => setEditValues({...editValues, protein: e.target.value})}
                 className="w-full bg-gray-50 dark:bg-gray-800 border rounded-lg px-3 py-2 text-sm text-deep-charcoal dark:text-off-white focus:outline-none focus:ring-2 focus:ring-primary/50"
               />
             </div>
           </div>
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button 
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {t('common_cancel', { defaultValue: 'Cancel' })}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-primary hover:bg-primary-dark transition-colors flex items-center gap-1 disabled:opacity-70"
          >
            <Check size={14} />
            {isSubmitting ? t('history_saving', { defaultValue: 'Saving...' }) : t('common_save', { defaultValue: 'Save' })}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card p-4 rounded-2xl border flex items-center justify-between shadow-sm transition-colors group">
      <div className="flex items-center gap-4">
        <div className="size-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary shrink-0 transition-colors">
          <span className="material-symbols-outlined">restaurant</span>
        </div>
        <div>
          <h4 className="font-bold text-sm text-deep-charcoal dark:text-off-white">{meal.name}</h4>
          <p className="text-xs text-muted-ui">{formatDate(meal.timestamp)}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-xs font-bold bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full transition-colors">
          {meal.calories} {t('history_kcal_unit')}
        </span>
        <div className="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setIsEditing(true)}
            className="text-gray-400 hover:text-primary transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={async () => {
              if(window.confirm(t('history_confirm_delete'))) {
                await onDelete(meal.id);
              }
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

const History = () => {
  const { t, i18n } = useTranslation();
  const { dailyMeals, userProfile, removeMeal, updateMeal } = useUserStore();
  const { isHeaderCompact, isHeaderHidden } = useHeaderMotion({ hideAt: 100 });
  const [timeWindow, setTimeWindow] = useState('today'); // 'today' | 'week'
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  
  const deviation = useMemo(() => 
    calculateNutrientDeviation(dailyMeals, userProfile, showCalendar ? 'date' : timeWindow, selectedDate), 
  [dailyMeals, userProfile, timeWindow, showCalendar, selectedDate]);
  
  const insight = useMemo(() => getAIInsight(deviation, t), [deviation, t]);

  // Filter and sort meals
  const sortedMeals = useMemo(() => {
    const filtered = filterMealsByWindow(dailyMeals, showCalendar ? 'date' : timeWindow, selectedDate);
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [dailyMeals, timeWindow, showCalendar, selectedDate]);

  const handleDeleteMeal = async (mealId) => {
    const result = await removeMeal(mealId);
    if (result?.ok) {
      setFeedback({ type: 'success', message: t('history_delete_success') });
      return;
    }
    setFeedback({ type: 'error', message: t('history_delete_failed') });
  };

  const handleUpdateMeal = async (mealId, updates) => {
    const result = await updateMeal(mealId, updates);
    if (result?.ok) {
      setFeedback({ type: 'success', message: t('history_update_success') });
      return result;
    }
    setFeedback({ type: 'error', message: t('history_update_failed') });
    return result;
  };

  return (
    <div className="surface-page font-display min-h-screen pb-24 p-6 transition-colors duration-200">
      <header
        className={`surface-nav sticky top-0 z-30 flex items-center justify-between -mx-6 px-6 mb-6 border-b transition-[transform,padding,box-shadow,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isHeaderCompact ? 'shadow-sm' : ''}`}
        style={{
          paddingTop: `calc(env(safe-area-inset-top, 0px) + ${isHeaderCompact ? '0.5rem' : '1.5rem'})`,
          paddingBottom: isHeaderCompact ? '0.65rem' : '1rem',
          transform: isHeaderHidden ? 'translateY(-100%)' : 'translateY(0)',
          opacity: isHeaderHidden ? 0.98 : 1,
          willChange: 'transform'
        }}
      >
        <h1 className={`font-bold text-deep-charcoal dark:text-off-white transition-all duration-300 ${isHeaderCompact ? 'text-xl' : 'text-2xl'}`}>{t('history_title')}</h1>
        <button 
          onClick={() => setShowCalendar(!showCalendar)}
          className={`surface-card rounded-full border flex items-center justify-center transition-all duration-300 ${isHeaderCompact ? 'size-9' : 'size-10'} ${showCalendar ? 'bg-primary text-white border-primary' : ''}`}
        >
          {showCalendar ? (
            <X size={isHeaderCompact ? 20 : 24} />
          ) : (
            <span className={`material-symbols-outlined text-muted-ui transition-all duration-300 ${isHeaderCompact ? 'text-[20px]' : 'text-[24px]'}`}>calendar_today</span>
          )}
        </button>
      </header>

      {/* Time Window Toggle */}
      {!showCalendar && (
        <div className="flex justify-center mb-6">
          <div className="surface-card p-1 rounded-full border inline-flex relative">
            <button
              onClick={() => setTimeWindow('today')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all z-10 ${
                timeWindow === 'today' ? 'text-white' : 'text-muted-ui hover:text-deep-charcoal dark:hover:text-off-white'
              }`}
            >
              {t('history_toggle_today')}
            </button>
            <button
              onClick={() => setTimeWindow('week')}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all z-10 ${
                timeWindow === 'week' ? 'text-white' : 'text-muted-ui hover:text-deep-charcoal dark:hover:text-off-white'
              }`}
            >
              {t('history_toggle_week')}
            </button>
            <div 
              className="absolute top-1 bottom-1 bg-primary rounded-full transition-all duration-300 ease-spring"
              style={{
                left: timeWindow === 'today' ? '4px' : '50%',
                width: 'calc(50% - 4px)'
              }}
            ></div>
          </div>
        </div>
      )}

      {feedback.message ? (
        <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${
          feedback.type === 'success'
            ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-300'
            : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300'
        }`}>
          {feedback.message}
        </div>
      ) : null}

      {/* Visualization */}
      <section className="surface-card rounded-3xl p-6 shadow-sm border mb-6 transition-colors">
        <h2 className="text-lg font-bold mb-2 dark:text-off-white">
          {showCalendar
            ? `${new Intl.DateTimeFormat(i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' }).format(selectedDate)} ${t('history_nutrient_balance')}`
            : t('history_nutrient_balance')
          }
        </h2>
        <CalorieDashboard deviation={deviation} dailyMeals={dailyMeals} userProfile={userProfile} timeWindow={showCalendar ? 'date' : timeWindow} selectedDate={selectedDate} />
      </section>

      {/* Weekly Trend or Calendar */}
      {showCalendar ? (
        <CalendarView 
          currentDate={selectedDate} 
          onDateSelect={setSelectedDate} 
          dailyMeals={dailyMeals}
        />
      ) : (
        <WeeklyTrendChart dailyMeals={dailyMeals} />
      )}

      {/* AI Insight */}
      <section className="bg-primary/5 dark:bg-primary/20 rounded-2xl p-5 border border-primary/10 dark:border-primary/30 mb-8 flex gap-4 transition-colors">
        <div className="size-10 rounded-full bg-primary flex items-center justify-center shrink-0 text-white shadow-sm">
          <span className="material-symbols-outlined">auto_awesome</span>
        </div>
        <div>
          <h3 className="font-bold text-primary text-sm mb-1">{t('history_ai_insight')}</h3>
          <p className="text-sm text-deep-charcoal/80 dark:text-off-white/80 leading-relaxed">
            {insight}
          </p>
        </div>
      </section>

      {/* Meal History List */}
      <section className="space-y-4 mb-8">
        <h2 className="text-lg font-bold dark:text-off-white">{t('history_recent_meals')}</h2>
        {sortedMeals.length === 0 ? (
           <div className="surface-card text-center py-10 text-muted-ui text-sm rounded-2xl border border-dashed transition-colors">
            {showCalendar ? t('history_no_meals_selected_date') : (timeWindow === 'today' ? t('history_no_meals_today') : t('history_no_meals_week'))}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMeals.map((meal) => (
              <MealItem 
                key={meal.id} 
                meal={meal} 
                onDelete={handleDeleteMeal}
                onUpdate={handleUpdateMeal}
              />
            ))}
          </div>
        )}
      </section>

      {/* Stats Breakdown */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold dark:text-off-white">{t('history_nutrient_breakdown')}</h2>
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(deviation).map(([nutrient, val]) => {
            const isDeficient = val < -10;
            const isExcess = val > 10;
            const isBalanced = !isDeficient && !isExcess;
            
            return (
              <div key={nutrient} className="surface-card p-4 rounded-2xl border flex flex-col gap-2 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-medium text-sm dark:text-off-white">{t(`history_nutrient_${nutrient}`, { defaultValue: nutrient.replace(/([A-Z])/g, ' $1').trim() })}</span>
                    {isBalanced && <span className="material-symbols-outlined text-green-500 text-sm">check_circle</span>}
                  </div>
                  <span className={`text-sm font-bold ${isDeficient ? 'text-orange-500' : isExcess ? 'text-red-500' : 'text-green-500'}`}>
                     {val > 0 ? '+' : ''}{val.toFixed(0)}%
                  </span>
                </div>
                
                {/* Progress Bar Container */}
                <div className="relative h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden w-full">
                  {/* Center Marker (0% deviation / 100% target) */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-500 z-10"></div>
                  
                  {/* Bar */}
                  <div 
                    className={`absolute top-0 bottom-0 rounded-full transition-all duration-500 ${
                      isDeficient ? 'bg-orange-400' : isExcess ? 'bg-red-400' : 'bg-green-500'
                    }`}
                    style={{
                      left: '50%',
                      width: `${Math.min(50, Math.abs(val) / 2)}%`, // Scale: 100% deviation = full half width
                      transform: val < 0 ? 'translateX(-100%)' : 'none'
                    }}
                  ></div>
                </div>
                
                <div className="flex justify-between text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                  <span>{t('history_under')}</span>
                  <span>{t('history_optimal')}</span>
                  <span>{t('history_over')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default History;
