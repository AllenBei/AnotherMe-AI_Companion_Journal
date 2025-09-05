'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';

type Provider = 'google' | 'github';

export async function oauthSignIn(provider: Provider) {
  const cookieStore = await cookies();
  const headersList = await headers();
  const origin = headersList.get('origin');

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error('OAuth sign-in error:', error);
    return { error: error.message };
  }

  // Supabase's signInWithOAuth returns a URL to redirect the user to.
  // This is how you get the user to the OAuth provider's sign-in page.
  if (data.url) {
    // In a server action, you can't directly redirect.
    // You need to return the URL to the client-side component.
    return { url: data.url, error: null };
  }

  return { url: null, error: 'OAuth provider URL not found.' };
}
