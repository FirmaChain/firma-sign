import { motion } from 'framer-motion';
import { Github, Globe } from 'lucide-react';

// X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// Telegram icon component
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
  </svg>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const links = {
    resources: [
      { name: 'GitHub Repository', href: 'https://github.com/firmachain/firma-sign' },
      { name: 'README & Docs', href: 'https://github.com/firmachain/firma-sign#readme' },
      { name: 'Issues & Support', href: 'https://github.com/firmachain/firma-sign/issues' },
    ],
    firmachain: [
      { name: 'About FirmaChain', href: 'https://firmachain.org' },
      { name: 'Blockchain Explorer', href: 'https://explorer.firmachain.dev' },
    ],
  };

  const socials = [
    { icon: Github, href: 'https://github.com/firmachain/firma-sign', label: 'GitHub' },
    { icon: XIcon, href: 'https://x.com/firmachain', label: 'X (Twitter)' },
    { icon: TelegramIcon, href: 'https://t.me/firmachain_global', label: 'Telegram' },
    { icon: Globe, href: 'https://firmachain.org', label: 'Website' },
  ];

  return (
    <footer className="bg-dark-bg-secondary border-t border-white/5">
      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand Column */}
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold text-gradient mb-4">Firma-Sign</h3>
              <p className="text-text-secondary mb-6">
                Open-source document signing. Run it yourself, control everything.
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

          {/* Resources Column */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3">
                {links.resources.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-secondary hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* FirmaChain Column */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h4 className="font-semibold mb-4">FirmaChain</h4>
              <ul className="space-y-3">
                {links.firmachain.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
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

      </div>
    </footer>
  );
};

export default Footer;