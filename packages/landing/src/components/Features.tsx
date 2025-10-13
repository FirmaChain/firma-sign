import { motion } from 'framer-motion';
import { Globe, Shield, DollarSign, Smartphone, Users, Lock } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Globe,
      title: 'True Peer-to-Peer',
      description: 'Documents travel directly from you to recipients. No uploads to corporate servers. Your data stays yours.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Shield,
      title: 'Blockchain Certified',
      description: 'Every signature is permanently recorded on the blockchain - tamper-proof and verifiable forever.',
      gradient: 'from-brand-primary to-brand-secondary',
    },
    {
      icon: DollarSign,
      title: 'Forever Free Core',
      description: 'No subscriptions, no per-document fees. The peer-to-peer network is yours to use freely.',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Smartphone,
      title: 'Works Everywhere',
      description: 'Sign from any device, any location. If you can connect to the internet, you can sign documents.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Users,
      title: 'Multi-Party Signing',
      description: 'Collect signatures from multiple parties seamlessly. Everyone signs the same document, transparently.',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Lock,
      title: 'End-to-End Security',
      description: 'Military-grade encryption protects your documents from the moment they leave your device.',
      gradient: 'from-gray-500 to-gray-600',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <section id="features" className="section bg-dark-bg-secondary">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-brand-primary font-semibold text-lg mb-4">Key Features</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-metropolis mb-6">
            Why Choose Firma-Sign
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Built on true Web3 principles - decentralized, secure, and owned by you
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="card card-hover group"
            >
              {/* Icon */}
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5 mb-6`}>
                <div className="w-full h-full bg-dark-bg-tertiary rounded-xl flex items-center justify-center group-hover:bg-dark-bg-secondary transition-colors">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-text-secondary leading-relaxed">{feature.description}</p>

              {/* Hover Effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-xl transition-opacity pointer-events-none`} />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-text-secondary mb-6">
            Need help with implementation or custom integration?
          </p>
          <a href="#vendors" className="btn btn-primary">
            Contact Vendor Companies
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;