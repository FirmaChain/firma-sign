import { motion } from 'framer-motion';
import { ArrowRight, Github, BookOpen } from 'lucide-react';

const CTA = () => {
  return (
    <section className="section relative overflow-hidden">
      {/* Background Gradient Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Main CTA */}
          <div className="mb-20">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold font-metropolis mb-6"
            >
              Ready to Build
              <span className="block text-gradient mt-2">Your Own Signing System?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              viewport={{ once: true }}
              className="text-xl text-text-secondary max-w-2xl mx-auto mb-12"
            >
              Join the community of developers creating the future of decentralized document signing.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <a
                href="https://github.com/FirmaChain/firma-sign"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary text-lg px-10 py-4 group animate-pulse-glow"
              >
                <Github className="mr-2 w-5 h-5" />
                Get Started on GitHub
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="https://github.com/FirmaChain/firma-sign#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-lg px-10 py-4"
              >
                Read Documentation
              </a>
            </motion.div>
          </div>

          {/* Quick Start Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            viewport={{ once: true }}
            className="py-12 px-8 bg-dark-bg-tertiary rounded-2xl"
          >
            <h3 className="text-2xl font-bold mb-4">Quick Start</h3>
            <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
              Get Firma-Sign running on your machine in minutes:
            </p>
            <div className="bg-dark-bg-primary rounded-lg p-6 mb-8 text-left max-w-2xl mx-auto">
              <pre className="text-sm text-text-primary overflow-x-auto">
                <code>{`git clone https://github.com/FirmaChain/firma-sign
cd firma-sign
pnpm install
pnpm dev`}</code>
              </pre>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/FirmaChain/firma-sign"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost inline-flex items-center"
              >
                <Github className="w-5 h-5 mr-2" />
                View on GitHub
              </a>
              <a
                href="https://github.com/FirmaChain/firma-sign#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost inline-flex items-center"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Full Documentation
              </a>
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-20"
          >
            <p className="text-text-tertiary mb-8">Built by developers, for developers</p>
            <div className="flex flex-wrap justify-center gap-12 items-center opacity-50">
              <div className="text-text-secondary">
                <p className="text-sm">100% Open Source</p>
              </div>
              <div className="text-text-secondary">
                <p className="text-sm">Self-Hosted</p>
              </div>
              <div className="text-text-secondary">
                <p className="text-sm">Community Driven</p>
              </div>
              <div className="text-text-secondary">
                <p className="text-sm">MIT Licensed</p>
              </div>
            </div>
          </motion.div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-20 max-w-3xl mx-auto"
          >
            <blockquote className="text-xl text-text-secondary italic">
              "Finally, a signing tool that gives developers complete control.
              This is how open-source software should work - transparent, customizable, and truly free."
            </blockquote>
            <p className="mt-4 text-brand-primary font-semibold">
              - Open Source Developer Community
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;