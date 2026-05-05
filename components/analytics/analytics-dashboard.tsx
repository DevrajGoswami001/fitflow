'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Flame, Percent, Weight } from 'lucide-react';
import type { AnalyticsSnapshot } from '@/lib/queries';
import { Card } from '@/components/shared/card';
import { Badge } from '@/components/shared/badge';

interface AnalyticsDashboardProps {
  snapshot: AnalyticsSnapshot;
}

export function AnalyticsDashboard({ snapshot }: AnalyticsDashboardProps) {
  const chartData = snapshot.weeklySeries;

  const stats = [
    { label: 'Streak', value: snapshot.streak, icon: Flame },
    { label: 'Completion', value: `${snapshot.completionPercentage}%`, icon: Percent },
    { label: 'Workouts', value: snapshot.totalWorkouts, icon: Activity },
    { label: 'Avg sets', value: snapshot.averageSetsPerWorkout, icon: Weight }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-white/8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{stat.label}</div>
                  <div className="mt-2 text-3xl font-semibold text-foreground">{stat.value}</div>
                </div>
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Badge>Weekly streak</Badge>
            <h2 className="mt-3 text-xl font-semibold text-foreground">Consistency over the last 7 days</h2>
          </div>
          <div className="text-sm text-muted-foreground">Each completed day increases the streak by 1</div>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10,10,15,0.96)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 16
                }}
              />
              <Line type="monotone" dataKey="streak" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Completed exercises</div>
          <div className="mt-2 text-3xl font-semibold text-foreground">{snapshot.completedWorkouts}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Total exercises</div>
          <div className="mt-2 text-3xl font-semibold text-foreground">{snapshot.totalWorkouts}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Days tracked</div>
          <div className="mt-2 text-3xl font-semibold text-foreground">{snapshot.weeklySeries.length}</div>
        </Card>
      </div>
    </div>
  );
}
