import { apiRequest } from '@/lib/queryClient';

export interface GanttFavorite {
  id: string;
  name: string;
  description?: string;
  config: {
    viewPreset: string;
    startDate: string;
    endDate: string;
    filters?: any;
    grouping?: string;
    sorting?: string;
    columns?: any[];
    features?: any;
  };
  isDefault?: boolean;
  isShared?: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export class GanttFavoritesService {
  private static instance: GanttFavoritesService;
  private favorites: Map<string, GanttFavorite> = new Map();
  
  private constructor() {
    this.loadFavorites();
  }
  
  static getInstance(): GanttFavoritesService {
    if (!GanttFavoritesService.instance) {
      GanttFavoritesService.instance = new GanttFavoritesService();
    }
    return GanttFavoritesService.instance;
  }
  
  /**
   * Load favorites from storage
   */
  private async loadFavorites(): Promise<void> {
    try {
      // Try to load from backend first
      const serverFavorites = await this.fetchFromServer();
      serverFavorites.forEach(fav => {
        this.favorites.set(fav.id, fav);
      });
    } catch (error) {
      console.error('Failed to load favorites from server:', error);
      // Fall back to localStorage
      this.loadFromLocalStorage();
    }
  }
  
  /**
   * Load favorites from localStorage
   */
  private loadFromLocalStorage(): void {
    const stored = localStorage.getItem('ganttFavorites');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach(fav => {
            this.favorites.set(fav.id, fav);
          });
        }
      } catch (error) {
        console.error('Failed to parse stored favorites:', error);
      }
    }
    
    // Add default favorites if none exist
    if (this.favorites.size === 0) {
      this.addDefaultFavorites();
    }
  }
  
  /**
   * Add default favorite views
   */
  private addDefaultFavorites(): void {
    const defaults: Omit<GanttFavorite, 'id'>[] = [
      {
        name: 'Today\'s Schedule',
        description: 'Focus on today\'s operations',
        config: {
          viewPreset: 'hourAndDay',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          grouping: 'department'
        },
        isDefault: true,
        isShared: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        name: 'Weekly View',
        description: 'Operations for the current week',
        config: {
          viewPreset: 'weekAndDay',
          startDate: this.getWeekStart().toISOString(),
          endDate: this.getWeekEnd().toISOString(),
          grouping: 'type'
        },
        isDefault: false,
        isShared: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        name: 'Bottleneck Analysis',
        description: 'Focus on bottleneck resources',
        config: {
          viewPreset: 'dayAndWeek',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          filters: {
            isBottleneck: true
          }
        },
        isDefault: false,
        isShared: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      },
      {
        name: 'Monthly Overview',
        description: 'High-level monthly schedule',
        config: {
          viewPreset: 'monthAndYear',
          startDate: this.getMonthStart().toISOString(),
          endDate: this.getMonthEnd().toISOString(),
          grouping: 'department'
        },
        isDefault: false,
        isShared: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      }
    ];
    
    defaults.forEach(fav => {
      const id = this.generateId();
      this.favorites.set(id, { ...fav, id });
    });
    
    this.saveToLocalStorage();
  }
  
  /**
   * Get all favorites
   */
  getAllFavorites(): GanttFavorite[] {
    return Array.from(this.favorites.values());
  }
  
  /**
   * Get favorite by ID
   */
  getFavorite(id: string): GanttFavorite | undefined {
    return this.favorites.get(id);
  }
  
  /**
   * Get default favorite
   */
  getDefaultFavorite(): GanttFavorite | undefined {
    return Array.from(this.favorites.values()).find(f => f.isDefault);
  }
  
  /**
   * Save a new favorite
   */
  async saveFavorite(favorite: Omit<GanttFavorite, 'id' | 'createdAt' | 'updatedAt'>): Promise<GanttFavorite> {
    const newFavorite: GanttFavorite = {
      ...favorite,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.favorites.set(newFavorite.id, newFavorite);
    this.saveToLocalStorage();
    
    // Try to save to server
    try {
      await this.saveToServer(newFavorite);
    } catch (error) {
      console.error('Failed to save favorite to server:', error);
    }
    
    return newFavorite;
  }
  
  /**
   * Update a favorite
   */
  async updateFavorite(id: string, updates: Partial<GanttFavorite>): Promise<GanttFavorite | null> {
    const existing = this.favorites.get(id);
    if (!existing) {
      return null;
    }
    
    const updated: GanttFavorite = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date()
    };
    
    this.favorites.set(id, updated);
    this.saveToLocalStorage();
    
    // Try to update on server
    try {
      await this.updateOnServer(updated);
    } catch (error) {
      console.error('Failed to update favorite on server:', error);
    }
    
    return updated;
  }
  
  /**
   * Delete a favorite
   */
  async deleteFavorite(id: string): Promise<boolean> {
    const deleted = this.favorites.delete(id);
    if (deleted) {
      this.saveToLocalStorage();
      
      // Try to delete from server
      try {
        await this.deleteFromServer(id);
      } catch (error) {
        console.error('Failed to delete favorite from server:', error);
      }
    }
    return deleted;
  }
  
  /**
   * Set default favorite
   */
  setDefaultFavorite(id: string): void {
    // Clear existing defaults
    this.favorites.forEach(fav => {
      fav.isDefault = false;
    });
    
    // Set new default
    const favorite = this.favorites.get(id);
    if (favorite) {
      favorite.isDefault = true;
      this.saveToLocalStorage();
    }
  }
  
  /**
   * Apply a favorite configuration
   */
  applyFavorite(id: string): any {
    const favorite = this.favorites.get(id);
    if (!favorite) {
      throw new Error(`Favorite ${id} not found`);
    }
    
    return {
      ...favorite.config,
      startDate: new Date(favorite.config.startDate),
      endDate: new Date(favorite.config.endDate)
    };
  }
  
  /**
   * Export favorites
   */
  exportFavorites(): string {
    const favoritesArray = Array.from(this.favorites.values());
    return JSON.stringify(favoritesArray, null, 2);
  }
  
  /**
   * Import favorites
   */
  importFavorites(jsonString: string): void {
    try {
      const imported = JSON.parse(jsonString);
      if (Array.isArray(imported)) {
        imported.forEach(fav => {
          if (fav.id && fav.name && fav.config) {
            this.favorites.set(fav.id, {
              ...fav,
              createdAt: new Date(fav.createdAt),
              updatedAt: new Date(fav.updatedAt)
            });
          }
        });
        this.saveToLocalStorage();
      }
    } catch (error) {
      throw new Error('Invalid favorites data');
    }
  }
  
  // Helper methods
  
  private generateId(): string {
    return `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private getWeekStart(): Date {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  }
  
  private getWeekEnd(): Date {
    const weekStart = this.getWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }
  
  private getMonthStart(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  private getMonthEnd(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  
  private saveToLocalStorage(): void {
    const favoritesArray = Array.from(this.favorites.values());
    localStorage.setItem('ganttFavorites', JSON.stringify(favoritesArray));
  }
  
  // Server communication methods (implement when backend is ready)
  
  private async fetchFromServer(): Promise<GanttFavorite[]> {
    // TODO: Implement API call
    // return apiRequest('/api/gantt-favorites');
    return [];
  }
  
  private async saveToServer(favorite: GanttFavorite): Promise<void> {
    // TODO: Implement API call
    // await apiRequest('/api/gantt-favorites', { method: 'POST', body: JSON.stringify(favorite) });
  }
  
  private async updateOnServer(favorite: GanttFavorite): Promise<void> {
    // TODO: Implement API call
    // await apiRequest(`/api/gantt-favorites/${favorite.id}`, { method: 'PUT', body: JSON.stringify(favorite) });
  }
  
  private async deleteFromServer(id: string): Promise<void> {
    // TODO: Implement API call
    // await apiRequest(`/api/gantt-favorites/${id}`, { method: 'DELETE' });
  }
}