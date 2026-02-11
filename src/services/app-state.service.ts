import { Injectable, signal, computed, inject } from '@angular/core';
import { ToastService } from './toast.service';

export type UserRole = 'ADMIN' | 'COLLABORATOR' | null;

export interface AdminCompany {
  name: string;
  piva: string;
  address: string;
  phone: string;
  cellphone: string;
  whatsapp: string;
  email: string;
  pec: string;
  sdi: string;
  licenseNumber: string;
  logo?: string;
}

export interface ClientEntity {
  id: string;
  name: string;
  piva: string;
  address: string;
  phone: string;
  cellphone?: string;
  whatsapp?: string;
  email: string;
  licenseNumber: string;
  suspended: boolean; // Service suspension for non-payment
  logo?: string;
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
  department?: string;
  clientId?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  category: 'dashboard' | 'operations' | 'history' | 'monitoring' | 'config' | 'communication';
  adminOnly?: boolean;
  operatorOnly?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientType: 'ALL' | 'SINGLE';
  recipientId?: string; // clientId if SINGLE
  recipientUserId?: string; // specific userId if SINGLE
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
  readonly reportRecipientEmail = signal<string>('amministrazione@haccppro.it');

  readonly currentLogo = computed(() => {
    if (this.isAdmin()) {
      return this.adminCompany().logo || '/logo.png';
    }
    return this.companyConfig().logo || '/logo.png';
  });

  // --- Admin Company / Master Data ---
  readonly adminCompany = signal<AdminCompany>({
    name: 'HACCP PRO - Sede Centrale',
    piva: '01234567890',
    address: 'Via dell\'Innovazione 10, Milano (MI)',
    phone: '02 99887766',
    cellphone: '333 1234567',
    whatsapp: '333 1234567',
    email: 'amministrazione@haccppro.it',
    pec: 'haccppro@legalmail.it',
    sdi: 'M5UXCR1',
    licenseNumber: 'HQ-RE-2024-001',
    logo: '/logo.png'
  });

  // Editing Permission Logic
  readonly isContextEditable = computed(() => {
    // If not admin (Operator via login), they can always edit their current view (which is their own)
    if (!this.isAdmin()) return true;

    // For Admin:
    // If we are in 'monitoring' category modules, they can edit IF they selected a collaborator
    // This allows them to "feedback" or correct values.
    const activeMod = this.currentModuleId();
    const menuItem = this.menuItems.find(m => m.id === activeMod);

    if (menuItem?.category === 'monitoring' || menuItem?.category === 'operations') {
      return !!this.filterCollaboratorId();
    }

    // Default: Admin cannot edit global modules directly
    return false;
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

  // --- Current Active Editing Session ---
  readonly recordToEdit = signal<any>(null);

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
        (msg.recipientType === 'ALL' ||
          (msg.recipientId === user.clientId && (!msg.recipientUserId || msg.recipientUserId === user.id)));
    }).length;
  });

  // --- Menu Definitions ---
  readonly menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie', category: 'dashboard', adminOnly: true },
    { id: 'operator-dashboard', label: 'Dashboard', icon: 'fa-chart-pie', category: 'dashboard', operatorOnly: true },
    { id: 'reports', label: 'Report Controlli', icon: 'fa-file-contract', category: 'dashboard', adminOnly: true },
    { id: 'general-checks', label: 'Controlli Generali', icon: 'fa-list-check', category: 'dashboard', adminOnly: true },

    // --- REGISTRI E FASI OPERATIVE ---
    { id: 'pre-op-checklist', label: 'Fase Pre-operativa', icon: 'fa-clipboard-check', category: 'operations' },
    { id: 'operative-checklist', label: 'Fase Operativa', icon: 'fa-briefcase', category: 'operations' },
    { id: 'post-op-checklist', label: 'Fase Post-operativa', icon: 'fa-hourglass-end', category: 'operations' },

    // --- STORICO ---
    { id: 'history', label: 'Archivio Checklist', icon: 'fa-clock-rotate-left', category: 'history' },

    // --- CONSUMABILI E MESSAGGI ---

    // Config
    { id: 'collaborators', label: 'Gestione Collaboratori', icon: 'fa-users-gear', category: 'config', adminOnly: true },
    { id: 'messages', label: 'Messaggistica', icon: 'fa-comments', category: 'communication', adminOnly: false },
    { id: 'accounting', label: 'Contabilità', icon: 'fa-calculator', category: 'config', adminOnly: true },
    { id: 'settings', label: 'Impostazioni Sistema', icon: 'fa-gears', category: 'config', adminOnly: false },
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
      this.currentUser.set({
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        clientId: user.clientId,
        department: user.department
      });

      // Determine company config (Admin -> First or demo, Collab -> Their Client)
      if (user.role === 'ADMIN') {
        this.companyConfig.set(this.clients()[0]); // Default to first client for admin view
      } else {
        const clientConfig = this.clients().find(c => c.id === user.clientId);
        if (clientConfig) this.companyConfig.set(clientConfig);
      }

      this.currentModuleId.set(user.role === 'ADMIN' ? 'dashboard' : 'operator-dashboard');
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
        this.currentUser.set({
          id: collabUser.id,
          name: collabUser.name,
          role: 'COLLABORATOR',
          avatar: collabUser.avatar,
          clientId: collabUser.clientId,
          department: collabUser.department
        });

        // LOAD THE SPECIFIC CLIENT CONFIG FOR THIS USER
        const clientConfig = this.clients().find(c => c.id === collabUser.clientId);
        if (clientConfig) {
          this.companyConfig.set(clientConfig);
        }
      }
    }
    this.currentModuleId.set(role === 'ADMIN' ? 'dashboard' : 'operator-dashboard');
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

  setReportRecipientEmail(email: string) {
    this.reportRecipientEmail.set(email);
    this.toastService.success('Indirizzo Aggiornato', `Il nuovo indirizzo per i report è: ${email}`);
  }

  updateAdminCompany(data: AdminCompany) {
    this.adminCompany.set(data);
    this.toastService.success('Anagrafica Salvata', 'I dati dell\'azienda amministratore sono stati aggiornati.');
  }

  // --- Data Access Methods ---

  saveRecord(moduleId: string, data: any) {
    const user = this.currentUser();
    if (!user) return;

    const date = this.filterDate();
    const targetUserId = (this.isAdmin() && this.filterCollaboratorId())
      ? this.filterCollaboratorId()
      : user.id;

    // Check if record exists for this day/user/module
    const existingIndex = this.checklistRecords().findIndex(r =>
      r.moduleId === moduleId &&
      r.userId === targetUserId &&
      r.date === date
    );

    const newRecord = {
      id: existingIndex >= 0 ? this.checklistRecords()[existingIndex].id : Math.random().toString(36).substr(2, 9),
      moduleId,
      userId: targetUserId,
      date,
      data,
      timestamp: new Date()
    };

    this.checklistRecords.update(records => {
      if (existingIndex >= 0) {
        // Overwrite existing
        const updated = [...records];
        updated[existingIndex] = newRecord;
        return updated;
      } else {
        // Add new
        return [...records, newRecord];
      }
    });

    // Notify user
    if (existingIndex >= 0) {
      this.toastService.info('Dati Aggiornati', 'La registrazione precedente per questa data è stata sovrascritta.');
    }

    // Feed to Operator if Admin is editing
    if (this.isAdmin() && this.filterCollaboratorId()) {
      const targetUser = this.systemUsers().find(u => u.id === targetUserId);
      const menuItem = this.menuItems.find(m => m.id === moduleId);

      this.toastService.success(
        'Feedback Inviato',
        `Le modifiche al modulo "${menuItem?.label}" sono state salvate e notificate a ${targetUser?.name}.`
      );

      // Optionally we could add a system message to their chat
      this.addMessage({
        id: Date.now().toString(),
        senderId: user.id,
        senderName: 'Amministrazione (Revisione)',
        recipientType: 'SINGLE',
        recipientId: targetUser?.clientId,
        recipientUserId: targetUserId,
        subject: `Aggiornamento: ${menuItem?.label}`,
        content: `L'amministratore ha revisionato e aggiornato i dati inseriti in data ${date} per il modulo ${menuItem?.label}.`,
        timestamp: new Date(),
        read: false,
        replies: []
      });
    }
  }

  // --- New Historical Methods ---

  saveChecklist(record: { id?: string, moduleId: string, data: any, date?: string }) {
    const user = this.currentUser();
    if (!user) return;

    const recordId = record.id || Math.random().toString(36).substr(2, 9);
    const date = record.date || new Date().toISOString().split('T')[0]; // Use provided date or today (not filterDate necessarily)

    const newEntry = {
      id: recordId,
      moduleId: record.moduleId,
      userId: user.id,
      date: date,
      data: record.data,
      timestamp: new Date()
    };

    this.checklistRecords.update(records => {
      const others = records.filter(r => r.id !== recordId);
      return [newEntry, ...others];
    });
  }

  deleteChecklist(id: string) {
    this.checklistRecords.update(records => records.filter(r => r.id !== id));
    this.toastService.success('Record Eliminato', 'La registrazione è stata rimossa.');
  }

  getChecklistHistory(moduleId: string) {
    // Return all records for this module, filtered by current user (or admin view logic)
    const user = this.currentUser();
    if (!user) return [];

    // Admins might want to see ALL records for this module? Or filtered by user?
    // user request: "troviamo la lista"
    // Let's return all records matching the module for now.
    // In a real app we would filter by Company.
    // Here we filter by clientId via user check? 
    // Let's verify clientId matches current user's clientId if not admin.

    return this.checklistRecords()
      .filter(r => r.moduleId === moduleId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
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

  updateCurrentCompany(updates: Partial<ClientEntity>) {
    const currentId = this.companyConfig().id;
    if (currentId) {
      this.updateClient(currentId, updates);
      this.toastService.success('Dati Aggiornati', 'Le informazioni della tua azienda sono state aggiornate.');
    }
  }

  // --- Editing State Methods ---
  startEditingRecord(record: any) {
    this.recordToEdit.set(record);
    this.setModule(record.moduleId);
    this.toastService.info('Caricamento...', 'Sto aprendo la registrazione selezionata.');
  }

  completeEditing() {
    this.recordToEdit.set(null);
  }

  // --- Messaging Methods ---
  sendMessage(subject: string, content: string, recipientType: 'ALL' | 'SINGLE', recipientId?: string, recipientUserId?: string, attachment?: { url: string, name: string }) {
    const user = this.currentUser();
    if (!user) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      senderName: user.name,
      recipientType,
      recipientId,
      recipientUserId,
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
      const recipientUser = this.systemUsers().find(u => u.id === recipientUserId);
      const targetStr = recipientUser ? `${client?.name} (Attr: ${recipientUser.name})` : client?.name;
      this.toastService.success('Messaggio inviato', `Inviato a ${targetStr}`);
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
    // 3. Messages sent to their specific company (if not targeted to someone else)
    // 4. Messages sent specifically to them
    return this.messages().filter(msg =>
      msg.senderId === user.id ||
      msg.recipientType === 'ALL' ||
      (msg.recipientId === user.clientId && (!msg.recipientUserId || msg.recipientUserId === user.id))
    );
  }

  addMessage(msg: any) {
    this.messages.update(msgs => [msg, ...msgs]);
  }
}

