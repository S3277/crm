import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SignInPage } from '../components/ui/sign-in';

export default function LoginPage({ onCreateAccount, onBackToIntro }: { onCreateAccount?: () => void; onBackToIntro?: () => void }) {
  const { signIn } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    console.log("Reset password clicked");
    // TODO: Implement password reset
  };

  const handleCreateAccountClick = () => {
    onCreateAccount?.();
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
        title={<span className="font-light text-slate-900 dark:text-white tracking-tighter">Welcome Back</span>}
        description="Sign in to access your CRM dashboard"
        heroImageSrc="https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80"
        testimonials={[]}
        onSignIn={handleSignIn}
        onResetPassword={handleResetPassword}
        onCreateAccount={handleCreateAccountClick}
        isLoading={loading}
        error={error}
      />
    </div>
  );
}
