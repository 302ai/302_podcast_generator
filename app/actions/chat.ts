'use server'
import { logger } from '@/lib/logger'
import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { createStreamableValue } from 'ai/rsc'
import { env } from 'next-runtime-env'

const MAX_TOKENS = 8192

export async function optimizeContent({
  model,
  apiKey,
  content,
  reference,
  prompt,
}: {
  model: string
  apiKey: string
  content: string
  reference: string
  prompt: string
}) {
  const stream = createStreamableValue('')
  try {
    const openai = createOpenAI({
      apiKey,
      baseURL: env('NEXT_PUBLIC_API_URL') + '/v1',
    })

    ;(async () => {
      try {
        const { textStream } = await streamText({
          model: openai(model),
          prompt: `
          You are a helpful assistant that optimizes content for a given reference.
          The reference is a string that contains the original content.
          The prompt is a string that contains the instructions for the optimization.
          The content is a string that contains the content to be optimized.
          The content should be optimized for the given reference and prompt.
          The content should be optimized for the given reference and prompt.
          The content should be optimized for the given reference and prompt.

          <reference>
          ${reference}
          </reference>
          <prompt>
          ${prompt}
          </prompt>
          <content>
          ${content}
          </content>

          PLEASE ONLY RETURN THE OPTIMIZED TEXT CONTENT, NO MARKDOWN, NO CODE, NOT HTML, NO BACKTICKS OR LANGUAGE NAMES.
          `,
          ...(model.includes('claude-3-5') && {
            maxTokens: MAX_TOKENS,
            headers: {
              'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
            },
          }),
        })
        for await (const delta of textStream) {
          stream.update(delta)
        }

        stream.done()
      } catch (e: any) {
        logger.error(e)
        stream.error(e.responseBody)
      }
    })()
  } catch (error) {
    console.error(error)
  }
  return { output: stream.value }
}
