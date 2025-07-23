"use client";

import { Button } from "~/components/ui/button";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="w-full flex flex-col items-center justify-center py-16 md:py-28 bg-gradient-to-b from-primary/10 to-background relative overflow-hidden">
      {/* Animated background shapes */}
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-3xl rounded-full z-0"
      />
      <motion.h1
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-5xl md:text-7xl font-extrabold text-center text-primary drop-shadow-lg z-10"
      >
        Filter My College
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="mt-6 text-lg md:text-2xl text-muted-foreground text-center max-w-2xl z-10"
      >
        Discover the best colleges and courses for you. Instantly filter by cutoff, category, and more—find your perfect fit in seconds!
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.7 }}
        className="mt-8 z-10"
      >
        <Button size="lg" className="text-lg px-8 py-5 shadow-lg cursor-pointer" onClick={() => {
          const cutoffData = document.getElementById("cutoff-data");
          if (cutoffData) {
            cutoffData.scrollIntoView({ behavior: "smooth" });
          }
        }}>
          Get Started
        </Button>
      </motion.div>
    </section>
  );
} 