import { handleFootballFixtures } from '../src/sources/footballServer.js'

declare const process: {
  env: Readonly<Record<string, string | undefined>>
}

export async function GET(request: Request): Promise<Response> {
  return handleFootballFixtures(request, process.env.FOOTBALL_DATA_TOKEN)
}
