import { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useLocation } from "wouter";
import { APP_LOGO } from "@/const";

/**
 * SSO Login Page - Matches intelleges.com/login design
 */
export default function SSOLogin() {
  const { register, handleSubmit } = useForm();
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    alert("Google SSO will be configured soon");
  };

  const handleMicrosoftLogin = () => {
    alert("Microsoft SSO will be configured soon");
  };

  const onSubmit = async (data: any) => {
    try {
      setError(null);
      setLoading(true);
      const resp = await axios.post('/api/auth/login', data, { withCredentials: true });
      if (resp.data.user) {
        setLocation('/dashboard');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      {/* Card Container */}
      <div className="w-full max-w-md bg-white shadow-md rounded-xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={APP_LOGO} alt="Intelleges Logo" className="h-10 w-auto" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-center text-gray-800">
          Client Login
        </h1>

        <p className="text-center text-gray-500 mt-1 mb-6">
          Access your compliance dashboard
        </p>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {/* Email/Password Form (Hardcoded credentials) */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder="admin@intelleges.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in with Email'}
          </button>
        </form>

        <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span>OR</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg py-3 hover:bg-gray-100 transition mb-3"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-gray-700 font-medium">
            Continue with Google
          </span>
        </button>

        {/* Microsoft Button */}
        <button
          type="button"
          onClick={handleMicrosoftLogin}
          className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg py-3 hover:bg-gray-100 transition"
        >
          <svg className="h-5 w-5" viewBox="0 0 23 23">
            <path fill="#f3f3f3" d="M0 0h23v23H0z" />
            <path fill="#f35325" d="M1 1h10v10H1z" />
            <path fill="#81bc06" d="M12 1h10v10H12z" />
            <path fill="#05a6f0" d="M1 12h10v10H1z" />
            <path fill="#ffba08" d="M12 12h10v10H12z" />
          </svg>
          <span className="text-gray-700 font-medium">
            Continue with Microsoft
          </span>
        </button>

        {/* Support Link */}
        <div className="text-center mt-5">
          <a href="mailto:support@intelleges.com" className="text-blue-600 hover:underline">
            Need help? Contact Support
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-gray-400 text-sm text-center">
        © {new Date().getFullYear()} Intelleges, Inc. All rights reserved.
      </footer>
    </div>
  );
}

