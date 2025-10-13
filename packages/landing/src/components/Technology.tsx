import { motion } from 'framer-motion';
import { Network, Shield, Eye } from 'lucide-react';

const Technology = () => {
  return (
    <section id="technology" className="section bg-dark-bg-secondary">
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-brand-primary font-semibold text-lg mb-4">Simple Explanation</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-metropolis mb-6">
            How the Technology Works
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Cutting-edge technology made simple - no technical knowledge required
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* P2P Technology */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="card"
          >
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-0.5 mb-6">
              <div className="w-full h-full bg-dark-bg-tertiary rounded-xl flex items-center justify-center">
                <Network className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4">Peer-to-Peer Magic</h3>
            <p className="text-text-secondary mb-6">
              Just like how you can video call someone directly, Firma-Sign lets you send documents
              directly to recipients. No middleman needed.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-brand-primary rounded-full mt-2" />
                <p className="text-sm text-text-secondary">Direct connection between users</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-brand-primary rounded-full mt-2" />
                <p className="text-sm text-text-secondary">No central server required</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-brand-primary rounded-full mt-2" />
                <p className="text-sm text-text-secondary">Works like BitTorrent or Skype</p>
              </div>
            </div>
          </motion.div>

          {/* Blockchain Security */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            viewport={{ once: true }}
            className="card"
          >
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary p-0.5 mb-6">
              <div className="w-full h-full bg-dark-bg-tertiary rounded-xl flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4">Blockchain Security</h3>
            <p className="text-text-secondary mb-6">
              Think of blockchain as a permanent, public notary. Once signed, your document's
              signature is recorded forever - anyone can verify it, no one can change it.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-brand-primary rounded-full mt-2" />
                <p className="text-sm text-text-secondary">Permanent signature record</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-brand-primary rounded-full mt-2" />
                <p className="text-sm text-text-secondary">Tamper-proof verification</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-brand-primary rounded-full mt-2" />
                <p className="text-sm text-text-secondary">No cryptocurrency needed</p>
              </div>
            </div>
          </motion.div>

          {/* Privacy First */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            viewport={{ once: true }}
            className="card"
          >
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-0.5 mb-6">
              <div className="w-full h-full bg-dark-bg-tertiary rounded-xl flex items-center justify-center">
                <Eye className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4">Privacy First</h3>
            <p className="text-text-secondary mb-6">
              Your actual documents never touch the blockchain - only a unique "fingerprint" (hash)
              that proves the signature is real.
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-brand-primary rounded-full mt-2" />
                <p className="text-sm text-text-secondary">Documents stay private</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-brand-primary rounded-full mt-2" />
                <p className="text-sm text-text-secondary">End-to-end encryption</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-brand-primary rounded-full mt-2" />
                <p className="text-sm text-text-secondary">Only hash on blockchain</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Technology;