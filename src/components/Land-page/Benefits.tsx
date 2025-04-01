/* eslint-disable @next/next/no-img-element */
"use client";

import { motion } from "motion/react";

const cards = [
  {
    title: "Deep Learning Models",
    description:
      "Leverage the power of deep neural networks for complex data processing and decision-making.",
    image: "/public/deskimg.PNG",
  },
  {
    title: "Cognitive Automation",
    description: "Transform your business processes with cognitive automation.",
    image: "/images/cognitive.png",
  },
  {
    title: "Advanced NLP",
    description: "Go beyond basic NLP with our advanced NLP capabilities.",
    image: "/images/nlp.png",
  },
  {
    title: "AI-Powered Predictive Maintenance",
    description:
      "Prevent costly downtime with our AI-driven predictive maintenance feature. By analyzing equipment data in real-time.",
    image: "/images/maintenance.png",
  },
  {
    title: "Computer Vision & Image Recognition",
    description:
      "Unlock new possibilities with our cutting-edge computer vision technology. Our AI can analyze and interpret visual data.",
    image: "/images/vision.png",
  },
];

function Benefits() {
  return (
    <div className="bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-white py-16 px-4 relative overflow-hidden transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        <motion.div
          className="flex items-center gap-4 mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-primary/10 dark:bg-primary/20 rounded-full px-3 py-1">
            <span className="text-xs font-medium text-primary">
              Top Features
            </span>
          </div>
        </motion.div>

        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">
            More Than AI
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Step into the future with AI, engineered to tackle the most complex
            challenges.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {cards.slice(0, 3).map((card, index) => (
            <motion.div
              key={index}
              className="relative h-full bg-white dark:bg-gray-800 backdrop-blur-xl rounded-[20px] overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              <div className="h-40 rounded-[20px] mb-3 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-700">
                <img
                  src={card.image || "/placeholder.svg"}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {card.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          {cards.slice(3).map((card, index) => (
            <motion.div
              key={index}
              className="relative h-full bg-white dark:bg-gray-800 backdrop-blur-xl rounded-[20px] overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 p-4 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              <div className="border border-gray-200 dark:border-gray-700 h-48 rounded-[20px] mb-4 flex items-center justify-center overflow-hidden">
                <img
                  src={card.image || "/placeholder.svg"}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                  {card.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {card.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="absolute bottom-0 left-1/2 top-3/4 -translate-x-1/2 w-[100px] h-[150px] rounded-full bg-gradient-to-br from-primary/20 to-primary/30 dark:from-primary/30 dark:to-primary/40 opacity-20 blur-3xl pointer-events-none" />
      </div>
    </div>
  );
}

export default Benefits;
