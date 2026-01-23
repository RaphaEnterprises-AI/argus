'use client';

import { SignInButton, SignUpButton } from '@clerk/nextjs';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuthButtonsProps {
  variant?: 'nav' | 'hero' | 'cta' | 'pricing';
  ctaText?: string;
  popular?: boolean;
}

export function AuthButtons({ variant = 'nav', ctaText, popular }: AuthButtonsProps) {
  const [mounted, setMounted] = useState(false);

  // Only render buttons after client-side hydration is complete
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show placeholder during SSR/hydration to prevent mismatch
  if (!mounted) {
    if (variant === 'nav') {
      return (
        <div className="flex items-center gap-3">
          <div className="btn-ghost text-sm opacity-0">Sign In</div>
          <div className="btn-primary text-sm opacity-0">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      );
    }
    if (variant === 'hero') {
      return (
        <button className="group w-full sm:w-auto btn-gradient-glass px-8 py-4 text-base rounded-2xl opacity-0">
          <Sparkles className="w-5 h-5" />
          Start Free
          <ArrowRight className="w-5 h-5" />
        </button>
      );
    }
    if (variant === 'cta') {
      return (
        <button className="group btn-gradient-glass px-10 py-4 text-lg rounded-2xl opacity-0">
          Get Started Free
          <ArrowRight className="w-5 h-5" />
        </button>
      );
    }
    if (variant === 'pricing') {
      return (
        <button className={`w-full py-3 rounded-xl font-medium opacity-0 ${
          popular ? 'btn-primary' : 'btn-glass'
        }`}>
          {ctaText}
        </button>
      );
    }
    return null;
  }

  if (variant === 'nav') {
    return (
      <div className="flex items-center gap-3">
        <SignInButton mode="modal">
          <button className="btn-ghost text-sm hover:bg-muted/50">Sign In</button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="btn-primary text-sm">
            Get Started
            <ArrowRight className="w-4 h-4" />
          </button>
        </SignUpButton>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <SignUpButton mode="modal">
        <button className="group w-full sm:w-auto btn-gradient-glass px-8 py-4 text-base rounded-2xl">
          <Sparkles className="w-5 h-5 animate-sparkle" />
          Start Free
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </SignUpButton>
    );
  }

  if (variant === 'cta') {
    return (
      <SignUpButton mode="modal">
        <button className="group btn-gradient-glass px-10 py-4 text-lg rounded-2xl">
          <Sparkles className="w-5 h-5 animate-sparkle" />
          Get Started Free
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </SignUpButton>
    );
  }

  if (variant === 'pricing') {
    return (
      <SignUpButton mode="modal">
        <button className={`w-full py-3.5 rounded-xl font-medium transition-all duration-300 ${
          popular
            ? 'btn-primary text-black'
            : 'btn-glass text-foreground hover:border-primary/40'
        }`}>
          {ctaText}
          <ArrowRight className="w-4 h-4 inline-block ml-2" />
        </button>
      </SignUpButton>
    );
  }

  return null;
}
