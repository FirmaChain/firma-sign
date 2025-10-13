import { motion } from 'framer-motion';
import { ExternalLink, Globe } from 'lucide-react';

const Vendors = () => {
  const vendors = [
    {
      name: 'Hereby',
      location: 'New York, United States',
      website: 'https://hereby.me',
      description: 'Technical implementation and integration support for Firma-Sign deployments',
      services: ['Custom Integration', 'Technical Consultation', 'Deployment Support'],
    },
    {
      name: 'Mintall',
      location: 'California, United States',
      website: 'https://mintall.ai',
      description: 'AI-powered solutions and blockchain integration expertise',
      services: ['Blockchain Integration', 'AI Solutions', 'NFT & IP Protection'],
    },
    {
      name: 'Kintsugi',
      location: 'Milan, Italy',
      website: 'https://kintsugi.tech/',
      description: 'End-to-end blockchain infrastructure and validator services',
      services: ['Blockchain Infrastructure', 'Validator Services', 'Ecosystem Development'],
    },
    {
      name: 'Donue',
      location: 'Seoul, South Korea',
      website: 'https://donue.co.kr/en/',
      description: 'Local technical support and enterprise solutions in Korea',
      services: ['Enterprise Support', 'Korean Localization', 'Training & Consulting'],
    },
  ];

  return (
    <section id="vendors" className="section relative overflow-hidden">
      {/* Background Gradient Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="section-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-brand-primary font-semibold text-lg mb-4">Technical Support</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-metropolis mb-6">
            Need Help Getting Started?
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            Connect with our certified vendor partners for professional technical support, custom integrations, and enterprise solutions.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {vendors.map((vendor, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              viewport={{ once: true }}
              className="card-3d group"
            >
              <div className="p-8 h-full flex flex-col">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2 group-hover:text-gradient transition-colors">
                    {vendor.name}
                  </h3>
                  <div className="flex items-center gap-2 text-text-tertiary text-sm mb-4">
                    <Globe className="w-4 h-4" />
                    <span>{vendor.location}</span>
                  </div>
                  <p className="text-text-secondary mb-6">{vendor.description}</p>
                </div>

                <div className="mb-6 flex-grow">
                  <h4 className="text-sm font-semibold text-text-tertiary uppercase mb-3">
                    Services
                  </h4>
                  <ul className="space-y-2">
                    {vendor.services.map((service, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-text-secondary text-sm">
                        <span className="text-brand-primary mt-1">•</span>
                        <span>{service}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <a
                  href={vendor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost w-full group/btn"
                >
                  Visit Website
                  <ExternalLink className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-12 flex flex-wrap justify-center gap-12 items-center opacity-50"
        >
          <div className="text-text-secondary">
            <p className="text-sm">Certified Partners</p>
          </div>
          <div className="text-text-secondary">
            <p className="text-sm">Global Coverage</p>
          </div>
          <div className="text-text-secondary">
            <p className="text-sm">Enterprise Ready</p>
          </div>
          <div className="text-text-secondary">
            <p className="text-sm">24/7 Support Available</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Vendors;
