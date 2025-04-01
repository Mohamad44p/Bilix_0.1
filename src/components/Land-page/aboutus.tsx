"use client";
import {
  Apple,
  ComputerIcon as Windows,
  PlayIcon as PlayStore,
} from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";

function Aboutus() {
  return (
    <>
      <div className="bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-950 text-center p-8 transition-colors duration-300">
        <motion.h1
          className="text-5xl font-bold text-gray-900 dark:text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Our Platforms
        </motion.h1>
        <motion.p
          className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Experience seamless integration across all your devices with our
          innovative solutions available on desktop and mobile platforms.
        </motion.p>
      </div>
      <div className="bg-gradient-to-b from-white to-gray-100 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center p-8 transition-colors duration-300">
        <motion.div
          className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl">
            {/* Desktop Section */}
            <motion.div
              className="flex-1 relative h-[500px] w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 backdrop-blur-xl rounded-[20px] shadow-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 p-6"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Desktop
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Discover the cutting-edge capabilities of our AI solutions
                designed to transform your business operations.
              </p>
              <div className="flex gap-4 mb-8">
                <button className="flex items-center gap-2 bg-gray-900 dark:bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-900 transition-colors">
                  <Apple className="w-5 h-5" />
                  <span>Download for</span>
                </button>
                <button className="flex items-center gap-2 bg-gray-900 dark:bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-900 transition-colors">
                  <Windows className="w-5 h-5" />
                  <span>Download for</span>
                </button>
              </div>
              <div className="w-full h-60 rounded-lg"></div>
              <Image
                src="/deskimg.PNG"
                alt="Desktop Preview"
                width={1000}
                height={1000}
                className="absolute bottom-4 right-4 w-11/12 h-64 rounded-lg object-cover shadow-lg"
              />
            </motion.div>

            {/* Mobile Section */}
            <motion.div
              className="flex-1 relative h-[500px] w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 backdrop-blur-xl rounded-[20px] shadow-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 p-6"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Mobile
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Discover the cutting-edge capabilities of our AI solutions
                designed to transform your business operations.
              </p>
              <div className="flex gap-4 mb-6">
                <button className="flex items-center gap-2 bg-gray-900 dark:bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-900 transition-colors">
                  <Apple className="w-5 h-5" />
                  <span>Download for</span>
                </button>
                <button className="flex items-center gap-2 bg-gray-900 dark:bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-900 transition-colors">
                  <PlayStore className="w-5 h-5" />
                  <span>Download for</span>
                </button>
              </div>
              <div className="w-full h-60 bg-gray-200 dark:bg-gray-800 rounded-lg shadow-inner"></div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export default Aboutus;
