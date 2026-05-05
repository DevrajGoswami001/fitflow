import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { workoutId } = await req.json();

    if (!workoutId) {
      return NextResponse.json({ error: 'Missing workoutId' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateValues = {
      completed: true,
      completed_at: new Date().toISOString()
    } satisfies Database['public']['Tables']['workouts']['Update'];

    const { error } = await supabase.from('workouts').update(updateValues).eq('id', workoutId).eq('user_id', user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    );
  }
}
