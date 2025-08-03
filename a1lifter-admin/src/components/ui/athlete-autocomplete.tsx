import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Trophy, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import type { Athlete, Registration } from '@/types';

interface AthleteOption {
  athlete: Athlete;
  registration?: Registration;
  bibNumber?: string;
}

interface AthleteAutocompleteProps {
  athletes: AthleteOption[];
  value?: AthleteOption | null;
  onSelect: (athlete: AthleteOption | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const AthleteAutocomplete: React.FC<AthleteAutocompleteProps> = ({
  athletes,
  value,
  onSelect,
  placeholder = "Cerca atleta per nome, cognome o numero pettorale...",
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAthletes, setFilteredAthletes] = useState<AthleteOption[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Aggiorna il termine di ricerca quando cambia il valore selezionato
  useEffect(() => {
    if (value) {
      setSearchTerm(value.athlete.name);
    } else {
      setSearchTerm('');
    }
  }, [value]);

  // Filtra gli atleti in base al termine di ricerca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAthletes(athletes.slice(0, 10)); // Mostra i primi 10 se non c'è ricerca
      return;
    }

    const filtered = athletes.filter(option => {
      const athlete = option.athlete;
      const searchLower = searchTerm.toLowerCase();
      
      // Cerca per nome (nome e cognome)
      const nameMatch = athlete.name.toLowerCase().includes(searchLower);
      
      // Cerca per numero pettorale se disponibile
      const bibMatch = option.bibNumber && option.bibNumber.toLowerCase().includes(searchLower);
      
      // Cerca per email
      const emailMatch = athlete.email.toLowerCase().includes(searchLower);
      
      return nameMatch || bibMatch || emailMatch;
    }).slice(0, 10); // Limita a 10 risultati

    setFilteredAthletes(filtered);
    setHighlightedIndex(-1);
  }, [searchTerm, athletes]);

  // Gestisce la selezione con tastiera
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredAthletes.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredAthletes[highlightedIndex]) {
          handleSelect(filteredAthletes[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Gestisce la selezione di un atleta
  const handleSelect = (option: AthleteOption) => {
    onSelect(option);
    setSearchTerm(option.athlete.name);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Gestisce il cambiamento del testo di ricerca
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // Se l'input è vuoto, deseleziona l'atleta
    if (!newValue.trim() && value) {
      onSelect(null);
    }
  };

  // Gestisce il focus sull'input
  const handleFocus = () => {
    setIsOpen(true);
  };

  // Gestisce il click fuori dal componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-4"
        />
      </div>

      {isOpen && filteredAthletes.length > 0 && (
        <Card 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto shadow-lg border bg-white"
        >
          <div className="py-1">
            {filteredAthletes.map((option, index) => {
              const athlete = option.athlete;
              const isHighlighted = index === highlightedIndex;
              
              return (
                <div
                  key={athlete.id}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    isHighlighted ? 'bg-blue-50 border-l-2 border-blue-500' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {athlete.name}
                          </p>
                          {option.bibNumber && (
                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                              <Hash className="h-3 w-3" />
                              <span>{option.bibNumber}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500 truncate">
                            {athlete.email}
                          </p>
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Trophy className="h-3 w-3" />
                            <span>{athlete.weightClass}</span>
                          </div>
                          {athlete.team && (
                            <span className="text-xs text-gray-500 truncate">
                              {athlete.team}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {option.registration && (
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          option.registration.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800'
                            : option.registration.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {option.registration.status === 'confirmed' ? 'Confermato' :
                           option.registration.status === 'pending' ? 'In attesa' : 'Annullato'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {isOpen && searchTerm && filteredAthletes.length === 0 && (
        <Card className="absolute z-50 w-full mt-1 shadow-lg border bg-white">
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            Nessun atleta trovato per "{searchTerm}"
          </div>
        </Card>
      )}
    </div>
  );
};