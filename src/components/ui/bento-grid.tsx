import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function BentoGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: {
  name: string;
  className?: string;
  background: ReactNode;
  Icon: any;
  description: string;
  href?: string;
  cta?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-xl',
        'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
        'hover:shadow-xl transition-all duration-300',
        className
      )}
    >
      <div className="absolute inset-0 z-0">{background}</div>

      <div className="relative z-10 flex flex-col p-6 h-full">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
            {name}
          </h3>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-auto">
          {description}
        </p>

        {href && cta && (
          <a
            href={href}
            className="mt-4 inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            {cta} →
          </a>
        )}
      </div>
    </motion.div>
  );
}
