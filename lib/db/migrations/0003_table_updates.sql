-- Add visibility column to Chat table
ALTER TABLE "Chat" ADD COLUMN "visibility" varchar DEFAULT 'private' NOT NULL;

-- Add text column to Document table
ALTER TABLE "Document" ADD COLUMN "text" varchar DEFAULT 'text' NOT NULL; 