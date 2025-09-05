import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface EmotionChartProps {
  emotions: Record<string, number>
}

export function EmotionChart({ emotions }: EmotionChartProps) {
  // Transform emotions data for the chart
  const data = Object.entries(emotions).map(([name, value]) => ({
    name,
    value,
  }))

  // Colors for each emotion based on Plutchik's wheel
  const COLORS = [
    "#FFCC00", // Joy (Yellow)
    "#33CC33", // Trust (Green)
    "#33CC99", // Fear (Teal)
    "#3399FF", // Surprise (Light Blue)
    "#3333CC", // Sadness (Blue)
    "#9933CC", // Disgust (Purple)
    "#CC3333", // Anger (Red)
    "#FF9933", // Anticipation (Orange)
  ]

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            innerRadius={40}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => [`${value}%`, "Intensity"]} />
          <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={10} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

