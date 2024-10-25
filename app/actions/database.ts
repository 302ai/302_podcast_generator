'use server'
import prisma from '@/lib/prisma'

export const createShare = async ({
  title,
  dialogues,
  mp3Url,
}: {
  title: string
  dialogues: any
  mp3Url: string
}) => {
  const exist = await prisma.podcastShare.findFirst({
    where: { mp3Url },
  })
  if (exist) {
    return exist
  }
  return await prisma.podcastShare.create({
    data: {
      title,
      dialogues,
      mp3Url,
    },
  })
}

export const getShareById = async (id: string) => {
  return await prisma.podcastShare.findFirst({
    where: { id },
  })
}

export const deleteShare = async (id: string) => {
  return await prisma.podcastShare.delete({
    where: { id },
  })
}
