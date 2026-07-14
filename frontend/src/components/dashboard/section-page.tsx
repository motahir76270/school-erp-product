'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { ArrowRight, CalendarDays, FileText, Settings, Users } from 'lucide-react';

interface DashboardSectionPageProps {
  title: string;
  description?: string;
  summary?: string;
  highlights?: string[];
}

export function DashboardSectionPage({
  title,
  description,
  summary,
  highlights = [
    'Track the latest records for this section.',
    'Use the dashboard tools to manage daily tasks.',
    'Review upcoming actions and keep your workflow current.',
  ],
}: DashboardSectionPageProps) {
  const pageDescription = description || `Manage ${title.toLowerCase()} from the dashboard.`;

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={pageDescription} />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{summary || 'This section is now using the dashboard view and is ready for your workflow.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Live dashboard view</Badge>
              <Badge variant="outline">Ready for data</Badge>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Useful next steps for this module.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm">Review records and assigned users</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm">Open recent entries and updates</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-sm">Plan upcoming activities and deadlines</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Settings className="h-4 w-4 text-primary" />
              <span className="text-sm">Adjust module preferences and visibility</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
