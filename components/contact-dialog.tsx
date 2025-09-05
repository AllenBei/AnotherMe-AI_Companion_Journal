import React from 'react'
import { useI18n } from '@/app/i18n'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { MessageCircle, X as TwitterIcon, Book, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ContactDialogProps {
  isOpen: boolean
  onClose: () => void
}

export const ContactDialog = ({ isOpen, onClose }: ContactDialogProps) => {
    const { t } = useI18n()

    const platforms = [
        {
           key: 'x',
           icon: TwitterIcon,
           color: 'bg-gray-900 hover:bg-black',
           textColor: 'text-gray-900',
           bgLight: 'bg-gray-50'
        },
        {
           key: 'rednote',
           icon: Book,
           color: 'bg-red-500 hover:bg-red-600',
           textColor: 'text-red-600',
           bgLight: 'bg-red-50'
        }
    ]

    const handleCopy = async (platformKey: string) => {
        const account = t(`product.contact.platforms.${platformKey}.account`)
        const platformName = t(`product.contact.platforms.${platformKey}.name`)
        try {
            await navigator.clipboard.writeText(account)
            toast.success(t('product.contact.copySuccess', { platformName, account }))
        } catch (error) {
            console.error('Failed to copy text: ', error)
            toast.error('Copy failed, please try again.')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white border-0 shadow-2xl rounded-2xl p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="text-2xl font-bold text-[#075071] text-center">
                        {t('product.contact.title')}
                    </DialogTitle>
                </DialogHeader>

                <div className="px-6 pb-6 space-y-6">
                    <p className="text-gray-600 text-center text-lg">
                        {t('product.contact.subtitle')}
                    </p>
                    <div className="text-center">
                        <p className="text-gray-700 font-medium mb-4">
                            {t('product.contact.searchHint')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {platforms.map((platform) => {
                            const Icon = platform.icon
                            return (
                                <Card
                                    key={platform.key}
                                    className={cn(
                                        "border-2 border-transparent hover:border-gray-200 transition-all duration-300 cursor-pointer group",
                                        platform.bgLight
                                    )}
                                    onClick={() => handleCopy(platform.key)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center text-white transition-all duration-300",
                                                platform.color
                                            )}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className={cn("font-semibold text-lg", platform.textColor)}>
                                                    {t(`product.contact.platforms.${platform.key}.name`)}
                                                </h3>
                                                <p className="text-gray-600 font-mono">
                                                    {t(`product.contact.platforms.${platform.key}.account`)}
                                                </p>
                                            </div>
                                            <div className="transition-opacity duration-300">
                                                <Copy className="w-5 h-5 text-gray-400" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <MessageCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div className="text-sm text-blue-700">
                                <p className="font-medium mb-1">{t('product.contact.tips.title')}</p>
                                <p>{t('product.contact.tips.content')}</p>
                            </div>
                        </div>
                    </div>

                    {/* <div className="pt-4">
                        <Button
                            onClick={onClose}
                            className="w-full bg-[#075071] hover:bg-[#0A6085] text-white py-3 rounded-xl text-lg font-medium"
                        >
                            {t('product.contact.close')}
                        </Button>
                    </div> */}
                </div>
            </DialogContent>
        </Dialog>
    )
} 