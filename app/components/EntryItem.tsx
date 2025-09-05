import {
    NotebookPen,
    Sun,
    Moon,
} from "lucide-react"
import { useI18n } from '@/app/i18n'
import { useRouter } from 'next/navigation'
import { EntryContent } from '@/types/entries'
import { SlideUpFade } from "@/components/ui/slide-up-fade";

interface EntryItemProps {
    entry: EntryContent;
    type?: 'morning' | 'evening' | 'snippet';
    showTags?: boolean;
}

// 根据不同类型的条目配置样式和图标
const typeConfig = {
    morning: {
        icon: Sun,
        iconClass: 'text-primary',
        bgClass: 'bg-primary/20',
        bgContainerClass: 'bg-primary/5',
        borderClass: 'border-l-4 border-primary/30',
        badgeClass: 'bg-primary/20 text-secondary'
    },
    evening: {
        icon: Moon,
        iconClass: 'text-secondary',
        bgClass: 'bg-secondary/20',
        bgContainerClass: 'bg-secondary/5',
        borderClass: 'border-l-4 border-secondary/30',
        badgeClass: 'bg-secondary/20 text-secondary'
    },
    snippet: {
        icon: NotebookPen,
        iconClass: 'text-gray-600',
        bgClass: 'bg-gray-100',
        bgContainerClass: 'bg-white',
        borderClass: '',
        badgeClass: 'bg-gray-50 text-gray-600'
    }
};

// 获取时间格式化显示 (MM-DD HH:ss)
const formatDateTime = (timestamp?: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${minutes}`;
};

export function EntryItem({ entry, type = 'snippet', showTags = false }: EntryItemProps) {
    const { t } = useI18n();
    const router = useRouter();

    // 使用传入的type或entry自身的type
    const entryType = type || entry.type || 'snippet';
    const config = typeConfig[entryType as keyof typeof typeConfig] || typeConfig.snippet;

    // 获取正确的Icon组件
    const Icon = config.icon;

    // 跳转到编辑页面
    const handleClick = () => {
        if (entry.euuid) {
            router.push(`/entries/new?type=${entryType}&euuid=${entry.euuid}`);
        }
    };

    // 获取标题文本
    const getTitleText = () => {
        if (entry.title) return entry.title;

        if (entryType === 'morning') return t('home.morningJournal');
        if (entryType === 'evening') return t('home.eveningJournal');

        return t('home.recordTitle');
    };

    return (
        <SlideUpFade duration={0.8} distance={30}>
            <div
                className={`${config.bgContainerClass} rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${config.borderClass}`}
                onClick={handleClick}
            >
                <div className="flex items-center mb-3 w-full">
                    {/* 图标 - 固定宽度 */}
                    <div className={`w-7 h-7 rounded-full ${config.bgClass} flex items-center justify-center mr-2 flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${config.iconClass}`} />
                    </div>
                    
                    {/* 标题 - 自适应宽度 */}
                    <div className="font-medium mt-1 align-middle text-secondary text-sm truncate flex-1 min-w-0">
                        {getTitleText()}
                    </div>
                    
                    {/* 时间 - 固定宽度 */}
                    <div className="text-xs text-gray-500 mt-2 flex-shrink-0 w-18 text-right">
                        {formatDateTime(entry.created_at)}
                    </div>
                </div>

                <div className="space-y-2 text-gray-700">
                    {entry.text ? (
                        <div>
                            {entry.text.split('\n').map((line, index) => (
                                <p key={index} className="text-sm">{line}</p>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-700 text-sm mb-2">
                            {t('home.snippetPlaceholder')}
                        </p>
                    )}
                </div>
                <div className="flex items-center flex-wrap pt-4">
                    {entry.icon && (
                        <span key={'emoji'} className={`px-2 py-1 mr-1 ${config.badgeClass} rounded-full text-sm`}>
                            {entry.icon}
                        </span>
                    )}

                    {showTags && entry.tags && entry.tags.length > 0 && (
                        entry.tags.map((item) => (
                            <span key={item} className={`px-2 py-2 mr-1 ${config.badgeClass} rounded-full text-xs whitespace-nowrap`}>
                                {item}
                            </span>
                        ))
                    )}
                </div>
            </div>
        </SlideUpFade>
    );
} 