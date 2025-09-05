/*
 * @Author: Allen Bei
 * @Date: 2025-03-07 07:28:46
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-05-20 16:52:21
 * @FilePath: /AnotherMe_AI_Web/components/habit-tracking.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
"use client"

// import { useTranslation } from 'react-i18next'; // Placeholder for i18n
import { FileText, TrendingUp, Keyboard } from "lucide-react"; // Added Keyboard icon
import { useI18n } from '@/app/i18n';
interface HabitTrackingProps {
  totalEntries: number;
  longestStreak: number;
  totalWordsWritten: number; // Added new prop
}

export function HabitTracking({ totalEntries, longestStreak, totalWordsWritten }: HabitTrackingProps) {

  const { t } = useI18n();

  const habitData = [
    {
      title: t("insights.habitTracking.totalEntries"),
      value: `${totalEntries}`, // Displaying raw number, could add "entries" suffix if needed via i18n
      icon: <FileText size={20} className="text-purple-500" />,
      bgColor: "bg-purple-100",
    },
    {
      title: t("insights.habitTracking.totalWordsWritten"),
      value: t("insights.habitTracking.words", { count: totalWordsWritten }),
      icon: <Keyboard size={20} className="text-green-500" />,
      bgColor: "bg-green-100",
    },
    {
      title: t("insights.habitTracking.longestStreak"),
      value: t("insights.habitTracking.days", { count: longestStreak }),
      icon: <TrendingUp size={20} className="text-blue-500" />,
      bgColor: "bg-blue-100",
    },
    // Example for Current Streak (if implemented later)
    // {
    //   title: t("insights.habitTracking.currentStreak"),
    //   value: t("insights.habitTracking.days", { count: currentStreakValue }),
    //   icon: <Zap size={20} className="text-yellow-500" />,
    //   bgColor: "bg-yellow-100",
    // },
  ];

  return (
    <div className="my-5">
      {/* <h2 className="text-2xl font-semibold text-dark mb-4">{t("insights.habitTracking.title")}</h2> */}
      <div className="flex flex-wrap gap-4">
        {habitData.map((item, index) => (
          <div key={index} className="bg-white p-5 rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.03)] flex items-center flex-1 min-w-[200px] sm:min-w-[240px]">
            <div className={`p-3 rounded-full mr-4 ${item.bgColor}`}>
              {item.icon}
            </div>
            <div>
              <p className="text-gray-500 text-sm">{item.title}</p>
              <p className="text-dark font-semibold text-xl">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

