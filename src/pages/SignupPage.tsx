import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SignInPage } from '../components/ui/sign-in';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

export default function SignupPage({ onBackToLogin, onBackToIntro }: { onBackToLogin?: () => void; onBackToIntro?: () => void }) {
  const { signUp } = useAuth();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700 text-center"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Account Created Successfully!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You can now sign in with your credentials.
          </p>
          <Button onClick={() => onBackToLogin?.()} className="w-full">
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = email.split('@')[0]; // Use email prefix as name if not provided

    try {
      await signUp(email, password, fullName);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    console.log("Reset password clicked");
    // TODO: Implement password reset
  };

  const handleCreateAccount = () => {
    // Already on signup page
  };

  const handleBackToLogin = () => {
    onBackToLogin?.();
  };

  return (
    <div>
      <button
        onClick={onBackToIntro}
        className="absolute top-4 left-4 z-10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors text-sm"
      >
        ← Back
      </button>
      <SignInPage
        title={<span className="font-light text-slate-900 dark:text-white tracking-tighter">Create Account</span>}
        description="Join us and start managing your leads efficiently"
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        testimonials={[]}
        onSignIn={handleSignUp}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccount}
        onBackToLogin={handleBackToLogin}
        isLoading={loading}
        error={error}
        isSignupPage={true}
      />
    </div>
  );
}
