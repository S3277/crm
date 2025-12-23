import {
  BarChart3,
  Flame,
  PhoneCall,
  User,
  Phone,
} from 'lucide-react';
import { GlowingEffect } from './glowing-effect';
import { cn } from '../../lib/utils';

interface DashboardGridProps {
  onNavigate?: (page: 'leads' | 'automation' | 'quick-analytics' | 'inbound-leads') => void;
  onProfileClick?: () => void;
}

export function DashboardGrid({ onNavigate, onProfileClick }: DashboardGridProps) {
  return (
    <ul className="grid grid-cols-1 grid-rows-none gap-2 md:grid-cols-12 md:grid-rows-4 lg:gap-2 xl:max-h-auto xl:grid-rows-2">
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/4]"
        icon={<BarChart3 className="h-4 w-4" />}
        title="Quick Analytics"
        description="View real-time stats on total, hot and warm leads."
        onClick={() => onNavigate?.('quick-analytics')}
        clickable
        buttonAlign="start"
      />
      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:1/4/2/7]"
        icon={<Flame className="h-4 w-4" />}
        title="Hot Leads Queue"
        description="Focus on leads with the highest close probability."
        onClick={() => onNavigate?.('leads')}
        clickable
        buttonAlign="start"
      />
      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/7/2/10]"
        icon={<Phone className="h-4 w-4" />}
        title="Inbound Leads"
        description="Process and manage inbound lead queue for your team."
        onClick={() => onNavigate?.('inbound-leads')}
        clickable
      />
      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:1/10/2/13]"
        icon={<User className="h-4 w-4" />}
        title="Profile Settings"
        description="View and manage your account information and preferences."
        onClick={onProfileClick}
        clickable
      />
      <GridItem
        area="md:[grid-area:3/1/4/13] xl:[grid-area:2/1/3/13]"
        icon={<PhoneCall className="h-4 w-4" />}
        title="Call & SMS Automation"
        description="Trigger outreach workflows and track call results."
        onClick={() => onNavigate?.('automation')}
        clickable
        isLarge
      />
    </ul>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  onClick?: () => void;
  clickable?: boolean;
  isLarge?: boolean;
  buttonAlign?: 'start' | 'end';
}

const GridItem = ({ area, icon, title, description, onClick, clickable, isLarge, buttonAlign = 'end' }: GridItemProps) => {
  const handleDetailsClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  return (
    <li className={`min-h-[8rem] list-none ${area}`}>
      <div 
        className={cn(
          'relative h-full rounded-[1.25rem] border-2 border-slate-300 dark:border-slate-600',
          clickable && 'cursor-pointer'
        )}
      >
        {/* Decorative glowing effect - absolutely positioned, must not block clicks */}
        <div className="pointer-events-none absolute inset-0 rounded-[1.25rem]">
          <GlowingEffect
            spread={50}
            glow={true}
            disabled={false}
            proximity={80}
            inactiveZone={0.01}
            borderWidth={4}
          />
        </div>
        
        {/* Interactive content - higher z-index */}
        <div className="relative z-10 flex h-full flex-col justify-between gap-3 rounded-xl border-[0.75px] bg-background p-4 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-4">
          <div className={cn('flex flex-1 flex-col justify-start gap-3', isLarge && 'overflow-y-auto max-h-[calc(100%-3rem)]')}>
            <div className="w-fit rounded-lg border-[0.75px] border-border bg-muted p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="pt-0.5 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground">
                {title}
              </h3>
              <p className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
          {clickable && (
            <button
              onClick={handleDetailsClick}
              type="button"
              className={cn('flex-shrink-0 flex items-center', buttonAlign === 'start' ? 'justify-start' : 'justify-end', 'text-xs text-muted-foreground hover:text-cyan-400 transition-all duration-300 cursor-pointer bg-transparent border-none p-0 mt-auto')}
            >
              View details →
            </button>
          )}
        </div>
      </div>
    </li>
  );
};
