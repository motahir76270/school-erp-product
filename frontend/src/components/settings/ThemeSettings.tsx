// dashboard/admin/settings/components/ThemeSettings.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-toastify';
import { 
  Palette, 
  Sun, 
  Moon, 
  Check,
  Layout,
  Eye,
  Save,
  RotateCcw,
  Monitor,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeConfig {
  mode: 'light' | 'dark' | 'blue' | 'green' | 'purple';
  fontSize: 'small' | 'medium' | 'large';
  sidebarCollapsed: boolean;
  animations: boolean;
  compactMode: boolean;
}

const themes = [
  { name: 'Light', value: 'light', icon: Sun, color: '#f8fafc' },
  { name: 'Dark', value: 'dark', icon: Moon, color: '#0f172a' },
  { name: 'Blue', value: 'blue', icon: Palette, color: '#3b82f6' },
  { name: 'Green', value: 'green', icon: Palette, color: '#22c55e' },
  { name: 'Purple', value: 'purple', icon: Palette, color: '#8b5cf6' },
];

export function ThemeSettings() {
  const [config, setConfig] = useState<ThemeConfig>({
    mode: 'light',
    fontSize: 'medium',
    sidebarCollapsed: false,
    animations: true,
    compactMode: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load saved theme settings
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedConfig = localStorage.getItem('themeConfig');
    
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed, mode: savedTheme as any }));
      } catch (e) {
        setConfig(prev => ({ ...prev, mode: savedTheme as any }));
      }
    } else {
      setConfig(prev => ({ ...prev, mode: savedTheme as any }));
    }
    
    document.documentElement.className = savedTheme;
  }, []);

  const handleThemeChange = (mode: 'light' | 'dark' | 'blue' | 'green' | 'purple') => {
    setConfig({ ...config, mode });
    document.documentElement.className = mode;
    localStorage.setItem('theme', mode);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem('themeConfig', JSON.stringify(config));
      toast.success('Theme settings saved successfully');
    } catch (error) {
      toast.error('Failed to save theme settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    const defaultConfig: ThemeConfig = {
      mode: 'light',
      fontSize: 'medium',
      sidebarCollapsed: false,
      animations: true,
      compactMode: false,
    };
    setConfig(defaultConfig);
    document.documentElement.className = 'light';
    localStorage.setItem('theme', 'light');
    localStorage.removeItem('themeConfig');
    toast.info('Theme settings reset to default');
  };

  const getThemeIcon = (value: string) => {
    const theme = themes.find(t => t.value === value);
    if (!theme) return null;
    const Icon = theme.icon;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Theme Settings</h2>
            <p className="text-[hsl(var(--muted-foreground))]">
              Customize the appearance of your dashboard
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleReset} 
              disabled={isLoading}
              className="border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Color Scheme - Theme Selection */}
          <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--card-foreground))]">
                <Palette className="h-5 w-5 text-[hsl(var(--primary))]" />
                Color Scheme
              </CardTitle>
              <CardDescription className="text-[hsl(var(--muted-foreground))]">
                Choose your preferred color theme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {themes.map((theme) => {
                  const Icon = theme.icon;
                  const isActive = config.mode === theme.value;
                  return (
                    <button
                      key={theme.value}
                      onClick={() => handleThemeChange(theme.value as any)}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                        isActive
                          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 ring-2 ring-[hsl(var(--primary))] ring-offset-2"
                          : "border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50 hover:bg-[hsl(var(--muted))]"
                      )}
                    >
                      <div className="flex items-center justify-center">
                        <Icon className={cn(
                          "h-5 w-5",
                          isActive ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))]"
                        )} />
                      </div>
                      <span className={cn(
                        "flex-1 text-sm font-medium",
                        isActive ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]"
                      )}>
                        {theme.name}
                      </span>
                      {isActive && (
                        <Check className="h-4 w-4 text-[hsl(var(--primary))]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Theme Preview Colors */}
              <div className="mt-4 p-4 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--muted))]/30">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[hsl(var(--background))] border border-[hsl(var(--border))]" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">BG</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[hsl(var(--foreground))]" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Text</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[hsl(var(--primary))]" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Primary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[hsl(var(--secondary))]" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Secondary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[hsl(var(--muted))]" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Muted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-[hsl(var(--border))]" />
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">Border</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Layout & Display */}
          <Card className="border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[hsl(var(--card-foreground))]">
                <Layout className="h-5 w-5 text-[hsl(var(--primary))]" />
                Layout & Display
              </CardTitle>
              <CardDescription className="text-[hsl(var(--muted-foreground))]">
                Customize how your dashboard looks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[hsl(var(--foreground))]">Font Size</Label>
                <Select
                  value={config.fontSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') =>
                    setConfig({ ...config, fontSize: value })
                  }
                >
                  <SelectTrigger className="border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
                    <SelectValue placeholder="Select font size" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(var(--background))] border-[hsl(var(--border))]">
                    <SelectItem 
                      value="small" 
                      className="text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                    >
                      Small
                    </SelectItem>
                    <SelectItem 
                      value="medium" 
                      className="text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                    >
                      Medium
                    </SelectItem>
                    <SelectItem 
                      value="large" 
                      className="text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
                    >
                      Large
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[hsl(var(--foreground))]">Sidebar Collapsed</Label>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Collapse sidebar to save space</p>
                </div>
                <Switch
                  checked={config.sidebarCollapsed}
                  onCheckedChange={(checked) => setConfig({ ...config, sidebarCollapsed: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[hsl(var(--foreground))]">Animations</Label>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Enable smooth animations</p>
                </div>
                <Switch
                  checked={config.animations}
                  onCheckedChange={(checked) => setConfig({ ...config, animations: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-[hsl(var(--foreground))]">Compact Mode</Label>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Reduce spacing for more content</p>
                </div>
                <Switch
                  checked={config.compactMode}
                  onCheckedChange={(checked) => setConfig({ ...config, compactMode: checked })}
                />
              </div>
            </CardContent>
          </Card>

 
        </div>
      </div>
    </div>
  );
}