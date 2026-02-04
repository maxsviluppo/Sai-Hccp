
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppStateService, SystemUser, ClientEntity } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-collaborators-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-8 pb-10">
      
      <!-- Premium Header -->
      <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl shadow-xl border border-slate-700/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <!-- Background Decoration -->
        <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <i class="fa-solid fa-network-wired text-9xl text-white"></i>
        </div>

        <div class="relative z-10">
          <h2 class="text-3xl font-black text-white flex items-center tracking-tight">
            <span class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mr-4 shadow-lg border border-white/20">
                <i class="fa-solid fa-sitemap"></i>
            </span>
            Struttura Organizzativa
          </h2>
          <p class="text-indigo-200 text-sm mt-2 font-medium ml-1">
            Gestione centralizzata di Aziende, Sedi e Personale Operativo
          </p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
            <button (click)="openClientModal()" class="px-5 py-3 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl hover:bg-white hover:text-indigo-900 transition-all font-bold flex items-center justify-center shadow-lg group">
                <i class="fa-solid fa-building mr-2 text-indigo-300 group-hover:text-indigo-600 transition-colors"></i> 
                Nuova Azienda
            </button>
            <button (click)="openUserModal()" class="px-6 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/30 font-bold flex items-center justify-center group active:scale-95">
                <i class="fa-solid fa-user-plus mr-2 group-hover:animate-pulse"></i> 
                Aggiungi Personale
            </button>
        </div>
      </div>

      <!-- Accordion List - Companies -->
      <div class="space-y-4 animate-fade-in">
        @for (client of state.clients(); track client.id) {
          @let isOpen = isClientExpanded(client.id);
          @let users = getUsersByClient(client.id);

          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300 hover:shadow-md"
               [class.ring-2]="isOpen" [class.ring-indigo-100]="isOpen">
            
            <!-- Company Header (Clickable for Accordion) -->
            <div class="relative bg-white px-6 py-5 cursor-pointer select-none transition-colors hover:bg-slate-50 border-l-4"
                 [class.border-l-indigo-500]="isOpen && !client.suspended" 
                 [class.border-l-transparent]="!isOpen && !client.suspended"
                 [class.border-l-red-500]="client.suspended"
                 [class.bg-red-50]="client.suspended"
                 (click)="toggleClient(client.id)">
               
               <!-- Suspension Warning Banner -->
               @if (client.suspended) {
                   <div class="absolute top-0 left-0 right-0 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-1 text-xs font-bold flex items-center justify-center gap-2 shadow-md">
                       <i class="fa-solid fa-ban animate-pulse"></i>
                       SERVIZIO SOSPESO - MANCATO PAGAMENTO
                       <i class="fa-solid fa-ban animate-pulse"></i>
                   </div>
               }

               <div class="flex flex-col md:flex-row justify-between items-center gap-4" [class.mt-6]="client.suspended">
                   <!-- Info Azienda -->
                   <div class="flex items-center gap-4 w-full">
                       <!-- Icon Box -->
                       <div class="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm flex-shrink-0 group-hover:scale-110 transition-transform"
                            [class.bg-red-100]="client.suspended" [class.border-red-200]="client.suspended" [class.text-red-600]="client.suspended">
                          <i class="fa-regular fa-building text-2xl" [class.fa-solid]="client.suspended" [class.fa-ban]="client.suspended"></i>
                       </div>
                       
                       <div class="flex-1 min-w-0">
                          <h3 class="font-bold text-xl text-slate-800 flex items-center gap-3" [class.text-red-700]="client.suspended">
                              {{ client.name }}
                              <span class="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono border border-slate-200"
                                    [class.bg-red-100]="client.suspended" [class.text-red-600]="client.suspended" [class.border-red-200]="client.suspended">
                                  {{ users.length }} Risorse
                              </span>
                              @if (client.suspended) {
                                  <span class="text-xs bg-red-500 text-white px-2 py-1 rounded-md font-bold uppercase animate-pulse shadow-lg">
                                      🚫 BLOCCATO
                                  </span>
                              }
                          </h3>
                          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-medium mt-1">
                             <span class="flex items-center"><i class="fa-solid fa-location-dot mr-1.5 text-indigo-400"></i> {{ client.address }}</span>
                             <span class="hidden sm:inline text-slate-300">|</span>
                             <span class="flex items-center"><i class="fa-solid fa-file-invoice mr-1.5 text-indigo-400"></i> P.IVA: {{ client.piva }}</span>
                          </div>
                      </div>

                      <!-- Arrow Icon -->
                      <div class="w-8 h-8 flex items-center justify-center text-slate-400 transition-transform duration-300"
                           [class.rotate-180]="isOpen">
                          <i class="fa-solid fa-chevron-down"></i>
                      </div>
                   </div>

                   <!-- Quick Actions (Stop Propagation to prevent toggle) -->
                   <div class="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 mt-3 md:mt-0 pl-18 md:pl-0" (click)="$event.stopPropagation()">
                       
                       <!-- Suspension Toggle -->
                       <div class="flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all"
                            [class.border-red-300]="client.suspended" [class.bg-red-50]="client.suspended"
                            [class.border-emerald-200]="!client.suspended" [class.bg-emerald-50]="!client.suspended">
                           <span class="text-[10px] font-bold uppercase tracking-wider" 
                                 [class.text-red-600]="client.suspended" [class.text-emerald-600]="!client.suspended">
                               {{ client.suspended ? 'Sospeso' : 'Attivo' }}
                           </span>
                           <button (click)="toggleSuspension(client)" 
                               class="w-11 h-6 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none shadow-inner"
                               [class.bg-red-500]="client.suspended"
                               [class.bg-emerald-500]="!client.suspended"
                               title="{{ client.suspended ? 'Riattiva Servizio' : 'Sospendi per Mancato Pagamento' }}">
                               <div class="w-4 h-4 bg-white rounded-full absolute top-1 transition-all duration-200 shadow-md"
                                    [class.left-6]="client.suspended"
                                    [class.left-1]="!client.suspended"></div>
                           </button>
                       </div>

                       <button (click)="openClientModal(client)" class="w-9 h-9 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 flex items-center justify-center transition-all bg-white" title="Modifica Dati Azienda">
                          <i class="fa-solid fa-pen-to-square"></i>
                       </button>
                       <button (click)="openUserModal(undefined, client.id)" class="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-all flex items-center whitespace-nowrap"
                               [disabled]="client.suspended" [class.opacity-50]="client.suspended" [class.cursor-not-allowed]="client.suspended">
                          <i class="fa-solid fa-plus mr-1.5"></i> Add User
                       </button>
                   </div>
               </div>
            </div>

            <!-- Users List (Accordion Body) -->
            @if (isOpen) {
                <div class="border-t border-slate-100 bg-slate-50/50 p-4 animate-slide-down">
                   
                   @if (users.length === 0) {
                     <div class="bg-white border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                        <div class="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                            <i class="fa-solid fa-users-slash text-xl"></i>
                        </div>
                        <p class="text-slate-500 min-w-0 font-medium">Nessuna unità operativa configurata per questa sede.</p>
                        <button (click)="openUserModal(undefined, client.id)" class="mt-3 text-indigo-600 text-sm font-bold hover:underline">
                            + Aggiungi il primo collaboratore
                        </button>
                     </div>
                   } @else {
                     <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        @for (user of users; track user.id) {
                            <div class="group bg-white rounded-xl p-4 border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all flex items-center gap-4">
                                <!-- Avatar -->
                                <div class="relative flex-shrink-0">
                                    <img [src]="user.avatar" class="w-14 h-14 rounded-xl object-cover border border-slate-100 shadow-sm" [class.grayscale]="!user.active">
                                    <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
                                         [class.bg-emerald-500]="user.active" [class.bg-slate-300]="!user.active">
                                    </div>
                                </div>

                                <!-- User Details -->
                                <div class="flex-1 min-w-0">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <h4 class="font-bold text-slate-800 text-base leading-tight">{{ user.name }}</h4>
                                            <p class="text-xs text-slate-500 font-medium truncate">{{ user.email }}</p>
                                        </div>
                                        <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                            {{ user.department || 'Generale' }}
                                        </span>
                                    </div>
                                    
                                    <!-- Actions Row -->
                                    <div class="mt-3 flex items-center justify-between pt-3 border-t border-slate-50 group-hover:border-slate-100 transition-colors">
                                        <!-- Active Toggle -->
                                        <button (click)="toggleUserActive(user)" [disabled]="user.role === 'ADMIN'"
                                            class="flex items-center gap-2 text-xs font-bold focus:outline-none transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <div class="w-8 h-4 rounded-full relative transition-colors duration-200"
                                                [class.bg-emerald-500]="user.active" [class.bg-slate-300]="!user.active">
                                                <div class="w-2.5 h-2.5 bg-white rounded-full absolute top-[3px] transition-all duration-200 shadow-sm"
                                                     [class.left-[18px]]="user.active" [class.left-[3px]]="!user.active"></div>
                                            </div>
                                            <span [class.text-emerald-600]="user.active" [class.text-slate-400]="!user.active">
                                                {{ user.active ? 'ATTIVO' : 'DISABILITATO' }}
                                            </span>
                                        </button>

                                        <!-- Edit/Delete -->
                                        <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button (click)="openUserModal(user)" class="text-slate-400 hover:text-indigo-600 p-1 transition-colors" title="Modifica">
                                                <i class="fa-solid fa-pen-to-square"></i>
                                            </button>
                                            @if (user.role !== 'ADMIN') {
                                                <button (click)="deleteUser(user.id)" class="text-slate-400 hover:text-red-600 p-1 transition-colors" title="Elimina">
                                                    <i class="fa-solid fa-trash-can"></i>
                                                </button>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        }
                     </div>
                   }
                </div>
            }
          </div>
        }
      </div>

      <!-- User Modal -->
      @if (activeModal() === 'user') {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
          
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 class="text-lg font-bold text-slate-800">
                {{ isEditing() ? 'Modifica Unità Operativa' : 'Nuova Unità Operativa' }}
              </h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
                <i class="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <form [formGroup]="userForm" (ngSubmit)="saveUser()" class="p-6 space-y-5">
              
              <div class="space-y-1">
                <label class="text-xs font-bold text-slate-500 uppercase">Sede di Appartenenza</label>
                <select formControlName="clientId" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-bold text-slate-700">
                  <option value="">-- Seleziona Sede --</option>
                  @for (client of state.clients(); track client.id) {
                    <option [value]="client.id">{{ client.name }}</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                 <div class="space-y-1">
                   <label class="text-xs font-bold text-slate-500 uppercase">Nome / Reparto</label>
                   <input type="text" formControlName="department" placeholder="Es. Cucina, Bar..." 
                          class="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                 </div>
                 <div class="space-y-1">
                   <label class="text-xs font-bold text-slate-500 uppercase">Ruolo Accesso</label>
                   <select formControlName="role" class="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium">
                     <option value="COLLABORATOR">Operatore</option>
                     <option value="ADMIN">Amministratore</option>
                   </select>
                 </div>
              </div>

              <div class="space-y-1">
                 <label class="text-xs font-bold text-slate-500 uppercase">Responsabile (Nome Cognome)</label>
                 <div class="relative">
                    <i class="fa-solid fa-user absolute left-3.5 top-3.5 text-slate-400"></i>
                    <input type="text" formControlName="name" placeholder="Es. Mario Rossi"
                           class="w-full pl-10 px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800">
                 </div>
              </div>

              <div class="space-y-1">
                 <label class="text-xs font-bold text-slate-500 uppercase">Email (Login)</label>
                 <div class="relative">
                    <i class="fa-solid fa-envelope absolute left-3.5 top-3.5 text-slate-400"></i>
                    <input type="email" formControlName="email" placeholder="email@esempio.it"
                           class="w-full pl-10 px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800">
                 </div>
              </div>

              <div class="pt-2 flex justify-end gap-3">
                 <button type="button" (click)="closeModal()" class="px-5 py-2.5 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors">Annulla</button>
                 <button type="submit" [disabled]="userForm.invalid" class="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100">
                    {{ isEditing() ? 'Salva Modifiche' : 'Crea Unità' }}
                 </button>
              </div>

            </form>
          </div>
        </div>
      }

      <!-- Client Company Modal -->
      @if (activeModal() === 'client') {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
          
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 class="text-lg font-bold text-slate-800">
                {{ isEditing() ? 'Modifica Azienda' : 'Nuova Azienda' }}
              </h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
                <i class="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <form [formGroup]="clientForm" (ngSubmit)="saveClient()" class="p-6 space-y-5">
              
              <div class="space-y-1">
                 <label class="text-xs font-bold text-slate-500 uppercase">Ragione Sociale / Nome</label>
                 <input type="text" formControlName="name" placeholder="Es. Ristorante Da Mario S.r.l."
                        class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800">
              </div>

              <div class="space-y-1">
                 <label class="text-xs font-bold text-slate-500 uppercase">Partita IVA</label>
                 <input type="text" formControlName="piva" placeholder="12345678901"
                        class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-mono font-medium">
              </div>

              <div class="space-y-1">
                 <label class="text-xs font-bold text-slate-500 uppercase">Indirizzo Sede Operativa</label>
                 <input type="text" formControlName="address" placeholder="Via Roma 1, Milano"
                        class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
              </div>

               <div class="grid grid-cols-2 gap-4">
                 <div class="space-y-1">
                   <label class="text-xs font-bold text-slate-500 uppercase">Telefono</label>
                   <input type="text" formControlName="phone" placeholder="02 1234567" 
                          class="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                 </div>
                 <div class="space-y-1">
                   <label class="text-xs font-bold text-slate-500 uppercase">Email Aziendale</label>
                   <input type="email" formControlName="email" placeholder="info@azienda.it" 
                          class="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium">
                 </div>
              </div>

              <div class="pt-2 flex justify-end gap-3">
                 <button type="button" (click)="closeModal()" class="px-5 py-2.5 rounded-lg font-bold text-slate-500 hover:bg-slate-100 transition-colors">Annulla</button>
                 <button type="submit" [disabled]="clientForm.invalid" class="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all transform active:scale-95 disabled:opacity-50 disabled:scale-100">
                    {{ isEditing() ? 'Aggiorna Azienda' : 'Crea Azienda' }}
                 </button>
              </div>

            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-down {
      animation: slideDown 0.2s ease-out forwards;
    }
  `]
})
export class CollaboratorsViewComponent {
  state = inject(AppStateService);
  fb = inject(FormBuilder);
  toastService = inject(ToastService);

  activeModal = signal<'user' | 'client' | null>(null);
  isEditing = signal(false);
  editingId = signal<string | null>(null);

  // Accordion State: Set of open client IDs
  expandedClientIds = signal<Set<string>>(new Set());

  userForm: FormGroup;
  clientForm: FormGroup;

  constructor() {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['COLLABORATOR', Validators.required],
      department: ['', Validators.required],
      clientId: ['', Validators.required],
      active: [true]
    });

    this.clientForm = this.fb.group({
      name: ['', Validators.required],
      piva: ['', Validators.required],
      address: ['', Validators.required],
      phone: [''],
      email: [''],
      licenseNumber: ['']
    });

    // All closed by default as requested
    // const clients = this.state.clients();
    // if (clients.length > 0) {
    //   this.toggleClient(clients[0].id);
    // }
  }

  isClientExpanded(clientId: string): boolean {
    return this.expandedClientIds().has(clientId);
  }

  toggleClient(clientId: string) {
    this.expandedClientIds.update(set => {
      const newSet = new Set(set);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        // Optional: Close others if we want "Accordion" behavior (only one open)
        // newSet.clear(); 
        newSet.add(clientId);
      }
      return newSet;
    });
  }

  getUsersByClient(clientId: string): SystemUser[] {
    return this.state.systemUsers().filter(u => u.clientId === clientId);
  }

  toggleUserActive(user: SystemUser) {
    if (user.role === 'ADMIN') return;
    this.state.updateSystemUser(user.id, { active: !user.active });
  }

  // --- User Logic ---
  openUserModal(user?: SystemUser, preSelectedClientId?: string) {
    this.activeModal.set('user');
    if (user) {
      this.isEditing.set(true);
      this.editingId.set(user.id);
      this.userForm.patchValue({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || '',
        clientId: user.clientId || '',
        active: user.active
      });
    } else {
      this.isEditing.set(false);
      this.editingId.set(null);
      this.userForm.reset({
        role: 'COLLABORATOR',
        active: true,
        department: '',
        clientId: preSelectedClientId || ''
      });
    }
  }

  saveUser() {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      const updates = {
        ...formValue,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formValue.name)}&background=random&color=fff`
      };
      if (this.isEditing() && this.editingId()) {
        this.state.updateSystemUser(this.editingId()!, updates);
      } else {
        this.state.addSystemUser(updates);
      }
      this.closeModal();
    }
  }

  deleteUser(id: string) {
    if (confirm('Sei sicuro di voler rimuovere questa unità operativa e tutti i suoi dati?')) {
      this.state.deleteSystemUser(id);
    }
  }

  // --- Client/Company Logic ---
  openClientModal(client?: ClientEntity) {
    this.activeModal.set('client');
    if (client) {
      this.isEditing.set(true);
      this.editingId.set(client.id);
      this.clientForm.patchValue({
        name: client.name,
        piva: client.piva,
        address: client.address,
        phone: client.phone,
        email: client.email,
        licenseNumber: client.licenseNumber
      });
    } else {
      this.isEditing.set(false);
      this.editingId.set(null);
      this.clientForm.reset();
    }
  }

  saveClient() {
    if (this.clientForm.valid) {
      const formValue = this.clientForm.value;
      if (this.isEditing() && this.editingId()) {
        this.state.updateClient(this.editingId()!, formValue);
      } else {
        this.state.addClient({ ...formValue, suspended: false });
      }
      this.closeModal();
    }
  }

  toggleSuspension(client: ClientEntity) {
    const message = client.suspended
      ? `Confermi di voler RIATTIVARE il servizio per "${client.name}"? Gli utenti potranno nuovamente accedere.`
      : `⚠️ ATTENZIONE: Stai per SOSPENDERE il servizio per "${client.name}".\n\nTutti gli utenti di questa azienda verranno BLOCCATI e non potranno più accedere al sistema.\n\nConfermi l'operazione?`;

    if (confirm(message)) {
      this.state.toggleClientSuspension(client.id, !client.suspended);
    }
  }

  closeModal() {
    this.activeModal.set(null);
    this.userForm.reset();
    this.clientForm.reset();
  }
}
