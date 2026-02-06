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

  const isConfigured = !!(bedrockApiKey && awsRegion);
  
  console.log('[Credentials API] Checking server-side Bedrock credentials:');
  console.log('[Credentials API] BEDROCK_API_KEY exists:', !!bedrockApiKey);
  console.log('[Credentials API] AWS_REGION exists:', !!awsRegion);
  console.log('[Credentials API] bedrockConfigured:', isConfigured);

  return NextResponse.json({
    bedrockConfigured: isConfigured,
  });
}
