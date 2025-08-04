-- CreateEnum
CREATE TYPE "public"."LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'SCHEDULED_VISIT', 'CLOSED', 'DROPPED');

-- CreateEnum
CREATE TYPE "public"."PropertyInterest" AS ENUM ('LOT', 'CONDO', 'HOUSE');

-- CreateEnum
CREATE TYPE "public"."LeadSource" AS ENUM ('SOCIAL_MEDIA', 'INTERNET', 'REFERRAL', 'WALK_IN');

-- CreateEnum
CREATE TYPE "public"."TransactionType" AS ENUM ('BUYING', 'SELLING');

-- CreateTable
CREATE TABLE "public"."leads" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "propertyInterest" "public"."PropertyInterest" NOT NULL,
    "source" "public"."LeadSource" NOT NULL,
    "transaction" "public"."TransactionType" NOT NULL,
    "status" "public"."LeadStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notes" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Appointment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "leadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leads_email_key" ON "public"."leads"("email");

-- CreateIndex
CREATE INDEX "notes_leadId_idx" ON "public"."notes"("leadId");

-- CreateIndex
CREATE INDEX "Appointment_leadId_idx" ON "public"."Appointment"("leadId");
