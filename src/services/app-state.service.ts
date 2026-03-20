 import { Injectable, signal, computed, inject, effect } from '@angular/core';
 import { ToastService } from './toast.service';
 import { supabase } from '../supabase';

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
  paymentBalanceDue?: boolean; // New: Banner info for balance payment due
  licenseExpiryDate?: string; // New: Expiration date for the subscription
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
  initials?: string;
  clientId?: string; // Link to the specific Company/Client
  username?: string;
  password?: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  initials?: string;
  department?: string;
  clientId?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  category: 'dashboard' | 'operations' | 'history' | 'monitoring' | 'config' | 'communication' | 'production' | 'documentation';
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

export interface AppDocument {
  id: string;
  clientId: string;
  category: string; // e.g., 'regolarita-documentazione'
  type: string; // e.g., 'scia', 'camerale', etc.
  fileName: string;
  fileType: string;
  fileData?: string; // base64
  uploadDate: Date;
  expiryDate?: string; // For PEE
  userId?: string; // Specific unit/collaborator association
}

export interface ProductionIngredient {
  id: string;
  name: string;
  packingDate: string;
  expiryDate: string;
  lotto: string; // or invoice ref
  photo?: string; // base64 jpg
}

export interface ProductionRecord {
  id: string;
  recordedDate: string; // day of record (archive date)
  mainProductName: string;
  packagingDate: string;
  expiryDate: string;
  lotto: string;
  ingredients: ProductionIngredient[];
  userId: string;
  clientId: string;
}

export interface Payment {
  id: string;
  clientId: string;
  amount: number;
  frequency: string;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
  paidDate?: string;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  clientId: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  category: string;
}

export interface Reminder {
  id: string;
  clientId: string;
  type: string;
  message: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  dismissed: boolean;
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

  // --- Accounting / Payments State ---
  readonly payments = signal<Payment[]>([]);
  readonly journalEntries = signal<JournalEntry[]>([]);
  readonly reminders = signal<Reminder[]>([]);

  // --- Global Filter State ---
  readonly filterCollaboratorId = signal<string>(''); // '' means All
  readonly filterDate = signal<string>(new Date().toISOString().split('T')[0]); // Default Today
  readonly reportRecipientEmail = signal<string>('amministrazione@haccppro.it');

  // Filter state for firms/companies
  readonly filterClientId = signal<string | null>(null);

  // Automatically switches between logged operator or filter for administrator.
  readonly activeTargetClientId = computed(() => {
    const user = this.currentUser();
    const filterId = this.filterClientId();

    if (user?.role === 'ADMIN') {
      return filterId || user.clientId || 'demo';
    }

    // Role == COLLABORATOR
    return user?.clientId || 'demo';
  });

  // Returns list of unique brands for initial filtering
  readonly groupedViewClients = computed(() => {
    const all = this.clients();
    const seen = new Set<string>();
    const brands: ClientEntity[] = [];

    all.forEach(c => {
      // Identify brand by PIVA or base name before space
      const brandKey = c.piva || c.name.split(' ')[0].toLowerCase();
      if (!seen.has(brandKey)) {
        seen.add(brandKey);
        brands.push(c);
      }
    });
    return brands;
  });

  // Returns list of units belonging to the same brand as the selected filterClientId
  readonly activeBrandUnits = computed(() => {
    const all = this.clients();
    const filterId = this.filterClientId();
    if (!filterId) return [];

    const selected = all.find(c => c.id === filterId);
    if (!selected) return [];

    const brandKey = selected.piva || selected.name.split(' ')[0].toLowerCase();
    
    return all.filter(c => {
      const cKey = c.piva || c.name.split(' ')[0].toLowerCase();
      return cKey === brandKey;
    });
  });

  // Returns list of companies filtered if administrator has selection.
  readonly filteredClients = computed(() => {
    const clients = this.clients();
    const filterId = this.filterClientId();
    if (this.currentUser()?.role === 'ADMIN' && filterId) {
      return clients.filter(c => c.id === filterId);
    }
    return clients;
  });

  // Returns list of users filtered by the active company selection.
  readonly filteredSystemUsers = computed(() => {
    const users = this.systemUsers();
    const activeClientId = this.activeTargetClientId();
    if (this.isAdmin() && activeClientId) {
      return users.filter(u => u.clientId === activeClientId);
    }
    return users;
  });

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

  constructor() {
    this.loadState();
    this.initSupabase();

    // Auto-save State when critical data changes
    effect(() => {
      this.saveState();
    });
  }

  private saveState() {
    const state = {
      documents: this.documents(),
      selectedEquipment: this.selectedEquipment(),
      disabledDocs: this.disabledDocs(),
      checklistRecords: this.checklistRecords(),
      productionRecords: this.productionRecords(),
      messages: this.messages()
    };
    localStorage.setItem('haccp_pro_persistence', JSON.stringify(state));
  }

  async initSupabase() {
    await this.refreshAllData();
  }

  async refreshAllData() {
    console.log('Refreshing HACCP PRO Data from Supabase...');
    try {
      // Synchronize Clients
    const { data: dbClients } = await supabase.from('clients').select('*');
    if (dbClients) {
      const validClients = dbClients.filter((c: any) => 
        !c.name.toLowerCase().includes('demo') && 
        !c.name.toLowerCase().includes('sviluppatore')
      );
      this.clients.set(validClients.map((c: any) => ({
          id: c.id,
          name: c.name,
          piva: c.piva,
          address: c.address,
          phone: c.phone,
          email: c.email,
          licenseNumber: c.license_number,
          suspended: c.suspended,
          paymentBalanceDue: !!c.payment_balance_due,
          licenseExpiryDate: c.license_expiry_date,
          logo: c.logo
        })));
    }

    const validClientIds = this.clients().map(c => c.id);

    // Synchronize Users
    const { data: dbUsers } = await supabase.from('system_users').select('*');
    if (dbUsers) {
      this.systemUsers.set(dbUsers
        .filter((u: any) => {
          const isDemo = u.name.toLowerCase().includes('demo') || u.name.toLowerCase().includes('sviluppatore');
          const isOrphaned = u.role !== 'ADMIN' && !validClientIds.includes(u.client_id);
          
          return !isDemo && !isOrphaned;
        })
        .map((u: any) => ({
          id: u.id,
          clientId: u.client_id,
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department,
          active: u.active,
          avatar: u.avatar,
          initials: this.generateInitials(u.name),
          username: u.username,
          password: u.password
        })));
    }

    // Synchronize Records
    const { data: dbRecords } = await supabase.from('checklist_records').select('*');
    if (dbRecords) {
      this.checklistRecords.set(dbRecords
        .filter((r: any) => r.client_id === 'demo' || validClientIds.includes(r.client_id))
        .map((r: any) => ({
          id: r.id,
          moduleId: r.module_id,
          userId: r.user_id,
          clientId: r.client_id,
          date: r.date,
          data: r.data,
          timestamp: r.timestamp
        })));
    }

      // 4. Documents
      const { data: docs } = await supabase.from('documents').select('*');
      if (docs) this.documents.set(docs as any);

      // 5. Equipment
      const { data: equip } = await supabase.from('equipment').select('*');
      if (equip) this.selectedEquipment.set(equip as any);

      // 6. Messages
      const { data: dbMsgs } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
      if (dbMsgs) {
        this.messages.set(dbMsgs.map((m: any) => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          recipientType: m.recipient_type,
          recipientId: m.recipient_id,
          recipientUserId: m.recipient_user_id,
          subject: m.subject,
          content: m.content,
          attachmentUrl: m.attachment_url,
          attachmentName: m.attachment_name,
          timestamp: new Date(m.timestamp || m.created_at),
          read: m.read,
          replies: (m.replies || []).map((r: any) => ({
            id: r.id,
            senderId: r.sender_id || r.senderId,
            senderName: r.sender_name || r.senderName,
            content: r.content,
            timestamp: new Date(r.timestamp)
          }))
        })));
      }

      // 7. Production Records
      const { data: prod } = await supabase.from('production_records').select('*');
      if (prod) this.productionRecords.set(prod as any);

      // 8. Accounting Payments
      const { data: payData } = await supabase.from('accounting_payments').select('*');
      if (payData) {
        this.payments.set(payData.map((p: any) => ({
          id: p.id,
          clientId: p.client_id,
          amount: parseFloat(p.amount) || 0,
          frequency: p.frequency,
          dueDate: p.due_date,
          status: p.status,
          paidDate: p.paid_date,
          notes: p.notes
        })));
      }

      // 9. Journal Entries
      const { data: journalData } = await supabase.from('journal_entries').select('*');
      if (journalData) {
        this.journalEntries.set(journalData.map((j: any) => ({
          id: j.id,
          clientId: j.client_id,
          date: j.date,
          description: j.description,
          debit: parseFloat(j.debit) || 0,
          credit: parseFloat(j.credit) || 0,
          category: j.category
        })));
      }

      // 10. Accounting Reminders
      const { data: reminderData } = await supabase.from('accounting_reminders').select('*');
      if (reminderData) {
        this.reminders.set(reminderData.map((r: any) => ({
          id: r.id,
          clientId: r.client_id,
          type: r.type,
          message: r.message,
          dueDate: r.due_date,
          priority: r.priority,
          dismissed: !!r.dismissed
        })));
      }

    } catch (e) {
      console.error('Error refreshing data from Supabase:', e);
    }
  }

  private loadState() {
    const saved = localStorage.getItem('haccp_pro_persistence');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.documents) this.documents.set(data.documents);
        if (data.selectedEquipment) this.selectedEquipment.set(data.selectedEquipment);
        if (data.disabledDocs) this.disabledDocs.set(data.disabledDocs);
        if (data.checklistRecords) {
          // Restore dates correctly
          const restoredRecords = data.checklistRecords.map((r: any) => ({
            ...r,
            timestamp: new Date(r.timestamp)
          }));
          this.checklistRecords.set(restoredRecords);
        }
        if (data.productionRecords) this.productionRecords.set(data.productionRecords);
        if (data.messages) {
          this.messages.set(data.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          })));
        }
      } catch (e) {
        console.error('Failed to load local state', e);
      }
    }
  }

  // --- Data Store (Mock Database) ---
  // Stores all checks from all users
  readonly checklistRecords = signal<{
    id: string;
    moduleId: string;
    userId: string;
    clientId: string;
    date: string;
    data: any;
    timestamp: any;
  }[]>([]);

  readonly documents = signal<AppDocument[]>([]);
  readonly disabledDocs = signal<Record<string, boolean>>({}); // Map doc ID to disabled boolean
  readonly selectedEquipment = signal<{ id: string; name: string; area: string }[]>([]);
  readonly groupedEquipment = computed(() => {
    const raw = this.selectedEquipment();
    const uniqueMap = new Map<string, { id: string; name: string; area: string }>();
    raw.forEach(e => {
      // Clean name: remove " n.1", " 1", etc.
      const cleaned = e.name.replace(/\s+n\.\d+/i, '').replace(/\s+\d+$/i, '').trim();
      if (!uniqueMap.has(cleaned)) {
        uniqueMap.set(cleaned, { ...e, name: cleaned });
      }
    });
    return Array.from(uniqueMap.values());
  });
  readonly productionRecords = signal<ProductionRecord[]>([]);

  // Global Filtered Documents for Admin View
  readonly filteredDocuments = computed(() => {
    const targetClientId = this.activeTargetClientId();
    if (!targetClientId) return [];

    return this.documents().filter(d => d.clientId === targetClientId);
  });

  // Global Filtered Checklists for Admin View
  readonly filteredChecklistRecords = computed(() => {
    const targetClientId = this.activeTargetClientId();
    if (!targetClientId) return [];

    return this.checklistRecords().filter(r => r.clientId === targetClientId);
  });

  getEquipmentIcon(name: string): string {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('congelatore')) return 'fa-icicles';
    if (nameLower.includes('pozzetto')) return 'fa-box-archive';
    if (nameLower.includes('frigo') || nameLower.includes('cella') || nameLower.includes('snowflake')) return 'fa-snowflake';
    if (nameLower.includes('piano cottura') || nameLower.includes('forno') || nameLower.includes('griglie') || nameLower.includes('fuochi') || nameLower.includes('friggitrice')) return 'fa-fire';
    if (nameLower.includes('lavello') || nameLower.includes('lavastoviglie')) return 'fa-sink';
    if (nameLower.includes('cappa')) return 'fa-fan';
    if (nameLower.includes('tavolo') || nameLower.includes('piano lavoro')) return 'fa-table';
    if (nameLower.includes('affettatrice')) return 'fa-shredder'; // or fa-circle-notch
    if (nameLower.includes('bilancia')) return 'fa-weight-hanging';
    return 'fa-microchip';
  }

  // --- Clients / Companies Database (New) ---
  readonly clients = signal<ClientEntity[]>([]);

  // --- System Users State ---
  readonly systemUsers = signal<SystemUser[]>([]);

  // --- Current Active Company Config ---
  // Automatically follows the activeTargetClientId (global Firm filter for Admin)
  readonly companyConfig = computed<ClientEntity>(() => {
    const targetId = this.activeTargetClientId();
    const allClients = this.clients();
    
    const found = allClients.find(c => c.id === targetId);
    if (found) return found;

    // Fallback/Default
    return allClients[0] || {
      id: 'demo',
      name: 'Demo Company S.r.l.',
      piva: '00000000000',
      address: 'Via Demo 1',
      phone: '',
      email: '',
      licenseNumber: '',
      suspended: false
    };
  });

  // --- Current Active Editing Session ---
  readonly recordToEdit = signal<any>(null);

  // --- Messages Database ---
  readonly messages = signal<Message[]>([]);

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

    // --- ARCHIVIO DOCUMENTALE ---
    { id: 'documentation', label: 'Archivio Documentale', icon: 'fa-folder-tree', category: 'documentation' },

    // --- REGISTRI E FASI OPERATIVE ---
    { id: 'pre-op-checklist', label: 'Fase Pre-operativa', icon: 'fa-clipboard-check', category: 'operations' },
    { id: 'operative-checklist', label: 'Fase Operativa', icon: 'fa-briefcase', category: 'operations' },
    { id: 'post-op-checklist', label: 'Fase Post-operativa', icon: 'fa-hourglass-end', category: 'operations' },
    { id: 'production-log', label: 'Rintracciabilità', icon: 'fa-barcode', category: 'operations' },

    { id: 'cleaning-maintenance', label: 'Manutenzione', icon: 'fa-screwdriver-wrench', category: 'operations' },
    { id: 'non-compliance', label: 'Non Conformità', icon: 'fa-circle-exclamation', category: 'operations' },
    { id: 'micro-bio', label: 'Monitoraggio Microbio', icon: 'fa-vial-virus', category: 'operations' },

    // --- STORICO ---
    { id: 'history', label: 'Archivio Checklist', icon: 'fa-clock-rotate-left', category: 'history' },

    // --- CONSUMABILI E MESSAGGI ---
    { id: 'messages', label: 'Messaggistica', icon: 'fa-comments', category: 'communication', adminOnly: false },

    // Config
    { id: 'suppliers', label: 'Anagrafica Fornitori', icon: 'fa-truck-field', category: 'config', operatorOnly: true },
    { id: 'staff-training', label: 'Formazione Personale', icon: 'fa-user-graduate', category: 'config', operatorOnly: true },
    { id: 'collaborators', label: 'Gestione Collaboratori', icon: 'fa-users-gear', category: 'config', adminOnly: true },
    { id: 'accounting', label: 'Contabilità', icon: 'fa-calculator', category: 'config', adminOnly: true },
    { id: 'settings', label: 'Impostazioni Sistema', icon: 'fa-gears', category: 'config', adminOnly: false },
  ];

  loginWithCredentials(username: string, pass: string): boolean {
    // Backdoor for Development ("Accessi Aperti")
    if (username === 'dev' && pass === 'dev') {
      this.currentUser.set({
        id: 'dev-admin',
        name: this.adminCompany().name,
        role: 'ADMIN',
        avatar: this.adminCompany().logo || '',
        initials: 'Adm',
        clientId: 'demo' // Default to demo context
      });
      // companyConfig is now computed

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
      // companyConfig is now computed and will follow automatically
      // The computed signal `companyConfig` will automatically react to changes in `activeTargetClientId` and `clients`.
      // No manual setting needed here.

      this.currentModuleId.set(user.role === 'ADMIN' ? 'dashboard' : 'operator-dashboard');
    }
  }

  login(role: UserRole) {
    if (role === 'ADMIN') {
      const adminUser = this.systemUsers().find(u => u.role === 'ADMIN');
      if (adminUser) {
        this.currentUser.set({ id: adminUser.id, name: adminUser.name, role: 'ADMIN', avatar: adminUser.avatar, clientId: adminUser.clientId });
        // companyConfig is now computed
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
        // companyConfig is now computed
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

  setClientIdFilter(id: string | null) {
    this.filterClientId.set(id);
    // When changing company, reset the collaborator/unit filter
    this.filterCollaboratorId.set('');
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

  saveChecklist(moduleIdOrObj: string | any, data?: any) {
    const user = this.currentUser();
    if (!user) return;

    let moduleId: string;
    let actualData: any;
    let forcedId: string | undefined;
    let forcedDate: string | undefined;

    if (typeof moduleIdOrObj === 'object' && moduleIdOrObj !== null && !data) {
      moduleId = moduleIdOrObj.moduleId;
      actualData = moduleIdOrObj.data;
      forcedId = moduleIdOrObj.id;
      forcedDate = moduleIdOrObj.date;
    } else {
      moduleId = moduleIdOrObj;
      actualData = data;
    }

    // Determine target company context
    const targetClientId = this.activeTargetClientId();
    
    // Determine the specific user identity (if admin is recording on behalf of a collaborator)
    const targetUserId = (this.isAdmin() && this.filterCollaboratorId()) 
      ? this.filterCollaboratorId() 
      : user.id;

    const record = {
      id: forcedId || Math.random().toString(36).substring(2, 9),
      userId: targetUserId,
      clientId: targetClientId || user.clientId || 'demo',
      moduleId,
      date: forcedDate || this.filterDate(),
      timestamp: new Date().toISOString(),
      data: actualData
    };

    this.checklistRecords.update(records => {
      // Logic to prevent duplicates for the same module/user/date if needed
      const filtered = records.filter(r => 
        !(r.moduleId === moduleId && r.userId === targetUserId && (r as any).date === record.date)
      );
      return [...filtered, record as any];
    });

    // Supabase Sync
    supabase.from('checklist_records').upsert(record).then();

    this.toastService.success('Registrazione Salvata', 'I dati sono stati archiviati correttamente.');

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
        content: `L'amministratore ha revisionato e aggiornato i dati inseriti in data ${record.date} per il modulo ${menuItem?.label}.`,
        timestamp: new Date(),
        read: false,
        replies: []
      });
    }
  }

  saveRecord(moduleId: string, data: any) {
    return this.saveChecklist(moduleId, data);
  }

  // --- New Historical Methods ---

  saveChecklistOld(record: { id?: string, moduleId: string, data: any, date?: string }) {
    const user = this.currentUser();
    if (!user) return;

    const recordId = record.id || Math.random().toString(36).substr(2, 9);
    const date = record.date || new Date().toISOString().split('T')[0]; // Use provided date or today (not filterDate necessarily)

    const newEntry = {
      id: recordId,
      moduleId: record.moduleId,
      userId: user.id,
      clientId: user.clientId || 'demo',
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
    const targetClientId = this.activeTargetClientId();
    if (!targetClientId) return [];

    return this.checklistRecords()
      .filter(r => r.moduleId === moduleId && r.clientId === targetClientId)
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

  async addClient(client: Omit<ClientEntity, 'id'>) {
    const newClient = { ...client, id: Math.random().toString(36).substr(2, 9) };
    this.clients.update(c => [...c, newClient]);
    
    const { error } = await supabase.from('clients').insert({
      id: newClient.id,
      name: newClient.name,
      piva: newClient.piva,
      address: newClient.address,
      phone: newClient.phone,
      email: newClient.email,
      license_number: newClient.licenseNumber,
      suspended: newClient.suspended,
      payment_balance_due: newClient.paymentBalanceDue,
      license_expiry_date: newClient.licenseExpiryDate,
      logo: newClient.logo
    });

    if (!error) {
      this.toastService.success('Azienda Registrata', `${newClient.name} è stata aggiunta correttamente.`);
    } else {
      console.error('Error adding client:', error);
      this.toastService.error('Errore', 'Impossibile salvare l\'azienda sul database.');
    }
  }

  async deleteClient(id: string) {
    const client = this.clients().find(c => c.id === id);
    if (!client) return;

    if (confirm(`⚠️ ATTENZIONE: Sei sicuro di voler eliminare DEFINITIVAMENTE l'azienda "${client.name}"?\n\nQuesta azione eliminerà anche TUTTI i suoi utenti e documenti collegati.`)) {
      this.clients.update(clients => clients.filter(c => c.id !== id));
      
      // Cascade-like manual cleanup (Supabase should ideally have fk constraints but let's be safe)
      this.systemUsers.update(users => users.filter(u => u.clientId !== id));
      
      const { error } = await supabase.from('clients').delete().eq('id', id);
      
      if (!error) {
          this.toastService.success('Azienda Rimossa', 'L\'anagrafica e i relativi dati sono stati cancellati.');
      } else {
          this.toastService.error('Errore', 'Impossibile rimuovere l\'azienda dal database.');
      }
    }
  }

  async updateClient(id: string, updates: Partial<ClientEntity>) {
    this.clients.update(clients =>
      clients.map(c => c.id === id ? { ...c, ...updates } : c)
    );
    // Sync with Supabase
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.piva !== undefined) dbUpdates.piva = updates.piva;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.licenseNumber !== undefined) dbUpdates.license_number = updates.licenseNumber;
    if (updates.suspended !== undefined) dbUpdates.suspended = updates.suspended;
    if (updates.paymentBalanceDue !== undefined) dbUpdates.payment_balance_due = updates.paymentBalanceDue;
    if (updates.licenseExpiryDate !== undefined) dbUpdates.license_expiry_date = updates.licenseExpiryDate;
    if (updates.logo !== undefined) dbUpdates.logo = updates.logo;

    const { error } = await supabase.from('clients').update(dbUpdates).eq('id', id);
    if (error) {
      console.error('Error updating client:', error);
      this.toastService.error('Errore Sync', 'Impossibile aggiornare i dati nel database.');
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

  async addSystemUser(user: Omit<SystemUser, 'id' | 'avatar'>) {
    const newUser: SystemUser = {
      ...user,
      id: Math.random().toString(36).substr(2, 9),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&color=fff`
    };
    
    this.systemUsers.update(users => [...users, newUser]);
    
    const { error } = await supabase.from('system_users').insert({
      id: newUser.id,
      client_id: newUser.clientId,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      department: newUser.department,
      active: newUser.active,
      avatar: newUser.avatar,
      username: newUser.username,
      password: newUser.password
    });
    
    if (!error) {
      this.toastService.success('Unità Creata', `L'unità operativa ${newUser.name} è stata registrata.`);
    } else {
      console.error('Error adding user:', error);
      this.toastService.error('Errore', 'Impossibile salvare il collaboratore sul database.');
    }
  }

  async updateSystemUser(id: string, updates: Partial<SystemUser>) {
    this.systemUsers.update(users =>
      users.map(u => u.id === id ? { ...u, ...updates } : u)
    );

    const { error } = await supabase.from('system_users').update(updates).eq('id', id);

    // Auto-suspend company if all users are now disabled
    if (updates.active === false) {
      const user = this.systemUsers().find(u => u.id === id);
      if (user?.clientId) {
        this.checkAutoSuspendClient(user.clientId);
      }
    }

    if (!error) {
      this.toastService.success('Aggiornato', 'I dati del collaboratore sono stati salvati.');
    }
  }

  async deleteSystemUser(id: string) {
    const user = this.systemUsers().find(u => u.id === id);
    if (!user) return;

    if (confirm(`Sei sicuro di voler eliminare definitivamente ${user.name}? Questa operazione non può essere annullata.`)) {
      this.systemUsers.update(users => users.filter(u => u.id !== id));
      const { error } = await supabase.from('system_users').delete().eq('id', id);
      
      if (!error) {
        this.toastService.success('Eliminato', 'Il collaboratore è stato rimosso correttamente.');
      } else {
        this.toastService.error('Errore', 'Impossibile eliminare dal database.');
        // Rollback state if error? For now simple.
      }
    }
  }

  updateCurrentCompany(updates: Partial<ClientEntity>) {
    const currentId = this.companyConfig().id;
    if (currentId) {
      this.updateClient(currentId, updates);
      this.toastService.success('Dati Aggiornati', 'Le informazioni della tua azienda sono state aggiornate.');
    }
  }

  saveDocument(doc: Partial<AppDocument>) {
    const user = this.currentUser();
    if (!user) return;

    const targetClientId = this.activeTargetClientId();

    const newDoc: AppDocument = {
      clientId: targetClientId || user.clientId || 'demo',
      userId: user.id,
      category: doc.category || 'general',
      type: doc.type || 'unknown',
      fileName: doc.fileName || 'documento.pdf',
      fileType: doc.fileType || 'application/pdf',
      fileData: doc.fileData || '',
      id: doc.id || Math.random().toString(36).substring(2, 9),
      uploadDate: doc.uploadDate || new Date(),
      expiryDate: doc.expiryDate
    };
    this.documents.update(docs => [...docs, newDoc]);
  }

  deleteDocument(id: string) {
    this.documents.update(docs => docs.filter(doc => doc.id !== id));
    this.toastService.success('Eliminato', 'Documento rimosso permanentemente.');
  }

  // --- Equipment Census Methods ---
  addEquipment(area: string, name: string) {
    const id = Math.random().toString(36).substring(2, 9);
    this.selectedEquipment.update(list => [...list, { id, area, name }]);
  }

  removeEquipment(id: string) {
    this.selectedEquipment.update(list => list.filter(e => e.id !== id));
  }

  getDocumentsByClient(clientId: string, category?: string) {
    return computed(() => {
      let docs = this.documents().filter(d => d.clientId === clientId);
      if (category) {
        docs = docs.filter(d => d.category === category);
      }
      return docs;
    });
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

    this.messages.update(msgs => [newMessage, ...msgs]);

    // DB Sync
    supabase.from('messages').insert({
      id: newMessage.id,
      sender_id: newMessage.senderId,
      sender_name: newMessage.senderName,
      recipient_type: newMessage.recipientType,
      recipient_id: newMessage.recipientId,
      recipient_user_id: newMessage.recipientUserId,
      subject: newMessage.subject,
      content: newMessage.content,
      attachment_url: newMessage.attachmentUrl,
      attachment_name: newMessage.attachmentName,
      timestamp: newMessage.timestamp.toISOString(),
      read: newMessage.read,
      replies: newMessage.replies
    }).then(({ error }) => {
      if (error) console.error('Error saving message:', error);
    });

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

    let updatedMessage: Message | undefined;

    this.messages.update(msgs =>
      msgs.map(msg => {
        if (msg.id === messageId) {
          updatedMessage = { ...msg, replies: [...msg.replies, reply] };
          return updatedMessage;
        }
        return msg;
      })
    );

    if (updatedMessage) {
      // DB Sync - map replies back to snake_case if needed, but usually we store as JSON
      // Let's ensure the format for storage is consistent
      const dbReplies = updatedMessage.replies.map(r => ({
        id: r.id,
        sender_id: r.senderId,
        sender_name: r.senderName,
        content: r.content,
        timestamp: r.timestamp.toISOString()
      }));

      supabase.from('messages').update({ 
        replies: dbReplies,
        read: false // Mark as unread for the original sender if we want? 
                    // Actually, usually messages are unread for recipients.
      }).eq('id', messageId).then();
    }

    this.toastService.success('Risposta inviata', 'La tua risposta è stata inviata');
  }

  markMessageAsRead(messageId: string) {
    this.messages.update(msgs =>
      msgs.map(msg =>
        msg.id === messageId ? { ...msg, read: true } : msg
      )
    );

    supabase.from('messages').update({ read: true }).eq('id', messageId).then();
  }


  deleteMessage(id: string) {
    this.messages.update(msgs => msgs.filter(m => m.id !== id));
    supabase.from('messages').delete().eq('id', id).then();
    this.toastService.success('Messaggio Eliminato', 'Il messaggio è stato rimosso correttamente.');
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
  private generateInitials(name: string): string {
    if (!name) return '??';
    return name
      .split(' ')
      .filter(part => part.length > 0)
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  // --- Accounting Persistence Methods ---
  async syncPayment(payment: Payment) {
    try {
      const { error } = await supabase.from('accounting_payments').upsert({
        id: payment.id,
        client_id: payment.clientId,
        amount: payment.amount,
        frequency: payment.frequency,
        due_date: payment.dueDate,
        status: payment.status,
        paid_date: payment.paidDate,
        notes: payment.notes
      });
      if (error) throw error;
      this.refreshAllData();
    } catch (e) {
      console.error('Error syncing payment:', e);
      this.toastService.error('Errore Database', 'Impossibile salvare il pagamento.');
    }
  }

  async syncJournalEntry(entry: JournalEntry) {
    try {
      const { error } = await supabase.from('journal_entries').upsert({
        id: entry.id,
        client_id: entry.clientId,
        date: entry.date,
        description: entry.description,
        debit: entry.debit,
        credit: entry.credit,
        category: entry.category
      });
      if (error) throw error;
      this.refreshAllData();
    } catch (e) {
      console.error('Error syncing journal entry:', e);
      this.toastService.error('Errore Database', 'Impossibile salvare la voce in prima nota.');
    }
  }

  async syncReminder(reminder: Reminder) {
    try {
      const { error } = await supabase.from('accounting_reminders').upsert({
        id: reminder.id,
        client_id: reminder.clientId,
        type: reminder.type,
        message: reminder.message,
        due_date: reminder.dueDate,
        priority: reminder.priority,
        dismissed: reminder.dismissed
      });
      if (error) throw error;
      this.refreshAllData();
    } catch (e) {
      console.error('Error syncing reminder:', e);
      this.toastService.error('Errore Database', 'Impossibile salvare il promemoria.');
    }
  }

  // Helper for dashboard display
  readonly latestActivePayment = computed(() => {
    const user = this.currentUser();
    if (!user || !user.clientId) return null;

    return this.payments()
      .filter(p => p.clientId === user.clientId && p.status !== 'paid')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] || null;
  });

  getDaysRemaining(dateStr: string): number {
    if (!dateStr) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
