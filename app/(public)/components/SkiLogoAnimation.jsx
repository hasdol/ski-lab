import { motion } from 'framer-motion';

export default function SkiLogoLoader() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Left ski */}
      <motion.g
        initial={{ y: -30, x: 0, opacity: 0 }}
        animate={{ y: 0, x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} // easeOutCirc
      >
        <circle cx="30" cy="30" r="12" fill="black" />
        <circle cx="30" cy="30" r="5" fill="white" />
        <circle cx="30" cy="90" r="12" fill="black" />
        <circle cx="30" cy="90" r="5" fill="white" />
        <rect x="27" y="35" width="6" height="50" rx="3" fill="black" />
      </motion.g>

      {/* Right ski */}
      <motion.g
        initial={{ y: -30, x: 0, opacity: 0 }}
        animate={{ y: 0, x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      >
        <circle cx="80" cy="30" r="12" fill="black" />
        <circle cx="80" cy="30" r="5" fill="white" />
        <circle cx="80" cy="90" r="12" fill="black" />
        <circle cx="80" cy="90" r="5" fill="white" />
        <rect x="77" y="35" width="6" height="50" rx="3" fill="black" />
      </motion.g>
    </svg>
  );
}
