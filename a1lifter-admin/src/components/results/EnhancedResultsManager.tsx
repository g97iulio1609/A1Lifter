import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Trophy,
  Medal,
  Target,
  Calendar,
  Award,
  BarChart3,
  Download,
  Search,
  Star,
  Crown,
  Zap,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

interface CompetitionResult {
  id: string;
  competitionName: string;
  date: string;
  location: string;
  athleteName: string;
  category: string;
  weightClass: string;
  discipline: string;
  squat: number[];
  bench: number[];
  deadlift: number[];
  total: number;
  placing: number;
  participants: number;
  bodyWeight: number;
  wilks: number;
  dots: number;
}

interface EnhancedResultsManagerProps {
  competitionId?: string;
}

export const EnhancedResultsManager: React.FC<EnhancedResultsManagerProps> = () => {
  const [results] = useState<CompetitionResult[]>([
    {
      id: '1',
      competitionName: 'Campionato Regionale Powerlifting 2024',
      date: '2024-03-15',
      location: 'Milano',
      athleteName: 'Marco Rossi',
      category: 'Open',
      weightClass: '83kg',
      discipline: 'Powerlifting',
      squat: [170, 180, 185],
      bench: [110, 120, 125],
      deadlift: [190, 200, 210],
      total: 520,
      placing: 1,
      participants: 15,
      bodyWeight: 82.5,
      wilks: 342.5,
      dots: 385.2
    },
    {
      id: '2',
      competitionName: 'Campionato Regionale Powerlifting 2024',
      date: '2024-03-15',
      location: 'Milano',
      athleteName: 'Laura Bianchi',
      category: 'Junior',
      weightClass: '63kg',
      discipline: 'Powerlifting',
      squat: [110, 120, 125],
      bench: [65, 70, 72.5],
      deadlift: [130, 140, 145],
      total: 342.5,
      placing: 1,
      participants: 8,
      bodyWeight: 62.8,
      wilks: 398.7,
      dots: 425.3
    },
    {
      id: '3',
      competitionName: 'Gara Locale Bench Press',
      date: '2024-02-20',
      location: 'Roma',
      athleteName: 'Giuseppe Verdi',
      category: 'Master',
      weightClass: '93kg',
      discipline: 'Bench Press',
      squat: [0, 0, 0],
      bench: [140, 150, 155],
      deadlift: [0, 0, 0],
      total: 155,
      placing: 2,
      participants: 12,
      bodyWeight: 91.2,
      wilks: 95.8,
      dots: 102.1
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('overview');

  const competitions = [...new Set(results.map(r => r.competitionName))];
  const categories = [...new Set(results.map(r => r.category))];
  const disciplines = [...new Set(results.map(r => r.discipline))];

  const filteredResults = results.filter(result => {
    const matchesSearch = result.athleteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.competitionName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompetition = selectedCompetition === 'all' || result.competitionName === selectedCompetition;
    const matchesCategory = selectedCategory === 'all' || result.category === selectedCategory;
    const matchesDiscipline = selectedDiscipline === 'all' || result.discipline === selectedDiscipline;
    
    return matchesSearch && matchesCompetition && matchesCategory && matchesDiscipline;
  });

  const getStats = () => {
    const totalResults = results.length;
    const totalCompetitions = competitions.length;
    const avgTotal = results.reduce((sum, r) => sum + r.total, 0) / results.length;
    const topWilks = Math.max(...results.map(r => r.wilks));
    
    return { totalResults, totalCompetitions, avgTotal: Math.round(avgTotal), topWilks: Math.round(topWilks) };
  };

  const getChartData = () => {
    // Dati per grafico progressione nel tempo
    const progressionData = results
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(result => ({
        date: new Date(result.date).toLocaleDateString('it-IT'),
        total: result.total,
        wilks: result.wilks,
        athlete: result.athleteName
      }));

    // Dati per distribuzione categorie
    const categoryData = categories.map(category => ({
      name: category,
      value: results.filter(r => r.category === category).length,
      color: category === 'Open' ? '#3b82f6' : category === 'Junior' ? '#10b981' : category === 'Master' ? '#f59e0b' : '#8b5cf6'
    }));

    // Dati per confronto discipline
    const disciplineData = disciplines.map(discipline => ({
      name: discipline,
      avgTotal: Math.round(results.filter(r => r.discipline === discipline).reduce((sum, r) => sum + r.total, 0) / results.filter(r => r.discipline === discipline).length),
      count: results.filter(r => r.discipline === discipline).length
    }));

    return { progressionData, categoryData, disciplineData };
  };

  const stats = getStats();
  const chartData = getChartData();

  const getRankingIcon = (placing: number) => {
    switch (placing) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <Trophy className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getPlacingBadge = (placing: number, participants: number) => {
    const percentage = (placing / participants) * 100;
    if (placing === 1) return <Badge className="bg-yellow-500">🥇 1° Posto</Badge>;
    if (placing === 2) return <Badge className="bg-gray-400">🥈 2° Posto</Badge>;
    if (placing === 3) return <Badge className="bg-amber-600">🥉 3° Posto</Badge>;
    if (percentage <= 25) return <Badge variant="default">Top 25%</Badge>;
    if (percentage <= 50) return <Badge variant="secondary">Top 50%</Badge>;
    return <Badge variant="outline">{placing}° su {participants}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-500 rounded-lg">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            Risultati e Statistiche
          </h1>
          <p className="text-muted-foreground">
            Analizza i risultati delle competizioni e le performance degli atleti
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Esporta Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Totale Risultati</p>
                <p className="text-2xl font-bold">{stats.totalResults}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Competizioni</p>
                <p className="text-2xl font-bold">{stats.totalCompetitions}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Media Totale</p>
                <p className="text-2xl font-bold">{stats.avgTotal}kg</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Wilks</p>
                <p className="text-2xl font-bold">{stats.topWilks}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-auto grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <Trophy className="h-4 w-4" />
            Panoramica
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analisi
          </TabsTrigger>
          <TabsTrigger value="rankings" className="gap-2">
            <Crown className="h-4 w-4" />
            Classifiche
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-2">
            <Zap className="h-4 w-4" />
            Record
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca per atleta o competizione..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Competizione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le competizioni</SelectItem>
                  {competitions.map(comp => (
                    <SelectItem key={comp} value={comp}>{comp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le categorie</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Disciplina" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le discipline</SelectItem>
                  {disciplines.map(disc => (
                    <SelectItem key={disc} value={disc}>{disc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <TabsContent value="overview">
          <div className="grid gap-6">
            {/* Results List */}
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <Card key={result.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full">
                          {getRankingIcon(result.placing)}
                        </div>
                        
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            {result.athleteName}
                            {getPlacingBadge(result.placing, result.participants)}
                          </h3>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(result.date).toLocaleDateString('it-IT')}
                            </span>
                            <span>{result.competitionName}</span>
                            <span>{result.category} - {result.weightClass}</span>
                            <span>{result.discipline}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        {result.discipline === 'Powerlifting' ? (
                          <>
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Squat</p>
                              <p className="font-medium">{Math.max(...result.squat)}kg</p>
                            </div>
                            
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Bench</p>
                              <p className="font-medium">{Math.max(...result.bench)}kg</p>
                            </div>
                            
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Deadlift</p>
                              <p className="font-medium">{Math.max(...result.deadlift)}kg</p>
                            </div>
                          </>
                        ) : (
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">Best Lift</p>
                            <p className="font-medium">{result.total}kg</p>
                          </div>
                        )}
                        
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Totale</p>
                          <p className="font-bold text-lg">{result.total}kg</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Wilks</p>
                          <p className="font-medium">{result.wilks}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">DOTS</p>
                          <p className="font-medium">{result.dots}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6">
            {/* Progression Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Progressione Performance</CardTitle>
                <CardDescription>Andamento dei totali nel tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.progressionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Distribuzione Categorie</CardTitle>
                  <CardDescription>Partecipazione per categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={chartData.categoryData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {chartData.categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Confronto Discipline</CardTitle>
                  <CardDescription>Media totali per disciplina</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.disciplineData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="avgTotal" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="rankings">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Migliori performance per categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categories.map(category => {
                    const categoryResults = results
                      .filter(r => r.category === category)
                      .sort((a, b) => b.wilks - a.wilks)
                      .slice(0, 3);
                    
                    return (
                      <div key={category} className="space-y-2">
                        <h4 className="font-semibold text-lg">{category}</h4>
                        <div className="grid gap-2">
                          {categoryResults.map((result, index) => (
                            <div key={result.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-3">
                                {getRankingIcon(index + 1)}
                                <div>
                                  <p className="font-medium">{result.athleteName}</p>
                                  <p className="text-sm text-muted-foreground">{result.competitionName}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold">{result.total}kg</p>
                                <p className="text-sm text-muted-foreground">Wilks: {result.wilks}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="records">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Record Personali</CardTitle>
                <CardDescription>Migliori performance individuali</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {['squat', 'bench', 'deadlift'].map(lift => {
                    const bestResult = results
                      .filter(r => r.discipline === 'Powerlifting')
                      .reduce((best, current) => {
                        const currentBest = Math.max(...(current[lift as keyof typeof current] as number[]));
                        const bestSoFar = best ? Math.max(...(best[lift as keyof typeof best] as number[])) : 0;
                        return currentBest > bestSoFar ? current : best;
                      }, null as CompetitionResult | null);
                    
                    if (!bestResult) return null;
                    
                    return (
                      <div key={lift} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Activity className="h-8 w-8 text-blue-500" />
                          <div>
                            <h4 className="font-semibold capitalize">{lift} Record</h4>
                            <p className="text-sm text-muted-foreground">{bestResult.athleteName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold">{Math.max(...(bestResult[lift as keyof typeof bestResult] as number[]))}kg</p>
                          <p className="text-sm text-muted-foreground">{bestResult.competitionName}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {filteredResults.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun Risultato Trovato</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCompetition !== 'all' || selectedCategory !== 'all' || selectedDiscipline !== 'all'
                ? 'Nessun risultato corrisponde ai filtri selezionati'
                : 'Non ci sono risultati disponibili'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};