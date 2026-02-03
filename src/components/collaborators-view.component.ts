
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppStateService, SystemUser } from '../services/app-state.service';

@Component({
  selector: 'app-collaborators-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Header with Action -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 flex items-center">
            <i class="fa-solid fa-users-gear mr-3 text-blue-600"></i>
            Gestione Collaboratori e Accessi
          </h2>
          <p class="text-slate-500 text-sm mt-1">
            Gestisci le utenze, assegna i collaboratori alle aziende e controlla i permessi di accesso.
          </p>
        </div>
        <button (click)="openModal()" class="px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 font-medium flex items-center">
          <i class="fa-solid fa-user-plus mr-2"></i> Aggiungi Utente
        </button>
      </div>

      <!-- Users Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
              <tr>
                <th class="px-6 py-4">Utente</th>
                <th class="px-6 py-4">Azienda Assegnata</th>
                <th class="px-6 py-4">Ruolo & Area</th>
                <th class="px-6 py-4">Accesso Piattaforma</th>
                <th class="px-6 py-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (user of state.systemUsers(); track user.id) {
                <tr class="hover:bg-slate-50 transition-colors" [class.bg-slate-50]="!user.active">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="relative">
                        <img [src]="user.avatar" class="w-10 h-10 rounded-full border border-slate-200" [class.grayscale]="!user.active">
                        @if (!user.active) {
                          <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                            <i class="fa-solid fa-ban text-[8px] text-white"></i>
                          </div>
                        }
                      </div>
                      <div [class.opacity-50]="!user.active">
                        <div class="font-bold text-slate-800">{{ user.name }}</div>
                        <div class="text-xs text-slate-400">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    @if (user.role === 'ADMIN') {
                       <span class="text-slate-400 italic">-- Super Admin --</span>
                    } @else {
                       <div class="flex items-center gap-2">
                         <i class="fa-solid fa-building text-slate-400"></i>
                         <span class="font-medium text-slate-700">{{ getClientName(user.clientId) }}</span>
                       </div>
                    }
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-col">
                      @if (user.role === 'ADMIN') {
                        <span class="inline-flex w-fit items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-bold mb-1">
                          ADMIN
                        </span>
                      } @else {
                        <span class="inline-flex w-fit items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-bold mb-1">
                          OPERATIVO
                        </span>
                      }
                      <span class="text-xs text-slate-500">{{ user.department || 'Generale' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                       <button (click)="toggleUserActive(user)" 
                          [class]="'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ' + (user.active ? 'bg-emerald-500' : 'bg-slate-200')">
                          <span [class]="'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ' + (user.active ? 'translate-x-5' : 'translate-x-0')"></span>
                       </button>
                       <span [class]="'text-xs font-medium ' + (user.active ? 'text-emerald-600' : 'text-slate-400')">
                         {{ user.active ? 'Abilitato' : 'Disabilitato' }}
                       </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button (click)="openModal(user)" class="text-slate-400 hover:text-blue-600 mx-1 p-2 hover:bg-blue-50 rounded-full transition-all" title="Modifica">
                      <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    @if (user.role !== 'ADMIN') { 
                      <button (click)="deleteUser(user.id)" class="text-slate-400 hover:text-red-600 mx-1 p-2 hover:bg-red-50 rounded-full transition-all" title="Elimina">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add/Edit Modal Overlay -->
      @if (isModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
          
          <!-- Modal Content -->
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 class="text-lg font-bold text-slate-800">
                {{ isEditing() ? 'Modifica Utente' : 'Nuovo Collaboratore' }}
              </h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
                <i class="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <form [formGroup]="userForm" (ngSubmit)="saveUser()" class="p-6 space-y-4">
              
              <!-- Name -->
              <div class="space-y-1">
                <label class="text-sm font-medium text-slate-700">Nome e Cognome</label>
                <div class="relative">
                   <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <i class="fa-solid fa-user text-slate-400"></i>
                   </div>
                   <input type="text" formControlName="name" class="pl-10 w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Es. Mario Rossi">
                </div>
              </div>

              <!-- Email -->
              <div class="space-y-1">
                <label class="text-sm font-medium text-slate-700">Indirizzo Email</label>
                <div class="relative">
                   <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <i class="fa-solid fa-envelope text-slate-400"></i>
                   </div>
                   <input type="email" formControlName="email" class="pl-10 w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Es. mario@azienda.it">
                </div>
              </div>

              <!-- Company Selection -->
              <div class="space-y-1 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                <label class="text-sm font-bold text-slate-800 block mb-1">Azienda di Appartenenza</label>
                <p class="text-xs text-slate-500 mb-2">Seleziona l'anagrafica aziendale a cui collegare questo utente.</p>
                <select formControlName="clientId" class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium">
                  <option value="">-- Seleziona Cliente --</option>
                  @for (client of state.clients(); track client.id) {
                    <option [value]="client.id">{{ client.name }} ({{ client.piva }})</option>
                  }
                </select>
              </div>

              <!-- Role & Department Grid -->
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                  <label class="text-sm font-medium text-slate-700">Ruolo Sistema</label>
                  <select formControlName="role" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                    <option value="COLLABORATOR">Collaboratore</option>
                    <option value="ADMIN">Amministratore</option>
                  </select>
                </div>

                <div class="space-y-1">
                  <label class="text-sm font-medium text-slate-700">Area Operativa</label>
                  <select formControlName="department" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                    <option value="">-- Seleziona --</option>
                    <option value="Cucina">Cucina / Laboratorio</option>
                    <option value="Sala">Sala / Bar</option>
                    <option value="Pulizie">Pulizie & Sanific.</option>
                    <option value="Magazzino">Magazzino</option>
                    <option value="Direzione">Direzione</option>
                  </select>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="pt-4 flex justify-end gap-3">
                <button type="button" (click)="closeModal()" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                  Annulla
                </button>
                <button type="submit" [disabled]="userForm.invalid" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ isEditing() ? 'Salva Modifiche' : 'Crea Utente' }}
                </button>
              </div>

            </form>
          </div>
        </div>
      }

    </div>
  `
})
export class CollaboratorsViewComponent {
  state = inject(AppStateService);
  fb = inject(FormBuilder);

  // Modal State
  isModalOpen = signal(false);
  isEditing = signal(false);
  editingUserId = signal<string | null>(null);

  userForm: FormGroup;

  constructor() {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      role: ['COLLABORATOR', Validators.required],
      department: [''],
      clientId: ['', Validators.required], // Now Required
      active: [true]
    });
  }

  getClientName(clientId?: string): string {
    if (!clientId) return 'N.D.';
    const client = this.state.clients().find(c => c.id === clientId);
    return client ? client.name : 'Azienda Sconosciuta';
  }

  toggleUserActive(user: SystemUser) {
    if (user.role === 'ADMIN') return; // Cannot disable main admin
    this.state.updateSystemUser(user.id, { active: !user.active });
  }

  openModal(user?: SystemUser) {
    if (user) {
      this.isEditing.set(true);
      this.editingUserId.set(user.id);
      this.userForm.patchValue({
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || '',
        clientId: user.clientId || '',
        active: user.active
      });
      // Handle Admin logic (admins might not need clientID in this simplified view, but usually do)
      if (user.role === 'ADMIN') {
        this.userForm.get('clientId')?.clearValidators();
      } else {
        this.userForm.get('clientId')?.setValidators(Validators.required);
      }
      this.userForm.get('clientId')?.updateValueAndValidity();

    } else {
      this.isEditing.set(false);
      this.editingUserId.set(null);
      this.userForm.reset({
        role: 'COLLABORATOR',
        active: true,
        department: '',
        clientId: ''
      });
      this.userForm.get('clientId')?.setValidators(Validators.required);
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.userForm.reset();
  }

  saveUser() {
    if (this.userForm.valid) {
      const formValue = this.userForm.value;
      
      if (this.isEditing() && this.editingUserId()) {
        this.state.updateSystemUser(this.editingUserId()!, formValue);
      } else {
        this.state.addSystemUser(formValue);
      }
      this.closeModal();
    }
  }

  deleteUser(id: string) {
    if(confirm('Sei sicuro di voler rimuovere questo utente?')) {
      this.state.deleteSystemUser(id);
    }
  }
}
