"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Sun, Moon, Zap, Code, ListChecks, Brain, MoreHorizontal } from "lucide-react"
import type { JSX } from "react/jsx-runtime"

interface Emotion {
  [key: string]: number
}

interface Entry {
  id: number
  date: string
  title: string
  content: string
  time: string
  emotions: Emotion
  summary: string
  icon: string
}

interface DiaryEntryProps {
  entry: Entry
}

export function DiaryEntry({ entry }: DiaryEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showEmotions, setShowEmotions] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("zh-CN", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const getIcon = (iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      sun: <Sun className="w-4 h-4" />,
      moon: <Moon className="w-4 h-4" />,
      zap: <Zap className="w-4 h-4" />,
      code: <Code className="w-4 h-4" />,
      "list-checks": <ListChecks className="w-4 h-4" />,
      brain: <Brain className="w-4 h-4" />,
    }
    return icons[iconName] || <Sun className="w-4 h-4" />
  }

  const getRandomGradient = () => {
    const gradients = [
      "bg-gradient-to-r from-pink-500 to-purple-500",
      "bg-gradient-to-r from-yellow-400 to-orange-500",
      "bg-gradient-to-r from-green-400 to-blue-500",
      "bg-gradient-to-r from-indigo-500 to-purple-600",
      "bg-gradient-to-r from-red-500 to-pink-500",
    ]
    return gradients[Math.floor(Math.random() * gradients.length)]
  }

  return (
    <motion.div whileHover={{ y: -5 }} className="bg-white rounded-lg shadow-sm overflow-hidden">
      <Link href={`/entries/${entry.id}`} className="block">
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-[#075071]/10 flex items-center justify-center text-[#075071] mr-2">
                {getIcon(entry.icon)}
              </div>
              <h3 className="font-medium text-[#075071]">{entry.title}</h3>
            </div>
            <span className="text-xs text-gray-500">{entry.time}</span>
          </div>

          <div className="text-sm text-gray-700 mb-4 line-clamp-4">{entry.content}</div>

          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">{formatDate(entry.date)}</span>
            <button className="text-gray-400 hover:text-[#D7AA06]">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

