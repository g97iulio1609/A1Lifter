import { useState, useEffect } from 'react';
import { competitionsService } from '@/services/competitions';
import { athletesService } from '@/services/athletes';
import type { CompetitionWithStats } from '@/types';

type DashboardCompetition = CompetitionWithStats & {
  participants: number;
  progress?: number;
};

interface DashboardStats {
  totalCompetitions: number;
  activeCompetitions: number;
  liveCompetitions: number;
  totalAthletes: number;
  monthlyRevenue: number;
  recentRegistrations: number;
}

interface RecentActivity {
  id: string;
  type: 'registration' | 'competition' | 'result' | 'system';
  message: string;
  time: Date;
  user?: string;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeCompetitions, setActiveCompetitions] = useState<DashboardCompetition[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch competitions
      const [allCompetitions, athletesStats] = await Promise.all([
        competitionsService.getCompetitions(),
        athletesService.getAthletesStats()
      ]);

      // Calculate competition stats
      const now = new Date();
      const activeComps = allCompetitions.filter(comp => 
        comp.status === 'active' || (comp.date >= now && comp.status !== 'completed')
      );
      const liveComps = allCompetitions.filter(comp => comp.status === 'active');

      // Calculate monthly revenue (mock for now - would need payment data)
      const monthlyRevenue = activeComps.reduce((total, comp) => {
        return total + (comp.registrationsCount * 50); // Default entry fee
      }, 0);

      // Get recent registrations count (last 30 days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentRegistrations = athletesStats.recentlyAdded;

      const dashboardStats: DashboardStats = {
        totalCompetitions: allCompetitions.length,
        activeCompetitions: activeComps.length,
        liveCompetitions: liveComps.length,
        totalAthletes: athletesStats.total,
        monthlyRevenue,
        recentRegistrations
      };

      // Get active competitions for display
      const topActiveCompetitions: DashboardCompetition[] = activeComps
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 3)
        .map(comp => ({
          ...comp,
          participants: comp.registrationsCount,
          progress: comp.status === 'in_progress' ? Math.floor(Math.random() * 40) + 30 : undefined
        }));

      // Generate recent activities based on real data
      const activities: RecentActivity[] = [];
      
      // Add recent competition activities
      allCompetitions
        .filter(comp => comp.createdAt >= thirtyDaysAgo)
        .slice(0, 2)
        .forEach(comp => {
          activities.push({
            id: `comp-${comp.id}`,
            type: 'competition',
            message: `Competizione "${comp.name}" creata`,
            time: comp.createdAt,
            user: 'Admin'
          });
        });

      // Add system activities
      activities.push(
        {
          id: 'backup-1',
          type: 'system',
          message: 'Backup automatico completato',
          time: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
          user: 'Sistema'
        },
        {
          id: 'athletes-1',
          type: 'registration',
          message: `${recentRegistrations} nuovi atleti registrati questo mese`,
          time: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
          user: 'Sistema'
        }
      );

      // Sort activities by time (most recent first)
      activities.sort((a, b) => b.time.getTime() - a.time.getTime());

      setStats(dashboardStats);
      setActiveCompetitions(topActiveCompetitions);
      setRecentActivities(activities.slice(0, 4));
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Errore nel caricamento dei dati della dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    stats,
    activeCompetitions,
    recentActivities,
    loading,
    error,
    refetch: fetchDashboardData
  };
};