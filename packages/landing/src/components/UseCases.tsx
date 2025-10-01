import { motion } from 'framer-motion';
import { User, Briefcase, Users2, Building } from 'lucide-react';

const UseCases = () => {
  const useCases = [
    {
      icon: User,
      title: 'For Individuals',
      items: [
        'Personal agreements',
        'Rental contracts',
        'Legal documents',
        'Permission forms',
      ],
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Briefcase,
      title: 'For Businesses',
      items: [
        'Sales contracts',
        'NDAs',
        'Employment agreements',
        'Partner agreements',
      ],
      gradient: 'from-brand-primary to-brand-secondary',
    },
    {
      icon: Users2,
      title: 'For Communities',
      items: [
        'DAO governance documents',
        'Community agreements',
        'Open source licenses',
        'Collaborative projects',
      ],
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Building,
      title: 'For Organizations',
      items: [
        'Board resolutions',
        'Policy documents',
        'Compliance forms',
        'Audit reports',
      ],
      gradient: 'from-orange-500 to-red-500',
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
          <p className="text-brand-primary font-semibold text-lg mb-4">Who Benefits</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-metropolis mb-6">
            Use Cases
          </h2>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            From personal documents to enterprise contracts - Firma-Sign handles it all
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              viewport={{ once: true }}
              className="card hover:border-brand-primary/30 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${useCase.gradient} p-0.5 mb-6`}>
                <div className="w-full h-full bg-dark-bg-tertiary rounded-lg flex items-center justify-center">
                  <useCase.icon className="w-7 h-7 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4">{useCase.title}</h3>
              <ul className="space-y-3">
                {useCase.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 bg-brand-primary rounded-full mt-2" />
                    <span className="text-text-secondary text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Success Stories */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <div className="inline-flex items-center gap-8 flex-wrap justify-center">
            <div>
              <p className="text-4xl font-bold text-gradient">10,000+</p>
              <p className="text-text-secondary">Documents Signed</p>
            </div>
            <div className="w-px h-12 bg-white/10 hidden sm:block" />
            <div>
              <p className="text-4xl font-bold text-gradient">50+</p>
              <p className="text-text-secondary">Countries</p>
            </div>
            <div className="w-px h-12 bg-white/10 hidden sm:block" />
            <div>
              <p className="text-4xl font-bold text-gradient">100%</p>
              <p className="text-text-secondary">Decentralized</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default UseCases;