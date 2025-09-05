"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/app/i18n';
import { useLanguageDetection } from '@/hooks/use-language-detection';
import Image from 'next/image';
import { oauthSignIn } from '@/app/auth/_actions/oauth-login';
import { Chrome, Github } from 'lucide-react'; // Assuming you have a Github icon

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingGitHub, setIsLoadingGitHub] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize language detection
  useLanguageDetection();

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    if (provider === 'google') {
      setIsLoadingGoogle(true);
    } else {
      setIsLoadingGitHub(true);
    }
    setError(null);

    const result = await oauthSignIn(provider);

    if (result.error) {
      setError(result.error);
      if (provider === 'google') {
        setIsLoadingGoogle(false);
      } else {
        setIsLoadingGitHub(false);
      }
    } else if (result.url) {
      // Redirect to the provider's sign-in page
      router.push(result.url);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F5F1] p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <Image
            src="/static/logo.png"
            alt="Another.Me Logo"
            width={182}
            height={182}
            className="transition-all duration-300 ease-in-out"
            priority
          />
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#075071]">{t('auth.signInOrUp')}</h1>
            <p className="text-gray-600 mt-2">{t('auth.signInOrUpSubtitle')}</p>
          </div>

          {error && (
             <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div className="space-y-4">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-gray-200 hover:bg-gray-50 rounded-xl font-medium text-base flex items-center justify-center gap-2"
              onClick={() => handleOAuthSignIn('github')}
              disabled={isLoadingGitHub || isLoadingGoogle}
            >
              <Github className="h-5 w-5" />
              {isLoadingGitHub ? t('auth.redirecting') : t('auth.loginWithGitHub')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-gray-200 hover:bg-gray-50 rounded-xl font-medium text-base flex items-center justify-center gap-2"
              onClick={() => handleOAuthSignIn('google')}
              disabled={isLoadingGoogle || isLoadingGitHub}
            >
              <Chrome className="mr-2 h-5 w-5" />
              {isLoadingGoogle ? t('auth.redirecting') : t('auth.loginWithGoogle')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 