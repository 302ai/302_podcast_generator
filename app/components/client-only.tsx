'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { ReactNode, useEffect, useState } from 'react'

interface ClientOnlyProps {
  children: ReactNode
}

export default function ClientOnly({
  children,
}: ClientOnlyProps): JSX.Element | null {
  const [hasMounted, setHasMounted] = useState<boolean>(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return (
      <div className='flex min-h-screen size-full flex-col items-center justify-center space-y-3'>
        <Skeleton className='h-4 w-[200px]' />
        <Skeleton className='h-4 w-[250px]' />
        <Skeleton className='h-4 w-[300px] rounded-xl' />
        <Skeleton className='h-4 w-[250px]' />
        <Skeleton className='h-4 w-[200px]' />
      </div>
    )
  }

  return <>{children}</>
}
