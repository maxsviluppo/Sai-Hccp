
import { Injectable, signal, computed } from '@angular/core';

export type UserRole = 'ADMIN' | 'COLLABORATOR' | null;

export interface ClientEntity {
  id: string;
  name: string;
  piva: string;
  address: string;
  phone: string;
  email: string;
  licenseNumber: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string; 
  active: boolean;
  avatar: string;
  clientId?: string; // Link to the specific Company/Client
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  clientId?: string;
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

  // --- Clients / Companies Database (New) ---
  readonly clients = signal<ClientEntity[]>([
    {
      id: 'c1',
      name: 'Ristorante Da Mario S.r.l.',
      piva: '12345678901',
      address: 'Via Roma 1, Milano',
      phone: '02 1234567',
      email: 'info@damario.it',
      licenseNumber: 'HACCP-MI-001'
    },
    {
      id: 'c2',
      name: 'Pizzeria Bella Napoli',
      piva: '98765432109',
      address: 'Corso Italia 50, Napoli',
      phone: '081 5556667',
      email: 'admin@bellanapoli.it',
      licenseNumber: 'HACCP-NA-999'
    }
  ]);

  // --- System Users State ---
  readonly systemUsers = signal<SystemUser[]>([
    { 
      id: '1', 
      name: 'Amministratore Sede', 
      email: 'admin@gestionale.it', 
      role: 'ADMIN', 
      department: 'Direzione',
      active: true,
      avatar: 'https://ui-avatars.com/api/?name=Admin+Sede&background=0f172a&color=fff',
      clientId: undefined // Admin sees all or manages system
    },
    { 
      id: '2', 
      name: 'Mario Rossi (Capo Sala)', 
      email: 'mario@damario.it', 
      role: 'COLLABORATOR', 
      department: 'Sala',
      active: true,
      avatar: 'https://ui-avatars.com/api/?name=Mario+Rossi&background=3b82f6&color=fff',
      clientId: 'c1' // Belongs to Ristorante Da Mario
    },
    { 
      id: '3', 
      name: 'Luigi Verdi (Chef)', 
      email: 'chef@bellanapoli.it', 
      role: 'COLLABORATOR', 
      department: 'Cucina',
      active: true, // Example: Active
      avatar: 'https://ui-avatars.com/api/?name=Luigi+Verdi&background=10b981&color=fff',
      clientId: 'c2' // Belongs to Pizzeria Bella Napoli
    },
    { 
      id: '4', 
      name: 'Giulia Bianchi (Bar)', 
      email: 'giulia@damario.it', 
      role: 'COLLABORATOR', 
      department: 'Bar',
      active: false, // Example: Access Disabled
      avatar: 'https://ui-avatars.com/api/?name=Giulia+Bianchi&background=d97706&color=fff',
      clientId: 'c1'
    }
  ]);

  // --- Current Active Company Config ---
  // If Admin, this might be the first client or a specific selected one.
  // If Collaborator, this is THEIR client.
  readonly companyConfig = signal<ClientEntity>({
    id: 'demo',
    name: 'Demo Company S.r.l.',
    piva: '00000000000',
    address: 'Via Demo 1',
    phone: '',
    email: '',
    licenseNumber: ''
  });

  // --- Menu Definitions ---
  readonly menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', category: 'dashboard' },
    
    // Daily Checks
    { id: 'operational-checklist', label: 'Controllo Pre/Post Op.', icon: 'fa-list-check', category: 'daily-checks' },

    // Anagrafiche
    { id: 'staff-training', label: 'Formazione Personale', icon: 'fa-graduation-cap', category: 'anagrafiche', adminOnly: true },
    { id: 'suppliers', label: 'Elenco Fornitori', icon: 'fa-truck-field', category: 'anagrafiche', adminOnly: true },
    { id: 'products-cleaning', label: 'Prodotti Pulizia', icon: 'fa-pump-soap', category: 'anagrafiche' },
    { id: 'equipment', label: 'Elenco Attrezzature', icon: 'fa-blender', category: 'anagrafiche' },
    { id: 'ingredients', label: 'Ingredienti & Allergeni', icon: 'fa-wheat-awn', category: 'anagrafiche' },

    // Operativo
    { id: 'staff-hygiene', label: 'Igiene Personale', icon: 'fa-hands-bubbles', category: 'operativo' },
    { id: 'cleaning-work', label: 'Pulizia Beni Lavoro', icon: 'fa-broom', category: 'operativo' },
    { id: 'cleaning-equip', label: 'Manutenzione Attrezz.', icon: 'fa-screwdriver-wrench', category: 'operativo' },
    { id: 'goods-receipt', label: 'Ricezione Prodotti', icon: 'fa-box-open', category: 'operativo' },
    { id: 'temp-control', label: 'Controllo Temperature', icon: 'fa-temperature-half', category: 'operativo' },
    { id: 'blast-chiller', label: 'Abbattitore', icon: 'fa-snowflake', category: 'operativo' },
    { id: 'ice-machine', label: 'Macchina Ghiaccio', icon: 'fa-cubes', category: 'operativo' },

    // Normativa
    { id: 'pest-control', label: 'Pest Control (Ratti/Blatte)', icon: 'fa-bug', category: 'normativa' },
    { id: 'animal-byproducts', label: 'Sottoprodotti (1069/09)', icon: 'fa-bone', category: 'normativa' },
    { id: 'micro-bio', label: 'Monitoraggio Microbio.', icon: 'fa-vial', category: 'normativa' },
    { id: 'non-compliance', label: 'Non Conformità', icon: 'fa-triangle-exclamation', category: 'normativa' },

    // Config
    { id: 'settings', label: 'Gestione Aziende', icon: 'fa-building', category: 'config', adminOnly: true },
    { id: 'collaborators', label: 'Gestione Collaboratori', icon: 'fa-users-gear', category: 'config', adminOnly: true },
  ];

  login(role: UserRole) {
    if (role === 'ADMIN') {
      const adminUser = this.systemUsers().find(u => u.role === 'ADMIN');
      if (adminUser) {
        this.currentUser.set({ id: adminUser.id, name: adminUser.name, role: 'ADMIN', avatar: adminUser.avatar, clientId: adminUser.clientId });
        // Admin defaults to the first client in list for view purposes, or a generic dash
        this.companyConfig.set(this.clients()[0]); 
      }
    } else {
      // Login as the first active collaborator found for demo
      const collabUser = this.systemUsers().find(u => u.role === 'COLLABORATOR' && u.active);
      if (collabUser) {
        this.currentUser.set({ id: collabUser.id, name: collabUser.name, role: 'COLLABORATOR', avatar: collabUser.avatar, clientId: collabUser.clientId });
        
        // LOAD THE SPECIFIC CLIENT CONFIG FOR THIS USER
        const clientConfig = this.clients().find(c => c.id === collabUser.clientId);
        if (clientConfig) {
          this.companyConfig.set(clientConfig);
        }
      }
    }
    this.currentModuleId.set('dashboard');
  }

  logout() {
    this.currentUser.set(null);
    this.currentModuleId.set('dashboard');
    this.filterCollaboratorId.set(''); 
  }

  setModule(id: string) {
    this.currentModuleId.set(id);
  }

  setCollaboratorFilter(id: string) {
    this.filterCollaboratorId.set(id);
  }

  // --- Client/Company Management Methods ---
  
  addClient(client: Omit<ClientEntity, 'id'>) {
    const newClient = { ...client, id: Math.random().toString(36).substr(2, 9) };
    this.clients.update(c => [...c, newClient]);
  }

  updateClient(id: string, updates: Partial<ClientEntity>) {
    this.clients.update(clients => 
      clients.map(c => c.id === id ? { ...c, ...updates } : c)
    );
    // If currently viewing this company, update the view immediately
    if (this.companyConfig().id === id) {
      this.companyConfig.update(c => ({ ...c, ...updates }));
    }
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
