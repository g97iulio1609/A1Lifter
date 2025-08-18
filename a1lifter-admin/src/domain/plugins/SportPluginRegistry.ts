import { SportPlugin } from './SportPlugin';
import { PowerliftingPlugin } from './powerlifting/PowerliftingPlugin';
import { WeightliftingPlugin } from './WeightliftingPlugin';
import { StrongmanPlugin } from './StrongmanPlugin';
import { CrossFitPlugin } from './CrossFitPlugin';
import { StreetliftingPlugin } from './StreetliftingPlugin';

export type SupportedSport = 'powerlifting' | 'weightlifting' | 'strongman' | 'crossfit' | 'streetlifting';

export class SportPluginRegistry {
  private static instance: SportPluginRegistry;
  private plugins: Map<SupportedSport, SportPlugin>;

  private constructor() {
    this.plugins = new Map();
    this.initializePlugins();
  }

  public static getInstance(): SportPluginRegistry {
    if (!SportPluginRegistry.instance) {
      SportPluginRegistry.instance = new SportPluginRegistry();
    }
    return SportPluginRegistry.instance;
  }

  private initializePlugins(): void {
    this.plugins.set('powerlifting', new PowerliftingPlugin());
    this.plugins.set('weightlifting', new WeightliftingPlugin());
    this.plugins.set('strongman', new StrongmanPlugin());
    this.plugins.set('crossfit', new CrossFitPlugin());
    this.plugins.set('streetlifting', new StreetliftingPlugin());
  }

  public getPlugin(sport: SupportedSport): SportPlugin {
    const plugin = this.plugins.get(sport);
    if (!plugin) {
      throw new Error(`Plugin non trovato per sport: ${sport}`);
    }
    return plugin;
  }

  public getSupportedSports(): SupportedSport[] {
    return Array.from(this.plugins.keys());
  }

  public getAllPlugins(): Map<SupportedSport, SportPlugin> {
    return new Map(this.plugins);
  }

  public isValidSport(sport: string): sport is SupportedSport {
    return this.plugins.has(sport as SupportedSport);
  }

  public getDisciplinesForSport(sport: SupportedSport): string[] {
    const plugin = this.getPlugin(sport);
    return plugin.disciplines;
  }

  public getAllDisciplines(): Record<SupportedSport, string[]> {
    const result: Record<SupportedSport, string[]> = {} as Record<SupportedSport, string[]>;
    
    for (const [sport, plugin] of this.plugins) {
      result[sport] = plugin.disciplines;
    }
    
    return result;
  }

  public getTimerSettingsForSport(sport: SupportedSport, discipline: string = 'default', phase: 'attempt' | 'rest' | 'warmup' = 'attempt') {
    const plugin = this.getPlugin(sport);
    return plugin.getTimerSettings(discipline, phase);
  }

  public validateSportDiscipline(sport: SupportedSport, discipline: string): boolean {
    const plugin = this.getPlugin(sport);
    return plugin.disciplines.includes(discipline);
  }

  // Utility method to get sport from discipline
  public getSportFromDiscipline(discipline: string): SupportedSport | null {
    for (const [sport, plugin] of this.plugins) {
      if (plugin.disciplines.includes(discipline)) {
        return sport;
      }
    }
    return null;
  }

  // Method to register custom plugins (for extensibility)
  public registerCustomPlugin(sport: string, _plugin: SportPlugin): void {
    void _plugin;
    if (this.plugins.has(sport as SupportedSport)) {
      throw new Error(`Plugin già registrato per sport: ${sport}`);
    }
    
    // For now, we only allow the predefined sports
    // This could be extended in the future for custom sports
    console.warn(`Tentativo di registrare plugin personalizzato per: ${sport}`);
  }

  // Method to get plugin metadata
  public getPluginMetadata(sport: SupportedSport) {
    const plugin = this.getPlugin(sport);
    return {
      sportName: plugin.sportName,
      disciplines: plugin.disciplines,
      disciplineCount: plugin.supportedDisciplines.length,
      timerSettings: plugin.getTimerSettings('squat', 'attempt')
    };
  }

  // Method to get all plugins metadata
  public getAllPluginsMetadata() {
    const metadata: Record<SupportedSport, unknown> = {} as Record<SupportedSport, unknown>;
    
    for (const sport of this.getSupportedSports()) {
      metadata[sport] = this.getPluginMetadata(sport);
    }
    
    return metadata;
  }
}

// Export singleton instance for easy access
export const sportPluginRegistry = SportPluginRegistry.getInstance();

// Export utility functions
export function getPluginForSport(sport: SupportedSport): SportPlugin {
  return sportPluginRegistry.getPlugin(sport);
}

export function validateSportAndDiscipline(sport: string, discipline: string): boolean {
  if (!sportPluginRegistry.isValidSport(sport)) {
    return false;
  }
  return sportPluginRegistry.validateSportDiscipline(sport as SupportedSport, discipline);
}

export function getSportFromDiscipline(discipline: string): SupportedSport | null {
  return sportPluginRegistry.getSportFromDiscipline(discipline);
}