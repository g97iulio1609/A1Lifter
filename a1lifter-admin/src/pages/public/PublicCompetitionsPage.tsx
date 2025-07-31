import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { getPublicCompetitions } from '@/services/publicRegistrations';
import type { PublicCompetition } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Users, Euro, Trophy, Clock } from 'lucide-react';

export const PublicCompetitionsPage: React.FC = () => {
  const [competitions, setCompetitions] = useState<PublicCompetition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const data = await getPublicCompetitions();
        setCompetitions(data);
      } catch (err) {
        setError('Errore nel caricamento delle competizioni');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, []);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento competizioni...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Riprova
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">A1Lifter</h1>
              <p className="text-gray-600">Competizioni di Powerlifting e Strongman</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/admin" className="text-blue-600 hover:text-blue-800">
                Area Amministratore
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Competizioni Aperte
          </h2>
          <p className="text-gray-600">
            Iscriviti alle prossime competizioni di powerlifting e strongman
          </p>
        </div>

        {competitions.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nessuna competizione disponibile
            </h3>
            <p className="text-gray-600">
              Al momento non ci sono competizioni aperte alle iscrizioni.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {competitions.map((competition) => (
              <Card key={competition.id} className="overflow-hidden">
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

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Categorie:</h4>
                    <p className="text-sm text-gray-600">
                      {competition.categories.length} categorie disponibili
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    {isRegistrationOpen(competition) ? (
                      <Link to={`/register/${competition.id}`} className="w-full">
                        <Button className="w-full">
                          Iscriviti ora
                        </Button>
                      </Link>
                    ) : (
                      <Button disabled className="w-full">
                        {competition.status !== 'active' ? 'Competizione non attiva' :
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
    </div>
  );
};