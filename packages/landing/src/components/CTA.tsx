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
              Ready to Experience
              <span className="block text-gradient mt-2">True Digital Freedom?</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              viewport={{ once: true }}
              className="text-xl text-text-secondary max-w-2xl mx-auto mb-12"
            >
              Join thousands who've already discovered the future of document signing.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button className="btn btn-primary text-lg px-10 py-4 group animate-pulse-glow">
                Launch Firma-Sign
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="btn btn-secondary text-lg px-10 py-4">
                Learn More
              </button>
            </motion.div>
          </div>

          {/* Developer CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            viewport={{ once: true }}
            className="py-12 px-8 bg-dark-bg-tertiary rounded-2xl"
          >
            <h3 className="text-2xl font-bold mb-4">For Developers</h3>
            <p className="text-text-secondary mb-8 max-w-2xl mx-auto">
              Firma-Sign is open source! Contribute to the future of decentralized document signing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://github.com/firmachain/firma-sign"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost inline-flex items-center"
              >
                <Github className="w-5 h-5 mr-2" />
                View on GitHub
              </a>
              <a
                href="#"
                className="btn btn-ghost inline-flex items-center"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Read Documentation
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
            <p className="text-text-tertiary mb-8">Trusted by innovators worldwide</p>
            <div className="flex flex-wrap justify-center gap-12 items-center opacity-50">
              {/* Placeholder for logos */}
              <div className="text-text-secondary">
                <p className="text-sm">Open Source</p>
              </div>
              <div className="text-text-secondary">
                <p className="text-sm">Community Driven</p>
              </div>
              <div className="text-text-secondary">
                <p className="text-sm">Blockchain Secured</p>
              </div>
              <div className="text-text-secondary">
                <p className="text-sm">Privacy First</p>
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
              "Finally, a signing solution that respects user privacy and data ownership.
              This is what Web3 should be - practical, accessible, and truly decentralized."
            </blockquote>
            <p className="mt-4 text-brand-primary font-semibold">
              - Web3 Developer Community
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;