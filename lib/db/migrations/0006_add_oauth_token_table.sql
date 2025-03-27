-- Create the OAuthToken table
CREATE TABLE IF NOT EXISTS "OAuthToken" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "provider" VARCHAR(50) NOT NULL,
  "accessToken" TEXT NOT NULL,
  "refreshToken" TEXT,
  "expiresAt" TIMESTAMP,
  "composioConnectionId" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookup by user and provider
CREATE INDEX IF NOT EXISTS "OAuthToken_userId_provider_idx" ON "OAuthToken"("userId", "provider"); 