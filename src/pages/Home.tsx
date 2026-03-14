import { useState, MouseEvent } from 'react';
import { motion } from 'motion/react';

export default function Home() {
  // State to track the X and Y coordinates of the user's mouse
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Function to update the mouse position state whenever the mouse moves over the container
  // This creates the interactive glowing gradient effect
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = e;
    const { left, top } = currentTarget.getBoundingClientRect();
    setMousePosition({
      x: clientX - left,
      y: clientY - top,
    });
  };

  return (
    <div 
      className="relative flex-grow flex items-center justify-center overflow-hidden py-20"
      onMouseMove={handleMouseMove}
    >
      {/* Interactive Glow Effect Background */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `
            radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(82, 113, 255, 0.15), transparent 40%),
            radial-gradient(400px circle at ${mousePosition.x + 100}px ${mousePosition.y + 100}px, rgba(254, 209, 49, 0.1), transparent 40%)
          `
        }}
      />

      {/* Main Content Container */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-400 text-sm font-semibold tracking-wide uppercase mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-500"></span>
            </span>
            Coming Soon
          </div>
          
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Building <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-accent-500">Second Chances</span>
          </h1>
          
          {/* Sub-headline */}
          <p className="text-lg md:text-2xl text-brand-200 max-w-3xl mx-auto leading-relaxed font-light">
            We are crafting a movement of hope and restoration. A new space dedicated to connecting justice-impacted individuals and families with the resources, support, and community they need for a fresh start.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
