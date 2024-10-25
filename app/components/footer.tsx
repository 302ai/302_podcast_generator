'use client'

import { use302Url } from '@/app/hooks/use-302url'
import { useClientTranslation } from '@/app/hooks/use-client-translation'
import { useIsDark } from '@/app/hooks/use-is-dark'
import { cn } from '@/lib/utils'
import darkLogo from '@/public/images/logo-dark.png'
import lightLogo from '@/public/images/logo-light.png'
import Image from 'next/image'
import { forwardRef } from 'react'
import { Trans } from 'react-i18next'

const LogoLink = () => {
  const { isDark } = useIsDark()
  const { href } = use302Url()
  return (
    <a href={href} rel='noreferrer' target='_blank'>
      <Image
        alt='ai-302'
        className='mx-auto h-[18px] w-[64px]'
        src={isDark ? darkLogo : lightLogo}
        quality={100}
        height={72}
        width={256}
      />
    </a>
  )
}

interface Props {
  className?: string
}

const Footer = forwardRef<HTMLDivElement, Props>(({ className }, ref) => {
  const { t } = useClientTranslation()

  return (
    <footer
      className={cn('flex flex-col items-center justify-center', className)}
      style={{ color: 'rgb(102, 102, 102)', fontSize: '12px' }}
      ref={ref}
    >
      <div>{t('extras:footer.copyright_leading')}</div>
      <div className='flex items-center justify-center gap-1'>
        <Trans
          t={t}
          i18nKey={'extras:footer.copyright_content'}
          components={{
            LogoLink: <LogoLink />,
          }}
        />
      </div>
    </footer>
  )
})

Footer.displayName = 'Footer'

export { Footer }
