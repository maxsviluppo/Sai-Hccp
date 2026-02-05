
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppStateService, ClientEntity } from '../services/app-state.service';

@Component({
  selector: 'app-settings-view',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Admin View: System & Master Company Settings -->
      @if (state.isAdmin()) {
        <!-- 1. Report Sending Settings -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-xl border border-blue-500/50 relative overflow-hidden">
           <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <i class="fa-solid fa-envelope-circle-check text-9xl text-white"></i>
           </div>
           
           <div class="relative z-10">
              <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                 <div class="flex-1">
                    <h2 class="text-2xl font-black text-white flex items-center">
                        <i class="fa-solid fa-gears mr-3"></i>
                        Configurazione Invio Report
                    </h2>
                    <p class="text-blue-100 mt-2 text-sm max-w-xl">
                        Imposta l'indirizzo email a cui gli operatori invieranno i report giornalieri in formato PDF.
                    </p>
                 </div>
                 
                 <div class="w-full md:w-auto">
                    <div class="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                       <label class="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-2 block">Email di Ricezione Report</label>
                       <div class="flex gap-2">
                          <input type="email" #newEmail [value]="state.reportRecipientEmail()"
                                 class="bg-white/10 text-white border border-white/30 rounded-lg px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[300px] placeholder-blue-300/50"
                                 placeholder="esempio@dominio.it">
                          <button (click)="state.setReportRecipientEmail(newEmail.value)"
                                  class="px-6 py-2 bg-white text-blue-700 rounded-lg font-bold hover:bg-blue-50 transition-all shadow-lg active:scale-95 truncate">
                              <i class="fa-solid fa-save mr-2"></i> Aggiorna
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <!-- 2. Master Company Anagraphic (Replacing the dynamic client list) -->
        <div class="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div class="px-8 py-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div class="flex items-center gap-4">
              <!-- Admin Logo Preview/Upload -->
              <div class="relative group">
                <div class="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-inner">
                  @if (state.adminCompany().logo) {
                    <img [src]="state.adminCompany().logo" class="w-full h-full object-contain p-2">
                  } @else {
                    <i class="fa-solid fa-image text-slate-300 text-2xl"></i>
                  }
                </div>
                @if (isEditingAdmin()) {
                  <label class="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-indigo-700 transition-colors border-2 border-white">
                    <i class="fa-solid fa-camera text-xs"></i>
                    <input type="file" (change)="onLogoChange($event, 'ADMIN')" class="hidden" accept="image/*">
                  </label>
                }
              </div>
              <div>
                <h2 class="text-2xl font-black text-slate-800 flex items-center">
                  <i class="fa-solid fa-building-shield mr-3 text-indigo-600"></i>
                  Anagrafica Azienda Amministratore
                </h2>
                <p class="text-slate-500 text-sm mt-1">Gestisci i dati della sede centrale e il logo globale del sistema.</p>
              </div>
            </div>
            @if (!isEditingAdmin()) {
              <button (click)="startEditingAdmin()" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-bold flex items-center gap-2">
                <i class="fa-solid fa-pen-to-square"></i> Modifica Dati
              </button>
            } @else {
              <div class="flex gap-3">
                <button (click)="cancelEditingAdmin()" class="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all font-bold">
                  Annulla
                </button>
                <button (click)="saveAdminData()" class="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 font-bold flex items-center gap-2">
                  <i class="fa-solid fa-check"></i> Salva Modifiche
                </button>
              </div>
            }
          </div>

          <div class="p-8">
            <form [formGroup]="adminForm" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <!-- Grid items remain same as before, but with logo management handled separately slightly -->
              <div class="space-y-2 lg:col-span-1">
                <label class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Ragione Sociale</label>
                @if (isEditingAdmin()) {
                  <input type="text" formControlName="name" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800">
                } @else {
                  <p class="text-lg font-bold text-slate-800">{{ state.adminCompany().name }}</p>
                }
              </div>
              
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Partita IVA</label>
                @if (isEditingAdmin()) {
                  <input type="text" formControlName="piva" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800">
                } @else {
                  <p class="text-lg font-bold text-slate-800 font-mono">{{ state.adminCompany().piva }}</p>
                }
              </div>

              <div class="space-y-2">
                <label class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Indirizzo Sede Centrale</label>
                @if (isEditingAdmin()) {
                  <input type="text" formControlName="address" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800">
                } @else {
                  <p class="text-lg font-bold text-slate-800">{{ state.adminCompany().address }}</p>
                }
              </div>

              <div class="space-y-2">
                <label class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Email Amministrativa</label>
                @if (isEditingAdmin()) {
                  <input type="email" formControlName="email" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800">
                } @else {
                  <p class="text-lg font-bold text-slate-800">{{ state.adminCompany().email }}</p>
                }
              </div>
              
              <div class="space-y-2">
                <label class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Posta Elettronica Certificata (PEC)</label>
                @if (isEditingAdmin()) {
                  <input type="email" formControlName="pec" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800">
                } @else {
                  <p class="text-lg font-bold text-indigo-600">{{ state.adminCompany().pec }}</p>
                }
              </div>

              <div class="space-y-2">
                <label class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Codice Univoco (SDI)</label>
                @if (isEditingAdmin()) {
                  <input type="text" formControlName="sdi" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 uppercase">
                } @else {
                  <p class="text-lg font-bold text-slate-800 font-mono tracking-widest">{{ state.adminCompany().sdi }}</p>
                }
              </div>

              <div class="space-y-2">
                <label class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Telefono Fisso</label>
                @if (isEditingAdmin()) {
                  <input type="text" formControlName="phone" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800">
                } @else {
                  <p class="text-lg font-bold text-slate-800">{{ state.adminCompany().phone || '-' }}</p>
                }
              </div>

              <div class="space-y-2">
                <label class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Cellulare</label>
                @if (isEditingAdmin()) {
                  <input type="text" formControlName="cellphone" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800">
                } @else {
                  <p class="text-lg font-bold text-slate-800">{{ state.adminCompany().cellphone || '-' }}</p>
                }
              </div>

              <div class="space-y-2">
                <label class="text-[10px] uppercase font-black text-slate-400 tracking-widest">WhatsApp</label>
                @if (isEditingAdmin()) {
                  <input type="text" formControlName="whatsapp" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800">
                } @else {
                  <p class="text-lg font-bold text-emerald-600 flex items-center gap-2">
                    <i class="fa-brands fa-whatsapp"></i>
                    {{ state.adminCompany().whatsapp || '-' }}
                  </p>
                }
              </div>

              <div class="space-y-2">
                <label class="text-[10px] uppercase font-black text-slate-400 tracking-widest">Nr. Licenza Master</label>
                @if (isEditingAdmin()) {
                  <input type="text" formControlName="licenseNumber" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800">
                } @else {
                  <p class="text-lg font-bold text-slate-800">{{ state.adminCompany().licenseNumber }}</p>
                }
              </div>
            </form>
          </div>
        </div>
      } 
      
      <!-- Collaborator View: Remains Read-Only Summary of THEIR company, with EDIT possibility -->
      @else {
        <div class="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div class="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div class="flex items-center gap-4">
              <!-- Operator Logo Preview/Upload -->
              <div class="relative group">
                <div class="w-20 h-20 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden shadow-lg">
                  @if (state.companyConfig().logo) {
                    <img [src]="state.companyConfig().logo" class="w-full h-full object-contain p-2">
                  } @else {
                    <div class="w-full h-full bg-slate-900 text-white flex items-center justify-center text-3xl font-bold">
                       {{ state.companyConfig().name.substring(0,1) }}
                    </div>
                  }
                </div>
                @if (isEditingOperator()) {
                  <label class="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-xl hover:bg-blue-700 transition-colors border-4 border-white">
                    <i class="fa-solid fa-cloud-arrow-up"></i>
                    <input type="file" (change)="onLogoChange($event, 'OPERATOR')" class="hidden" accept="image/*">
                  </label>
                }
              </div>
              <div>
                <h2 class="text-2xl font-black text-slate-800"><i class="fa-solid fa-building-circle-check mr-3 text-slate-500"></i>Profilo Aziendale Operativo</h2>
                <p class="text-sm text-slate-500 mt-1">Gestisci i recapiti e l'immagine della tua unità operativa.</p>
              </div>
            </div>
            @if (!isEditingOperator()) {
              <button (click)="startEditingOperator()" class="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg font-bold flex items-center gap-2">
                <i class="fa-solid fa-pen-to-square"></i> Completa / Modifica
              </button>
            } @else {
              <div class="flex gap-3">
                <button (click)="cancelEditingOperator()" class="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition-all font-bold">
                  Annulla
                </button>
                <button (click)="saveOperatorData()" class="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg font-bold flex items-center gap-2">
                  <i class="fa-solid fa-check"></i> Salva Tutto
                </button>
              </div>
            }
          </div>

          <div class="p-8">
             <div class="mb-10">
                <h1 class="text-3xl font-black text-slate-900 leading-tight">{{ state.companyConfig().name }}</h1>
                <div class="flex items-center gap-3 mt-1">
                  <span class="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 uppercase tracking-tighter">P.IVA: {{ state.companyConfig().piva }}</span>
                  <span class="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100 uppercase tracking-tighter">Licenza: {{ state.companyConfig().licenseNumber }}</span>
                </div>
             </div>
             
             <form [formGroup]="operatorForm" class="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div class="space-y-2">
                 <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sede Operativa (Indirizzo)</label>
                 @if (isEditingOperator()) {
                   <input type="text" formControlName="address" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800" placeholder="Indirizzo completo">
                 } @else {
                   <p class="text-lg font-bold text-slate-800 leading-snug">{{ state.companyConfig().address || 'Non specificato' }}</p>
                 }
               </div>

               <div class="space-y-2">
                 <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email di Contatto</label>
                 @if (isEditingOperator()) {
                   <input type="email" formControlName="email" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800" placeholder="Email aziendale">
                 } @else {
                   <p class="text-lg font-bold text-slate-800">{{ state.companyConfig().email || 'Non specificato' }}</p>
                 }
               </div>

               <div class="space-y-2">
                 <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Telefono Fisso</label>
                 @if (isEditingOperator()) {
                   <input type="text" formControlName="phone" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800" placeholder="Prefisso e Numero">
                 } @else {
                   <p class="text-lg font-bold text-slate-800">{{ state.companyConfig().phone || 'Non specificato' }}</p>
                 }
               </div>

               <div class="space-y-2">
                 <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cellulare / Mobile</label>
                 @if (isEditingOperator()) {
                   <input type="text" formControlName="cellphone" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800" placeholder="Numero mobile">
                 } @else {
                   <p class="text-lg font-bold text-slate-800">{{ state.companyConfig().cellphone || '-' }}</p>
                 }
               </div>

               <div class="space-y-2">
                 <label class="text-[10px] font-black uppercase text-slate-400 tracking-widest">WhatsApp Business</label>
                 @if (isEditingOperator()) {
                   <input type="text" formControlName="whatsapp" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800" placeholder="Numero WhatsApp">
                 } @else {
                   <p class="text-lg font-bold text-emerald-600 flex items-center gap-2">
                     <i class="fa-brands fa-whatsapp text-xl"></i>
                     {{ state.companyConfig().whatsapp || '-' }}
                   </p>
                 }
               </div>
             </form>
             
             <div class="mt-10 p-5 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-700 flex items-start gap-3 shadow-inner">
               <i class="fa-solid fa-circle-info mt-0.5 text-lg"></i>
               <div class="space-y-1">
                 <p class="font-bold uppercase tracking-tighter">Nota Informativa per l'Operatore</p>
                 <p class="leading-relaxed opacity-80">Inserisci anche il logo aziendale se desiderato tramite l'icona di caricamento sull'immagine di sinistra.</p>
               </div>
             </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SettingsViewComponent {
  state = inject(AppStateService);
  fb = inject(FormBuilder);

  isEditingAdmin = signal(false);
  isEditingOperator = signal(false);

  adminForm: FormGroup;
  operatorForm: FormGroup;

  constructor() {
    this.adminForm = this.fb.group({
      name: ['', Validators.required],
      piva: ['', Validators.required],
      address: ['', Validators.required],
      phone: [''],
      cellphone: [''],
      whatsapp: [''],
      email: ['', [Validators.required, Validators.email]],
      pec: ['', [Validators.required, Validators.email]],
      sdi: ['', [Validators.required, Validators.minLength(7)]],
      licenseNumber: [''],
      logo: ['']
    });

    this.operatorForm = this.fb.group({
      address: ['', Validators.required],
      phone: [''],
      cellphone: [''],
      whatsapp: [''],
      email: ['', [Validators.required, Validators.email]],
      logo: ['']
    });
  }

  // Logo Handling
  onLogoChange(event: any, role: 'ADMIN' | 'OPERATOR') {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const logoData = e.target.result;
        if (role === 'ADMIN') {
          this.adminForm.patchValue({ logo: logoData });
        } else {
          this.operatorForm.patchValue({ logo: logoData });
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // Admin Methods
  startEditingAdmin() {
    this.adminForm.patchValue(this.state.adminCompany());
    this.isEditingAdmin.set(true);
  }

  cancelEditingAdmin() {
    this.isEditingAdmin.set(false);
  }

  saveAdminData() {
    if (this.adminForm.valid) {
      this.state.updateAdminCompany(this.adminForm.value);
      this.isEditingAdmin.set(false);
    }
  }

  // Operator Methods
  startEditingOperator() {
    const config = this.state.companyConfig();
    this.operatorForm.patchValue({
      address: config.address,
      phone: config.phone,
      cellphone: config.cellphone || '',
      whatsapp: config.whatsapp || '',
      email: config.email,
      logo: config.logo || ''
    });
    this.isEditingOperator.set(true);
  }

  cancelEditingOperator() {
    this.isEditingOperator.set(false);
  }

  saveOperatorData() {
    if (this.operatorForm.valid) {
      this.state.updateCurrentCompany(this.operatorForm.value);
      this.isEditingOperator.set(false);
    }
  }
}
