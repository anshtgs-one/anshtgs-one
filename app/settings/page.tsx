'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import {
  User, Bell, Palette, Building2, Moon, Sun, Lock, Shield, UserCog, ShieldCheck
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth, getInitials } from '@/lib/auth-context';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { profile, updatePassword } = useAuth();
  const router = useRouter();
  const [activeSection, setActiveSection] = useState('profile');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const stored = localStorage.getItem('tgs-notif-prefs');
    if (stored) setNotifPrefs(JSON.parse(stored));
  }, []);

  const handleNotifToggle = (key: string, checked: boolean) => {
    const updated = { ...notifPrefs, [key]: checked };
    setNotifPrefs(updated);
    localStorage.setItem('tgs-notif-prefs', JSON.stringify(updated));
    toast.success(checked ? 'Notification enabled' : 'Notification disabled');
  };

  const isSuperAdmin = profile?.role === 'super_admin';

  const sections = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'appearance', label: 'Appearance', icon: Palette },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'organization', label: 'Organization', icon: Building2 },
    ...(isSuperAdmin ? [
      { key: 'users', label: 'User Management', icon: UserCog },
      { key: 'access', label: 'Access Control', icon: ShieldCheck },
    ] : []),
  ];

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setChangingPassword(true);
    const { error } = await updatePassword(newPassword);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    }
    setChangingPassword(false);
  };

  return (
    <div className="animate-fade-in-up">
      <PageHeader
        title="Settings"
        description="Manage your account, preferences, and system configuration"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <Card className="p-3 h-fit lg:sticky lg:top-0">
          <div className="space-y-1">
            {sections.map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.key}
                  onClick={() => {
                    if (section.key === 'users') router.push('/settings/users');
                    else if (section.key === 'access') router.push('/settings/roles');
                    else setActiveSection(section.key);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    activeSection === section.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="lg:col-span-3">
          {activeSection === 'profile' && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Profile Information</h3>
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className={cn('text-lg font-bold', ROLE_COLORS[profile?.role || 'sig'])}>
                    {getInitials(profile?.full_name || 'User')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{profile?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                  <Badge variant="outline" className="mt-1">{ROLE_LABELS[profile?.role || 'sig']}</Badge>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-xs">Full Name</Label>
                  <Input defaultValue={profile?.full_name || ''} className="mt-1" readOnly />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input defaultValue={profile?.email || ''} className="mt-1" readOnly />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input defaultValue={profile?.phone || ''} className="mt-1" readOnly />
                </div>
                <div>
                  <Label className="text-xs">Designation</Label>
                  <Input defaultValue={profile?.designation || ''} className="mt-1" readOnly />
                </div>
                <div>
                  <Label className="text-xs">Department</Label>
                  <Input defaultValue={profile?.department || ''} className="mt-1" readOnly />
                </div>
                <div>
                  <Label className="text-xs">City</Label>
                  <Input defaultValue={profile?.city || ''} className="mt-1" readOnly />
                </div>
                <div>
                  <Label className="text-xs">Employee ID</Label>
                  <Input defaultValue={profile?.employee_id || ''} className="mt-1" readOnly />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Input defaultValue={profile?.status || 'active'} className="mt-1" readOnly />
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <Label className="text-xs">New Password</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Confirm Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </Card>
          )}

          {activeSection === 'appearance' && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Appearance</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div className="flex items-center gap-3">
                    {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                    <div>
                      <p className="text-sm font-medium">Dark Mode</p>
                      <p className="text-xs text-muted-foreground">Toggle between light and dark themes</p>
                    </div>
                  </div>
                  <Switch checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Notification Preferences</h3>
              <div className="space-y-3">
                {[
                  { label: 'Task Assignments', desc: 'Get notified when a task is assigned to you' },
                  { label: 'Approval Requests', desc: 'Get notified when an approval is needed' },
                  { label: 'Budget Updates', desc: 'Get notified about budget changes' },
                  { label: 'Creative Deliveries', desc: 'Get notified when creative work is delivered' },
                  { label: 'Vendor Updates', desc: 'Get notified about vendor changes' },
                  { label: 'Deadlines', desc: 'Get notified about upcoming deadlines' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border border-border p-4">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  <Switch checked={notifPrefs[item.label] !== false} onCheckedChange={(checked) => handleNotifToggle(item.label, checked)} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeSection === 'organization' && (
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Organization</h3>
              <div className="space-y-3">
                {[
                  { label: 'Organization Name', value: 'The Gurukulam School' },
                  { label: 'Parent Organization', value: 'PhysicsWallah' },
                  { label: 'Total Schools', value: '12' },
                  { label: 'Fiscal Year', value: '2025-26' },
                  { label: 'Current Quarter', value: 'Q1' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between border-b border-border pb-3">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
