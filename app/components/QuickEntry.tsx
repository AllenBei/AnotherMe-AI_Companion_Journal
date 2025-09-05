/*
 * @Author: Allen Bei 870970821@qq.com
 * @Date: 2025-03-24 11:30:11
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-03-31 18:14:21
 * @FilePath: /AnotherMe_AI_Web/app/components/QuickEntry.tsx
 * @Description: ...
 */
import { ArrowRight } from "lucide-react"
import { useI18n } from '@/app/i18n'
import { useRouter } from 'next/navigation'

// 生成新的日记ID
const generateNewEntryId = () => {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

interface QuickEntryProps {
  isLoggedIn: boolean;
}

export function QuickEntry({ isLoggedIn }: QuickEntryProps) {
  const { t } = useI18n()
  const router = useRouter()

  const handleQuickEntry = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoggedIn) {
      router.push('/')
      return
    }
    router.push(`/entries/new?type=snippet`)
  }

  return (
    <section className="mb-4">
        <form onSubmit={handleQuickEntry} className="gradient-animate rounded-xl p-4 shadow-lg flex items-center justify-between cursor-pointer transform hover:scale-[1.01] transition-transform">
          <div
            onClick={handleQuickEntry}
            className="bg-transparent border-none outline-none text-white placeholder-white/70 w-full cursor-pointer"
          >
            {t('home.snippetPlaceholder')}
          </div>
          <button type="submit">
            <ArrowRight className="text-white w-5 h-5 animate-bounce-slow" />
          </button>
        </form>
    </section>
  )
} 