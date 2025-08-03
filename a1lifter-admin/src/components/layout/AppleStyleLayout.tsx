import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Users, 
  Trophy, 
  BarChart3, 
  Monitor,
  Settings,
  LogOut,
  Play,
  Award,

  Gavel,
  Scale,
  UserCheck,
  HardDrive,
  ChevronLeft,
  Maximize,
  Eye,
  ExternalLink,
  MoreHorizontal
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { JudgeModeInterface } from '@/components/judge/JudgeModeInterface';
import { useJudgeMode } from '@/hooks/useJudgeMode';

interface AppleStyleLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
  primary?: boolean;
}

// Navigazione principale semplificata
const coreNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, primary: true },
  { name: 'Live', href: '/live', icon: Play, badge: 'LIVE', primary: true },
  { name: 'Competizioni', href: '/competitions', icon: Trophy, primary: true },
  { name: 'Atleti', href: '/athletes', icon: Users, primary: true }
];

// Gestione gara - funzioni operative
const competitionNavigation: NavigationItem[] = [
  { name: 'Organizzatore', href: '/organizer', icon: Monitor },
  { name: 'Iscrizioni', href: '/registrations', icon: UserCheck },
  { name: 'Pesate', href: '/weigh-in', icon: Scale },
  { name: 'Giudici', href: '/judges', icon: Gavel },
  { name: 'Risultati', href: '/results', icon: BarChart3 }
];

// Strumenti e configurazioni
const toolsNavigation: NavigationItem[] = [
  { name: 'Record', href: '/records', icon: Award },
  { name: 'Backup', href: '/backup', icon: HardDrive },
  { name: 'Impostazioni', href: '/settings', icon: Settings }
];

export const AppleStyleLayout: React.FC<AppleStyleLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { judgeMode, disableJudgeMode } = useJudgeMode();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCompetitionTools, setShowCompetitionTools] = useState(false);
  const [showAdvancedTools, setShowAdvancedTools] = useState(false);

  // Se l'utente è in modalità giudice, mostra solo l'interfaccia giudice
  if (judgeMode.isJudgeMode) {
    return (
      <JudgeModeInterface 
        onExitJudgeMode={disableJudgeMode}
      />
    );
  }

  // Modalità fullscreen per live
  if (isFullscreen && location.pathname === '/live') {
    return (
      <div className="h-screen bg-black text-white relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 left-4 z-50 text-white hover:bg-white/10"
          onClick={() => setIsFullscreen(false)}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Esci da Fullscreen
        </Button>
        <div className="h-full">
          {children}
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
  };

  const renderNavigationItem = (item: NavigationItem, isPrimary = false) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;
    
    return (
      <Link
        key={item.name}
        to={item.href}
        className={cn(
          'group flex items-center justify-between rounded-xl transition-all duration-200 ease-out',
          isPrimary ? 'px-4 py-3 text-base font-medium' : 'px-3 py-2 text-sm font-medium',
          isActive
            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:scale-95'
        )}
      >
        <div className="flex items-center">
          <Icon className={cn(
            isPrimary ? 'mr-3 h-5 w-5' : 'mr-3 h-4 w-4',
            isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'
          )} />
          <span>{item.name}</span>
        </div>
        {item.badge && (
          <Badge 
            variant={item.badge === 'HOT' ? 'destructive' : 'secondary'} 
            className="text-xs px-2 py-0.5"
          >
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">A1Lifter</h1>
          <p className="text-sm text-gray-500 mt-1">
            {user?.name || user?.email}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          {/* Core Navigation */}
          <div className="space-y-2">
            {coreNavigation.map((item) => renderNavigationItem(item, true))}
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Azioni Rapide</span>
            </div>
            
            {/* Live Actions */}
            {location.pathname === '/live' && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => setIsFullscreen(true)}
                >
                  <Maximize className="mr-2 h-4 w-4" />
                  Modalità Fullscreen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => window.open('/public/live/1', '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Vista Pubblica
                </Button>
              </div>
            )}
          </div>

          {/* Competition Tools */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-gray-600 hover:text-gray-900 hover:bg-gray-100 mb-2"
              onClick={() => setShowCompetitionTools(!showCompetitionTools)}
            >
              <div className="flex items-center">
                <Trophy className="mr-2 h-4 w-4" />
                Gestione Gara
              </div>
              <MoreHorizontal className={cn('h-4 w-4 transition-transform', showCompetitionTools && 'rotate-90')} />
            </Button>
            
            {showCompetitionTools && (
              <div className="space-y-1 pl-2">
                {competitionNavigation.map((item) => renderNavigationItem(item))}
              </div>
            )}
          </div>

          {/* Advanced Tools */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-gray-600 hover:text-gray-900 hover:bg-gray-100 mb-2"
              onClick={() => setShowAdvancedTools(!showAdvancedTools)}
            >
              <div className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Strumenti
              </div>
              <MoreHorizontal className={cn('h-4 w-4 transition-transform', showAdvancedTools && 'rotate-90')} />
            </Button>
            
            {showAdvancedTools && (
              <div className="space-y-1 pl-2">
                {toolsNavigation.map((item) => renderNavigationItem(item))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          {/* Judge Mode Access */}
          {user?.role === 'judge' && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-purple-600 border-purple-200 hover:bg-purple-50"
              onClick={() => navigate('/live?judge=true')}
            >
              <Eye className="mr-2 h-4 w-4" />
              Modalità Giudice
            </Button>
          )}
          
          {/* User Info & Logout */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name || 'Utente'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <div className="p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};