
import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';
import { FormsModule } from '@angular/forms';

interface TraceabilityEntry {
  id: string;
  productName: string;
  preparationDate: string;
  expiryDate: string;
  lotNumber: string;
  notes: string;
  operator: string;
  registrationDate: string; // Date selected in the header
}

@Component({
  selector: 'app-traceability-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Header with Toggle View -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 flex items-center">
            <i class="fa-solid fa-barcode mr-3 text-emerald-600"></i>
            Rintracciabilità Alimenti
          </h2>
          <p class="text-slate-500 text-sm mt-1">
            Modulo di monitoraggio e tracciamento prodotti
          </p>
        </div>
        
        <div class="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
             <!-- View Switcher -->
             <div class="flex bg-slate-100 p-1 rounded-lg">
                <button (click)="viewMode.set('daily')" 
                    class="px-4 py-2 rounded-md text-sm font-bold transition-all"
                    [class.bg-white]="viewMode() === 'daily'"
                    [class.shadow-sm]="viewMode() === 'daily'"
                    [class.text-slate-800]="viewMode() === 'daily'"
                    [class.text-slate-400]="viewMode() !== 'daily'">
                    <i class="fa-solid fa-calendar-day mr-2"></i> Giornaliero
                </button>
                <button (click)="viewMode.set('history')" 
                    class="px-4 py-2 rounded-md text-sm font-bold transition-all"
                    [class.bg-white]="viewMode() === 'history'"
                    [class.shadow-sm]="viewMode() === 'history'"
                    [class.text-slate-800]="viewMode() === 'history'"
                    [class.text-slate-400]="viewMode() !== 'history'">
                    <i class="fa-solid fa-list mr-2"></i> Storico Completo
                </button>
             </div>

             <!-- Context Info -->
             @if (viewMode() === 'daily') {
                <div class="relative flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
                   <div class="flex flex-col">
                     <span class="text-xs text-slate-400 font-bold uppercase mb-0.5">Data Operazione</span>
                     <div class="font-medium text-slate-800 text-sm flex items-center h-[28px]">
                        <i class="fa-regular fa-calendar mr-2 text-slate-400"></i>
                        {{ state.filterDate() | date:'dd/MM/yyyy' }}
                     </div>
                   </div>
                   @if (!state.isContextEditable()) {
                       <div class="h-8 w-px bg-slate-200"></div>
                       <div class="flex items-center text-orange-500 font-bold text-xs uppercase px-2">
                           <i class="fa-solid fa-lock mr-1"></i> Sola Lettura
                       </div>
                   }
                </div>
             }
        </div>
      </div>

      <!-- DAILY VIEW -->
      @if (viewMode() === 'daily') {
          <!-- FORM -->
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up"
               [class.opacity-60]="!state.isContextEditable()"
               [class.pointer-events-none]="!state.isContextEditable()">
               
             <div class="p-4 border-b bg-slate-50 border-slate-100 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-700 shadow-sm border border-slate-100">
                       <i class="fa-solid" [class.fa-pen-to-square]="!editingEntryId()" [class.fa-edit]="editingEntryId()"></i>
                    </div>
                    <div>
                       <h3 class="font-bold text-slate-800 leading-tight">{{ editingEntryId() ? 'Modifica Prodotto' : 'Nuovo Prodotto' }}</h3>
                       <p class="text-[10px] text-slate-500 font-medium">Registrazione per data: {{ state.filterDate() | date:'dd/MM/yyyy' }}</p>
                    </div>
                </div>
                
                @if (editingEntryId()) {
                    <button (click)="cancelEdit()" class="text-xs text-red-500 hover:text-red-700 font-bold uppercase pointer-events-auto">
                        <i class="fa-solid fa-times mr-1"></i> Annulla Modifica
                    </button>
                }
             </div>

             <div class="p-6 md:p-8 space-y-6">
                <!-- Nome Prodotto -->
                <div>
                   <label class="block text-sm font-bold text-slate-700 mb-2">NOME DEL PRODOTTO <span class="text-red-500">*</span></label>
                   <input type="text" [(ngModel)]="formData.productName" placeholder="Es. Pomodori Pelati, Farina 00..."
                          [disabled]="!state.isContextEditable()"
                          class="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all font-medium text-slate-800 placeholder-slate-400 disabled:opacity-50">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Data Preparazione -->
                    <div>
                      <label class="block text-sm font-bold text-slate-700 mb-2">DATA PREPARAZIONE <span class="text-red-500">*</span></label>
                      <input type="date" [(ngModel)]="formData.preparationDate"
                             [disabled]="!state.isContextEditable()"
                             class="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all font-medium text-slate-800 cursor-pointer disabled:opacity-50">
                    </div>

                    <!-- Data Scadenza -->
                    <div>
                      <label class="block text-sm font-bold text-slate-700 mb-2">DATA SCADENZA <span class="text-red-500">*</span></label>
                      <input type="date" [(ngModel)]="formData.expiryDate"
                             [disabled]="!state.isContextEditable()"
                             class="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all font-medium text-slate-800 cursor-pointer disabled:opacity-50">
                    </div>
                </div>

                <!-- Numero Lotto -->
                <div>
                   <label class="block text-sm font-bold text-slate-700 mb-2">N° DI LOTTO <span class="text-red-500">*</span></label>
                   <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <span class="text-slate-400 font-bold text-xs">L-</span>
                      </div>
                      <input type="text" [(ngModel)]="formData.lotNumber" placeholder="123456"
                             [disabled]="!state.isContextEditable()"
                             class="w-full pl-8 p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all font-medium text-slate-800 placeholder-slate-400 disabled:opacity-50">
                   </div>
                </div>

                <!-- Altro -->
                <div>
                   <label class="block text-sm font-bold text-slate-700 mb-2">ALTRO (Note opzionali)</label>
                   <textarea [(ngModel)]="formData.notes" rows="2" placeholder="Note aggiuntive..."
                             [disabled]="!state.isContextEditable()"
                             class="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all font-medium text-slate-800 placeholder-slate-400 resize-none disabled:opacity-50"></textarea>
                </div>
             </div>

             <!-- Action Bar -->
             <div class="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
                <button (click)="saveEntry()" [disabled]="!isValid() || !state.isContextEditable()" 
                    class="px-6 py-3 rounded-xl font-bold flex items-center shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    [class.bg-emerald-600]="!editingEntryId()"
                    [class.text-white]="!editingEntryId()"
                    [class.bg-amber-500]="editingEntryId()"
                    [class.text-white]="editingEntryId()">
                    @if (editingEntryId()) {
                        <i class="fa-solid fa-save mr-2"></i> Aggiorna Prodotto
                    } @else {
                        <i class="fa-solid fa-plus mr-2"></i> Aggiungi alla Lista
                    }
                </button>
             </div>
          </div>

          <!-- LISTA GIORNALIERA -->
          <div class="mt-8">
             <h3 class="font-bold text-slate-800 mb-4 flex items-center">
                 <i class="fa-solid fa-clipboard-list text-slate-400 mr-2"></i> 
                 Prodotti caricati il {{ state.filterDate() | date:'dd/MM/yyyy' }}
                 <span class="ml-2 bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full">{{ dailyEntries().length }} items</span>
             </h3>
             
             @if (dailyEntries().length === 0) {
                 <div class="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
                     <div class="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                         <i class="fa-solid fa-box-open text-slate-300 text-xl"></i>
                     </div>
                     <p class="text-slate-400 font-medium">Nessun prodotto caricato in questa data.</p>
                 </div>
             } @else {
                 <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                                    <th class="px-4 py-3 font-bold">Prodotto</th>
                                    <th class="px-4 py-3 font-bold">Lotto</th>
                                    <th class="px-4 py-3 font-bold">Scadenza</th>
                                    <th class="px-4 py-3 font-bold text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                @for (entry of dailyEntries(); track entry.id) {
                                    <tr class="hover:bg-slate-50/80 transition-colors group">
                                        <td class="px-4 py-3">
                                            <div class="font-bold text-slate-700">{{ entry.productName }}</div>
                                            <div class="text-[10px] text-slate-400">Prep: {{ entry.preparationDate | date:'dd/MM/yyyy' }}</div>
                                        </td>
                                        <td class="px-4 py-3">
                                            <span class="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-mono font-bold">L-{{ entry.lotNumber }}</span>
                                        </td>
                                        <td class="px-4 py-3">
                                            <div [class.text-red-500]="isExpired(entry.expiryDate)" class="font-medium text-sm text-slate-600">
                                                {{ entry.expiryDate | date:'dd/MM' }}
                                                @if (isExpired(entry.expiryDate)) { <i class="fa-solid fa-triangle-exclamation ml-1 text-[10px]"></i> }
                                            </div>
                                        </td>
                                        <td class="px-4 py-3 text-right">
                                            <div class="flex items-center justify-end gap-2" [class.opacity-50]="!state.isContextEditable()">
                                                <button (click)="editEntry(entry)" [disabled]="!state.isContextEditable()" class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Modifica">
                                                    <i class="fa-solid fa-pen text-xs"></i>
                                                </button>
                                                <button (click)="deleteEntry(entry.id)" [disabled]="!state.isContextEditable()" class="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Elimina">
                                                    <i class="fa-solid fa-trash text-xs"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                }
                            </tbody>
                        </table>
                    </div>
                 </div>
             }
          </div>
      }

      <!-- HISTORY VIEW -->
      @if (viewMode() === 'history') {
         <div class="space-y-4 animate-fade-in-up">
            <!-- Filter Bar -->
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10">
                <div class="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
                    <div>
                        <label class="text-xs font-bold text-slate-500 uppercase block mb-1">Filtra per Data</label>
                        <div class="flex items-center gap-2">
                            <input type="date" [ngModel]="historyFilterDate()" (ngModelChange)="historyFilterDate.set($event)" 
                                class="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium focus:outline-none focus:border-indigo-500 w-full md:w-auto">
                            
                            @if (historyFilterDate()) {
                                <button (click)="historyFilterDate.set('')" class="text-slate-400 hover:text-red-500 px-2">
                                    <i class="fa-solid fa-times-circle"></i>
                                </button>
                            }
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-indigo-600">{{ filteredHistory().length }}</div>
                        <div class="text-[10px] text-slate-400 uppercase font-bold">Prodotti Trovati</div>
                    </div>
                </div>
            </div>

            <!-- Full History Table -->
            <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div class="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 class="font-bold text-slate-700 text-sm">Registro Completo Rintracciabilità</h3>
                </div>
                <div class="overflow-x-auto max-h-[600px]">
                    <table class="w-full text-left border-collapse">
                        <thead class="bg-slate-50 sticky top-0 z-0">
                            <tr class="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-100">
                                <th class="px-4 py-3 font-bold">Data Reg.</th>
                                <th class="px-4 py-3 font-bold">Prodotto</th>
                                <th class="px-4 py-3 font-bold">Lotto</th>
                                <th class="px-4 py-3 font-bold text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            @for (entry of filteredHistory(); track entry.id) {
                                <tr class="hover:bg-indigo-50/30 transition-colors">
                                    <td class="px-4 py-3">
                                        <span class="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{{ entry.registrationDate | date:'dd/MM/yy' }}</span>
                                    </td>
                                    <td class="px-4 py-3">
                                        <div class="font-bold text-slate-700">{{ entry.productName }}</div>
                                        <div class="text-[10px] text-slate-400 truncate max-w-[150px]">{{ entry.notes }}</div>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span class="text-xs font-mono text-slate-600">L-{{ entry.lotNumber }}</span>
                                    </td>
                                    <td class="px-4 py-3 text-right">
                                        <button (click)="deleteEntry(entry.id)" 
                                                [disabled]="!state.isContextEditable()"
                                                class="text-slate-400 hover:text-red-500 transition-colors p-1 disabled:opacity-30 disabled:hover:text-slate-400" title="Elimina definitivamente">
                                            <i class="fa-solid fa-trash-can"></i>
                                        </button>
                                    </td>
                                </tr>
                            }
                            @if (filteredHistory().length === 0) {
                                <tr>
                                    <td colspan="4" class="p-8 text-center text-slate-400">
                                        Nessun dato trovato con i filtri attuali.
                                    </td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>
         </div>
      }

    </div>
  `,
  styles: [`
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fade-in-up {
        animation: fadeInUp 0.3s ease-out forwards;
      }
    `]
})
export class TraceabilityViewComponent implements OnInit {
  state = inject(AppStateService);

  viewMode = signal<'daily' | 'history'>('daily');
  historyFilterDate = signal('');
  allEntries = signal<TraceabilityEntry[]>([]);
  editingEntryId = signal<string | null>(null);

  dailyEntries = computed(() => {
    return this.allEntries().filter(e => e.registrationDate === this.state.filterDate());
  });

  filteredHistory = computed(() => {
    let data = this.allEntries().sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());
    if (this.historyFilterDate()) {
      data = data.filter(e => e.registrationDate === this.historyFilterDate());
    }
    return data;
  });

  formData = {
    productName: '',
    preparationDate: '',
    expiryDate: '',
    lotNumber: '',
    notes: ''
  };

  constructor() {
    effect(() => {
      const d = this.state.filterDate();
      if (!this.editingEntryId() && this.formData.preparationDate !== d) {
        // Optional: auto-sync prep date only if form is clear? 
        // Better to just start fresh if date changes.
        // But let's avoid overriding user input while typing.
        // For now, simpler: do nothing here, the template uses filterDate for LIST.
        // When adding NEW, I want it to default to filterDate.
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit() {
    this.loadData();
    // Default form prep date to today/filter date
    this.formData.preparationDate = this.state.filterDate();
  }

  loadData() {
    const stored = localStorage.getItem('haccp_traceability_data');
    if (stored) {
      try {
        this.allEntries.set(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse traceability data', e);
      }
    }
  }

  saveAll() {
    localStorage.setItem('haccp_traceability_data', JSON.stringify(this.allEntries()));
  }

  resetForm() {
    this.formData = {
      productName: '',
      preparationDate: this.state.filterDate(),
      expiryDate: '',
      lotNumber: '',
      notes: ''
    };
    this.editingEntryId.set(null);
  }

  isValid() {
    return this.formData.productName &&
      this.formData.preparationDate &&
      this.formData.expiryDate &&
      this.formData.lotNumber;
  }

  saveEntry() {
    if (!this.isValid()) return;
    if (!this.state.isContextEditable()) return;

    const entry: TraceabilityEntry = {
      id: this.editingEntryId() || crypto.randomUUID(),
      productName: this.formData.productName,
      preparationDate: this.formData.preparationDate,
      expiryDate: this.formData.expiryDate,
      lotNumber: this.formData.lotNumber,
      notes: this.formData.notes,
      operator: this.state.currentUser()?.name || 'Admin',
      registrationDate: this.state.filterDate()
    };

    if (this.editingEntryId()) {
      this.allEntries.update(list => list.map(e => e.id === entry.id ? entry : e));
    } else {
      this.allEntries.update(list => [entry, ...list]);
    }

    this.saveAll();
    this.resetForm();
  }

  editEntry(entry: TraceabilityEntry) {
    if (!this.state.isContextEditable()) return;

    if (entry.registrationDate !== this.state.filterDate()) {
      if (confirm('Questo elemento appartiene a una data diversa. Visualizzare la data corrispondente?')) {
        this.state.setDateFilter(entry.registrationDate);
      } else {
        return;
      }
    }

    this.editingEntryId.set(entry.id);
    this.formData = {
      productName: entry.productName,
      preparationDate: entry.preparationDate,
      expiryDate: entry.expiryDate,
      lotNumber: entry.lotNumber,
      notes: entry.notes
    };

    this.viewMode.set('daily');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  deleteEntry(id: string) {
    if (!this.state.isContextEditable()) return;
    if (confirm('Sei sicuro di voler eliminare questo prodotto?')) {
      this.allEntries.update(list => list.filter(e => e.id !== id));
      this.saveAll();
      if (this.editingEntryId() === id) {
        this.resetForm();
      }
    }
  }

  cancelEdit() {
    this.resetForm();
  }

  isExpired(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }
}
