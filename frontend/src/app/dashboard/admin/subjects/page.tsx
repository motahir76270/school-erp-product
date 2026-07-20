// dashboard/admin/subjects/page.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, Layers } from 'lucide-react';
import { SubjectsList } from '@/src/components/subjectAssign/subjectList';
import ClassSubjects from '@/src/components/subjectAssign/classSubjects';
import SectionSubjects from '@/src/components/subjectAssign/sectionSubject';

export default function SubjectsPage() {
  const [activeTab, setActiveTab] = useState('subjects');

  return (
    <div className="space-y-6">
      {/* Tabs for navigation - No routing, just component switching */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="class" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Class Subjects
          </TabsTrigger>
          <TabsTrigger value="section" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Section Subjects
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="subjects" className="mt-6">
          <SubjectsList />
        </TabsContent>
        
        <TabsContent value="class" className="mt-6">
          <ClassSubjects />
        </TabsContent>
        
        <TabsContent value="section" className="mt-6">
          <SectionSubjects />
        </TabsContent>
      </Tabs>
    </div>
  );
}