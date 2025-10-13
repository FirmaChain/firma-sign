import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Menu, X } from 'lucide-react';

const sections = [
  { id: 'hero', label: 'Home' },
  { id: 'problem', label: 'Problem' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'features', label: 'Features' },
  { id: 'comparison', label: 'Comparison' },
  { id: 'technology', label: 'Technology' },
  { id: 'use-cases', label: 'Use Cases' },
  { id: 'faq', label: 'FAQ' },
  { id: 'vendors', label: 'Support' },
];

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show navigation bar after scrolling
      setIsScrolled(window.scrollY > 100);

      // Show scroll to top button after scrolling down
      setShowScrollTop(window.scrollY > 500);

      // Detect active section
      const scrollPosition = window.scrollY + 200;

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    // Handle initial hash on page load
    const handleInitialHash = () => {
      const hash = window.location.hash.slice(1); // Remove the # symbol
      if (hash) {
        // Small delay to ensure DOM is ready
        window.setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    };

    // Handle hash changes (browser back/forward)
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };

    handleInitialHash();
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Update URL hash
      window.history.pushState(null, '', `#${sectionId}`);
      // Smooth scroll to section
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const scrollToTop = () => {
    // Update URL to remove hash or set to #hero
    window.history.pushState(null, '', '#hero');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Desktop Navigation Bar */}
      <AnimatePresence>
        {isScrolled && (
          <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50 bg-dark-bg-secondary/95 backdrop-blur-lg border-b border-white/10"
          >
            <div className="section-container">
              <div className="flex items-center justify-between py-4">
                {/* Logo */}
                <a
                  href="#hero"
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToTop();
                  }}
                  className="text-xl font-bold text-gradient hover:opacity-80 transition-opacity"
                >
                  Firma-Sign
                </a>

                {/* Desktop Menu */}
                <div className="hidden lg:flex items-center gap-1">
                  {sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(section.id);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeSection === section.id
                          ? 'bg-brand-primary/20 text-brand-primary'
                          : 'text-text-secondary hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {section.label}
                    </a>
                  ))}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden p-2 text-text-secondary hover:text-white transition-colors"
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && isScrolled && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[73px] left-0 right-0 z-40 bg-dark-bg-secondary/98 backdrop-blur-lg border-b border-white/10 lg:hidden"
          >
            <div className="section-container py-4">
              <div className="flex flex-col gap-2">
                {sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(section.id);
                    }}
                    className={`px-4 py-3 rounded-lg text-left font-medium transition-all ${
                      activeSection === section.id
                        ? 'bg-brand-primary/20 text-brand-primary'
                        : 'text-text-secondary hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {section.label}
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-40 p-4 bg-brand-primary hover:bg-brand-primary/80 text-white rounded-full shadow-lg transition-all hover:scale-110"
            aria-label="Scroll to top"
          >
            <ChevronUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Section Progress Indicator (Desktop) */}
      <div className="hidden lg:block fixed right-8 top-1/2 -translate-y-1/2 z-40">
        <div className="flex flex-col gap-3">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(section.id);
              }}
              className="group relative"
              aria-label={`Go to ${section.label}`}
            >
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  activeSection === section.id
                    ? 'bg-brand-primary scale-125'
                    : 'bg-white/20 hover:bg-white/40 hover:scale-110'
                }`}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 px-3 py-1 bg-dark-bg-secondary/95 backdrop-blur-sm text-sm text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">
                {section.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
};

export default Navigation;
