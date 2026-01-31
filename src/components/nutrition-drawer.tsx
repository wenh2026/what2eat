"use client";

import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Activity, Flame, Utensils } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function NutritionDrawer() {
  // Mock data based on Chinese DRIs (approximate)
  const data = [
    { name: '热量', current: 1450, target: 2000, unit: 'kcal' },
    { name: '蛋白质', current: 45, target: 60, unit: 'g' },
    { name: '脂肪', current: 50, target: 60, unit: 'g' },
    { name: '碳水', current: 200, target: 300, unit: 'g' },
  ];

  return (
    <div className="h-full flex flex-col gap-6">
      <SheetHeader>
        <div className="flex items-center gap-2 text-primary mb-2">
          <Activity className="w-5 h-5" />
          <span className="font-bold">健康 · 档案</span>
        </div>
        <SheetTitle className="text-3xl font-black text-left">
          今日摄入
        </SheetTitle>
        <SheetDescription className="text-left">
          基于《中国居民膳食指南》推荐标准
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto space-y-8 pr-2">
        {/* Main Chart */}
        <div className="bg-card rounded-xl border p-4 shadow-sm">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
            <Flame className="w-4 h-4 text-orange-500" />
            营养达标率
          </h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={50} tick={{fontSize: 12}} />
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
                <Bar dataKey="current" radius={[0, 4, 4, 0]} background={{ fill: '#eee', radius: [0, 4, 4, 0] }}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.current > entry.target ? '#ef4444' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Meals */}
        <div>
          <h3 className="font-bold mb-4 flex items-center gap-2 text-sm">
            <Utensils className="w-4 h-4 text-primary" />
            最近记录
          </h3>
          <div className="space-y-3">
            {[
              { time: "午餐", food: "番茄炒蛋盖浇饭", cal: 650 },
              { time: "早餐", food: "全麦面包 + 牛奶", cal: 350 },
              { time: "加餐", food: "苹果 x 1", cal: 80 },
            ].map((meal, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-secondary/10 rounded-lg">
                <div>
                  <p className="font-medium text-sm">{meal.food}</p>
                  <p className="text-xs text-muted-foreground">{meal.time}</p>
                </div>
                <span className="font-mono text-sm font-bold text-primary">
                  {meal.cal} <span className="text-xs font-normal text-muted-foreground">kcal</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
