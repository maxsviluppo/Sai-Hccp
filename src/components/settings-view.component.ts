
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppStateService, ClientEntity } from '../services/app-state.service';

@Component({
  selector: 'app-settings-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Admin View: List of Companies -->
      @if (state.isAdmin()) {
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h2 class="text-2xl font-bold text-slate-800 flex items-center">
              <i class="fa-solid fa-building mr-3 text-slate-600"></i>
              Gestione Anagrafiche Aziende
            </h2>
            <p class="text-slate-500 text-sm mt-1">Crea e configura le aziende clienti per cui attivare i servizi.</p>
          </div>
          <button (click)="openModal()" class="px-5 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200 font-medium flex items-center">
            <i class="fa-solid fa-plus mr-2"></i> Nuova Azienda
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          @for (client of state.clients(); track client.id) {
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between group hover:border-blue-200 transition-all relative">
              
              <div class="absolute top-4 right-4">
                 <button (click)="openModal(client)" class="text-slate-400 hover:text-blue-600 p-2 bg-slate-50 rounded-full hover:bg-blue-50 transition-colors">
                   <i class="fa-solid fa-pen"></i>
                 </button>
              </div>

              <div>
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl font-bold">
                    {{ client.name.substring(0,1) }}
                  </div>
                  <div>
                    <h3 class="font-bold text-slate-800 text-lg leading-tight">{{ client.name }}</h3>
                    <p class="text-xs text-slate-400 font-mono mt-1">P.IVA: {{ client.piva }}</p>
                  </div>
                </div>

                <div class="space-y-2 text-sm text-slate-600 mb-4">
                   <div class="flex items-start gap-2">
                     <i class="fa-solid fa-location-dot mt-1 text-slate-400"></i>
                     <span>{{ client.address }}</span>
                   </div>
                   <div class="flex items-center gap-2">
                     <i class="fa-solid fa-phone text-slate-400"></i>
                     <span>{{ client.phone }}</span>
                   </div>
                   <div class="flex items-center gap-2">
                     <i class="fa-solid fa-envelope text-slate-400"></i>
                     <span>{{ client.email }}</span>
                   </div>
                </div>
              </div>
              
              <div class="pt-4 border-t border-slate-50 flex items-center justify-between text-xs font-medium">
                 <span class="text-slate-500">Licenza: <span class="text-slate-800">{{ client.licenseNumber || 'N.D.' }}</span></span>
                 <span class="text-blue-600 bg-blue-50 px-2 py-1 rounded">Attivo</span>
              </div>
            </div>
          }
        </div>
      } 
      
      <!-- Collaborator View: Read Only / Edit My Company -->
      @else {
        <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div class="p-6 border-b border-slate-100">
            <h2 class="text-xl font-bold text-slate-800"><i class="fa-solid fa-building mr-2 text-slate-500"></i>Dati Aziendali</h2>
            <p class="text-sm text-slate-500 mt-1">Riepilogo dati per intestazione reportistica.</p>
          </div>
          <div class="p-8">
             <div class="flex items-center gap-4 mb-8">
                <div class="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-3xl font-bold">
                  {{ state.companyConfig().name.substring(0,1) }}
                </div>
                <div>
                  <h1 class="text-2xl font-bold text-slate-900">{{ state.companyConfig().name }}</h1>
                  <p class="text-slate-500">Licenza HACCP: {{ state.companyConfig().licenseNumber }}</p>
                </div>
             </div>
             
             <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div>
                 <h4 class="text-xs font-bold uppercase text-slate-400 mb-2">Sede Operativa</h4>
                 <p class="font-medium text-slate-800">{{ state.companyConfig().address }}</p>
               </div>
               <div>
                 <h4 class="text-xs font-bold uppercase text-slate-400 mb-2">Dati Fiscali</h4>
                 <p class="font-medium text-slate-800">P.IVA: {{ state.companyConfig().piva }}</p>
               </div>
               <div>
                 <h4 class="text-xs font-bold uppercase text-slate-400 mb-2">Contatti</h4>
                 <p class="font-medium text-slate-800">{{ state.companyConfig().email }}</p>
                 <p class="font-medium text-slate-800">{{ state.companyConfig().phone }}</p>
               </div>
             </div>
             
             <div class="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100 text-sm text-yellow-800 flex items-start gap-3">
               <i class="fa-solid fa-lock mt-0.5"></i>
               <p>Questi dati sono gestiti dall'amministratore di sistema. Per modifiche anagrafiche, contattare la sede centrale.</p>
             </div>
          </div>
        </div>
      }

      <!-- Admin: Edit/Add Client Modal -->
      @if (isModalOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
          
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 class="text-lg font-bold text-slate-800">
                {{ isEditing() ? 'Modifica Azienda' : 'Nuova Anagrafica Azienda' }}
              </h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 transition-colors">
                <i class="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <form [formGroup]="clientForm" (ngSubmit)="saveClient()" class="p-6 space-y-4">
              <div class="space-y-1">
                 <label class="text-sm font-medium text-slate-700">Ragione Sociale</label>
                 <input type="text" formControlName="name" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1">
                   <label class="text-sm font-medium text-slate-700">Partita IVA</label>
                   <input type="text" formControlName="piva" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div class="space-y-1">
                   <label class="text-sm font-medium text-slate-700">Telefono</label>
                   <input type="text" formControlName="phone" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
              </div>

              <div class="space-y-1">
                 <label class="text-sm font-medium text-slate-700">Indirizzo Sede</label>
                 <input type="text" formControlName="address" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>

              <div class="space-y-1">
                 <label class="text-sm font-medium text-slate-700">Email Amministrazione</label>
                 <input type="email" formControlName="email" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>

               <div class="space-y-1">
                 <label class="text-sm font-medium text-slate-700">Nr. Licenza</label>
                 <input type="text" formControlName="licenseNumber" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              </div>

              <div class="pt-4 flex justify-end gap-3">
                <button type="button" (click)="closeModal()" class="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">Annulla</button>
                <button type="submit" [disabled]="clientForm.invalid" class="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium">Salva Azienda</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class SettingsViewComponent {
  state = inject(AppStateService);
  fb = inject(FormBuilder);
  
  isModalOpen = signal(false);
  isEditing = signal(false);
  editingClientId = signal<string | null>(null);

  clientForm: FormGroup;

  constructor() {
    this.clientForm = this.fb.group({
      name: ['', Validators.required],
      piva: ['', Validators.required],
      address: ['', Validators.required],
      phone: [''],
      email: ['', [Validators.required, Validators.email]],
      licenseNumber: ['']
    });
  }

  openModal(client?: ClientEntity) {
    if (client) {
      this.isEditing.set(true);
      this.editingClientId.set(client.id);
      this.clientForm.patchValue(client);
    } else {
      this.isEditing.set(false);
      this.editingClientId.set(null);
      this.clientForm.reset();
    }
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  saveClient() {
    if (this.clientForm.valid) {
      if (this.isEditing() && this.editingClientId()) {
        this.state.updateClient(this.editingClientId()!, this.clientForm.value);
      } else {
        this.state.addClient(this.clientForm.value);
      }
      this.closeModal();
    }
  }
}
