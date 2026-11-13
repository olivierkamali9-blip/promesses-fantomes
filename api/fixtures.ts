import { handleFootballFixtures } from '../src/sources/footballServer'

declare const process: {
  env: Readonly<Record<string, string | undefined>>
}

export async function GET(request: Request): Promise<Response> {
  return handleFootballFixtures(request, process.env.FOOTBALL_DATA_TOKEN)
}
