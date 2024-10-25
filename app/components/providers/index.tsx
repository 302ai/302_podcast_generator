'use client'

import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from './theme-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute='class' defaultTheme='light'>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  )
}
