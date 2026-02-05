import { Injectable, signal, computed, inject } from '@angular/core';
import { ToastService } from './toast.service';

export type UserRole = 'ADMIN' | 'COLLABORATOR' | null;

export interface ClientEntity {
  id: string;
  name: string;
  piva: string;
  address: string;
  phone: string;
  email: string;
  licenseNumber: string;
  suspended: boolean; // Service suspension for non-payment
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
  username?: string;
  password?: string;
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
  category: 'dashboard' | 'daily-checks' | 'anagrafiche' | 'operativo' | 'normativa' | 'config' | 'communication';
  adminOnly?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientType: 'ALL' | 'SINGLE';
  recipientId?: string; // clientId if SINGLE
  subject: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  timestamp: Date;
  read: boolean;
  replies: MessageReply[];
}

export interface MessageReply {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  timestamp: Date;
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
  readonly filterDate = signal<string>(new Date().toISOString().split('T')[0]); // Default Today

  // Editing Permission Logic
  readonly isContextEditable = computed(() => {
    // If not admin (Operator via login), they can always edit their current view (which is their own)
    if (!this.isAdmin()) return true;

    // If Admin, they can ONLY edit if they have selected a specific target context (Collaborator/Unit)
    return !!this.filterCollaboratorId();
  });

  // Services
  private toastService = inject(ToastService);

  // --- Data Store (Mock Database) ---
  // Stores all checks from all users
  readonly checklistRecords = signal<{
    id: string;
    moduleId: string;
    userId: string;
    date: string;
    data: any;
    timestamp: Date;
  }[]>([]);

  // --- Clients / Companies Database (New) ---
  readonly clients = signal<ClientEntity[]>([
    {
      id: 'c1',
      name: 'Ristorante Da Mario S.r.l.',
      piva: '12345678901',
      address: 'Via Roma 1, Milano',
      phone: '02 1234567',
      email: 'info@damario.it',
      licenseNumber: 'HACCP-MI-001',
      suspended: false
    },
    {
      id: 'c2',
      name: 'Pizzeria Bella Napoli',
      piva: '98765432109',
      address: 'Corso Italia 50, Napoli',
      phone: '081 5556667',
      email: 'admin@bellanapoli.it',
      licenseNumber: 'HACCP-NA-999',
      suspended: false
    }
  ]);

  // --- System Users State ---
  readonly systemUsers = signal<SystemUser[]>([
    // Admin Removed as per request
    // {
    //   id: '1',
    //   name: 'Amministratore Sede',
    //   email: 'admin@gestionale.it',
    //   role: 'ADMIN',
    //   department: 'Direzione',
    //   active: true,
    //   avatar: 'https://ui-avatars.com/api/?name=Admin+Sede&background=0f172a&color=fff',
    //   clientId: undefined,
    //   username: 'admin',
    //   password: 'password'
    // },
    {
      id: '2',
      name: 'Mario Rossi (Capo Sala)',
      email: 'mario@damario.it',
      role: 'COLLABORATOR',
      department: 'Sala',
      active: true,
      avatar: 'https://ui-avatars.com/api/?name=Mario+Rossi&background=3b82f6&color=fff',
      clientId: 'c1',
      username: 'mario',
      password: 'password'
    },
    {
      id: '3',
      name: 'Luigi Verdi (Chef)',
      email: 'chef@bellanapoli.it',
      role: 'COLLABORATOR',
      department: 'Cucina',
      active: true,
      avatar: 'https://ui-avatars.com/api/?name=Luigi+Verdi&background=10b981&color=fff',
      clientId: 'c2',
      username: 'luigi',
      password: 'password'
    },
    {
      id: '4',
      name: 'Giulia Bianchi (Bar)',
      email: 'giulia@damario.it',
      role: 'COLLABORATOR',
      department: 'Bar',
      active: false,
      avatar: 'https://ui-avatars.com/api/?name=Giulia+Bianchi&background=d97706&color=fff',
      clientId: 'c1',
      username: 'giulia',
      password: 'password'
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
    licenseNumber: '',
    suspended: false
  });

  // --- Messages Database ---
  readonly messages = signal<Message[]>([
    {
      id: 'm1',
      senderId: '1',
      senderName: 'Amministrazione',
      subject: 'Benvenuti nel nuovo sistema HACCP Pro',
      content: 'Siamo lieti di annunciare il lancio della nuova piattaforma. Per qualsiasi assistenza, utilizzate questo modulo di messaggistica.',
      recipientType: 'ALL',
      timestamp: new Date(Date.now() - 86400000 * 2), // 2 days ago
      read: true,
      replies: []
    },
    {
      id: 'm2',
      senderId: '1',
      senderName: 'Amministrazione',
      subject: 'Aggiornamento Documentazione',
      content: 'Abbiamo caricato i nuovi moduli per il controllo temperature. Si prega di prenderne visione.',
      recipientType: 'SINGLE',
      recipientId: 'c1',
      timestamp: new Date(Date.now() - 3600000 * 5), // 5 hours ago
      read: false,
      replies: []
    }
  ]);

  readonly unreadMessagesCount = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;

    return this.messages().filter(msg => {
      // Admin sees all messages
      if (user.role === 'ADMIN') {
        return !msg.read && msg.senderId !== user.id;
      }
      // Collaborator sees messages for their company or broadcast
      return !msg.read &&
        msg.senderId !== user.id &&
        (msg.recipientType === 'ALL' || msg.recipientId === user.clientId);
    }).length;
  });

  // --- Menu Definitions ---
  readonly menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', category: 'dashboard' },
    { id: 'reports', label: 'Report Controlli', icon: 'fa-file-contract', category: 'dashboard', adminOnly: true },
    { id: 'general-checks', label: 'Controlli Generali', icon: 'fa-list-check', category: 'dashboard', adminOnly: true },

    // Daily Checks
    { id: 'operational-checklist', label: 'Controllo Pre/Post Op.', icon: 'fa-list-check', category: 'daily-checks' },

    // Anagrafiche
    { id: 'staff-training', label: 'Formazione Personale', icon: 'fa-graduation-cap', category: 'anagrafiche', adminOnly: true },
    { id: 'suppliers', label: 'Elenco Fornitori', icon: 'fa-truck-field', category: 'anagrafiche', adminOnly: true },
    { id: 'products-cleaning', label: 'Prodotti Pulizia', icon: 'fa-pump-soap', category: 'anagrafiche' },
    { id: 'equipment', label: 'Elenco Attrezzature', icon: 'fa-blender', category: 'anagrafiche' },
    { id: 'allergens-ue1169', label: 'Reg. U.E. 1169/2011', icon: 'fa-wheat-awn', category: 'anagrafiche' },

    // Operativo
    { id: 'staff-hygiene', label: 'Igiene Personale', icon: 'fa-hands-bubbles', category: 'operativo' },
    { id: 'cleaning-maintenance', label: 'Pulizia / Manutenzione', icon: 'fa-broom', category: 'operativo' },
    { id: 'goods-receipt', label: 'Ricezione Prodotti', icon: 'fa-box-open', category: 'operativo' },
    { id: 'food-conservation', label: 'Conservazione Alimenti', icon: 'fa-temperature-half', category: 'operativo' },
    { id: 'temperatures', label: 'Temperature', icon: 'fa-temperature-low', category: 'operativo' },
    { id: 'traceability', label: 'Rintracciabilità Alimenti', icon: 'fa-barcode', category: 'operativo' },

    // Normativa
    { id: 'pest-control', label: 'Controllo Infestanti', icon: 'fa-bug', category: 'normativa' },
    { id: 'micro-bio', label: 'Monitoraggio Microbiologico', icon: 'fa-vial', category: 'normativa' },
    { id: 'non-compliance', label: 'Non Conformità', icon: 'fa-triangle-exclamation', category: 'normativa' },

    // Config
    { id: 'collaborators', label: 'Gestione Collaboratori', icon: 'fa-users-gear', category: 'config', adminOnly: true },
    { id: 'messages', label: 'Messaggistica', icon: 'fa-comments', category: 'communication', adminOnly: false },
    { id: 'accounting', label: 'Contabilità', icon: 'fa-calculator', category: 'config', adminOnly: true },
  ];

  loginWithCredentials(username: string, pass: string): boolean {
    // Backdoor for Development ("Accessi Aperti")
    if (username === 'dev' && pass === 'dev') {
      this.currentUser.set({
        id: 'dev-admin',
        name: 'Sviluppatore (Admin)',
        role: 'ADMIN',
        avatar: 'https://ui-avatars.com/api/?name=Dev&background=000&color=fff',
        clientId: 'demo' // Default to demo context
      });
      // Default config
      if (this.clients().length > 0) this.companyConfig.set(this.clients()[0]);

      this.currentModuleId.set('dashboard');
      return true;
    }

    const user = this.systemUsers().find(u => u.username === username && u.password === pass && u.active);

    if (user) {
      // Check if user's company is suspended
      const userClient = this.clients().find(c => c.id === user.clientId);
      if (userClient?.suspended) {
        this.toastService.error(
          'Accesso Negato',
          'Servizio sospeso per mancato pagamento. Contattare l\'amministrazione.'
        );
        return false;
      }

      this.loginAsUser(user);
      return true;
    }
    return false;
  }

  loginAsUser(user: SystemUser) {
    if (user.active) {
      this.currentUser.set({ id: user.id, name: user.name, role: user.role, avatar: user.avatar, clientId: user.clientId });

      // Determine company config (Admin -> First or demo, Collab -> Their Client)
      if (user.role === 'ADMIN') {
        this.companyConfig.set(this.clients()[0]); // Default to first client for admin view
      } else {
        const clientConfig = this.clients().find(c => c.id === user.clientId);
        if (clientConfig) this.companyConfig.set(clientConfig);
      }

      this.currentModuleId.set('dashboard');
    }
  }

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
    this.filterDate.set(new Date().toISOString().split('T')[0]);
  }

  setModule(id: string) {
    this.currentModuleId.set(id);
  }

  setCollaboratorFilter(id: string) {
    this.filterCollaboratorId.set(id);
  }

  setDateFilter(date: string) {
    this.filterDate.set(date);
  }

  // --- Data Access Methods ---

  saveRecord(moduleId: string, data: any) {
    const user = this.currentUser();
    if (!user) return;

    const date = this.filterDate(); // Usually save for the SELECTED date context
    // Ideally, a collaborator saves for Today, but let's assume filterDate is the "Working Date"

    // Remove existing record for this user/date/module if exists (upsert)
    const newRecord = {
      id: Math.random().toString(36).substr(2, 9),
      moduleId,
      userId: user.id,
      date,
      data,
      timestamp: new Date()
    };

    this.checklistRecords.update(records => [
      ...records.filter(r => !(r.moduleId === moduleId && r.userId === user.id && r.date === date)),
      newRecord
    ]);
  }

  getRecord(moduleId: string) {
    // Determine context
    let targetUserId = this.currentUser()?.id;
    const targetDate = this.filterDate();

    if (this.isAdmin() && this.filterCollaboratorId()) {
      targetUserId = this.filterCollaboratorId();
    }

    // If admin has NO filter selected, maybe show nothing or aggregate?
    // User requested: "selezionando ... un collaboratore e la data ... mi deve apparire"
    // So if no collaborator is selected, we might return null or empty to indicate "Select a user".
    // Or we return the Admin's own data (if they want to do checks). 
    // Let's default to Admin's own data if no filter, OR if admin wants to see "All" that's harder for a Detail view.
    // For now, simple: returns record for targetUserId + targetDate

    if (!targetUserId) return null;

    return this.checklistRecords().find(r =>
      r.moduleId === moduleId && r.userId === targetUserId && r.date === targetDate
    )?.data || null;
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

  // Toggle company suspension (for non-payment)
  toggleClientSuspension(id: string, suspended: boolean) {
    this.updateClient(id, { suspended });

    // If reactivating, ensure at least one user is active
    if (!suspended) {
      const clientUsers = this.systemUsers().filter(u => u.clientId === id);
      if (clientUsers.length > 0 && clientUsers.every(u => !u.active)) {
        // Reactivate first user to allow access
        this.updateSystemUser(clientUsers[0].id, { active: true });
      }
    }
  }

  // Auto-suspend company if all users are disabled
  checkAutoSuspendClient(clientId: string) {
    const clientUsers = this.systemUsers().filter(u => u.clientId === clientId && u.role !== 'ADMIN');

    // If all operational users are inactive, auto-suspend the company
    if (clientUsers.length > 0 && clientUsers.every(u => !u.active)) {
      this.updateClient(clientId, { suspended: true });
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

    // Auto-suspend company if all users are now disabled
    if (updates.active === false) {
      const user = this.systemUsers().find(u => u.id === id);
      if (user?.clientId) {
        this.checkAutoSuspendClient(user.clientId);
      }
    }
  }

  deleteSystemUser(id: string) {
    this.systemUsers.update(users => users.filter(u => u.id !== id));
  }

  // --- Messaging Methods ---
  sendMessage(subject: string, content: string, recipientType: 'ALL' | 'SINGLE', recipientId?: string, attachment?: { url: string, name: string }) {
    const user = this.currentUser();
    if (!user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      recipientType,
      recipientId,
      subject,
      content,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      timestamp: new Date(),
      read: false,
      replies: []
    };

    this.messages.update(msgs => [...msgs, newMessage]);

    // Show toast notification to recipients
    if (recipientType === 'ALL') {
      this.toastService.success('Messaggio inviato', 'Inviato a tutte le aziende');
    } else if (recipientId === 'ADMIN_OFFICE') {
      this.toastService.success('Messaggio inviato', 'Inviato all\'Amministrazione');
    } else {
      const client = this.clients().find(c => c.id === recipientId);
      this.toastService.success('Messaggio inviato', `Inviato a ${client?.name}`);
    }
  }

  replyToMessage(messageId: string, content: string, attachment?: { url: string, name: string }) {
    const user = this.currentUser();
    if (!user) return;

    const reply: MessageReply = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      content,
      attachmentUrl: attachment?.url,
      attachmentName: attachment?.name,
      timestamp: new Date()
    };

    this.messages.update(msgs =>
      msgs.map(msg =>
        msg.id === messageId
          ? { ...msg, replies: [...msg.replies, reply] }
          : msg
      )
    );

    this.toastService.success('Risposta inviata', 'La tua risposta è stata inviata');
  }

  markMessageAsRead(messageId: string) {
    this.messages.update(msgs =>
      msgs.map(msg =>
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );
  }

  getMessagesForCurrentUser() {
    const user = this.currentUser();
    if (!user) return [];

    if (user.role === 'ADMIN') {
      return this.messages();
    }

    // Collaborators see:
    // 1. Messages they sent
    // 2. Messages sent to everyone (broadcast)
    // 3. Messages sent to their specific company
    return this.messages().filter(msg =>
      msg.senderId === user.id ||
      msg.recipientType === 'ALL' ||
      msg.recipientId === user.clientId
    );
  }
}

