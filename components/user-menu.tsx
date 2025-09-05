import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    LogIn,
    LogOut,
    Globe,
    User,
    Loader2
} from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'
import { useI18n } from '@/app/i18n'
import { signOut } from '@/lib/auth'
import { useUser } from '@/components/UserProvider'

interface UserMenuProps {
    userAvatar?: string
    userName?: string
}

export function UserMenu({ userAvatar, userName }: UserMenuProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const { t, language, setLanguage } = useI18n()
    // 使用用户上下文获取用户状态
    const { user, loading, refreshUser, userProfile } = useUser()

    // 用户是否已登录
    const isLoggedIn = !!user

    const handleLogout = async () => {
        try {
            const { error } = await signOut()
            if (error) throw error

            // 刷新用户状态
            await refreshUser()

            // 刷新页面以更新认证状态
            window.location.href = '/'
        } catch (err) {
            console.error('退出登录失败:', err)
        }
    }

    const menuItems = [
        {
            label: t('userMenu.language'),
            icon: Globe,
            onClick: async () => {
                // 标记这是用户主动的语言切换
                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('user_initiated_language_change', 'true');
                }
                
                // 切换语言，setLanguage会自动更新用户语言偏好
                const new_language = language === 'zh' ? 'en' : 'zh'

                setLanguage(new_language, userProfile)
                setOpen(false)
            },
        },
        {
            label: t('userMenu.logout'),
            icon: LogOut,
            onClick: () => {
                handleLogout()
                setOpen(false)
            },
        },
    ]

    const handleClick = () => {
        if (!isLoggedIn) {
            router.push('/auth/login');
            return;
        }
    }

    // 如果正在加载，显示加载指示器
    if (loading) {
        return (
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white shadow-sm">
                <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
            </div>
        )
    }

    // 获取用户显示名称
    const displayName = userName || userProfile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || t('userMenu.user')

    return (
        <>
            <Popover.Root open={open} onOpenChange={setOpen}>
                <Popover.Trigger asChild>
                    <button
                        onClick={handleClick}
                        className={cn(
                            "flex items-center gap-2 rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800",
                            "transition-colors duration-200"
                        )}
                    >
                        {isLoggedIn ? (
                            <>
                                <div className="relative h-8 w-8 overflow-hidden rounded-full">
                                    {userAvatar || user?.user_metadata?.avatar_url ? (
                                        <img
                                            src={userAvatar || user?.user_metadata?.avatar_url}
                                            alt={displayName}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                                // 图像加载错误时，显示默认头像
                                                const imgEl = e.currentTarget as HTMLImageElement;
                                                imgEl.style.display = 'none';
                                                const fallbackEl = imgEl.parentElement?.querySelector('.fallback-avatar') as HTMLDivElement;
                                                if (fallbackEl) {
                                                    fallbackEl.style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <div
                                        className={`fallback-avatar flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700 ${(userAvatar || user?.user_metadata?.avatar_url) ? 'hidden' : 'flex'}`}
                                    >
                                        <User className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                    </div>
                                </div>
                                <span className="hidden sm:inline-block text-sm font-medium">
                                    {displayName}
                                </span>
                            </>
                        ) : (
                            <>
                                <div className="h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center">
                                    <LogIn className="h-4 w-4 text-gray-500" />
                                </div>
                                <span className="hidden sm:inline-block text-sm font-medium">
                                    {t('auth.signInOrUp')}
                                </span>
                            </>
                        )}
                    </button>
                </Popover.Trigger>

                {isLoggedIn && (
                    <Popover.Portal>
                        <Popover.Content
                            className="z-50 min-w-[200px] rounded-lg bg-white p-2 shadow-lg dark:bg-gray-800"
                            sideOffset={5}
                            align="end"
                        >
                            <div className="flex flex-col gap-1">
                                {menuItems.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={item.onClick}
                                        className={cn(
                                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                                            "hover:bg-gray-100 dark:hover:bg-gray-700",
                                            "transition-colors duration-200"
                                        )}
                                    >
                                        <item.icon className="h-4 w-4" />
                                        <span>{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        </Popover.Content>
                    </Popover.Portal>
                )}
            </Popover.Root>
        </>
    )
} 