import { handlePoliticalStatements } from '../src/sources/politicalServer.js'

declare const process: {
  env: Readonly<Record<string, string | undefined>>
}

export const maxDuration = 30

export async function GET(): Promise<Response> {
  try {
    return await handlePoliticalStatements(process.env.GEMINI_API_KEY)
  } catch (error) {
    return new Response(JSON.stringify({
      candidates: [],
      warnings: [
        `Veille politique interrompue : ${error instanceof Error ? error.message : 'erreur inconnue'}`,
      ],
      fetchedAt: new Date().toISOString(),
      aiProvider: 'rules',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
    })
  }
}
