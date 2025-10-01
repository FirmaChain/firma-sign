import { motion } from 'framer-motion';
import { Github, Twitter, MessageSquare, Globe } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    product: [
      { name: 'Features', href: '#features' },
      { name: 'How It Works', href: '#how-it-works' },
      { name: 'Use Cases', href: '#use-cases' },
      { name: 'Technology', href: '#technology' },
    ],
    developers: [
      { name: 'Documentation', href: '#' },
      { name: 'GitHub', href: 'https://github.com/firmachain/firma-sign' },
      { name: 'API Reference', href: '#' },
      { name: 'Contributing', href: '#' },
    ],
    company: [
      { name: 'About FirmaChain', href: 'https://firmachain.org' },
      { name: 'Blog', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Contact', href: '#' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Security', href: '#' },
      { name: 'Compliance', href: '#' },
    ],
  };

  const socials = [
    { icon: Github, href: 'https://github.com/firmachain/firma-sign', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: MessageSquare, href: '#', label: 'Discord' },
    { icon: Globe, href: 'https://firmachain.org', label: 'Website' },
  ];

  return (
    <footer className="bg-dark-bg-secondary border-t border-white/5">
      <div className="section-container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-gradient mb-4">Firma-Sign</h3>
              <p className="text-text-secondary mb-6">
                Signing documents the way the internet was meant to work - peer to peer, no gatekeepers.
              </p>
              <div className="flex gap-4">
                {socials.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-lg bg-white/5 hover:bg-brand-primary/20 flex items-center justify-center transition-colors"
                  >
                    <social.icon className="w-5 h-5 text-text-secondary hover:text-white" />
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Links Columns */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-3">
                {links.product.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-text-secondary hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h4 className="font-semibold mb-4">Developers</h4>
              <ul className="space-y-3">
                {links.developers.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-text-secondary hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                {links.company.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-text-secondary hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-3">
                {links.legal.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-text-secondary hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-12 pt-8 border-t border-white/5"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-text-tertiary text-sm">
              © {currentYear} FirmaChain. All rights reserved.
            </p>
            <div className="flex gap-6">
              <span className="text-text-tertiary text-sm">Open Source</span>
              <span className="text-text-tertiary text-sm">•</span>
              <span className="text-text-tertiary text-sm">MIT License</span>
              <span className="text-text-tertiary text-sm">•</span>
              <span className="text-text-tertiary text-sm">Built with ❤️ by the community</span>
            </div>
          </div>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          viewport={{ once: true }}
          className="mt-8 flex flex-wrap justify-center gap-8 text-text-tertiary text-xs"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Network Online</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔒</span>
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-2">
            <span>⚡</span>
            <span>Lightning Fast</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🌍</span>
            <span>Global CDN</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;