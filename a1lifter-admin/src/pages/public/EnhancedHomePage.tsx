import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { getPublicCompetitions } from '@/services/publicRegistrations';
import { useLiveCompetitions, useRecentResults, usePlatformStats } from '@/hooks/usePublicData';
import type { PublicCompetition } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Euro, 
  Trophy, 
  Clock, 
  Search,
  Play,
  TrendingUp,
  Award,

  ChevronRight,
  Star,
  Activity,
  BarChart3
} from 'lucide-react';

// Interfaces moved to usePublicData hook

export const EnhancedHomePage: React.FC = () => {
  const [competitions, setCompetitions] = useState<PublicCompetition[]>([]);
  const { liveCompetitions, loading: liveLoading } = useLiveCompetitions();
  const { recentResults, loading: resultsLoading } = useRecentResults();
  const { stats: platformStats, loading: statsLoading } = usePlatformStats();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const data = await getPublicCompetitions();
        setCompetitions(data);
      } catch (err) {
        console.error('Error fetching competitions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, []);

  const filteredCompetitions = competitions.filter(comp => {
    const matchesSearch = comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comp.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || comp.type === typeFilter;
    const matchesLocation = locationFilter === 'all' || comp.location.includes(locationFilter);
    
    return matchesSearch && matchesType && matchesLocation;
  });

  const getCompetitionTypeLabel = (type: string) => {
    return type === 'powerlifting' ? 'Powerlifting' : 'Strongman';
  };

  const getCompetitionTypeColor = (type: string) => {
    return type === 'powerlifting' ? 'bg-blue-500' : 'bg-orange-500';
  };

  const isRegistrationOpen = (competition: PublicCompetition) => {
    const now = new Date();
    return now < competition.registrationDeadline && 
           competition.status === 'active' &&
           (!competition.maxParticipants || competition.currentParticipants < competition.maxParticipants);
  };

  const getDaysUntilDeadline = (deadline: Date) => {
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">A1Lifter</h1>
                  <p className="text-sm text-gray-600">Powerlifting & Strongman Platform</p>
                </div>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="#competitions" className="text-gray-600 hover:text-blue-600 transition-colors">
                Competizioni
              </Link>
              <Link to="#results" className="text-gray-600 hover:text-blue-600 transition-colors">
                Risultati
              </Link>
              <Link to="#live" className="text-gray-600 hover:text-blue-600 transition-colors">
                Live
              </Link>
              <Link to="/admin" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Area Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-5xl font-bold mb-6">
              La Piattaforma Definitiva per
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
                Powerlifting & Strongman
              </span>
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Gestisci competizioni, monitora performance in tempo reale e scopri i migliori atleti d'Italia. 
              Tutto in un'unica piattaforma professionale.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="#competitions">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
                  <Trophy className="h-5 w-5 mr-2" />
                  Esplora Competizioni
                </Button>
              </Link>
              <Link to="#live">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3">
                  <Play className="h-5 w-5 mr-2" />
                  Guarda Live
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Competitions Section */}
      <section id="live" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              🔴 Competizioni Live
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Segui le gare in tempo reale e non perdere nemmeno un sollevamento
            </p>
          </div>
          
          {liveLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Caricamento competizioni live...</p>
            </div>
          ) : liveCompetitions.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessuna competizione live al momento
              </h3>
              <p className="text-gray-600">
                Torna più tardi per seguire le gare in diretta.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {liveCompetitions.map((comp) => (
                <Card key={comp.id} className="overflow-hidden border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <Badge variant={comp.status === 'live' ? 'destructive' : 'secondary'}>
                          {comp.status === 'live' ? 'LIVE' : 'Prossima'}
                        </Badge>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-1" />
                        {comp.viewers} spettatori
                      </div>
                    </div>
                    <CardTitle className="text-lg">{comp.name}</CardTitle>
                    <CardDescription className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {comp.location} • {format(comp.date, 'dd MMM yyyy', { locale: it })}
                    </CardDescription>
                    {comp.currentAthlete && (
                      <CardDescription className="flex items-center mt-1">
                        <Activity className="h-4 w-4 mr-1" />
                        {comp.currentAthlete} - {comp.discipline}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Link to={`/public/live/${comp.id}`}>
                      <Button className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        {comp.status === 'live' ? 'Guarda Live' : 'Imposta Promemoria'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Search and Filters */}
      <section id="competitions" className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Competizioni Aperte
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Trova e iscriviti alle prossime competizioni di powerlifting e strongman
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cerca competizioni..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    <SelectItem value="powerlifting">Powerlifting</SelectItem>
                    <SelectItem value="strongman">Strongman</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Località" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le località</SelectItem>
                    <SelectItem value="Roma">Roma</SelectItem>
                    <SelectItem value="Milano">Milano</SelectItem>
                    <SelectItem value="Napoli">Napoli</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => {
                  setSearchTerm('');
                  setTypeFilter('all');
                  setLocationFilter('all');
                }}>
                  Reset Filtri
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Competitions Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Caricamento competizioni...</p>
            </div>
          ) : filteredCompetitions.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessuna competizione trovata
              </h3>
              <p className="text-gray-600">
                Prova a modificare i filtri di ricerca.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompetitions.map((competition) => (
                <Card key={competition.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">
                          {competition.name}
                        </CardTitle>
                        <CardDescription className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          {competition.location}
                        </CardDescription>
                      </div>
                      <Badge 
                        className={`${getCompetitionTypeColor(competition.type)} text-white`}
                      >
                        {getCompetitionTypeLabel(competition.type)}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span>
                          {format(competition.date, 'dd MMM yyyy', { locale: it })}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                        <span>
                          {competition.currentParticipants}
                          {competition.maxParticipants && `/${competition.maxParticipants}`}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Euro className="h-4 w-4 mr-2 text-gray-500" />
                        <span>€{competition.registrationFee}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span>
                          {getDaysUntilDeadline(competition.registrationDeadline)} giorni
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Discipline:</h4>
                      <div className="flex flex-wrap gap-1">
                        {competition.rules.disciplines.map((discipline: string) => (
                          <Badge key={discipline} variant="outline" className="text-xs">
                            {discipline}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t flex gap-2">
                      {isRegistrationOpen(competition) ? (
                        <>
                          <Link to={`/public/competitions/${competition.id}/register`} className="flex-1">
                            <Button className="w-full">
                              Iscriviti ora
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button disabled className="w-full">
                          {competition.status !== 'active' ? 'Non attiva' :
                           new Date() > competition.registrationDeadline ? 'Iscrizioni chiuse' :
                           'Posti esauriti'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent Results Section */}
      <section id="results" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              🏆 Risultati Recenti
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              I migliori risultati e record delle ultime competizioni
            </p>
          </div>

          {resultsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Caricamento risultati recenti...</p>
            </div>
          ) : recentResults.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nessun risultato recente
              </h3>
              <p className="text-gray-600">
                I risultati delle ultime competizioni appariranno qui.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {recentResults.map((result) => (
                <Card key={result.id} className="overflow-hidden">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-lg">{result.athleteName}</h4>
                          {result.isRecord && (
                            <Badge className="bg-yellow-500 text-white">
                              <Star className="h-3 w-3 mr-1" />
                              Record
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-1">{result.competitionName}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{result.discipline}</span>
                          <span>•</span>
                          <span>{format(result.date, 'dd MMM yyyy', { locale: it })}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{result.result}</div>
                        <div className="text-sm text-gray-500">Risultato</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/results">
              <Button variant="outline" size="lg">
                <BarChart3 className="h-5 w-5 mr-2" />
                Vedi Tutti i Risultati
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {statsLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Caricamento statistiche...</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{platformStats?.totalCompetitions || 150}+</div>
                <div className="text-gray-600">Competizioni Organizzate</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{platformStats?.totalAthletes?.toLocaleString() || '2,500'}+</div>
                <div className="text-gray-600">Atleti Registrati</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{platformStats?.totalRecords || 45}</div>
                <div className="text-gray-600">Record Stabiliti</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">98%</div>
                <div className="text-gray-600">Soddisfazione Utenti</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">A1Lifter</span>
              </div>
              <p className="text-gray-400 text-sm">
                La piattaforma leader per competizioni di powerlifting e strongman in Italia.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Competizioni</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="#" className="hover:text-white transition-colors">Powerlifting</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Strongman</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Calendario</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Risultati</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Supporto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="#" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Contatti</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Regolamenti</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Amministratori</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/admin" className="hover:text-white transition-colors">Area Admin</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Login</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Documentazione</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 A1Lifter. Tutti i diritti riservati.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};