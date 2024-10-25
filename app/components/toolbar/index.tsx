'use client'
import { useIsSharePath } from '@/app/hooks/use-is-share-path'
import { History } from './history'
import { LanguageSwitcher } from './language-switcher'
import { ThemeSwitcher } from './theme-switcher'
function Toolbar() {
  const { isSharePath } = useIsSharePath()

  return (
    <div className='fixed right-4 top-2 z-50 flex gap-2'>
      {!isSharePath && <History />}
      {!isSharePath && <LanguageSwitcher />}
      <ThemeSwitcher />
    </div>
  )
}

export { Toolbar }
