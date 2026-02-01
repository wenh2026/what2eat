export async function onRequestPost() {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return Response.json({
    ingredients: ["鸡蛋", "西红柿", "青椒", "剩米饭"],
    recommendations: [
      {
        name: "黄金蛋炒饭",
        desc: "隔夜饭的华丽转身，金黄诱人，粒粒分明。",
        reason: "看你有剩米饭和鸡蛋，这是最快手又好吃的选择！",
      },
      {
        name: "西红柿炒鸡蛋",
        desc: "国民神菜，酸甜可口，拌饭一绝。",
        reason: "经典的红黄搭配，营养均衡又下饭。",
      },
    ],
  });
}

