import Hero from './components/Hero';
import Problem from './components/Problem';
import HowItWorks from './components/HowItWorks';
import Features from './components/Features';
import Comparison from './components/Comparison';
import Technology from './components/Technology';
import UseCases from './components/UseCases';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-dark-bg-primary overflow-x-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="absolute inset-0 network-bg opacity-10" />
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <Comparison />
        <Technology />
        <UseCases />
        <FAQ />
        <CTA />
        <Footer />
      </div>
    </div>
  );
}

export default App;