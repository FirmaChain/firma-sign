import { motion } from 'framer-motion';
import { ArrowRight, Github } from 'lucide-react';

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center relative section">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-brand-primary font-semibold text-lg mb-6"
          >
            Sign Documents. Peer-to-Peer. No Middleman.
          </motion.p>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold font-metropolis mb-6 leading-tight"
          >
            Transform Document Signing
            <span className="block text-gradient mt-2">with True Web3 Technology</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Experience the future of document signing - directly between peers,
            secured by blockchain, owned by you.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <button className="btn btn-primary text-lg px-8 py-4 group">
              Start Signing for Free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="btn btn-secondary text-lg px-8 py-4">
              See How It Works
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-16 flex flex-wrap justify-center gap-8 text-text-tertiary"
          >
            <div className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              <span>Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>No Vendor Lock-in</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-primary">∞</span>
              <span>Forever Free Core</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-brand-primary">🔒</span>
              <span>Blockchain Secured</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Animated Background Elements */}
        <motion.div
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="absolute top-20 left-10 w-20 h-20 bg-brand-primary/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            y: [0, 10, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="absolute bottom-20 right-10 w-32 h-32 bg-brand-secondary/10 rounded-full blur-xl"
        />
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-text-tertiary rounded-full p-1"
        >
          <div className="w-1 h-2 bg-text-tertiary rounded-full mx-auto" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;