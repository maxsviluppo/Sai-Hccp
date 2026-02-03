
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';

@Component({
  selector: 'app-settings-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div class="p-6 border-b border-slate-100">
        <h2 class="text-xl font-bold text-slate-800"><i class="fa-solid fa-building mr-2 text-slate-500"></i>Configurazione Azienda</h2>
        <p class="text-sm text-slate-500 mt-1">Gestisci i dati della sede operativa per la reportistica e i certificati.</p>
      </div>
      
      <form [formGroup]="configForm" (ngSubmit)="save()" class="p-6 space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Ragione Sociale</label>
            <input type="text" formControlName="name" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Partita IVA / C.F.</label>
            <input type="text" formControlName="piva" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
          </div>

          <div class="space-y-2 md:col-span-2">
            <label class="text-sm font-medium text-slate-700">Indirizzo Sede Operativa</label>
            <input type="text" formControlName="address" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Telefono</label>
            <input type="text" formControlName="phone" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-700">Email Amministrazione</label>
            <input type="email" formControlName="email" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
          </div>

           <div class="space-y-2 md:col-span-2">
            <label class="text-sm font-medium text-slate-700">Numero Licenza / Autorizzazione HACCP</label>
            <input type="text" formControlName="licenseNumber" class="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-yellow-50 border-yellow-200">
            <p class="text-xs text-slate-500">Questo numero apparirà su tutti i report di autocontrollo.</p>
          </div>

        </div>

        <div class="pt-4 flex justify-end items-center border-t border-slate-100">
           @if (savedMessage()) {
             <span class="text-emerald-600 mr-4 text-sm font-medium animate-pulse"><i class="fa-solid fa-check mr-1"></i> Modifiche salvate con successo</span>
           }
           <button type="submit" [disabled]="configForm.invalid" class="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
             Salva Configurazione
           </button>
        </div>
      </form>
    </div>
  `
})
export class SettingsViewComponent {
  state = inject(AppStateService);
  fb = inject(FormBuilder);
  
  configForm: FormGroup;
  savedMessage = signal(false);

  constructor() {
    const current = this.state.companyConfig();
    this.configForm = this.fb.group({
      name: [current.name, Validators.required],
      piva: [current.piva, Validators.required],
      address: [current.address, Validators.required],
      phone: [current.phone],
      email: [current.email, [Validators.required, Validators.email]],
      licenseNumber: [current.licenseNumber]
    });
  }

  save() {
    if (this.configForm.valid) {
      this.state.updateCompanyConfig(this.configForm.value);
      this.savedMessage.set(true);
      setTimeout(() => this.savedMessage.set(false), 3000);
    }
  }
}
