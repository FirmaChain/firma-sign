import { motion } from 'framer-motion';
import { Download, Upload, Share2, CheckCircle } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      number: '01',
      icon: Download,
      title: 'Install & Setup',
      description: 'Clone from GitHub and install with pnpm - runs locally on your machine',
      color: 'from-purple-500 to-purple-600',
    },
    {
      number: '02',
      icon: Upload,
      title: 'Upload & Prepare',
      description: 'Upload documents and add signature fields - all processing happens locally in your browser',
      color: 'from-blue-500 to-blue-600',
    },
    {
      number: '03',
      icon: Share2,
      title: 'Share Directly',
      description: 'Send documents peer-to-peer through libp2p - no central server, direct connections only',
      color: 'from-brand-primary to-brand-secondary',
    },
    {
      number: '04',
      icon: CheckCircle,
      title: 'Sign & Certify',
      description: 'Recipients sign locally, optional blockchain certification provides permanent proof',
      color: 'from-green-500 to-green-600',
    },
  ];

  return (
    <section id="how-it-works" className="section">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-brand-primary font-semibold text-lg mb-4">Simple 4-Step Process</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-metropolis mb-6">
            How It Works
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Get up and running in minutes. Clone, install, and you're ready to sign documents peer-to-peer.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-brand-primary/50 to-transparent" />
              )}

              {/* Step Card */}
              <div className="text-center">
                {/* Icon Container */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={`w-32 h-32 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${step.color} p-1`}
                >
                  <div className="w-full h-full bg-dark-bg-primary rounded-2xl flex items-center justify-center relative">
                    <step.icon className="w-12 h-12 text-white" />
                    <span className="absolute -top-3 -right-3 bg-dark-bg-tertiary text-brand-primary font-bold text-xl px-3 py-1 rounded-lg">
                      {step.number}
                    </span>
                  </div>
                </motion.div>

                {/* Content */}
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-text-secondary">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Requirements & Installation */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20 p-8 bg-dark-bg-tertiary rounded-2xl"
        >
          <h4 className="text-2xl font-bold mb-6 text-center">System Requirements</h4>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h5 className="text-xl font-bold mb-2">Node.js 18+</h5>
              <p className="text-text-secondary">Required runtime</p>
            </div>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-brand-primary to-brand-secondary hidden md:block" />
            <div className="text-center">
              <h5 className="text-xl font-bold mb-2">pnpm Package Manager</h5>
              <p className="text-text-secondary">For dependencies</p>
            </div>
            <div className="flex-1 h-0.5 bg-gradient-to-r from-brand-secondary to-green-500 hidden md:block" />
            <div className="text-center md:text-right">
              <h5 className="text-xl font-bold mb-2">Modern Browser</h5>
              <p className="text-text-secondary">Chrome, Firefox, Safari</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;