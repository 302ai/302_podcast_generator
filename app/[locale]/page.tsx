'use client'
import { Footer } from '@/app/components/footer'
import { env } from 'next-runtime-env'
import Header from '../components/header'
import Main from '../components/main'

export default function Home({
  params: { locale },
}: {
  params: { locale: string }
}) {
  const showBrand = env('NEXT_PUBLIC_SHOW_BRAND') === 'true'
  return (
    <>
      <div className='flex h-full min-h-screen flex-col justify-between'>
        <Header className='mt-8' />

        <Main className='container mx-auto min-h-[500px] w-full max-w-[1024px] flex-1 px-2 py-6' />

        {showBrand && <Footer className='mb-8' />}
      </div>
    </>
  )
}
