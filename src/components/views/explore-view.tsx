"use client";

import { Leaf, MapPin, CloudSun, Calendar } from "lucide-react";

export function ExploreView() {
  const currentSeason = "立春"; // Mock data
  const currentRegion = "江南"; // Mock data
  
  const recommendations = [
    { name: "春笋", benefit: "鲜嫩爽口，通便排毒", dishes: ["油焖笋", "腌笃鲜"] },
    { name: "荠菜", benefit: "护肝明目，补钙", dishes: ["荠菜豆腐羹", "荠菜鲜肉馄饨"] },
    { name: "河蚌", benefit: "滋阴清热", dishes: ["咸肉河蚌豆腐汤"] },
  ];

  return (
    <div className="h-full flex flex-col gap-6 px-4 py-6 pb-24 overflow-y-auto">
      <header className="space-y-4">
        <h1 className="text-2xl font-black">发现 · 时令</h1>
        
        {/* Hero Card */}
        <div className="w-full bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-100 dark:border-green-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Leaf className="w-24 h-24 text-green-600 dark:text-green-400" />
            </div>
            
            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                <CloudSun className="w-5 h-5" />
                <span className="font-bold text-sm">今日节气</span>
            </div>
            
            <div className="flex items-baseline gap-3 mb-2">
                <h2 className="text-4xl font-black text-green-900 dark:text-green-100">{currentSeason}</h2>
                <span className="text-sm font-normal text-green-700 dark:text-green-300 flex items-center gap-1 bg-white/50 dark:bg-black/30 px-2 py-1 rounded-full">
                    <MapPin className="w-3 h-3" /> {currentRegion}
                </span>
            </div>
            
            <p className="text-green-800/80 dark:text-green-200/80 text-sm leading-relaxed max-w-[80%]">
                “阳和起蛰，品物皆春。” 此时节应多吃升发阳气的食物。
            </p>
        </div>
      </header>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> 
            当季推荐
            </h3>
        </div>
        
        <div className="grid gap-4">
          {recommendations.map((item) => (
            <div key={item.name} className="bg-card p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-lg text-foreground">{item.name}</h4>
                <span className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">{item.benefit}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.dishes.map(dish => (
                  <span key={dish} className="text-xs bg-secondary/30 px-2.5 py-1 rounded-md text-muted-foreground border border-border">
                    {dish}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/10 p-5 rounded-2xl border border-orange-100 dark:border-orange-900/50">
          <h4 className="font-bold text-orange-800 dark:text-orange-300 mb-2 text-sm flex items-center gap-2">
            💡 饮食小贴士
          </h4>
          <p className="text-sm text-orange-700/80 dark:text-orange-200/80 leading-relaxed">
            春季肝气旺盛，宜少吃酸，多吃甘味食物以养脾气。建议多食红枣、蜂蜜、山药。
          </p>
        </div>
      </div>
    </div>
  );
}
