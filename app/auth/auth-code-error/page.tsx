'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function AuthCodeError() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Authentication Error
          </h1>
          <p className="text-gray-600 mt-2 mb-6">
            Something went wrong during the authentication process. Please try again.
          </p>
          <Button
            onClick={() => router.push('/auth/login')}
            className="w-full h-12 bg-[#075071] hover:bg-[#075071]/90 rounded-xl font-medium text-base"
          >
            Return to Login
          </Button>
        </div>
      </div>
    </div>
  );
}
