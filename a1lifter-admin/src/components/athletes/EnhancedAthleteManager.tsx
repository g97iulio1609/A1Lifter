import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users,
  Search,
  Download,
  Upload,
  UserPlus,
  Trash2,
  Trophy,
  User,
  Mail,
  Phone,
  Star,
  Award,
  Edit,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { athletesService } from '@/services/athletes';
import type { Athlete } from '@/types';
import { AthleteForm } from './AthleteForm';

interface EnhancedAthleteManagerProps {
  competitionId?: string;
}

export const EnhancedAthleteManager: React.FC<EnhancedAthleteManagerProps> = () => {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWeightClass, setSelectedWeightClass] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);


  const [newAthlete, setNewAthlete] = useState<Partial<Athlete>>({
    name: '',
    email: '',
    phone: '',
    birthDate: undefined,
    gender: 'M',
    category: 'Open',
    weightClass: '',
    bodyWeight: 0,
    team: '',
    personalBests: { squat: 0, bench: 0, deadlift: 0 },
    competitions: 0,
    isActive: true
  });

  const categories = ['Open', 'Junior', 'Master', 'Sub-Junior'];
  const weightClasses = {
    M: ['59kg', '66kg', '74kg', '83kg', '93kg', '105kg', '120kg', '120kg+'],
    F: ['47kg', '52kg', '57kg', '63kg', '69kg', '76kg', '84kg', '84kg+']
  };

  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         athlete.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         athlete.team?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || athlete.category === selectedCategory;
    const matchesWeightClass = selectedWeightClass === 'all' || athlete.weightClass === selectedWeightClass;
    
    return matchesSearch && matchesCategory && matchesWeightClass;
  });

  const handleAddAthlete = async () => {
    if (!newAthlete.name || !newAthlete.email) {
      toast.error('Nome e email sono obbligatori');
      return;
    }

    setSaving(true);
    try {
      const athleteData: Omit<Athlete, 'id' | 'createdAt' | 'updatedAt'> = {
        name: newAthlete.name,
        email: newAthlete.email,
        phone: newAthlete.phone || '',
        birthDate: newAthlete.birthDate || new Date(),
        gender: newAthlete.gender || 'M',
        bodyweight: newAthlete.bodyWeight || 0,
        bodyWeight: newAthlete.bodyWeight || 0,
        weightClass: newAthlete.weightClass || '',
        federation: 'FIPL',
        team: newAthlete.team || '',
        category: newAthlete.category || 'Open',
        isActive: newAthlete.isActive ?? true,
        personalRecords: {},
        personalBests: newAthlete.personalBests || { squat: 0, bench: 0, deadlift: 0 },
        competitions: newAthlete.competitions || 0
      };
      
      await athletesService.createAthlete(athleteData);
       
       // Ricarica la lista degli atleti
       await loadAthletes();
      
      // Reset form
      setNewAthlete({
        name: '',
        email: '',
        phone: '',
        birthDate: undefined,
        gender: 'M',
        category: 'Open',
        weightClass: '',
        bodyWeight: 0,
        team: '',
        personalBests: { squat: 0, bench: 0, deadlift: 0 },
        competitions: 0,
        isActive: true
      });
      setIsAddDialogOpen(false);
      toast.success('Atleta aggiunto con successo!');
    } catch (error) {
      console.error('Errore durante il salvataggio dell\'atleta:', error);
      toast.error('Errore durante il salvataggio dell\'atleta');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAthlete = async (id: string) => {
    try {
      await athletesService.deleteAthlete(id);
      await loadAthletes();
      toast.success('Atleta eliminato con successo!');
    } catch (error) {
      console.error('Errore durante l\'eliminazione dell\'atleta:', error);
      toast.error('Errore durante l\'eliminazione dell\'atleta');
    }
  };

  const handleEditAthlete = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    setIsEditDialogOpen(true);
  };

  const handleUpdateAthlete = async (data: { name: string; email: string; birthDate: string; gender: "M" | "F"; weightClass: string; federation: string; }) => {
    if (!editingAthlete) return;
    
    setSaving(true);
    try {
      // Converti birthDate da string a Date
      const athleteData: Partial<Athlete> = {
        ...data,
        birthDate: new Date(data.birthDate)
      };
      
      await athletesService.updateAthlete(editingAthlete.id, athleteData);
      
      // Aggiorna la lista locale
      setAthletes(athletes.map(athlete => 
        athlete.id === editingAthlete.id 
          ? { ...athlete, ...athleteData, updatedAt: new Date() }
          : athlete
      ));
      
      setIsEditDialogOpen(false);
      setEditingAthlete(null);
      toast.success('Atleta aggiornato con successo');
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'atleta:', error);
      toast.error('Errore nell\'aggiornamento dell\'atleta');
    } finally {
      setSaving(false);
    }
  };

  const loadAthletes = async () => {
    try {
      setLoading(true);
      const athletesData = await athletesService.getAthletes();
      setAthletes(athletesData);
    } catch (error) {
      console.error('Errore durante il caricamento degli atleti:', error);
      toast.error('Errore durante il caricamento degli atleti');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAthletes();
  }, []);

  const getAthleteStats = () => {
    const total = athletes.length;
    const active = athletes.filter(a => a.isActive).length;
    const byCategory = categories.reduce((acc, cat) => {
      acc[cat] = athletes.filter(a => a.category === cat).length;
      return acc;
    }, {} as Record<string, number>);
    
    return { total, active, byCategory };
  };

  const stats = getAthleteStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            Gestione Atleti
          </h1>
          <p className="text-muted-foreground">
            Gestisci gli atleti registrati e le loro informazioni
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Importa
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Esporta
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Aggiungi Atleta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Aggiungi Nuovo Atleta</DialogTitle>
                <DialogDescription>
                  Inserisci le informazioni dell'atleta
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={newAthlete.name}
                    onChange={(e) => setNewAthlete({ ...newAthlete, name: e.target.value })}
                    placeholder="Nome e cognome"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAthlete.email}
                    onChange={(e) => setNewAthlete({ ...newAthlete, email: e.target.value })}
                    placeholder="email@esempio.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    value={newAthlete.phone}
                    onChange={(e) => setNewAthlete({ ...newAthlete, phone: e.target.value })}
                    placeholder="+39 333 1234567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data di Nascita</Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={newAthlete.birthDate ? newAthlete.birthDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setNewAthlete({ ...newAthlete, birthDate: e.target.value ? new Date(e.target.value) : undefined })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Genere</Label>
                  <Select 
                    value={newAthlete.gender} 
                    onValueChange={(value) => setNewAthlete({ ...newAthlete, gender: value as 'M' | 'F' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Maschile</SelectItem>
                      <SelectItem value="F">Femminile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={newAthlete.category} 
                    onValueChange={(value) => setNewAthlete({ ...newAthlete, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="weightClass">Categoria di Peso</Label>
                  <Select 
                    value={newAthlete.weightClass} 
                    onValueChange={(value) => setNewAthlete({ ...newAthlete, weightClass: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {weightClasses[newAthlete.gender as 'M' | 'F']?.map(wc => (
                        <SelectItem key={wc} value={wc}>{wc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bodyWeight">Peso Corporeo (kg)</Label>
                  <Input
                    id="bodyWeight"
                    type="number"
                    step="0.1"
                    value={newAthlete.bodyWeight}
                    onChange={(e) => setNewAthlete({ ...newAthlete, bodyWeight: parseFloat(e.target.value) || 0 })}
                    placeholder="75.5"
                  />
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="team">Team/Società</Label>
                  <Input
                    id="team"
                    value={newAthlete.team}
                    onChange={(e) => setNewAthlete({ ...newAthlete, team: e.target.value })}
                    placeholder="Nome del team"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Annulla
                </Button>
                <Button onClick={handleAddAthlete} disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvataggio...
                    </>
                  ) : (
                    'Aggiungi Atleta'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Totale Atleti</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Atleti Attivi</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Star className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categoria Open</p>
                <p className="text-2xl font-bold">{stats.byCategory.Open || 0}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categoria Junior</p>
                <p className="text-2xl font-bold">{stats.byCategory.Junior || 0}</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome, email o team..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
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
            
            <Select value={selectedWeightClass} onValueChange={setSelectedWeightClass}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Peso" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i pesi</SelectItem>
                {[...weightClasses.M, ...weightClasses.F].map(wc => (
                  <SelectItem key={wc} value={wc}>{wc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Athletes List */}
      {loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold mb-2">Caricamento Atleti</h3>
            <p className="text-muted-foreground">
              Stiamo caricando la lista degli atleti...
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAthletes.map((athlete) => (
          <Card key={athlete.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {athlete.name}
                      <Badge variant={athlete.isActive ? 'default' : 'secondary'}>
                        {athlete.isActive ? 'Attivo' : 'Inattivo'}
                      </Badge>
                    </h3>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {athlete.email}
                      </span>
                      {athlete.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {athlete.phone}
                        </span>
                      )}
                      {athlete.team && (
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {athlete.team}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Categoria</p>
                    <p className="font-medium">{athlete.category}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Peso</p>
                    <p className="font-medium">{athlete.weightClass}</p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Totale PB</p>
                    <p className="font-medium">
                      {(athlete.personalBests?.squat || 0) + 
                       (athlete.personalBests?.bench || 0) + 
                       (athlete.personalBests?.deadlift || 0)}kg
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Gare</p>
                    <p className="font-medium">{athlete.competitions || 0}</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1"
                      onClick={() => handleEditAthlete(athlete)}
                    >
                      <Edit className="h-4 w-4" />
                      Modifica
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteAthlete(athlete.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Elimina
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      )}
      
      {!loading && filteredAthletes.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nessun Atleta Trovato</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedWeightClass !== 'all'
                ? 'Nessun atleta corrisponde ai filtri selezionati'
                : 'Non ci sono atleti registrati'}
            </p>
            {!searchTerm && selectedCategory === 'all' && selectedWeightClass === 'all' && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Aggiungi Primo Atleta
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog per modifica atleta */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifica Atleta</DialogTitle>
            <DialogDescription>
              Modifica le informazioni dell'atleta selezionato
            </DialogDescription>
          </DialogHeader>
          {editingAthlete && (
            <AthleteForm
              athlete={editingAthlete}
              onSubmit={handleUpdateAthlete}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setEditingAthlete(null);
              }}
              isLoading={saving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};