'use client'
import { Footer } from '@/app/components/footer'
import Header from '../components/header'
import Main from '../components/main'

export default function Home({
  params: { locale },
}: {
  params: { locale: string }
}) {
  return (
    <>
      <div className='flex h-full min-h-screen flex-col justify-between'>
        <Header className='mt-8' />

        <Main className='container mx-auto min-h-[500px] w-full max-w-[1024px] flex-1 px-2 py-6' />

        <Footer className='mb-8' />
      </div>
    </>
  )
}
