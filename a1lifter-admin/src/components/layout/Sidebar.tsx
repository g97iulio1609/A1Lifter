import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Users, 
  Trophy, 
  BarChart3, 
  Monitor,
  Settings,
  LogOut,
  UserCheck,
  Scale,
  Play,
  Award,
  HardDrive,
  Bell,
  Gavel
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Atleti', href: '/athletes', icon: Users },
  { name: 'Competizioni', href: '/competitions', icon: Trophy },
  { name: 'Iscrizioni', href: '/registrations', icon: UserCheck },
  { name: 'Risultati', href: '/results', icon: BarChart3 },
  { name: 'Giudici', href: '/judges', icon: Gavel },
  { name: 'Pesate', href: '/weigh-in', icon: Scale },
  { name: 'Live', href: '/live', icon: Play },
  { name: 'Record', href: '/records', icon: Award },
  { name: 'Notifiche', href: '/notifications', icon: Bell },
  { name: 'Backup', href: '/backup', icon: HardDrive },
  { name: 'Organizzatore', href: '/organizer', icon: Monitor },
  { name: 'Impostazioni', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-2xl font-bold">A1Lifter</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};