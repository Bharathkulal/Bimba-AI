import React from 'react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Bell, Shield, Keyboard, Volume2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const settingOptions = [
    { title: 'Notifications', desc: 'Manage your email and in-app alerts', icon: Bell },
    { title: 'Security', desc: 'Manage password, 2FA, and sessions', icon: Shield },
    { title: 'Accessibility', desc: 'Shortcuts and UI preferences', icon: Keyboard },
    { title: 'Sounds & Haptics', desc: 'Interface audio cues', icon: Volume2 },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Settings"
        description="Configure your workspace and preferences"
      />

      <div className="max-w-3xl flex flex-col gap-4">
        {settingOptions.map((opt, idx) => {
          const Icon = opt.icon;
          return (
            <Card key={idx} className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-base">{opt.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
