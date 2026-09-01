"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Star, Shield, Zap } from "lucide-react";

const stats = [
  { label: "Products", value: "10K+" },
  { label: "Customers", value: "50K+" },
  { label: "Reviews", value: "200K+" },
  { label: "Countries", value: "80+" },
];

const badges = [
  { icon: Shield, text: "Secure Payments" },
  { icon: Zap, text: "Fast Delivery" },
  { icon: Star, text: "5-Star Rated" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-700/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-3xl" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <div className="max-w-4xl">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 glass rounded-full text-sm text-purple-300 mb-8 border border-purple-500/20"
          >
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            New arrivals just dropped — Shop now
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="section-title text-5xl sm:text-6xl lg:text-7xl text-white mb-6 leading-tight"
          >
            Elevate Your{" "}
            <span className="gradient-text">Lifestyle</span>
            <br />
            With Premium
            <br />
            <span className="text-purple-300">Products</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-gray-400 max-w-xl mb-10 leading-relaxed"
          >
            Discover a curated selection of premium products crafted for the
            modern lifestyle. From fashion to tech, find everything that
            elevates your world.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-4 mb-16"
          >
            <Link href="/products" className="btn-primary text-base px-8 py-3.5">
              <ShoppingBag className="w-5 h-5" />
              Shop Now
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/products?isFeatured=true"
              className="px-8 py-3.5 rounded-lg text-base font-semibold text-white border border-white/20 hover:border-purple-500/50 hover:bg-white/5 transition-all flex items-center gap-2"
            >
              <Star className="w-5 h-5 text-amber-400" />
              Featured Picks
            </Link>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap gap-4 mb-16"
          >
            {badges.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 text-sm text-gray-400"
              >
                <div className="w-7 h-7 rounded-full bg-purple-900/50 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-purple-400" />
                </div>
                {text}
              </div>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-8"
          >
            {stats.map(({ label, value }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.6 + i * 0.1 }}
              >
                <p className="text-3xl font-bold gradient-text">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-xs text-gray-500">Scroll to explore</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-5 h-8 rounded-full border border-gray-700 flex items-start justify-center p-1"
        >
          <div className="w-1 h-2 bg-purple-500 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
