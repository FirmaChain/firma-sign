import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How do I install Firma-Sign?',
      answer: 'Clone the GitHub repository and run `pnpm install`. Full installation guide is available in the README. You need Node.js 18+ and pnpm package manager. Run `pnpm -F frontend dev` to start the frontend application locally.',
    },
    {
      question: 'Is it really free?',
      answer: 'Yes! It\'s 100% open source (MIT license). Free to use, modify, and deploy forever. No hidden costs, no premium tiers, no subscriptions. Download the code and run it on your own infrastructure.',
    },
    {
      question: 'What are the system requirements?',
      answer: 'Node.js 18 or higher, pnpm package manager, and a modern browser (Chrome, Firefox, or Safari). Works on Windows, macOS, and Linux. The server package is optional - frontend can run standalone.',
    },
    {
      question: 'Is there a hosted version available?',
      answer: 'No. Firma-Sign is designed to run locally on your infrastructure. This ensures complete data ownership and privacy. You control where it runs, how it\'s configured, and who has access.',
    },
    {
      question: 'Can I customize it for my needs?',
      answer: 'Absolutely! The modular architecture allows you to add custom transports, storage backends, or modify any functionality. Fork the repo, make your changes, and deploy your own version.',
    },
    {
      question: 'Do I need blockchain/cryptocurrency?',
      answer: 'No! Blockchain integration is optional. You can use P2P document signing without any blockchain or crypto knowledge. The optional FirmaChain integration provides tamper-proof certification when you need it.',
    },
    {
      question: 'How secure is it?',
      answer: 'Extremely secure. All code is open source and auditable. Documents are encrypted end-to-end during P2P transfer. Everything runs locally on your machine - no data sent to third-party servers.',
    },
    {
      question: 'How does it compare to DocuSign or Adobe Sign?',
      answer: 'Unlike those services, Firma-Sign is a self-hosted tool, not a SaaS platform. You run it yourself, own all the code and data, pay nothing, and can customize everything. Trade-off: you need to set it up yourself.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="section bg-dark-bg-secondary">
      <div className="section-container max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-brand-primary font-semibold text-lg mb-4">Questions & Answers</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-metropolis mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Everything you need to know about Firma-Sign
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              viewport={{ once: true }}
              className="card cursor-pointer hover:border-brand-primary/30"
              onClick={() => toggleFAQ(index)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                <div className="flex-shrink-0">
                  {openIndex === index ? (
                    <Minus className="w-5 h-5 text-brand-primary" />
                  ) : (
                    <Plus className="w-5 h-5 text-text-tertiary" />
                  )}
                </div>
              </div>
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? 'auto' : 0,
                  opacity: openIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <p className="text-text-secondary mt-4 leading-relaxed">{faq.answer}</p>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-text-secondary mb-6">
            Need help getting started? Check out our resources!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://github.com/FirmaChain/firma-sign#readme"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              Read Documentation
            </a>
            <a
              href="https://github.com/FirmaChain/firma-sign/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              GitHub Issues
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;