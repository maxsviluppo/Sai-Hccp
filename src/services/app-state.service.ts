
import { Injectable, signal, computed } from '@angular/core';

export type UserRole = 'ADMIN' | 'COLLABORATOR' | null;

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string; // e.g., 'Cucina', 'Pulizie', 'Magazzino'
  active: boolean;
  avatar: string;
}

export interface User {
  name: string;
  role: UserRole;
  avatar: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  category: 'dashboard' | 'daily-checks' | 'anagrafiche' | 'operativo' | 'normativa' | 'config';
  adminOnly?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  // --- Auth State ---
  readonly currentUser = signal<User | null>(null);
  
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');

  // --- Navigation State ---
  readonly currentModuleId = signal<string>('dashboard');
  
  // --- Global Filter State ---
  readonly filterCollaboratorId = signal<string>(''); // '' means All

  // --- System Users State (Database Mock) ---
  readonly systemUsers = signal<SystemUser[]>([
    { 
      id: '1', 
      name: 'Mario Rossi', 
      email: 'mario.admin@azienda.it', 
      role: 'ADMIN', 
      department: 'Direzione',
      active: true,
      avatar: 'https://ui-avatars.com/api/?name=Mario+Rossi&background=0f172a&color=fff'
    },
    { 
      id: '2', 
      name: 'Luigi Verdi', 
      email: 'luigi.op@azienda.it', 
      role: 'COLLABORATOR', 
      department: 'Cucina',
      active: true,
      avatar: 'https://ui-avatars.com/api/?name=Luigi+Verdi&background=3b82f6&color=fff'
    },
    { 
      id: '3', 
      name: 'Giulia Bianchi', 
      email: 'giulia.clean@azienda.it', 
      role: 'COLLABORATOR', 
      department: 'Sanificazione',
      active: true,
      avatar: 'https://ui-avatars.com/api/?name=Giulia+Bianchi&background=10b981&color=fff'
    }
  ]);

  // --- Company Config State (Mock) ---
  readonly companyConfig = signal({
    name: 'Ristorante Da Mario S.r.l.',
    piva: '12345678901',
    address: 'Via Roma 1, Milano',
    phone: '+39 02 1234567',
    email: 'info@damario.it',
    licenseNumber: 'HACCP-2024-001'
  });

  // --- Menu Definitions ---
  readonly menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', category: 'dashboard' },
    
    // Daily Checks (New Category)
    { id: 'operational-checklist', label: 'Controllo Pre/Post Op.', icon: 'fa-list-check', category: 'daily-checks' },

    // Anagrafiche (Setup Data)
    { id: 'staff-training', label: 'Formazione Personale', icon: 'fa-graduation-cap', category: 'anagrafiche', adminOnly: true },
    { id: 'suppliers', label: 'Elenco Fornitori', icon: 'fa-truck-field', category: 'anagrafiche', adminOnly: true },
    { id: 'products-cleaning', label: 'Prodotti Pulizia', icon: 'fa-pump-soap', category: 'anagrafiche' },
    { id: 'equipment', label: 'Elenco Attrezzature', icon: 'fa-blender', category: 'anagrafiche' },
    { id: 'ingredients', label: 'Ingredienti & Allergeni', icon: 'fa-wheat-awn', category: 'anagrafiche' },

    // Operativo (Daily Tasks)
    { id: 'staff-hygiene', label: 'Igiene Personale', icon: 'fa-hands-bubbles', category: 'operativo' },
    { id: 'cleaning-work', label: 'Pulizia Beni Lavoro', icon: 'fa-broom', category: 'operativo' },
    { id: 'cleaning-equip', label: 'Manutenzione Attrezz.', icon: 'fa-screwdriver-wrench', category: 'operativo' },
    { id: 'goods-receipt', label: 'Ricezione Prodotti', icon: 'fa-box-open', category: 'operativo' },
    { id: 'temp-control', label: 'Controllo Temperature', icon: 'fa-temperature-half', category: 'operativo' },
    { id: 'blast-chiller', label: 'Abbattitore', icon: 'fa-snowflake', category: 'operativo' },
    { id: 'ice-machine', label: 'Macchina Ghiaccio', icon: 'fa-cubes', category: 'operativo' },

    // Normativa & Controlli Specifici
    { id: 'pest-control', label: 'Pest Control (Ratti/Blatte)', icon: 'fa-bug', category: 'normativa' },
    { id: 'animal-byproducts', label: 'Sottoprodotti (1069/09)', icon: 'fa-bone', category: 'normativa' },
    { id: 'micro-bio', label: 'Monitoraggio Microbio.', icon: 'fa-vial', category: 'normativa' },
    { id: 'non-compliance', label: 'Non Conformità', icon: 'fa-triangle-exclamation', category: 'normativa' },

    // Config
    { id: 'settings', label: 'Configurazione Azienda', icon: 'fa-cog', category: 'config', adminOnly: true },
    { id: 'collaborators', label: 'Gestione Collaboratori', icon: 'fa-users-gear', category: 'config', adminOnly: true },
  ];

  login(role: UserRole) {
    if (role === 'ADMIN') {
      this.currentUser.set({
        name: 'Amministratore Sede',
        role: 'ADMIN',
        avatar: 'https://ui-avatars.com/api/?name=Admin+Sede&background=0f172a&color=fff'
      });
    } else {
      this.currentUser.set({
        name: 'Collaboratore Operativo',
        role: 'COLLABORATOR',
        avatar: 'https://ui-avatars.com/api/?name=Mario+Rossi&background=3b82f6&color=fff'
      });
    }
    this.currentModuleId.set('dashboard');
  }

  logout() {
    this.currentUser.set(null);
    this.currentModuleId.set('dashboard');
    this.filterCollaboratorId.set(''); // Reset filter on logout
  }

  setModule(id: string) {
    this.currentModuleId.set(id);
  }

  setCollaboratorFilter(id: string) {
    this.filterCollaboratorId.set(id);
  }

  updateCompanyConfig(newConfig: any) {
    this.companyConfig.set(newConfig);
  }

  // --- User Management Methods ---
  
  addSystemUser(user: Omit<SystemUser, 'id' | 'avatar'>) {
    const newUser: SystemUser = {
      ...user,
      id: Math.random().toString(36).substr(2, 9),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`
    };
    this.systemUsers.update(users => [...users, newUser]);
  }

  updateSystemUser(id: string, updates: Partial<SystemUser>) {
    this.systemUsers.update(users => 
      users.map(u => u.id === id ? { ...u, ...updates } : u)
    );
  }

  deleteSystemUser(id: string) {
    this.systemUsers.update(users => users.filter(u => u.id !== id));
  }
}
