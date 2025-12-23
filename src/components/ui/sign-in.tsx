import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';


// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  onBackToLogin?: () => void;
  isLoading?: boolean;
  error?: string;
  isSignupPage?: boolean;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30 backdrop-blur-sm transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl bg-slate-700/40 dark:bg-zinc-800/40 backdrop-blur-xl border border-white/10 p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium text-white">{testimonial.name}</p>
      <p className="text-slate-300">{testimonial.handle}</p>
      <p className="mt-1 text-slate-200">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-slate-900 dark:text-white tracking-tighter">Welcome</span>,
  description = "Access your account and continue your journey with us",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onResetPassword,
  onCreateAccount,
  onBackToLogin,
  isLoading = false,
  error = "",
  isSignupPage = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-sans w-[100dvw]">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-slate-900">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            <p className="animate-element animate-delay-200 text-slate-600 dark:text-slate-400">{description}</p>

            {error && (
              <div className="animate-element animate-delay-250 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Email Address</label>
                <GlassInputWrapper>
                  <input name="email" type="email" placeholder="Enter your email address" className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400" required />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input name="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center">
                      {showPassword ? <EyeOff className="w-5 h-5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" /> : <Eye className="w-5 h-5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" />}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="rememberMe" className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 accent-violet-600" />
                  <span className="text-slate-700 dark:text-slate-200">Keep me signed in</span>
                </label>
                <a href="#" onClick={(e) => { e.preventDefault(); onResetPassword?.(); }} className="hover:underline text-violet-600 dark:text-violet-400 transition-colors">Reset password</a>
              </div>

              <button type="submit" disabled={isLoading} className="animate-element animate-delay-600 w-full rounded-2xl bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 py-4 font-medium text-white transition-colors">
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="animate-element animate-delay-700 text-center text-sm text-slate-600 dark:text-slate-400">
              {isSignupPage ? (
                <>
                  Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); onBackToLogin?.(); }} className="text-violet-600 dark:text-violet-400 hover:underline transition-colors">Sign In</a>
                </>
              ) : (
                <>
                  New to our platform? <a href="#" onClick={(e) => { e.preventDefault(); onCreateAccount?.(); }} className="text-violet-600 dark:text-violet-400 hover:underline transition-colors">Create Account</a>
                </>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4 bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
          <div className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" style={{ backgroundImage: `url(${heroImageSrc})` }}></div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && <div className="hidden xl:flex"><TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" /></div>}
              {testimonials[2] && <div className="hidden 2xl:flex"><TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" /></div>}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
