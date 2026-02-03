
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
            Gestione Collaboratori
          </h2>
          <p class="text-slate-500 text-sm mt-1">
            Gestisci gli accessi del personale, assegna ruoli e aree operative.
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
                <th class="px-6 py-4">Ruolo</th>
                <th class="px-6 py-4">Dipartimento / Area</th>
                <th class="px-6 py-4">Stato</th>
                <th class="px-6 py-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (user of state.systemUsers(); track user.id) {
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <img [src]="user.avatar" class="w-10 h-10 rounded-full border border-slate-200">
                      <div>
                        <div class="font-bold text-slate-800">{{ user.name }}</div>
                        <div class="text-xs text-slate-400">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    @if (user.role === 'ADMIN') {
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-800 text-xs font-bold">
                        <i class="fa-solid fa-shield-halved mr-1.5 text-slate-500"></i> ADMIN
                      </span>
                    } @else {
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold">
                        <i class="fa-solid fa-user mr-1.5"></i> OPERATIVO
                      </span>
                    }
                  </td>
                  <td class="px-6 py-4">
                    <span class="text-slate-700">{{ user.department || 'Generale' }}</span>
                  </td>
                  <td class="px-6 py-4">
                    @if (user.active) {
                      <span class="text-emerald-600 font-medium text-xs flex items-center">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 mr-2"></span> Attivo
                      </span>
                    } @else {
                      <span class="text-slate-400 font-medium text-xs flex items-center">
                        <span class="w-2 h-2 rounded-full bg-slate-300 mr-2"></span> Disabilitato
                      </span>
                    }
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button (click)="openModal(user)" class="text-slate-400 hover:text-blue-600 mx-1 p-2 hover:bg-blue-50 rounded-full transition-all" title="Modifica">
                      <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    @if (user.role !== 'ADMIN') { 
                       <!-- Prevent deleting admins for safety in demo -->
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
        
        @if (state.systemUsers().length === 0) {
          <div class="p-12 text-center text-slate-400">
            <i class="fa-solid fa-users-slash text-4xl mb-3"></i>
            <p>Nessun collaboratore trovato.</p>
          </div>
        }
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

              <!-- Active Status -->
              <div class="flex items-center gap-2 pt-2">
                <input type="checkbox" formControlName="active" id="activeUser" class="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500">
                <label for="activeUser" class="text-sm text-slate-700 cursor-pointer select-none">
                  Utente Attivo (Abilitato all'accesso)
                </label>
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
      active: [true]
    });
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
        active: user.active
      });
    } else {
      this.isEditing.set(false);
      this.editingUserId.set(null);
      this.userForm.reset({
        role: 'COLLABORATOR',
        active: true,
        department: ''
      });
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
