import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'Is it really free?',
      answer: 'Yes! The core P2P signing functionality will always be free. Premium features like advanced workflows may have optional fees in the future, but basic document signing between peers will remain free forever.',
    },
    {
      question: 'Do I need cryptocurrency?',
      answer: "No! While blockchain certifies your signatures, you don't need to own or understand cryptocurrency to use Firma-Sign. The blockchain verification happens automatically in the background.",
    },
    {
      question: 'Is it legally binding?',
      answer: 'Digital signatures are legally recognized in most countries under laws like eIDAS (EU), ESIGN Act (US), and similar regulations worldwide. Blockchain certification adds an extra layer of verification and proof.',
    },
    {
      question: "What if the recipient isn't online?",
      answer: 'Documents can be shared through multiple methods. If direct P2P connection is not available, you can use fallback methods like email links or temporary encrypted storage until the recipient comes online.',
    },
    {
      question: 'How secure is it?',
      answer: 'Extremely secure. Documents are encrypted end-to-end during transfer, and only signature hashes are stored on the blockchain. Your actual documents never leave your control or get stored on any central server.',
    },
    {
      question: 'What file formats are supported?',
      answer: 'Currently, Firma-Sign supports PDF documents, which is the standard for legal documents. Support for other formats like Word documents and images is planned for future updates.',
    },
    {
      question: 'Can I use it for my business?',
      answer: 'Absolutely! Firma-Sign is perfect for businesses of all sizes. From startups to enterprises, the decentralized nature ensures your business documents remain under your control.',
    },
    {
      question: 'How does it compare to DocuSign or Adobe Sign?',
      answer: 'Unlike traditional services, Firma-Sign is decentralized, has no vendor lock-in, and the core features are free forever. Your documents transfer directly between parties without being stored on corporate servers.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="section bg-dark-bg-secondary">
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
            Still have questions? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn btn-secondary">
              Read Documentation
            </button>
            <button className="btn btn-ghost">
              Join Community
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;