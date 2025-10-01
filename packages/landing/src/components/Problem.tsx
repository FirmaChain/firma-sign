import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

const Problem = () => {
  const problems = [
    'Store your sensitive documents on their servers',
    'Charge recurring fees for basic functionality',
    'Create single points of failure',
    'Own your data and signing history',
  ];

  const solutions = [
    'Documents travel directly from you to recipients',
    'Free core functionality forever',
    'Decentralized & resilient network',
    'You own your data completely',
  ];

  return (
    <section className="section bg-dark-bg-secondary">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-metropolis mb-6">
            The Problem We Solve
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            In a world moving towards decentralization, why do we still rely on
            centralized services for something as fundamental as document signing?
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Traditional Problems */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-8 text-red-400">
              Traditional E-Signature Platforms
            </h3>
            <div className="space-y-4">
              {problems.map((problem, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4"
                >
                  <div className="mt-1 p-1 bg-red-500/20 rounded-full">
                    <X className="w-5 h-5 text-red-400" />
                  </div>
                  <p className="text-text-secondary text-lg">{problem}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Firma-Sign Solutions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-8 text-gradient">
              Firma-Sign Solution
            </h3>
            <div className="space-y-4">
              {solutions.map((solution, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="flex items-start gap-4"
                >
                  <div className="mt-1 p-1 bg-brand-primary/20 rounded-full">
                    <Check className="w-5 h-5 text-brand-primary" />
                  </div>
                  <p className="text-text-primary text-lg">{solution}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Visual Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          viewport={{ once: true }}
          className="mt-16 h-0.5 bg-gradient-to-r from-transparent via-brand-primary to-transparent"
        />
      </div>
    </section>
  );
};

export default Problem;