/*
 * @Author: Allen Bei
 * @Date: 2025-04-03 17:25:17
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-09-02 14:41:17
 * @FilePath: /AnotherMe-AI_Companion_Journal/app/components/EmptyRecord.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import { useI18n } from '@/app/i18n'
import {
  SmilePlus,
} from "lucide-react"

export function EmptyRecord() {
  const { t } = useI18n()
  // const canvasRef = useRef<HTMLCanvasElement>(null)

  // 绘制简单的卡通图形
  // useEffect(() => {
  //   const canvas = canvasRef.current
  //   if (!canvas) return

  //   const ctx = canvas.getContext('2d')
  //   if (!ctx) return

  //   // 清除画布
  //   ctx.clearRect(0, 0, canvas.width, canvas.height)

  //   // 绘制脸
  //   ctx.beginPath()
  //   ctx.arc(75, 75, 50, 0, Math.PI * 2)
  //   ctx.fillStyle = '#F8F3E2'
  //   ctx.fill()
  //   ctx.strokeStyle = '#CCCCCC'
  //   ctx.lineWidth = 2
  //   ctx.stroke()

  //   // 绘制眼睛
  //   ctx.beginPath()
  //   ctx.arc(55, 65, 7, 0, Math.PI * 2)
  //   ctx.arc(95, 65, 7, 0, Math.PI * 2)
  //   ctx.fillStyle = '#183861'
  //   ctx.fill()

  //   // 绘制眼睛高光
  //   ctx.beginPath()
  //   ctx.arc(58, 62, 2, 0, Math.PI * 2)
  //   ctx.arc(98, 62, 2, 0, Math.PI * 2)
  //   ctx.fillStyle = 'white'
  //   ctx.fill()

  //   // 绘制笑脸
  //   ctx.beginPath()
  //   ctx.arc(75, 85, 25, 0.2 * Math.PI, 0.8 * Math.PI)
  //   ctx.strokeStyle = '#183861'
  //   ctx.lineWidth = 2
  //   ctx.stroke()

  //   // 绘制眉毛
  //   ctx.beginPath()
  //   ctx.moveTo(45, 50)
  //   ctx.lineTo(65, 55)
  //   ctx.moveTo(105, 50)
  //   ctx.lineTo(85, 55)
  //   ctx.strokeStyle = '#183861'
  //   ctx.lineWidth = 2
  //   ctx.stroke()

  //   // 绘制腮红
  //   ctx.beginPath()
  //   ctx.arc(45, 80, 10, 0, Math.PI * 2)
  //   ctx.arc(105, 80, 10, 0, Math.PI * 2)
  //   ctx.fillStyle = 'rgba(255, 150, 150, 0.3)'
  //   ctx.fill()

  // }, [])

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* <canvas 
        ref={canvasRef} 
        width={150} 
        height={150} 
        className="mb-4"
      /> */}
      <div className={`rounded-full flex items-center justify-center my-4`}>
        {/* <SmilePlus className={`w-16 h-16 text-[#585a5a]`} /> */}
      </div>
      <p className="text-gray-500 text-center">
        {t('home.emptyRecord')}
      </p>
    </div>
  )
} 