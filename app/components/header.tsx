
import { cn } from '@/lib/utils'
import { env } from 'next-runtime-env'
import { forwardRef, memo } from 'react'
import { useClientTranslation } from '../hooks/use-client-translation'
import LogoIcon from './icons/logo-icon'
interface Props {
  className?: string
}

const Header = forwardRef<HTMLDivElement, Props>(
  ({ className }, ref) => {
    const { t } = useClientTranslation()
    const showBrand = env('NEXT_PUBLIC_SHOW_BRAND')

    return (
      <header
        className={cn(
          'flex flex-col items-center justify-center space-y-8 px-2',
          className
        )}
        ref={ref}
      >
        <div className='flex items-center space-x-4'>
          {showBrand && <LogoIcon className='size-8 flex-shrink-0' />}
          <h1 className='break-all text-3xl leading-tight tracking-tighter transition-all sm:text-4xl lg:leading-[1.1]'>
            {t('home:header.title')}
          </h1>
        </div>

      </header>
    )
  }
)

Header.displayName = 'Header'

export default memo(Header)
