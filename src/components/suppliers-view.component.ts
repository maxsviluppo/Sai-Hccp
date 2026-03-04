import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';

interface Supplier {
  id: string;
  ragioneSociale: string;
  responsabile: string;
  piva: string;
  telefono: string;
  email: string;
  indirizzo: string;
  status: 'pending' | 'ok' | 'issue';
  note?: string;
}

@Component({
  selector: 'app-suppliers-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8 pb-10">
        <!-- Premium Header Banner -->
        <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 rounded-3xl shadow-xl border border-blue-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <i class="fa-solid fa-truck-field text-9xl text-white"></i>
            </div>
            <div class="relative z-10">
                <h2 class="text-3xl font-black text-white flex items-center tracking-tight">
                    <span class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mr-4 shadow-lg border border-white/30">
                        <i class="fa-solid fa-truck-field"></i>
                    </span>
                    Anagrafica Fornitori
                </h2>
                <p class="text-blue-100 text-sm mt-2 font-medium ml-1">Gestione qualificata e monitoraggio fornitori</p>
            </div>
            <div class="relative z-10 flex flex-col gap-2">
                <button (click)="isAddModalOpen.set(true)" 
                        class="px-6 py-3 bg-white text-blue-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2">
                    <i class="fa-solid fa-plus-circle"></i>
                    Nuovo Fornitore
                </button>
            </div>
        </div>

        <!-- Suppliers Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            @for (s of suppliers(); track s.id) {
                <div class="bg-white rounded-[32px] p-6 shadow-sm border-2 transition-all duration-300 relative overflow-hidden group"
                     [class.border-slate-100]="s.status === 'pending'"
                     [class.border-emerald-500/30]="s.status === 'ok'"
                     [class.border-rose-500/30]="s.status === 'issue'"
                     [class.bg-emerald-50/30]="s.status === 'ok'"
                     [class.bg-rose-50/30]="s.status === 'issue'">
                    
                    <div class="flex flex-col gap-6">
                        <!-- Card Header -->
                        <div class="flex items-start justify-between">
                            <div class="flex items-start gap-4">
                                <div class="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg border shrink-0"
                                     [class.bg-emerald-500]="s.status === 'ok'"
                                     [class.text-white]="s.status === 'ok'"
                                     [class.bg-rose-500]="s.status === 'issue'"
                                     [class.text-white]="s.status === 'issue'"
                                     [class.bg-slate-50]="s.status === 'pending'"
                                     [class.text-slate-400]="s.status === 'pending'">
                                    <i class="fa-solid fa-building text-2xl"></i>
                                </div>
                                <div class="min-w-0">
                                    <h3 class="font-black text-slate-800 text-lg uppercase tracking-tight truncate">{{ s.ragioneSociale }}</h3>
                                    <div class="flex flex-col gap-1 mt-1">
                                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <i class="fa-solid fa-user-tie text-[8px]"></i> Resp: {{ s.responsabile }}
                                        </span>
                                        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                            <i class="fa-solid fa-id-card text-[8px]"></i> P.IVA: {{ s.piva }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex items-center gap-2">
                                <button (click)="setStatus(s.id, 'ok')" 
                                        class="w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2"
                                        [class]="s.status === 'ok' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300 hover:border-emerald-500 hover:text-emerald-500'">
                                    <i class="fa-solid fa-check"></i>
                                </button>
                                <button (click)="setStatus(s.id, 'issue')" 
                                        class="w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2"
                                        [class]="s.status === 'issue' ? 'bg-rose-500 border-rose-500 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300 hover:border-rose-500 hover:text-rose-500'">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                                <button (click)="removeSupplier(s.id)" 
                                        class="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 border-2 border-slate-100 text-slate-300 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all ml-2">
                                    <i class="fa-solid fa-trash-can text-sm"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Contact Grid -->
                        <div class="grid grid-cols-2 gap-3 p-4 bg-white/50 rounded-2xl border border-slate-100 shadow-inner">
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contatto Email</span>
                                <span class="text-xs font-bold text-slate-700 truncate">{{ s.email }}</span>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Telefono</span>
                                <span class="text-xs font-bold text-slate-700">{{ s.telefono }}</span>
                            </div>
                        </div>

                        <!-- Non-conformity Note -->
                        @if (s.status === 'issue') {
                            <div class="animate-slide-down">
                                <label class="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 block">Motivazione Non Conformità</label>
                                <textarea [(ngModel)]="s.note" 
                                          (ngModelChange)="onNoteUpdate()"
                                          placeholder="Specifica i motivi della non conformità (es. certificazione scaduta, merce non idonea)..."
                                          class="w-full bg-white border-2 border-rose-100 rounded-2xl p-4 text-sm text-slate-700 focus:outline-none focus:border-rose-500 transition-all min-h-[100px] shadow-inner"></textarea>
                            </div>
                        }
                    </div>
                </div>
            } @empty {
                <div class="lg:col-span-2 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center">
                    <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <i class="fa-solid fa-truck-ramp-box text-4xl text-slate-300"></i>
                    </div>
                    <h3 class="text-xl font-black text-slate-400 uppercase tracking-tight">Nessun fornitore censito</h3>
                    <p class="text-slate-400 text-sm mt-2">Inizia aggiungendo il primo fornitore all'anagrafica.</p>
                </div>
            }
        </div>

        <!-- Add Supplier Modal -->
        @if (isAddModalOpen()) {
            <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" (click)="isAddModalOpen.set(false)"></div>
                <div class="relative bg-white w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden animate-slide-up border border-slate-100 flex flex-col">
                    <div class="p-8 bg-gradient-to-br from-blue-700 to-indigo-900 text-white flex justify-between items-center">
                        <div>
                            <h3 class="text-2xl font-black mb-1">Nuovo Fornitore</h3>
                            <p class="text-blue-200 text-[10px] font-bold uppercase tracking-widest opacity-80">Caricamento anagrafica di base</p>
                        </div>
                        <button (click)="isAddModalOpen.set(false)" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <div class="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Ragione Sociale</label>
                                <input [(ngModel)]="newSupplier.ragioneSociale" type="text" placeholder="Nome Azienda Srl..." class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-blue-500 focus:outline-none transition-all">
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Partita IVA</label>
                                <input [(ngModel)]="newSupplier.piva" type="text" placeholder="IT00000000000" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-blue-500 focus:outline-none transition-all">
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Responsabile</label>
                                <input [(ngModel)]="newSupplier.responsabile" type="text" placeholder="Nome e Cognome..." class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-blue-500 focus:outline-none transition-all">
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Email di contatto</label>
                                <input [(ngModel)]="newSupplier.email" type="email" placeholder="email@fornitore.it" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-blue-500 focus:outline-none transition-all">
                            </div>
                            <div>
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Telefono</label>
                                <input [(ngModel)]="newSupplier.telefono" type="text" placeholder="+39 000 0000000" class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-blue-500 focus:outline-none transition-all">
                            </div>
                            <div class="md:col-span-2">
                                <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Indirizzo Sede</label>
                                <input [(ngModel)]="newSupplier.indirizzo" type="text" placeholder="Via, Città, CAP..." class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm focus:border-blue-500 focus:outline-none transition-all">
                            </div>
                        </div>
                    </div>

                    <div class="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                        <button (click)="isAddModalOpen.set(false)" class="flex-1 py-4 bg-white text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-all">Annulla</button>
                        <button (click)="addSupplier()" class="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">Salva Fornitore</button>
                    </div>
                </div>
            </div>
        }
    </div>
    `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-slide-down { animation: slideDown 0.3s ease-out; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    `]
})
export class SuppliersViewComponent {
  state = inject(AppStateService);
  moduleId = 'suppliers';

  suppliers = signal<Supplier[]>([]);
  isAddModalOpen = signal(false);

  newSupplier = {
    ragioneSociale: '',
    responsabile: '',
    piva: '',
    telefono: '',
    email: '',
    indirizzo: ''
  };

  constructor() {
    effect(() => {
      this.state.filterDate();
      this.state.filterCollaboratorId();
      this.state.currentUser();
      this.loadData();
    }, { allowSignalWrites: true });
  }

  loadData() {
    const savedData = this.state.getRecord(this.moduleId);
    if (savedData && Array.isArray(savedData)) {
      this.suppliers.set(savedData);
    } else {
      // Default mock if none
      this.suppliers.set([
        { id: '1', ragioneSociale: 'Global Foods Srl', responsabile: 'Marco Rossi', piva: '01234567890', telefono: '02 123456', email: 'info@globalfoods.it', indirizzo: 'Via Milano 1, Milano', status: 'ok', note: '' },
        { id: '2', ragioneSociale: 'Ortofrutta Express', responsabile: 'Anna Bianchi', piva: '09876543210', telefono: '06 987654', email: 'ordini@ortoexpress.it', indirizzo: 'Via Roma 10, Roma', status: 'pending', note: '' }
      ]);
    }
  }

  addSupplier() {
    if (!this.newSupplier.ragioneSociale) return;

    const supplier: Supplier = {
      id: Date.now().toString(),
      ...this.newSupplier,
      status: 'pending',
      note: ''
    };

    this.suppliers.update(current => [...current, supplier]);
    this.saveData();

    // Reset form
    this.newSupplier = {
      ragioneSociale: '',
      responsabile: '',
      piva: '',
      telefono: '',
      email: '',
      indirizzo: ''
    };
    this.isAddModalOpen.set(false);
  }

  removeSupplier(id: string) {
    this.suppliers.update(current => current.filter(s => s.id !== id));
    this.saveData();
  }

  setStatus(id: string, status: 'ok' | 'issue') {
    this.suppliers.update(current => current.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === status ? 'pending' : status };
      }
      return s;
    }));
    this.saveData();
  }

  onNoteUpdate() {
    this.saveData();
  }

  private saveData() {
    this.state.saveRecord(this.moduleId, this.suppliers());
  }
}
