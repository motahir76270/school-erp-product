// dashboard/admin/settings/page.tsx
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  Key, 
  Palette, 
  Server,

} from 'lucide-react';
import { ThemeSettings } from '@/src/components/settings/ThemeSettings';
import { ChangePassword } from '@/src/components/settings/ChangePassword';

import { Permissions } from '@/src/components/settings/Permissions';
import ConfigGateway from '@/src/components/settings/ConfigGateway';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('config-gateway');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="config-gateway" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Config Gateway
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="change-password" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Change Password
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config-gateway" className="mt-6">
          <ConfigGateway />
        </TabsContent>

        <TabsContent value="permissions" className="mt-6">
          <Permissions />
        </TabsContent>

        <TabsContent value="change-password" className="mt-6">
          <ChangePassword />
        </TabsContent>

        <TabsContent value="theme" className="mt-6">
          <ThemeSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}