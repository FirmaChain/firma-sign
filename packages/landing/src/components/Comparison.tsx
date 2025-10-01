import { motion } from 'framer-motion';
import { Check, X } from 'lucide-react';

const Comparison = () => {
  const comparisons = [
    {
      feature: 'Document Storage',
      traditional: 'Centralized servers',
      firmaSign: 'Direct P2P transfer',
    },
    {
      feature: 'Pricing Model',
      traditional: 'Monthly/yearly fees',
      firmaSign: 'Free core forever',
    },
    {
      feature: 'Data Ownership',
      traditional: 'Vendor controls',
      firmaSign: 'You own everything',
    },
    {
      feature: 'Infrastructure',
      traditional: 'Single point of failure',
      firmaSign: 'Decentralized network',
    },
    {
      feature: 'Vendor Lock-in',
      traditional: 'Proprietary format',
      firmaSign: 'Open standards',
    },
    {
      feature: 'Privacy',
      traditional: 'Company access',
      firmaSign: 'End-to-end encrypted',
    },
    {
      feature: 'Availability',
      traditional: 'Server dependent',
      firmaSign: 'Always available P2P',
    },
    {
      feature: 'Verification',
      traditional: 'Company database',
      firmaSign: 'Blockchain permanent',
    },
  ];

  return (
    <section className="section">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-brand-primary font-semibold text-lg mb-4">The Difference</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-metropolis mb-6">
            Traditional vs Firma-Sign
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            See why decentralized signing is the future
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="overflow-x-auto"
        >
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-4 px-4 text-text-secondary font-medium">Feature</th>
                <th className="text-center py-4 px-4">
                  <div className="inline-flex items-center gap-2">
                    <X className="w-5 h-5 text-red-400" />
                    <span className="text-red-400 font-semibold">Traditional E-Signatures</span>
                  </div>
                </th>
                <th className="text-center py-4 px-4">
                  <div className="inline-flex items-center gap-2">
                    <Check className="w-5 h-5 text-brand-primary" />
                    <span className="text-gradient font-semibold">Firma-Sign</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((row, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-6 px-4 font-medium">{row.feature}</td>
                  <td className="py-6 px-4 text-center">
                    <span className="inline-flex items-center justify-center px-4 py-2 bg-red-500/10 text-red-400 rounded-lg text-sm">
                      {row.traditional}
                    </span>
                  </td>
                  <td className="py-6 px-4 text-center">
                    <span className="inline-flex items-center justify-center px-4 py-2 bg-brand-primary/10 text-brand-primary rounded-lg text-sm font-medium">
                      {row.firmaSign}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-2 gap-8 mt-16"
        >
          <div className="card bg-red-500/5 border-red-500/20">
            <h3 className="text-xl font-bold text-red-400 mb-4">The Old Way</h3>
            <p className="text-text-secondary">
              Upload documents to corporate servers, pay monthly fees, hope they stay in business,
              trust them with your data.
            </p>
          </div>
          <div className="card bg-brand-primary/5 border-brand-primary/20">
            <h3 className="text-xl font-bold text-gradient mb-4">The New Way</h3>
            <p className="text-text-secondary">
              Send documents directly peer-to-peer, use it free forever, own your data completely,
              verify on blockchain permanently.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Comparison;