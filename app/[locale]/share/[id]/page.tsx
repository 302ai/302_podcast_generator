import { getShareById } from '@/app/actions/database'
import MP3Player from '@/app/components/mp3-player'
import { DialogueItem } from '@/app/components/share'
import { DialogueItems } from '@/app/stores/use-podcast-info-store'

export default async function SharePage({
  params,
}: {
  params: { id: string }
}) {
  const share = await getShareById(params.id)
  const dialogues = share?.dialogues as DialogueItems
  const speakerNums = new Set(dialogues.map((dialogue) => dialogue.speaker))
  return (
    <div className='flex h-full min-h-screen flex-col justify-between px-0 py-0 md:px-4 md:py-9'>
      <div className='container mx-auto flex min-h-[500px] w-full max-w-[1024px] flex-1 flex-col items-center gap-4 rounded-lg border bg-background px-2 py-8 shadow-sm'>
        <MP3Player audioSrc={share?.mp3Url ?? ''} title={share?.title ?? ''} />
        {/* dialogues */}
        <div className='flex flex-col gap-2'>
          {dialogues.map((dialogue) => (
            <DialogueItem
              key={dialogue.id}
              {...dialogue}
              speakerNums={speakerNums.size}
              useSpeakerName={share?.useSpeakerName ?? false}
              speakerNames={share?.names ?? []}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
