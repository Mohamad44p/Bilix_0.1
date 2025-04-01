"use client";

import { motion } from "motion/react";
import { Button } from "../ui/button";
import HeaderHero from "./HeaderHero";

export default function Hero() {
  return (
    <>
      <HeaderHero />
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 text-black dark:text-white overflow-hidden relative transition-colors duration-300">
        {/* Decorative blob - adjusted positioning and visibility */}
        <div className="absolute -top-50 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-gradient-to-br from-primary/20 to-primary/30 dark:from-primary/30 dark:to-primary/40 opacity-30 blur-3xl pointer-events-none z-[1]" />

        <div className="container mx-auto px-4 py-20">
          {/* Announcement banner */}
          <motion.div
            className="flex justify-center mb-16 mt-20 relative z-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white/10 dark:bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-gray-200 dark:border-white/20 shadow-lg">
              <p className="text-sm md:text-base">
                We just raised $20M in Series B.{" "}
                <a
                  href="#"
                  className="underline underline-offset-2 text-primary hover:text-primary/80 transition-colors"
                >
                  Learn more
                </a>
              </p>
            </div>
          </motion.div>

          <div className="max-w-5xl mx-auto text-center mb-16 relative z-10">
            <motion.h1
              className="text-6xl md:text-7xl lg:text-8xl font-medium mb-6 tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Modern analytics
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                for the modern world
              </span>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-gray-700 dark:text-gray-300 mb-10 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              Suspendisse varius enim in eros elementum tristique.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Button className="bg-primary text-white hover:bg-primary/90 px-6 py-6 text-base shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30 hover:scale-105">
                Download the app
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 dark:border-white/30 hover:bg-gray-100 dark:hover:bg-white/10 px-6 py-6 text-base transition-all duration-300 hover:scale-105"
              >
                Talk to an expert
              </Button>

              {/* Decorative blob - adjusted positioning and visibility */}
              <div className="absolute top-60 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] rounded-full bg-gradient-to-br from-primary/20 to-primary/30 dark:from-primary/30 dark:to-primary/40 opacity-30 blur-3xl pointer-events-none z-[1]" />
            </motion.div>
          </div>

          {/* Dashboard Image */}
          <div className="max-w-6xl mx-auto mt-20 relative z-10">
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              <motion.img
                src="/dash2.png"
                alt="Dashboard"
                className="w-full h-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            </motion.div>
            {/* Bottom gradient overlay */}
            <div className="absolute bottom-0 left-0 right-0 w-full h-5/6 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none z-1" />
          </div>
        </div>
      </div>
    </>
  );
}
