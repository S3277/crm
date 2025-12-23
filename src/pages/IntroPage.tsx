import { motion } from 'framer-motion';
import { HeroGeometric } from '../components/ui/shape-landing-hero';
import { Button } from '../components/ui/button';

export default function IntroPage({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <div className="relative">
      <HeroGeometric
        badge="327.io"
        title1="Elevate Your"
        title2="Lead Management"
      />
      
      <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 2 }}
        >
          <Button
            onClick={onGetStarted}
            className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 text-white font-semibold rounded-lg"
          >
            Get Started
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
