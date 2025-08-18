import React, { useState } from 'react';
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
  Gavel,
  ChevronDown,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
  description?: string;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
  collapsible?: boolean;
}

const navigationSections: NavigationSection[] = [
  {
    title: 'Principale',
    items: [
      { 
        name: 'Dashboard', 
        href: '/dashboard', 
        icon: Home,
        description: 'Panoramica generale'
      }
    ]
  },
  {
    title: 'Gestione Competizioni',
    collapsible: true,
    items: [
      { 
        name: 'Competizioni', 
        href: '/competitions', 
        icon: Trophy,
        description: 'Crea e gestisci competizioni'
      },
      { 
        name: 'Live', 
        href: '/live', 
        icon: Play,
        description: 'Gestione gare in tempo reale',
        badge: 'HOT'
      },
      { 
        name: 'Organizzatore', 
        href: '/organizer', 
        icon: Monitor,
        description: 'Controllo sessioni live'
      }
    ]
  },
  {
    title: 'Partecipanti',
    collapsible: true,
    items: [
      { 
        name: 'Atleti', 
        href: '/athletes', 
        icon: Users,
        description: 'Gestione atleti'
      },
      { 
        name: 'Iscrizioni', 
        href: '/registrations', 
        icon: UserCheck,
        description: 'Gestione iscrizioni'
      },
      { 
        name: 'Pesate', 
        href: '/weigh-in', 
        icon: Scale,
        description: 'Gestione pesate'
      },
      { 
        name: 'Giudici', 
        href: '/judges', 
        icon: Gavel,
        description: 'Gestione giudici'
      }
    ]
  },
  {
    title: 'Risultati e Dati',
    collapsible: true,
    items: [
      { 
        name: 'Risultati', 
        href: '/results', 
        icon: BarChart3,
        description: 'Visualizza risultati'
      },
      { 
        name: 'Record', 
        href: '/records', 
        icon: Award,
        description: 'Gestione record'
      }
    ]
  },
  {
    title: 'Sistema',
    collapsible: true,
    items: [
      { 
        name: 'Notifiche', 
        href: '/notifications', 
        icon: Bell,
        description: 'Centro notifiche'
      },
      { 
        name: 'Backup', 
        href: '/backup', 
        icon: HardDrive,
        description: 'Backup e ripristino'
      },
      { 
        name: 'Impostazioni', 
        href: '/settings', 
        icon: Settings,
        description: 'Configurazione sistema'
      }
    ]
  }
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout } = useAuth();
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const handleLogout = async () => {
    await logout();
  };

  const toggleSection = (sectionTitle: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionTitle)) {
      newCollapsed.delete(sectionTitle);
    } else {
      newCollapsed.add(sectionTitle);
    }
    setCollapsedSections(newCollapsed);
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;
    
    return (
      <Link
        key={item.name}
        to={item.href}
        className={cn(
          'group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-all duration-200',
          isActive
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:shadow-sm'
        )}
        title={item.description}
      >
        <div className="flex items-center">
          <Icon className="mr-3 h-4 w-4" />
          <span>{item.name}</span>
        </div>
        {item.badge && (
          <Badge 
            variant={item.badge === 'HOT' ? 'destructive' : 'secondary'} 
            className="text-xs px-1.5 py-0.5"
          >
            {item.badge}
          </Badge>
        )}
      </Link>
    );
  };

  const renderSection = (section: NavigationSection) => {
    const isCollapsed = collapsedSections.has(section.title);
    
    return (
      <div key={section.title} className="space-y-1">
        {section.collapsible ? (
          <button
            onClick={() => toggleSection(section.title)}
            className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            <span>{section.title}</span>
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        ) : (
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {section.title}
          </div>
        )}
        
        {(!section.collapsible || !isCollapsed) && (
          <div className="space-y-1">
            {section.items.map(renderNavigationItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      {/* Header */}
      <div className="flex h-16 items-center px-6 border-b">
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 bg-primary rounded-lg">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">A1Lifter</h1>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navigationSections.map(renderSection)}
      </nav>
      
      {/* Footer */}
      <div className="p-3 border-t">
        <button
          onClick={handleLogout}
          className="flex w-full items-center px-3 py-2 text-sm font-medium text-muted-foreground rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  );
};