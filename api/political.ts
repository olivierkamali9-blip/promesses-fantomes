import { handlePoliticalStatements } from '../src/sources/politicalServer.js'

declare const process: {
  env: Readonly<Record<string, string | undefined>>
}

export async function GET(): Promise<Response> {
  return handlePoliticalStatements(process.env.GEMINI_API_KEY)
}
