import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const ImageCarousel = () => {
  const carouselRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current) {
        carouselRef.current.scrollLeft += 2; // Adjust speed here
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full overflow-hidden">
      <motion.div
        ref={carouselRef}
        className="flex gap-4 w-max"
        animate={{ x: [0, -100] }}
        transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="w-48 h-48 bg-gray-300 flex-shrink-0 rounded-xl shadow-lg flex items-center justify-center"
          >
            Pic {index + 1}
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default ImageCarousel;
