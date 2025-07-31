import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Trophy, 
  CreditCard,
  AlertTriangle,
  FileText,
  Check,
  X
} from 'lucide-react';
import { useRegistrationDetails, useUpdateRegistration } from '@/hooks/useRegistrations';
import { toast } from 'sonner';

interface RegistrationDetailsProps {
  registrationId: string;
  open: boolean;
  onClose: () => void;
}

export const RegistrationDetails: React.FC<RegistrationDetailsProps> = ({
  registrationId,
  open,
  onClose
}) => {
  const { data: registration, isLoading } = useRegistrationDetails(registrationId, open);
  const updateMutation = useUpdateRegistration();

  const handleStatusUpdate = async (status: 'confirmed' | 'cancelled') => {
    if (!registration) return;
    
    try {
      await updateMutation.mutateAsync({
        id: registration.id,
        data: { status }
      });
      
      toast.success(status === 'confirmed' ? 'Iscrizione confermata' : 'Iscrizione annullata');
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento');
    }
  };

  const handlePaymentUpdate = async (paymentStatus: 'paid' | 'refunded') => {
    if (!registration) return;
    
    try {
      await updateMutation.mutateAsync({
        id: registration.id,
        data: { paymentStatus }
      });
      
      toast.success(paymentStatus === 'paid' ? 'Pagamento registrato' : 'Rimborso registrato');
    } catch (error) {
      toast.error('Errore durante l\'aggiornamento del pagamento');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">In attesa</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="text-green-600 border-green-600">Confermata</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="text-red-600 border-red-600">Annullata</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'unpaid':
        return <Badge variant="outline" className="text-orange-600 border-orange-600">Non pagato</Badge>;
      case 'paid':
        return <Badge variant="outline" className="text-green-600 border-green-600">Pagato</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Rimborsato</Badge>;
      default:
        return <Badge variant="outline">{paymentStatus}</Badge>;
    }
  };

  if (isLoading || !registration) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Dettagli Iscrizione - {registration.athleteName}</span>
            <div className="flex gap-2">
              {getStatusBadge(registration.status)}
              {getPaymentBadge(registration.paymentStatus)}
            </div>
          </DialogTitle>
          <DialogDescription>
            Iscrizione del {format(registration.registeredAt, 'dd MMMM yyyy alle HH:mm', { locale: it })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Informazioni Atleta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Informazioni Atleta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nome</p>
                  <p className="font-semibold">{registration.athleteName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Genere</p>
                  <p>{registration.athleteGender === 'M' ? 'Maschile' : 'Femminile'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="flex items-center">
                    <Mail className="mr-1 h-3 w-3" />
                    {registration.athleteEmail}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Categoria Peso</p>
                  <p>{registration.athleteWeightClass}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informazioni Competizione */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Trophy className="mr-2 h-4 w-4" />
                Informazioni Competizione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Competizione</p>
                <p className="font-semibold">{registration.competitionName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Categoria</p>
                <p>{registration.categoryName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Data Iscrizione</p>
                <p className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  {format(registration.registeredAt, 'dd MMMM yyyy', { locale: it })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contatto di Emergenza */}
          {registration.emergencyContact && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="mr-2 h-4 w-4" />
                  Contatto di Emergenza
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-600">Nome</p>
                  <p>{registration.emergencyContact.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Telefono</p>
                  <p>{registration.emergencyContact.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Relazione</p>
                  <p>{registration.emergencyContact.relationship}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informazioni Mediche */}
          {registration.medicalInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Informazioni Mediche
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {registration.medicalInfo.allergies && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Allergie</p>
                    <p>{registration.medicalInfo.allergies}</p>
                  </div>
                )}
                {registration.medicalInfo.medications && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Farmaci</p>
                    <p>{registration.medicalInfo.medications}</p>
                  </div>
                )}
                {registration.medicalInfo.conditions && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">Condizioni</p>
                    <p>{registration.medicalInfo.conditions}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Note */}
          {registration.notes && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{registration.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <Separator />

        {/* Azioni */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {registration.status === 'pending' && (
              <>
                <Button
                  onClick={() => handleStatusUpdate('confirmed')}
                  disabled={updateMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="mr-2 h-4 w-4" />
                  Conferma Iscrizione
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={updateMutation.isPending}
                >
                  <X className="mr-2 h-4 w-4" />
                  Annulla Iscrizione
                </Button>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {registration.paymentStatus === 'unpaid' && registration.status !== 'cancelled' && (
              <Button
                variant="outline"
                onClick={() => handlePaymentUpdate('paid')}
                disabled={updateMutation.isPending}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Segna come Pagato
              </Button>
            )}
            
            {registration.paymentStatus === 'paid' && (
              <Button
                variant="outline"
                onClick={() => handlePaymentUpdate('refunded')}
                disabled={updateMutation.isPending}
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                Rimborsa
              </Button>
            )}

            <Button variant="outline" onClick={onClose}>
              Chiudi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 