"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";

// All gallery images from assets
const galleryImages = [
  // Studio A
  "/studios/studio-a.jpeg",
  "/studios/studio-a-2.jpeg",
  "/studios/studio-a-3.jpeg",
  "/studios/studio-a-4.jpeg",
  // Studio B
  "/studios/studio-b.jpeg",
  "/studios/studio-b-2.jpeg",
  "/studios/studio-b-3.jpeg",
  "/studios/studio-b-4.jpeg",
  // Studio C
  "/studios/studio-c.jpeg",
  "/studios/studio-c-2.jpeg",
];

// Optimized animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.03,
    },
  },
};

export default function GalleryPage() {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);

  // Auto-scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCarouselIndex((prev) => (prev + 1) % galleryImages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const goToPrevious = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const goToNext = () => {
    if (
      selectedImageIndex !== null &&
      selectedImageIndex < galleryImages.length - 1
    ) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-12 text-center"
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
            Gallery
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Take a virtual tour of our studios and equipment
          </p>
        </motion.div>

        {/* Featured Carousel */}
        <motion.div
          className="mb-12 relative h-80 md:h-[500px] rounded-3xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentCarouselIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <Image
                src={galleryImages[currentCarouselIndex]}
                alt="Gallery image"
                fill
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>

          {/* Carousel Navigation */}
          <button
            onClick={() =>
              setCurrentCarouselIndex(
                (prev) =>
                  (prev - 1 + galleryImages.length) % galleryImages.length
              )
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() =>
              setCurrentCarouselIndex(
                (prev) => (prev + 1) % galleryImages.length
              )
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {galleryImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentCarouselIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentCarouselIndex === index
                    ? "bg-white w-6"
                    : "bg-white/50 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Gallery Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {galleryImages.map((image, index) => (
            <motion.div
              key={index}
              className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
              variants={fadeInUp}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -3, scale: 1.02 }}
              onClick={() => setSelectedImageIndex(index)}
            >
              <Image
                src={image}
                alt="Gallery image"
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
              onClick={() => setSelectedImageIndex(null)}
            />

            {/* Close Button */}
            <motion.button
              className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={() => setSelectedImageIndex(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Navigation Arrows */}
            {selectedImageIndex > 0 && (
              <motion.button
                className="absolute left-4 md:left-8 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                onClick={goToPrevious}
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            )}

            {selectedImageIndex < galleryImages.length - 1 && (
              <motion.button
                className="absolute right-4 md:right-8 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                onClick={goToNext}
                whileHover={{ scale: 1.1, x: 2 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronRight className="w-6 h-6" />
              </motion.button>
            )}

            {/* Image Container */}
            <motion.div
              className="relative z-10 w-full max-w-5xl mx-4 md:mx-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="aspect-video rounded-2xl overflow-hidden relative">
                <Image
                  src={galleryImages[selectedImageIndex]}
                  alt="Gallery image"
                  fill
                  className="object-cover"
                />
              </div>

              {/* Image Counter */}
              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-zinc-400 text-sm">
                  {selectedImageIndex + 1} of {galleryImages.length}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
