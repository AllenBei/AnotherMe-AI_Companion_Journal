import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
// import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useI18n } from '@/app/i18n'
import { UserMenu } from '@/components/user-menu'
import { useUser } from '@/components/UserProvider'
import SplitText from '@/components/ui/split-text'

interface HeaderProps {
  isLoggedIn?: boolean;
  userName?: string;
  userAvatar?: string;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  isLoadingData?: boolean;
}

// 获取基于时间的问候语
const getTimeBasedGreeting = (language: string): string => {
  const hour = new Date().getHours()
  if (language === 'zh') {
    if (hour >= 0 && hour < 5) return '凌晨好。'
    if (hour >= 5 && hour < 12) return '早安。'
    if (hour >= 12 && hour < 18) return '下午好。'
    return '晚上好。'
  } else {
    if (hour >= 0 && hour < 5) return 'Good night.'
    if (hour >= 5 && hour < 12) return 'Good morning.'
    if (hour >= 12 && hour < 18) return 'Good afternoon.'
    return 'Good evening.'
  }
}

// 格式化日期
const formatDate = (date: Date, language: string): string => {
  if (language === 'zh') {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
}

export function Header({ onDateSelect, selectedDate: propSelectedDate, isLoadingData }: HeaderProps) {
  const { t, language } = useI18n()
  const { user } = useUser()
  const [scrolled, setScrolled] = useState(false)
  const [greeting, setGreeting] = useState<string>('')
  const [currentDate, setCurrentDate] = useState('')
  const [currentWeek, setCurrentWeek] = useState<Date[]>([])
  const [selectedDate, setSelectedDate] = useState(propSelectedDate || new Date())
  const [weekOffset, setWeekOffset] = useState(0)
  const [fontsLoaded, setFontsLoaded] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // 客户端检测
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 字体加载检测
  useEffect(() => {
    if (!isClient) return
    
    // 检查字体是否已加载
    const checkFonts = async () => {
      try {
        if ('fonts' in document) {
          await document.fonts.ready
          setFontsLoaded(true)
        } else {
          // 如果不支持 document.fonts API，延迟一段时间后假设字体已加载
          setTimeout(() => setFontsLoaded(true), 1000)
        }
      } catch (error) {
        console.warn('Font loading detection failed:', error)
        // 错误情况下也假设字体已加载，避免卡死
        setTimeout(() => setFontsLoaded(true), 1500)
      }
    }
    
    checkFonts()
  }, [isClient])

  // Listen for scroll events to set navbar state
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Update internal state when externally passed selectedDate changes
  useEffect(() => {
    if (propSelectedDate) {
      setSelectedDate(propSelectedDate);
    }
  }, [propSelectedDate]);

  // Update greeting and current date - 只在客户端和语言可用时更新
  useEffect(() => {
    if (!isClient || !language) return
    
    const updateDateTime = () => {
      setGreeting(getTimeBasedGreeting(language as string))
      setCurrentDate(formatDate(new Date(), language as string))
    }

    updateDateTime()

    // Set timer to update every minute
    const timer = setInterval(updateDateTime, 60000)
    return () => clearInterval(timer)
  }, [language, isClient])

  // Generate date array for the current week
  useEffect(() => {
    const today = new Date()
    const currentDay = today.getDay() // 0 is Sunday, 1 is Monday, etc.

    // Calculate the first day of the week (Sunday)
    const firstDayOfWeek = new Date(today)
    firstDayOfWeek.setDate(today.getDate() - currentDay + (weekOffset * 7))

    // Generate dates for all days of the week
    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(firstDayOfWeek)
      day.setDate(firstDayOfWeek.getDate() + i)
      weekDays.push(day)
    }

    setCurrentWeek(weekDays)
  }, [weekOffset])

  // Switch to the previous week
  const prevWeek = () => {
    setWeekOffset(prev => prev - 1)
  }

  // Switch to the next week
  const nextWeek = () => {
    setWeekOffset(prev => prev + 1)
  }

  // Go back to the current week
  const backToCurrentWeek = () => {
    setWeekOffset(0)
  }

  // Check if a date is today
  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
  }

  // Check if two dates are the same
  const isSameDate = (date1: Date, date2: Date): boolean => {
    return date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
  }

  // Select a date
  const selectDate = (date: Date) => {
    setSelectedDate(date);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clickedDateNormalized = new Date(date);
    clickedDateNormalized.setHours(0, 0, 0, 0);

    if (clickedDateNormalized.getTime() <= today.getTime()) {
      if (onDateSelect) {
        onDateSelect(date);
      }
    } else {
      if (onDateSelect) {
        onDateSelect(date);
      }
    }
  }

  const displayDateString = useMemo(() => {
    const todayForComparison = new Date();
    todayForComparison.setHours(0, 0, 0, 0); // 归零时间部分用于准确比较

    const selectedDateNormalized = new Date(selectedDate);
    selectedDateNormalized.setHours(0, 0, 0, 0);

    const formattedSelectedDate = formatDate(selectedDate, language as string);

    if (isSameDate(selectedDate, todayForComparison)) {
      return <span>{formattedSelectedDate}</span>;
    } else {
      // 计算天数差
      const diffTime = selectedDateNormalized.getTime() - todayForComparison.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let daysDiffText = '';
      if (diffDays > 0) {
        // 未来日期
        daysDiffText = language === 'zh' ? `${diffDays}天后` : `${diffDays} day${diffDays > 1 ? 's' : ''} later`;
      } else {
        // 过去日期
        const absDiffDays = Math.abs(diffDays);
        daysDiffText = language === 'zh' ? `${absDiffDays}天前` : `${absDiffDays} day${absDiffDays > 1 ? 's' : ''} ago`;
      }

      return (
        <span>
          {formattedSelectedDate}
          <span className="text-sm"> ({daysDiffText})</span>
        </span>
      );
    }
  }, [selectedDate, language]);

  return (
    <header className={`transition-all duration-300 bg-transparent pt-1 pb-2`}>
      <div className="container mx-auto px-2 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          {/* <Image
            src="/images/logo.svg"
            alt="AnotherMe Logo"
            width={32}
            height={32}
            className="mr-2"
          /> */}
          {/* <span className="text-4xl font-bold text-[#075071]">{greeting}</span> */}
          {/* 只在客户端、语言已加载、字体已加载且greeting有值时渲染SplitText */}
          {
          isClient && language && fontsLoaded && greeting ? (
            <SplitText
              key={greeting} 
              text={greeting}
              className="text-4xl font-bold text-[#075071]"
              delay={100}
              duration={0.6}
              ease="power3.out"
              splitType="chars"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              threshold={0.1}
              rootMargin="-100px"
              textAlign="center"
            />
          ) : (
            /* 在SplitText加载前显示简单的文本，避免布局跳动 */
            <h1 className="text-4xl font-bold text-[#075071]">
              {greeting || (language === 'zh' ? '早安。' : 'Good morning.')}
            </h1>
          )
          }
        </Link>

        <div className="flex items-center gap-6">

          <UserMenu
            userName={user?.user_metadata?.name}
            userAvatar={user?.user_metadata?.avatar_url}
          />
        </div>

      </div>
      {/* Date */}
      <div className="text-gray-500 px-4 mt-4 mb-2">{displayDateString}</div>

      {/* Week Days */}
      <section className="mb-4 animate-fade-in">
        <div className="flex justify-between items-center">
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors px-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={prevWeek}
            disabled={isLoadingData}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-7 gap-2 w-full">
            {currentWeek.map((date, index) => {
              const dayNumber = date.getDate()
              const isTodayDate = isToday(date)
              const isSelectedDay = selectedDate && isSameDate(date, selectedDate)

              return (
                <button
                  key={index}
                  className={`flex flex-col items-center py-2 ${isTodayDate
                      ? 'px-3 bg-[#183861] rounded-xl'
                      : isSelectedDay
                        ? 'px-3 border-2 border-[#183861] rounded-xl'
                        : ''
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={() => selectDate(date)}
                  disabled={isLoadingData}
                >
                  <span className={`text-xs ${isTodayDate
                      ? 'text-white/90'
                      : 'text-[#1a1a1a]/60'
                    } whitespace-nowrap`}>
                    {language === 'zh'
                      ? t(`common.${['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][date.getDay()]}`)
                      : date.toLocaleDateString('en-US', { weekday: 'short' })
                    }
                  </span>
                  <span className={`text-xl font-medium ${isTodayDate
                      ? 'text-white'
                      : 'text-[#1a1a1a]'
                    }`}>
                    {dayNumber}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            className="text-gray-400 hover:text-gray-600 transition-colors px-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={nextWeek}
            disabled={isLoadingData}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {weekOffset !== 0 && (
          <div className="flex justify-center mt-2">
            <button
              className="text-xs text-[#183861] hover:text-[#075071] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={backToCurrentWeek}
              disabled={isLoadingData}
            >
              {t('common.backToCurrentWeek')}
            </button>
          </div>
        )}
      </section>
    </header>
  )
} 