'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Chrome } from 'lucide-react';
import { authSchema, type AuthValues } from '@/lib/validations';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/shared/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shared/card';
import { Input } from '@/components/shared/input';
import { toast } from 'sonner';

interface AuthFormProps {
  mode: 'login' | 'signup';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema)
  });

  async function onSubmit(values: AuthValues) {
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword(values);
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              full_name: values.email.split('@')[0]
            },
            emailRedirectTo: `${window.location.origin}/home`
          }
        });
        if (error) throw error;
      }
      toast.success(mode === 'login' ? 'Welcome back' : 'Account created');
      router.push('/home');
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Something went wrong';
      toast.error(message);
    }
  }

  async function signInWithGoogle() {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`
        }
      });
      if (error) throw error;
    } catch (error) {
      setIsGoogleLoading(false);
      const message = error instanceof Error ? error.message : 'Unable to continue with Google';
      toast.error(message);
    }
  }

  return (
    <Card className="mx-auto max-w-md border-white/8 bg-white/[0.03] p-6 shadow-glow">
      <CardHeader>
        <div className="mb-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">FitFlow</div>
        <CardTitle>{mode === 'login' ? 'Welcome back' : 'Create your account'}</CardTitle>
        <CardDescription>
          {mode === 'login'
            ? 'Sign in to resume your streaks, workout templates, and analytics.'
            : 'Start tracking workouts with a premium dashboard built for consistency.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="email">Email</label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register('email')} />
            {errors.email ? <p className="text-xs text-red-400">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="password">Password</label>
            <Input id="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="********" {...register('password')} />
            {errors.password ? <p className="text-xs text-red-400">{errors.password.message}</p> : null}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <Button variant="outline" className="w-full" disabled={isGoogleLoading} onClick={signInWithGoogle}>
          {isGoogleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Chrome className="h-4 w-4" />}
          Continue with Google
        </Button>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {mode === 'login' ? 'Need an account? ' : 'Already have an account? '}
          <Link className="text-primary hover:underline" href={mode === 'login' ? '/signup' : '/login'}>
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
