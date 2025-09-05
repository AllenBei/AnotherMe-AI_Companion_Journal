"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface YearSelectorProps {
  selectedYear: string
  onSelectYear: (year: string) => void
}

export function YearSelector({ selectedYear, onSelectYear }: YearSelectorProps) {
  const years = ["2025", "2024", "2023", "2022"]
  const animals = ["tiger", "rabbit", "dragon", "snake"]
  const colors = ["#F6B352", "#9ED2BE", "#E57C73", "#8D9EFF"]

  // 计算今年已经过去的百分比
  const calculateYearProgress = () => {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1)
    const yearTotal = endOfYear.getTime() - startOfYear.getTime()
    const yearElapsed = now.getTime() - startOfYear.getTime()
    return Math.floor((yearElapsed / yearTotal) * 100)
  }

  const [yearProgress, setYearProgress] = useState(calculateYearProgress())
  const [animatingYear, setAnimatingYear] = useState<string | null>(null)

  useEffect(() => {
    setYearProgress(calculateYearProgress())
  }, [])

  const getAnimalEmoji = (animal: string) => {
    const animals: Record<string, string> = {
      tiger: "🐯",
      rabbit: "🐰",
      dragon: "🐲",
      snake: "🐍",
    }
    return animals[animal] || "📓"
  }

  const handleYearSelect = (year: string) => {
    // 设置正在动画的年份
    setAnimatingYear(year)

    // 简单的放大效果后导航
    setTimeout(() => {
      onSelectYear(year)
      setAnimatingYear(null)
    }, 500)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 relative">
      {years.map((year, index) => (
        <motion.div
          key={year}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          animate={animatingYear === year ? { scale: 1.2, opacity: 0.8 } : {}}
          transition={{ duration: 0.5 }}
          className={`cursor-pointer rounded-lg shadow-md overflow-hidden border-2 ${
            selectedYear === year ? "border-[#D7AA06]" : "border-transparent"
          }`}
          onClick={() => handleYearSelect(year)}
        >
          {/* 笔记本封面 */}
          <div
            className="w-full aspect-[2/3] relative flex"
            style={{
              backgroundColor: colors[index],
            }}
          >
            {/* 笔记本缝线效果 - 现在延伸到整个左边框 */}
            <div className="absolute left-0 top-0 bottom-0 w-6 flex flex-col justify-between py-4 before:content-[''] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-full before:bg-black/10">
              <div className="relative z-10 space-y-2">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="h-[3px] w-[12px] bg-white/50 rounded-full ml-2"></div>
                ))}
              </div>
            </div>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-6xl mb-4">{getAnimalEmoji(animals[index])}</div>
              <div className="text-3xl font-bold text-white mb-4">{year}</div>

              {/* 只为当前年份显示进度条 */}
              {year === new Date().getFullYear().toString() && (
                <>
                  <div className="w-3/4 bg-white/30 rounded-full h-3 mb-1">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${yearProgress}%` }}
                      transition={{ duration: 1 }}
                      className="bg-white h-3 rounded-full"
                    />
                  </div>
                  <div className="text-sm text-white">{yearProgress}% 已过去</div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

