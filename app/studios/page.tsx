"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Check,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Optimized animation variants with shorter durations
const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function StudiosPage() {
  const studios = [
    {
      id: "studio-a",
      name: "Studio A",
      tag: "Large Studio",
      tagColor: "bg-red-500/20 text-red-400",
      subtitle: "Our largest and most spacious studio",
      description:
        "Perfect for big live rehearsals and large groups of Karaoke rehearsal.",
      capacity: {
        live: "10-12 musicians",
        karaoke: "Up to 30 participants",
      },
      features: [
        "Yamaha Silver Star Drum kit (with cymbals)",
        "Two Electric Guitars",
        "One Keyboard",
        "Two Guitar Amps",
        "One Bass Amp",
        "Climate controlled",
        "Professional sound system",
        'Huge 65" TV screen for karaoke',
      ],
      price: "350",
      images: [
        "/studios/studio-a.jpeg",
        "/studios/studio-a-2.jpeg",
        "/studios/studio-a-3.jpeg",
        "/studios/studio-a-4.jpeg",
      ],
    },
    {
      id: "studio-b",
      name: "Studio B",
      tag: "Medium Studio",
      tagColor: "bg-amber-500/20 text-amber-400",
      subtitle: "A versatile, moderately sized studio",
      description:
        "Adapts to your needs. Primarily recommended for karaoke rehearsal groups.",
      capacity: {
        live: "4-5 musicians",
        karaoke: "Up to 10 participants",
      },
      features: [
        '46" TV screen for karaoke',
        "Professional sound system",
        "Climate controlled",
        "Comfortable seating area",
      ],
      price: "250",
      images: [
        "/studios/studio-b.jpeg",
        "/studios/studio-b-2.jpeg",
        "/studios/studio-b-3.jpeg",
        "/studios/studio-b-4.jpeg",
      ],
    },
    {
      id: "studio-c",
      name: "Studio C",
      tag: "Small Studio",
      tagColor: "bg-emerald-500/20 text-emerald-400",
      subtitle: "Primarily designed for audio/video recording",
      description: "Also ideal for podcast production and small rehearsals.",
      capacity: {
        live: "Up to 2 musicians",
        karaoke: "Up to 5 participants",
      },
      features: [
        "Professional recording equipment",
        "Video recording setup",
        "Podcast production ready",
        "Climate controlled",
        "Intimate recording space",
      ],
      price: "200",
      images: ["/studios/studio-c.jpeg", "/studios/studio-c-2.jpeg"],
    },
  ];

  // State to track current image index for each studio
  const [currentImageIndex, setCurrentImageIndex] = useState<{
    [key: string]: number;
  }>({
    "studio-a": 0,
    "studio-b": 0,
    "studio-c": 0,
  });

  const nextImage = (studioId: string, totalImages: number) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [studioId]: (prev[studioId] + 1) % totalImages,
    }));
  };

  const prevImage = (studioId: string, totalImages: number) => {
    setCurrentImageIndex((prev) => ({
      ...prev,
      [studioId]: (prev[studioId] - 1 + totalImages) % totalImages,
    }));
  };

  // Auto-scroll effect for all studios
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => ({
        "studio-a": (prev["studio-a"] + 1) % 4,
        "studio-b": (prev["studio-b"] + 1) % 4,
        "studio-c": (prev["studio-c"] + 1) % 2,
      }));
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            href="/home"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Our Studios
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            State-of-the-art recording facilities designed for creativity and
            professional results
          </p>
        </motion.div>

        {/* Studios List */}
        <motion.div
          className="space-y-8 mb-16"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {studios.map((studio, index) => (
            <motion.div
              key={index}
              id={studio.id}
              className="glass-strong rounded-3xl overflow-hidden group scroll-mt-24"
              variants={fadeInUp}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Studio Image Carousel */}
                <div className="lg:w-2/5 h-64 lg:h-auto min-h-[280px] relative overflow-hidden bg-zinc-900">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentImageIndex[studio.id]}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={studio.images[currentImageIndex[studio.id]]}
                        alt={`${studio.name} - Image ${
                          currentImageIndex[studio.id] + 1
                        }`}
                        fill
                        className="object-cover"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation Arrows */}
                  {studio.images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          prevImage(studio.id, studio.images.length)
                        }
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          nextImage(studio.id, studio.images.length)
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Dot Indicators */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                        {studio.images.map((_, imgIndex) => (
                          <button
                            key={imgIndex}
                            onClick={() =>
                              setCurrentImageIndex((prev) => ({
                                ...prev,
                                [studio.id]: imgIndex,
                              }))
                            }
                            className={`w-2 h-2 rounded-full transition-all ${
                              currentImageIndex[studio.id] === imgIndex
                                ? "bg-white w-4"
                                : "bg-white/50 hover:bg-white/70"
                            }`}
                            aria-label={`Go to image ${imgIndex + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Studio Info */}
                <div className="lg:w-3/5 p-6 lg:p-8">
                  <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-white">
                        {studio.name}
                      </h2>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${studio.tagColor}`}
                      >
                        {studio.tag}
                      </span>
                    </div>
                    <p className="text-zinc-400">
                      {studio.subtitle}. {studio.description}
                    </p>
                  </div>

                  {/* Capacity */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-white font-medium mb-1">
                      <Users className="w-4 h-4 text-violet-400" />
                      Capacity
                    </div>
                    <p className="text-zinc-400 text-sm">
                      Live: {studio.capacity.live} | Karaoke:{" "}
                      {studio.capacity.karaoke}
                    </p>
                  </div>

                  {/* Key Features */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-white font-medium mb-3">
                      <Star className="w-4 h-4 text-amber-400" />
                      Key Features
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {studio.features.map((feature, i) => (
                        <motion.div
                          key={i}
                          className="flex items-center gap-2 text-sm text-zinc-300"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.05 }}
                        >
                          <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          {feature}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Price and CTA */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
                    <div className="bg-white/5 rounded-xl px-4 py-2">
                      <p className="text-zinc-400 text-xs">Starting from</p>
                      <p className="text-2xl font-bold text-white">
                        ₹{Number(studio.price).toLocaleString("en-IN")}
                        <span className="text-sm font-normal text-zinc-400">
                          /hour
                        </span>
                      </p>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        href="/booking/new"
                        className="btn-primary px-8 py-3 text-center block"
                      >
                        Book {studio.name}
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
