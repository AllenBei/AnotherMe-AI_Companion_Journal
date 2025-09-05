"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { EmotionChart } from "@/components/emotion-chart"
import { EmotionHeatmap } from "@/components/emotion-heatmap"

// Mock emotions based on Plutchik's Wheel
const emotionCategories = ["Joy", "Trust", "Fear", "Surprise", "Sadness", "Disgust", "Anger", "Anticipation"]

// Mock function to analyze emotions
const analyzeEmotions = (text: string) => {
  // In a real app, this would call an AI model
  return new Promise<Record<string, number>>((resolve) => {
    setTimeout(() => {
      // Generate random emotion values that sum to 100
      const emotions: Record<string, number> = {}
      let remaining = 100

      emotionCategories.forEach((emotion, index) => {
        if (index === emotionCategories.length - 1) {
          emotions[emotion] = remaining
        } else {
          const value = Math.floor(Math.random() * remaining)
          emotions[emotion] = value
          remaining -= value
        }
      })

      resolve(emotions)
    }, 1500) // Simulate API delay
  })
}

export function EmotionAnalysis() {
  const [diaryText, setDiaryText] = useState(
    "Today was a mix of emotions. I felt excited about my upcoming project, but also a bit anxious about the deadline. The meeting with my team went well, and I'm looking forward to our collaboration. However, I'm still processing some disappointing news I received yesterday.",
  )
  const [emotions, setEmotions] = useState<Record<string, number> | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const result = await analyzeEmotions(diaryText)
      setEmotions(result)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white dark:bg-gray-800 shadow-md">
        <CardHeader>
          <CardTitle>Emotional Analysis</CardTitle>
          <CardDescription>Analyze your diary entries to understand your emotional patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your diary text here..."
            className="min-h-[150px] resize-none"
            value={diaryText}
            onChange={(e) => setDiaryText(e.target.value)}
          />
          <Button onClick={handleAnalyze} disabled={isAnalyzing || !diaryText.trim()} className="w-full">
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Emotions"
            )}
          </Button>
        </CardContent>
      </Card>

      {emotions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white dark:bg-gray-800 shadow-md">
            <CardHeader>
              <CardTitle>Emotion Breakdown</CardTitle>
              <CardDescription>Donut Chart</CardDescription>
            </CardHeader>
            <CardContent>
              <EmotionChart emotions={emotions} />
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-md">
            <CardHeader>
              <CardTitle>Emotion Intensity</CardTitle>
              <CardDescription>Radar Chart</CardDescription>
            </CardHeader>
            <CardContent>
              <EmotionHeatmap emotions={emotions} />
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-md md:col-span-2">
            <CardHeader>
              <CardTitle>Emotion Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(emotions)
                  .sort((a, b) => b[1] - a[1])
                  .map(([emotion, value]) => (
                    <div key={emotion} className="flex items-center">
                      <span className="w-24 text-sm">{emotion}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{
                            width: `${value}%`,
                            backgroundColor: getEmotionColor(emotion),
                          }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm">{value}%</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Helper function to get color for each emotion based on Plutchik's wheel
function getEmotionColor(emotion: string): string {
  const colors: Record<string, string> = {
    Joy: "#FFCC00", // Yellow
    Trust: "#33CC33", // Green
    Fear: "#33CC99", // Teal
    Surprise: "#3399FF", // Light Blue
    Sadness: "#3333CC", // Blue
    Disgust: "#9933CC", // Purple
    Anger: "#CC3333", // Red
    Anticipation: "#FF9933", // Orange
  }

  return colors[emotion] || "#075071" // Default to secondary color
}

