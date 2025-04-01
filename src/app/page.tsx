import Hero from "@/components/Land-page/Hero";
import Plans2 from "@/components/Land-page/Plans2";
import FooterSection from "@/components/Land-page/Footer";
import Benefits from "@/components/Land-page/Benefits";
import Reviews from "@/components/Land-page/Reviews";
import { FaqSection } from "@/components/Land-page/faq";
import Aboutus from "@/components/Land-page/aboutus";
import StatsSection from "@/components/Land-page/StatsSection";

export default async function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      <Hero />
      {/* HeaderHero component is already included in Hero.tsx */}
      <Aboutus />
      <Benefits />
      <StatsSection />
      <Plans2 />
      <Reviews />
      <FaqSection 
        title="Frequently Asked Questions"
        description="Find answers to commonly asked questions about our platform and services."
        items={[
          {
            question: "What is Next.js?",
            answer: "Next.js is a React framework that enables functionality such as server-side rendering, static site generation, and API routes. It provides a great developer experience with features like fast refresh and file-based routing.",
          },
          {
            question: "How do I get started with Next.js?",
            answer: "To get started with Next.js, you can use the create-next-app command: 'npx create-next-app@latest'. This will set up a new Next.js project with all the necessary configurations.",
          },
          {
            question: "What is the App Router?",
            answer: "The App Router is Next.js's new routing system introduced in version 13. It uses a file-system based router built on React Server Components, supporting layouts, nested routing, loading states, error handling, and more.",
          },
          {
            question: "What are Server Components?",
            answer: "Server Components are a new type of React component that render on the server. They can fetch data directly, access backend resources securely, and reduce the client-side JavaScript bundle size.",
          },
          {
            question: "How do I deploy a Next.js application?",
            answer: "Next.js applications can be easily deployed on Vercel with zero configuration. You can also deploy to other platforms like Netlify, AWS, or any Node.js hosting service.",
          }
        ]}
      />
      <FooterSection />
    </div>
  );
}