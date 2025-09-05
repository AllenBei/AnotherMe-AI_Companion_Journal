/*
 * @Author: Allen Bei
 * @Date: 2025-03-07 07:28:46
 * @LastEditors: Allen Bei 870970821@qq.com
 * @LastEditTime: 2025-06-12 16:37:53
 * @FilePath: /AnotherMe_AI_Web/app/layout.tsx
 * @Description: ...
 * 
 * Copyright (c) 2025 by Allen Bei, All Rights Reserved. 
 */
import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { UserProvider } from "@/components/UserProvider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import './globals.css'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Another.Me",
  description: "AI-powered diary application",
  generator: 'Allen and AI',
  applicationName: "Another.Me",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Another.Me",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/static/logo.png',
    apple: '/static/logo.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#075071',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Another.Me" />
        <link rel="apple-touch-icon" href="/static/logo.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light">
          <UserProvider>
            {children}
            <Toaster />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'