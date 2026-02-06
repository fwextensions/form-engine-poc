import { NextResponse } from "next/server";

/**
 * GET /api/llm/credentials
 *
 * Returns whether server-side Bedrock credentials are configured
 * via environment variables. Never exposes actual credential values.
 */
export async function GET() {
  const bedrockApiKey = process.env.BEDROCK_API_KEY;
  const awsRegion = process.env.AWS_REGION;

  return NextResponse.json({
    bedrockConfigured: !!(bedrockApiKey && awsRegion),
  });
}
