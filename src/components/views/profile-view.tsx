"use client";

import { useState, useEffect } from "react";
import { Activity, Flame, Utensils, Settings, LogOut, User as UserIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export function ProfileView() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) return;
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Mock data
  const data = [
    { name: '热量', current: 1450, target: 2000, unit: 'kcal' },
    { name: '蛋白质', current: 45, target: 60, unit: 'g' },
    { name: '脂肪', current: 50, target: 60, unit: 'g' },
    { name: '碳水', current: 200, target: 300, unit: 'g' },
  ];

  return (
    <div className="h-full flex flex-col gap-6 px-4 py-6 pb-24 overflow-y-auto">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black">我的健康日志</h1>
          <p className="text-sm text-muted-foreground">
            {user ? `欢迎回来，${user.email?.split('@')[0]}` : '记录每一次健康饮食'}
          </p>
        </div>
        {user && (
           <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
               <UserIcon className="w-4 h-4" />
             </div>
           </div>
        )}
      </header>

      {/* Main Chart */}
      <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
          <Flame className="w-4 h-4 text-orange-500" />
          今日营养达标率
        </h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={50} tick={{fontSize: 12, fill: 'currentColor'}} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    return (
                      <div className="bg-popover border text-popover-foreground p-2 rounded shadow-lg text-xs">
                        <p className="font-bold">{d.name}</p>
                        <p>摄入: {d.current}{d.unit}</p>
                        <p>目标: {d.target}{d.unit}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="current" radius={[0, 4, 4, 0]} background={{ fill: 'var(--muted)' }}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.current > entry.target ? '#ef4444' : '#f97316'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Meals */}
      <div className="space-y-4">
        <h3 className="font-bold flex items-center gap-2 text-sm">
          <Utensils className="w-4 h-4 text-primary" />
          最近记录
        </h3>
        <div className="space-y-3">
          {[
            { time: "午餐", food: "番茄炒蛋盖浇饭", cal: 650 },
            { time: "早餐", food: "全麦面包 + 牛奶", cal: 350 },
            { time: "加餐", food: "苹果 x 1", cal: 80 },
          ].map((meal, i) => (
            <div key={i} className="flex justify-between items-center p-4 bg-card rounded-xl border border-border shadow-sm">
              <div>
                <p className="font-bold text-sm text-foreground">{meal.food}</p>
                <p className="text-xs text-muted-foreground">{meal.time}</p>
              </div>
              <span className="font-mono text-sm font-bold text-primary">
                {meal.cal} <span className="text-xs font-normal text-muted-foreground">kcal</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="mt-4 space-y-3">
        <button className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/30 rounded-lg">
                    <Settings className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="font-medium">偏好设置</span>
            </div>
        </button>

        {user && (
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-border shadow-sm text-red-600 dark:text-red-400"
          >
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
                      <LogOut className="w-5 h-5" />
                  </div>
                  <span className="font-medium">退出登录</span>
              </div>
          </button>
        )}
      </div>
    </div>
  );
}
