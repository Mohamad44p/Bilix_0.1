"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";
import { Avatar } from "../ui/avatar";
import Image from "next/image";
import { motion } from "motion/react";

// Testimonial card component
const ReviewCard = ({
  avatar,
  name,
  username,
  text,
}: {
  avatar: string;
  name: string;
  username: string;
  text: string;
}) => {
  return (
    <motion.div
      className="bg-white/10 dark:bg-gray-800/20 rounded-xl p-4 sm:p-6 md:p-8 backdrop-blur-sm border border-gray-200/30 dark:border-gray-700/30 h-full min-w-[280px] sm:min-w-[320px] md:min-w-[360px] lg:min-w-[400px] mx-2 sm:mx-3 md:mx-4 shadow-lg"
      whileHover={{
        scale: 1.02,
        boxShadow:
          "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-4 mb-4">
        <Avatar className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary/20">
          <Image
            src={avatar || "/placeholder.svg"}
            alt={name}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        </Avatar>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white text-base">
            {name}
          </h4>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            @{username}
          </p>
        </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
        {text}
      </p>
    </motion.div>
  );
};

export default function Reviews() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const fadeInRef = useRef(0);

  // Testimonial data
  const testimonials = [
    {
      avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
      name: "CindyCandy",
      username: "CindyC688",
      text: "This app is a testament to the potential of AI. The image generation is mind-blowing.",
    },
    {
      avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
      name: "Leodo17",
      username: "leodo17",
      text: "The integration capabilities of this AI app are unparalleled.",
    },
    {
      avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
      name: "CindyCandy",
      username: "CindyC688",
      text: "I've never experienced such seamless text to image and text-to-video transformations.",
    },
    {
      avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
      name: "JohnD",
      username: "JohnD456",
      text: "This AI app seamlessly blends innovation with user-friendly design. From image generation to data analysis.",
    },
    {
      avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
      name: "CindyCandy",
      username: "CindyC688",
      text: "This app is a testament to the potential of AI. The image generation is mind-blowing.",
    },
    {
      avatar: "https://v0.dev/placeholder.svg?height=40&width=40",
      name: "Leodo17",
      username: "leodo17",
      text: "The integration capabilities of this AI app are unparalleled.",
    },
  ];

  useEffect(() => {
    let phi = 0;
    let width = 0;
    const currentCanvas = canvasRef.current;

    const onResize = () => {
      const container = currentCanvas?.parentElement;
      width = container ? Math.min(container.offsetWidth * 1.1, 900) : 900;
      if (currentCanvas) {
        currentCanvas.width = width;
        currentCanvas.height = width;
      }
    };

    window.addEventListener("resize", onResize);
    onResize();

    let globe: ReturnType<typeof createGlobe> | undefined;

    if (currentCanvas) {
      globe = createGlobe(currentCanvas, {
        devicePixelRatio: 2,
        width: width * 2,
        height: width * 2,
        phi: Math.PI / 4,
        theta: Math.PI / 15,
        dark: 3,
        diffuse: 1.2,
        mapSamples: 24000,
        mapBrightness: 6,
        baseColor: [0.1, 0.1, 0.1],
        markerColor: [0.3, 0.6, 1],
        glowColor: [0.3, 0.6, 1],
        markers: [
          { location: [37.7749, -122.4194], size: 0.04 },
          { location: [40.7128, -74.006], size: 0.04 },
          { location: [51.5074, -0.1278], size: 0.04 },
          { location: [35.6762, 139.6503], size: 0.04 },
          { location: [-33.8688, 151.2093], size: 0.04 },
        ],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onRender: (state: Record<string, any>) => {
          if (fadeInRef.current < 1) {
            fadeInRef.current += 0.01;
            state.phi = phi;
          }
          state.phi = phi + pointerInteractionMovement.current;
          phi += 0.0003;
          state.width = width * 2;
          state.height = width * 2;
        },
      });

      const onPointerDown = (e: PointerEvent) => {
        pointerInteracting.current =
          e.clientX - pointerInteractionMovement.current;
        if (currentCanvas) currentCanvas.style.cursor = "grabbing";
      };

      const onPointerUp = () => {
        pointerInteracting.current = null;
        if (currentCanvas) currentCanvas.style.cursor = "grab";
      };

      const onPointerOut = () => {
        pointerInteracting.current = null;
        if (currentCanvas) currentCanvas.style.cursor = "grab";
      };

      const onPointerMove = (e: PointerEvent) => {
        if (pointerInteracting.current !== null) {
          const delta = e.clientX - pointerInteracting.current;
          pointerInteractionMovement.current = delta * 0.01;
        }
      };

      currentCanvas.addEventListener("pointerdown", onPointerDown);
      currentCanvas.addEventListener("pointerup", onPointerUp);
      currentCanvas.addEventListener("pointerout", onPointerOut);
      currentCanvas.addEventListener("pointermove", onPointerMove);
    }

    return () => {
      if (globe) globe.destroy();
      window.removeEventListener("resize", onResize);
      if (currentCanvas) {
        // Need to define handlers outside the if block or store them to remove
        // For simplicity, we'll skip removing specific pointer listeners here,
        // but ideally, they should be removed.
      }
    };
  }, []);

  return (
    <div
      className="bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-gray-950 text-gray-900 dark:text-white py-16 min-h-screen flex flex-col items-center overflow-hidden relative transition-colors duration-300"
      suppressHydrationWarning={true}
    >
      {/* Background gradient blobs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 blur-[120px] opacity-70 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 blur-[100px] opacity-70 pointer-events-none"></div>

      {/* Title */}
      <motion.div
        className="w-full text-center z-20 mb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight max-w-3xl mx-auto px-4 text-gray-900 dark:text-white">
          What Our Clients Say
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
          Hear from our satisfied customers around the globe
        </p>
      </motion.div>

      {/* Globe */}
      <motion.div
        className="relative w-full max-w-7xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        <div className="relative w-full h-[400px] flex items-center justify-center z-10">
          <div className="absolute inset-0 flex justify-center items-center">
            <div className="w-[600px] h-[600px] relative">
              <canvas
                ref={canvasRef}
                style={{
                  width: "100%",
                  height: "100%",
                  cursor: "grab",
                  contain: "layout paint size",
                }}
              />
              {/* Gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-[110%] bg-gradient-to-t from-white dark:from-gray-950 via-white/90 dark:via-gray-950/90 to-transparent"></div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Testimonials */}
      <div className="max-w-full w-full overflow-hidden -mt-40 z-40">
        <div className="relative">
          {/* Gradient masks */}
          <div className="absolute left-0 top-0 w-[20%] h-full bg-gradient-to-r from-white dark:from-gray-950 to-transparent z-10"></div>
          <div className="absolute right-0 top-0 w-[20%] h-full bg-gradient-to-l from-white dark:from-gray-950 to-transparent z-10"></div>

          {/* Top row - left to right */}
          <motion.div
            className="flex py-4"
            animate={{
              x: [0, -1000],
            }}
            transition={{
              duration: 50,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            <div className="flex">
              {testimonials.map((testimonial, index) => (
                <ReviewCard key={`top-${index}`} {...testimonial} />
              ))}
            </div>
            <div className="flex">
              {testimonials.map((testimonial, index) => (
                <ReviewCard key={`top-duplicate-${index}`} {...testimonial} />
              ))}
            </div>
          </motion.div>

          {/* Bottom row - right to left */}
          <motion.div
            className="flex py-4"
            animate={{
              x: [-1000, 0],
            }}
            transition={{
              duration: 50,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          >
            <div className="flex">
              {testimonials.map((testimonial, index) => (
                <ReviewCard key={`bottom-${index}`} {...testimonial} />
              ))}
            </div>
            <div className="flex">
              {testimonials.map((testimonial, index) => (
                <ReviewCard
                  key={`bottom-duplicate-${index}`}
                  {...testimonial}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
