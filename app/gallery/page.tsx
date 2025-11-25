'use client';

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, ChevronLeft, ChevronRight, Music, Camera, Maximize2 } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

type GalleryItem = {
  id: number;
  title: string;
  category: string;
  gradient: string;
};

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const galleryItems: GalleryItem[] = [
    { id: 1, title: "Studio A - Main View", category: "studio-a", gradient: "from-orange-500 via-pink-500 to-violet-600" },
    { id: 2, title: "Studio A - Equipment", category: "studio-a", gradient: "from-pink-500 via-purple-500 to-indigo-600" },
    { id: 3, title: "Studio A - Karaoke Setup", category: "studio-a", gradient: "from-violet-500 via-purple-500 to-orange-500" },
    { id: 4, title: "Studio B - Overview", category: "studio-b", gradient: "from-orange-600 via-red-500 to-purple-600" },
    { id: 5, title: "Studio B - Recording Session", category: "studio-b", gradient: "from-pink-600 via-violet-500 to-purple-600" },
    { id: 6, title: "Studio C - Podcast Setup", category: "studio-c", gradient: "from-violet-600 via-purple-500 to-orange-500" },
    { id: 7, title: "Studio C - Recording Booth", category: "studio-c", gradient: "from-orange-500 via-pink-500 to-violet-600" },
    { id: 8, title: "Control Room", category: "equipment", gradient: "from-indigo-600 via-purple-500 to-pink-500" },
    { id: 9, title: "Drum Kit", category: "equipment", gradient: "from-violet-600 via-purple-600 to-orange-500" },
    { id: 10, title: "Mixing Console", category: "equipment", gradient: "from-purple-600 via-pink-500 to-orange-500" },
    { id: 11, title: "Microphone Setup", category: "equipment", gradient: "from-orange-500 via-red-500 to-purple-600" },
    { id: 12, title: "65\" TV Screen - Studio A", category: "studio-a", gradient: "from-pink-500 via-purple-600 to-indigo-600" },
  ];

  const filters = [
    { id: "all", label: "All" },
    { id: "studio-a", label: "Studio A" },
    { id: "studio-b", label: "Studio B" },
    { id: "studio-c", label: "Studio C" },
    { id: "equipment", label: "Equipment" },
  ];

  const filteredItems = activeFilter === "all" 
    ? galleryItems 
    : galleryItems.filter(item => item.category === activeFilter);

  const currentIndex = selectedImage ? filteredItems.findIndex(item => item.id === selectedImage.id) : -1;

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSelectedImage(filteredItems[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (currentIndex < filteredItems.length - 1) {
      setSelectedImage(filteredItems[currentIndex + 1]);
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
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Gallery</h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Take a virtual tour of our studios and equipment
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="flex flex-wrap justify-center gap-2 mb-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {filters.map((filter) => (
            <motion.button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeFilter === filter.id
                  ? "bg-violet-500 text-white shadow-lg shadow-violet-500/25"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {filter.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Gallery Grid */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          key={activeFilter}
        >
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer"
              variants={fadeInUp}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => setSelectedImage(item)}
            >
              {/* Gradient Background (placeholder for actual images) */}
              <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`} />
              
              {/* Music Icon Placeholder */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Music className="w-12 h-12 text-white/30" />
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                <motion.div 
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  initial={{ scale: 0.8 }}
                  whileHover={{ scale: 1 }}
                >
                  <Maximize2 className="w-8 h-8 text-white" />
                </motion.div>
              </div>
              
              {/* Title */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-medium text-sm">{item.title}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <motion.div 
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Camera className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-400">No images found in this category</p>
          </motion.div>
        )}

        {/* Image Count */}
        <motion.p 
          className="text-center text-zinc-500 text-sm mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Showing {filteredItems.length} of {galleryItems.length} images
        </motion.p>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black/95 backdrop-blur-xl"
              onClick={() => setSelectedImage(null)}
            />
            
            {/* Close Button */}
            <motion.button
              className="absolute top-6 right-6 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              onClick={() => setSelectedImage(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-6 h-6" />
            </motion.button>

            {/* Navigation Arrows */}
            {currentIndex > 0 && (
              <motion.button
                className="absolute left-4 md:left-8 z-10 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                onClick={goToPrevious}
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.9 }}
              >
                <ChevronLeft className="w-6 h-6" />
              </motion.button>
            )}
            
            {currentIndex < filteredItems.length - 1 && (
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
              <div className={`aspect-video rounded-2xl overflow-hidden bg-gradient-to-br ${selectedImage.gradient} flex items-center justify-center`}>
                <Music className="w-24 h-24 text-white/30" />
              </div>
              
              {/* Image Info */}
              <motion.div 
                className="mt-6 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-xl font-bold text-white mb-2">{selectedImage.title}</h3>
                <p className="text-zinc-400 text-sm">
                  {currentIndex + 1} of {filteredItems.length}
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
