import { handlePoliticalStatements } from '../src/sources/politicalServer.js'

export async function GET(): Promise<Response> {
  return handlePoliticalStatements()
}
