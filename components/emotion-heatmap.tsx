"use client"

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts"

interface EmotionHeatmapProps {
  emotions: Record<string, number>
}

export function EmotionHeatmap({ emotions }: EmotionHeatmapProps) {
  // Transform emotions data for the radar chart
  const data = Object.entries(emotions).map(([name, value]) => ({
    emotion: name,
    value: value,
  }))

  return (
    <div className="w-full h-[250px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="emotion" tick={{ fill: "#888", fontSize: 10 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar name="Emotions" dataKey="value" stroke="#D7AA06" fill="#D7AA06" fillOpacity={0.6} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

