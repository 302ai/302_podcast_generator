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

export async function generateSearchKeywords({
  model,
  apiKey,
  userInput,
}: {
  model: string
  apiKey: string
  userInput: string
}) {
  try {
    const openai = createOpenAI({
      apiKey,
      baseURL: env('NEXT_PUBLIC_API_URL') + '/v1',
    })

    const { textStream } = await streamText({
      model: openai(model),
      prompt: `
      You are a search optimization assistant. Your task is to analyze the user's input and generate relevant search keywords and phrases that would help them find the information they're looking for.

      Important guidelines:
      1. Identify the core concepts and topics from the input
      2. Include both specific and broader related terms
      3. Consider common variations and synonyms
      4. Add relevant technical terms if applicable
      5. Include both English and native language terms when appropriate
      6. Prioritize terms that are likely to yield high-quality search results

      User input:
      ${userInput}

      Return the results in this JSON format:
      {
        "mainKeywords": ["most important terms"],
        "relatedPhrases": ["longer search phrases"],
        "technicalTerms": ["specific technical terms if relevant"],
        "alternativeTerms": ["synonyms and variations"]
      }

      PLEASE ONLY RETURN THE JSON OBJECT, NO MARKDOWN, NO CODE BLOCKS, NO BACKTICKS.
      `,
      ...(model.includes('claude-3-5') && {
        maxTokens: MAX_TOKENS,
        headers: {
          'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
        },
      }),
    })

    let fullResponse = ''
    for await (const delta of textStream) {
      fullResponse += delta
    }

    // Parse the response to ensure it's valid JSON
    const result = JSON.parse(fullResponse)
    return result
  } catch (error) {
    console.error(error)
    throw error
  }
}

export type DialogueItem = {
  id: string
  content: string
  speaker: number
}

export async function optimizeDialogues({
  model,
  apiKey,
  dialogues,
  type,
  customPrompt,
}: {
  model: string
  apiKey: string
  dialogues: DialogueItem[]
  type: 'tone_consistency' | 'make_concise' | 'fix_all' | 'custom'
  customPrompt?: string
}) {
  try {
    const prompts = {
      tone_consistency: "Maintain consistent tone and style across all dialogues while preserving each speaker's unique voice.",
      make_concise: "Make all dialogues more concise and to the point while maintaining their essential meaning.",
      fix_all: "Fix any grammar issues, typos, and improve the overall language quality while maintaining the original meaning.",
      custom: customPrompt || "Optimize the dialogues based on the custom prompt.",
    }

    if (type === 'custom' && !customPrompt) {
      throw new Error('Custom prompt is required for custom optimization type')
    }

    const openai = createOpenAI({
      apiKey,
      baseURL: env('NEXT_PUBLIC_API_URL') + '/v1',
    })

    const { textStream } = await streamText({
      model: openai(model),
      prompt: `
      You are a dialogue optimization assistant. Your task is to optimize multiple dialogues according to the following instruction:
      ${prompts[type]}

      Important rules:
      1. Keep the same speaker numbers
      2. Keep the same dialogue IDs
      3. Maintain the original meaning while applying the optimization
      4. Return the optimized dialogues in valid JSON format

      Input dialogues:
      ${JSON.stringify(dialogues, null, 2)}

      Return format:
      {
        "dialogues": [
          {"id": "...", "content": "optimized content", "speaker": number}
        ]
      }

      PLEASE ONLY RETURN THE JSON OBJECT, NO MARKDOWN, NO CODE BLOCKS, NO BACKTICKS.
      `,
      ...(model.includes('claude-3-5') && {
        maxTokens: MAX_TOKENS,
        headers: {
          'anthropic-beta': 'max-tokens-3-5-sonnet-2024-07-15',
        },
      }),
    })

    let fullResponse = ''
    for await (const delta of textStream) {
      fullResponse += delta
    }

    // Parse the response to ensure it's valid JSON
    const result = JSON.parse(fullResponse)
    return result
  } catch (error) {
    console.error(error)
    throw error
  }
}
