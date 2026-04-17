-- CreateEnum
CREATE TYPE "public"."AdminRole" AS ENUM ('ADMIN', 'MANAGER');

-- CreateTable
CREATE TABLE "public"."admin_users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "public"."AdminRole" NOT NULL DEFAULT 'MANAGER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_refresh_tokens" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "adminUserId" INTEGER NOT NULL,
    "status" "public"."RefreshTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "lastUsed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "public"."admin_users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_refresh_tokens_token_key" ON "public"."admin_refresh_tokens"("token");

-- AddForeignKey
ALTER TABLE "public"."admin_refresh_tokens" ADD CONSTRAINT "admin_refresh_tokens_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "public"."admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
