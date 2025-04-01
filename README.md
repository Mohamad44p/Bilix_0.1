# AI-Powered Invoice Management System

This project is an AI-powered invoice processing and financial analysis tool built with Next.js, Prisma, PostgreSQL, and Clerk.

## Setup Instructions

### 1. Install Dependencies

```bash
cd front
pnpm install
pnpm add @prisma/client @vercel/blob nanoid @vercel/ai @ai-sdk/openai
```

### 2. Set Up the Database

```bash
# Generate Prisma client
cd front
npx prisma generate

# Push the schema to the database
npx prisma db push
```

### 3. Set Up Environment Variables

Make sure your `.env` file contains:

```
DATABASE_URL="your-postgresql-url"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your-clerk-publishable-key"
CLERK_SECRET_KEY="your-clerk-secret-key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/"
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
OPENAI_API_KEY="your-openai-api-key"
```

### 4. Start the Development Server

```bash
cd front
pnpm dev
```

## Project Structure

- `src/app`: Next.js app router pages
- `src/components`: UI components
- `src/db`: Database connection setup
- `src/lib/actions`: Server actions for data fetching and mutations
- `src/lib/types`: TypeScript type definitions
- `src/lib/services`: Services like OCR using OpenAI

## Features Implemented

- User authentication with Clerk
- Database integration with Prisma
- Invoice upload with Vercel Blob storage
- AI-powered OCR for invoice data extraction
- Category and vendor suggestions using AI
- Multi-language invoice support
- Dashboard with financial insights

## OCR Features

- AI-powered OCR for text extraction from invoice images/PDFs
- Automatic categorization suggestions
- Vendor matching and suggestions
- Multi-language invoice support
- User-editable extraction results
- Storage of extracted data for analysis

## Next Steps

1. Connect Prisma models to OpenAI API for invoice OCR processing
2. Implement organization management and team collaboration
3. Set up AI financial insights and predictions
4. Create reporting functionality

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
