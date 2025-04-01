"use client";

import { Star } from "lucide-react";
import { motion } from "motion/react";

export default function StatsSection() {
  return (
    <div className="relative w-full bg-gradient-to-b from-white to-gray-100 dark:from-gray-950 dark:to-gray-900 py-20 px-4 md:px-6 lg:px-8 overflow-hidden transition-colors duration-300">
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Left to right gradient overlay */}
        <div className="absolute inset-0 bg-white/85 dark:bg-gray-950/85 opacity-85 z-10"></div>

        {/* Square Grid - Bigger cells */}
        <div className="h-full w-full">
          <div
            className="h-full w-full grid"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
              gridTemplateRows: "repeat(auto-fill, minmax(130px, 1fr))",
              gridAutoFlow: "row",
            }}
          >
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="border border-gray-200 dark:border-gray-800"
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Content with background */}
      <div className="relative z-20 max-w-6xl mx-auto">
        <motion.div
          className="p-8 md:p-12 rounded-t-2xl grid md:grid-cols-2 gap-12 items-center bg-gradient-to-r from-transparent via-white/80 to-transparent dark:from-transparent dark:via-gray-900/80 dark:to-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col items-center md:items-start gap-8">
            <div className="flex items-center gap-2 text-primary text-sm">
              <div className="h-px w-6 bg-primary"></div>
              <span>indicator</span>
              <div className="h-px w-6 bg-primary"></div>
            </div>

            <h2 className="text-gray-900 dark:text-white text-3xl md:text-4xl font-bold text-center md:text-left leading-tight">
              We Are Proud To Have
              <br />A Great Indicator.
            </h2>

            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 flex items-center gap-3 shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary border-2 border-white dark:border-gray-800"></div>
                <div className="w-8 h-8 rounded-full bg-primary/70 border-2 border-white dark:border-gray-800"></div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-white font-bold">
                    4.9/5
                  </span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  Based on 34 reviews on Clutch
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Stats Only */}
          <div className="grid grid-cols-2 gap-8 relative">
            {/* Large decorative blob */}
            <div className="absolute right-2/4 top-1/2 -translate-y-1/2 w-[200px] h-[400px] rounded-full bg-gradient-to-br from-primary/10 to-primary/30 dark:from-primary/20 dark:to-primary/40 blur-[80px] pointer-events-none"></div>

            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                11.5M<span className="text-gray-900 dark:text-white">+</span>
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                Clients Revenue
              </span>
            </motion.div>

            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <span className="text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-primary/70 to-primary bg-clip-text text-transparent">
                11.5M<span className="text-gray-900 dark:text-white">+</span>
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                Clients Revenue
              </span>
            </motion.div>

            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <span className="text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                21.9M<span className="text-gray-900 dark:text-white">+</span>
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                Transactions recorded
              </span>
            </motion.div>

            <motion.div
              className="flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <span className="text-4xl md:text-5xl lg:text-6xl bg-gradient-to-r from-primary/70 to-primary bg-clip-text text-transparent">
                300<span className="text-gray-900 dark:text-white">+</span>
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                Project Done
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* Trusted By Section */}
        <motion.div
          className="text-center max-w-7xl mx-auto rounded-b-2xl bg-gradient-to-r from-transparent via-white/80 to-transparent dark:from-transparent dark:via-gray-900/80 dark:to-transparent py-16 px-8 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-gradient-to-r after:from-transparent after:via-primary/40 after:via-50% after:to-transparent"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <p className="text-gray-600 dark:text-gray-300 text-md mb-16">
            Trusted by 500+ Brands & Companies
          </p>
          <div className="flex flex-wrap justify-center items-center gap-16 md:gap-14">
            {[
              "Upglam",
              "Nutrilix",
              "Investify",
              "Knewish",
              "SIKKA",
              "SEKORO",
            ].map((brand, index) => (
              <motion.div
                key={brand}
                className="text-gray-500 dark:text-gray-400 opacity-70 font-semibold text-xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.05, color: "#000" }}
              >
                {brand}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
