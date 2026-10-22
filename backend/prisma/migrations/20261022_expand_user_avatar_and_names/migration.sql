-- AlterTable users: expand avatar_url, display_name, and google_id
ALTER TABLE "users" ALTER COLUMN "avatar_url" TYPE TEXT;
ALTER TABLE "users" ALTER COLUMN "display_name" TYPE VARCHAR(255);
ALTER TABLE "users" ALTER COLUMN "google_id" TYPE VARCHAR(255);
