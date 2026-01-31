import { Heart } from "lucide-react";

export function FavoritesView() {
  return (
    <div className="flex flex-col h-full bg-orange-50/30 dark:bg-neutral-950 overflow-y-auto pb-24">
      <div className="p-6 pt-12">
        <h1 className="text-3xl font-black text-foreground mb-2">我的收藏</h1>
        <p className="text-muted-foreground">这里将保存你喜欢的菜谱和推荐。</p>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <div className="w-24 h-24 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mb-4">
          <Heart className="w-10 h-10 text-orange-400" />
        </div>
        <p className="text-lg font-medium">还没有收藏内容</p>
        <p className="text-sm mt-2">看到喜欢的菜谱，记得点亮爱心哦！</p>
      </div>
    </div>
  );
}
