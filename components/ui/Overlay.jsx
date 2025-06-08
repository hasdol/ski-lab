// Overlay.js
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';


const Overlay = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 bg-opacity-50"
      >
      </motion.div>
    </AnimatePresence>
  );
};

export default Overlay;
