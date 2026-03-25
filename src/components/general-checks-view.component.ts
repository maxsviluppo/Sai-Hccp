import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';

interface CheckItem {
    id: string;
    label: string;
    moduleId: string;
    completed: boolean;
}

interface CheckCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
    items: CheckItem[];
}

@Component({
    selector: 'app-general-checks-view',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="space-y-6 pb-12 max-w-7xl mx-auto p-4">
      
      <!-- Sleek Professional Header -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
        
        <div class="relative z-10 flex items-center gap-5">
           <div class="h-14 w-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm text-emerald-600 shrink-0">
             <i class="fa-solid fa-list-check text-2xl"></i>
           </div>
           <div>
             <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Controlli Generali</h2>
             <div class="flex items-center gap-3 mt-1">
                 <p class="text-xs font-semibold text-slate-500">Panoramica globale HACCP</p>
                 <button (click)="showStandardInfo.set(true)" class="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 transition-colors">
                     <i class="fa-solid fa-circle-info"></i> Info
                 </button>
             </div>
           </div>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 relative z-10 w-full md:w-auto shrink-0">
          <!-- Company Selector -->
          <div class="bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-200 flex flex-col justify-center min-w-[220px]">
            <label class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-0.5 leading-none">Azienda Filtro</label>
            <select [ngModel]="selectedCompanyId()" (ngModelChange)="selectedCompanyId.set($event)"
                    class="bg-transparent text-slate-700 font-bold text-sm focus:outline-none cursor-pointer border-none p-0 w-full">
              <option value="">Tutte le Aziende</option>
              @for (client of state.clients(); track client.id) {
                <option [value]="client.id">{{ client.name }}</option>
              }
            </select>
          </div>

          <!-- Print Action -->
          <button (click)="printCompleteList()" 
                  [disabled]="!selectedCompanyId()"
                  class="px-5 py-3 h-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale shadow-sm shrink-0">
            <i class="fa-solid fa-print"></i>
            <span class="hidden sm:inline">Stampa rapporto</span>
          </button>
        </div>
      </div>

      <!-- Informational Modal -->
      @if (showStandardInfo()) {
            <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" (click)="showStandardInfo.set(false)"></div>
                <div class="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-slide-up border border-slate-100 flex flex-col">
                    <div class="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                        <div class="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-lg shrink-0">
                            <i class="fa-solid fa-list-check"></i>
                        </div>
                        <div>
                            <h3 class="text-base font-bold text-slate-800">Controlli HACCP</h3>
                            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Protocollo Standard</p>
                        </div>
                    </div>
                    
                    <div class="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <div class="space-y-2">
                            <h4 class="text-xs font-bold text-slate-800 flex items-center gap-2">
                                <i class="fa-solid fa-shield-check text-emerald-500"></i> Obiettivo
                            </h4>
                            <p class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                Monitorare costantemente l'attuazione delle procedure di autocontrollo previste dal piano HACCP aziendale.
                            </p>
                        </div>

                        <div class="space-y-2">
                            <h4 class="text-xs font-bold text-slate-800 flex items-center gap-2">
                                <i class="fa-solid fa-flask-vial text-blue-500"></i> Protocollo Sanificazione
                            </h4>
                            <p class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                "La sanificazione comprende pulizia meccanica/chimica e successiva disinfezione." 
                                Utilizzare prodotti anionici per il lavaggio e cationici per la disinfezione.
                            </p>
                        </div>

                        <div class="space-y-2">
                            <h4 class="text-xs font-bold text-slate-800 flex items-center gap-2">
                                <i class="fa-solid fa-triangle-exclamation text-orange-500"></i> Segnalazione
                            </h4>
                            <p class="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                Le non conformità rilevate devono essere registrate tempestivamente con le relative azioni correttive intraprese nel registro specifico.
                            </p>
                        </div>
                    </div>

                    <div class="p-4 bg-slate-50 border-t border-slate-100">
                        <button (click)="showStandardInfo.set(false)"
                                class="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:border-slate-300 transition-all shadow-sm">
                            CHIUDI
                        </button>
                    </div>
                </div>
            </div>
        }

      <!-- Summary Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm transition-all hover:shadow-md">
          <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Totale Controlli</p>
          <div class="flex items-end justify-between">
            <p class="text-3xl font-black text-slate-800 leading-none">{{ totalChecks() }}</p>
            <i class="fa-solid fa-clipboard-list text-slate-300 text-xl mb-1"></i>
          </div>
        </div>

        <div class="bg-emerald-50 rounded-xl p-5 border border-emerald-100 shadow-sm transition-all hover:shadow-md">
          <p class="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Completati</p>
          <div class="flex items-end justify-between">
            <p class="text-3xl font-black text-emerald-700 leading-none">{{ completedChecks() }}</p>
            <i class="fa-solid fa-circle-check text-emerald-300 text-xl mb-1"></i>
          </div>
        </div>

        <div class="bg-orange-50 rounded-xl p-5 border border-orange-100 shadow-sm transition-all hover:shadow-md">
          <p class="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">Da Completare</p>
          <div class="flex items-end justify-between">
            <p class="text-3xl font-black text-orange-700 leading-none">{{ pendingChecks() }}</p>
            <i class="fa-solid fa-clock text-orange-300 text-xl mb-1"></i>
          </div>
        </div>

        <div class="bg-blue-50 rounded-xl p-5 border border-blue-100 shadow-sm transition-all hover:shadow-md">
          <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Completamento</p>
          <div class="flex items-end justify-between">
            <p class="text-3xl font-black text-blue-700 leading-none">{{ completionRate() }}%</p>
            <i class="fa-solid fa-chart-pie text-blue-300 text-xl mb-1"></i>
          </div>
        </div>
      </div>

      <!-- Categories List -->
      <div class="space-y-4">
        @for (category of categories(); track category.id) {
          @let isOpen = isCategoryExpanded(category.id);
          @let categoryCompleted = getCategoryCompletedCount(category);
          @let categoryTotal = category.items.length;
          @let categoryRate = categoryTotal > 0 ? (categoryCompleted / categoryTotal * 100) : 0;

          <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:border-slate-300">
            
            <!-- Category Header -->
            <div class="px-5 py-4 cursor-pointer select-none transition-colors hover:bg-slate-50 border-l-[3px]"
                 [style.border-left-color]="category.color"
                 (click)="toggleCategory(category.id)">
               
               <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div class="flex items-center gap-4 flex-1 w-full relative">
                       <!-- Icon -->
                       <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-slate-100"
                            [style.background]="category.color + '15'"
                            [style.color]="category.color">
                          <i [class]="'fa-solid ' + category.icon + ' text-base'"></i>
                       </div>
                       
                       <div class="flex-1 min-w-0 pr-10 md:pr-0">
                          <div class="flex items-center gap-3 mb-1">
                              <h3 class="font-bold text-base text-slate-800 truncate">{{ category.name }}</h3>
                              <span class="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold tracking-widest border border-slate-200 shrink-0 uppercase">
                                  {{ categoryTotal }} VOCE{{categoryTotal > 1 ? 'I' :'E'}}
                              </span>
                          </div>
                          
                          <!-- Progress Bar -->
                          <div class="flex items-center gap-3 mt-1.5">
                              <div class="flex-1 max-w-[200px]">
                                  <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div class="h-full transition-all duration-700"
                                           [style.background]="category.color"
                                           [style.width.%]="categoryRate"></div>
                                  </div>
                              </div>
                              <span class="text-[10px] font-bold text-slate-500 w-8">
                                  {{ (categoryRate | number:'1.0-0') }}%
                              </span>
                          </div>
                       </div>

                       <!-- Expand Arrow -->
                       <div class="absolute right-0 top-1/2 -translate-y-1/2 md:relative md:top-auto md:translate-y-0 w-8 h-8 flex items-center justify-center text-slate-400 transition-transform duration-300"
                            [class.rotate-180]="isOpen">
                           <i class="fa-solid fa-chevron-down text-sm"></i>
                       </div>
                   </div>
               </div>
            </div>

            <!-- Category Items (Accordion Body) -->
            @if (isOpen) {
                <div class="border-t border-slate-100 bg-slate-50/50 p-4 md:p-6 animate-slide-down">
                   <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                      @for (item of category.items; track item.id) {
                          <div class="bg-white/80 rounded-lg p-4 border transition-all flex items-center gap-3"
                               [class.border-emerald-200]="item.completed"
                               [class.bg-emerald-50/50]="item.completed"
                               [class.border-slate-200]="!item.completed"
                               [class.hover:border-slate-300]="!item.completed">
                              
                              <div class="flex items-start gap-3 flex-1">
                                  <!-- Status Icon -->
                                  <div class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 border"
                                       [class.bg-emerald-500]="item.completed"
                                       [class.border-emerald-600]="item.completed"
                                       [class.text-white]="item.completed"
                                       [class.bg-slate-50]="!item.completed"
                                       [class.border-slate-300]="!item.completed"
                                       [class.text-slate-300]="!item.completed">
                                      @if (item.completed) {
                                          <i class="fa-solid fa-check text-[10px] font-black"></i>
                                      } @else {
                                          <i class="fa-solid fa-minus text-[10px] font-black"></i>
                                      }
                                  </div>

                                  <!-- Label -->
                                  <div class="flex-1 min-w-0 pr-2">
                                      <p class="text-sm font-semibold leading-tight mb-1"
                                         [class.text-slate-700]="!item.completed"
                                         [class.text-emerald-800]="item.completed">
                                          {{ item.label }}
                                      </p>
                                      <p class="text-[9px] text-slate-400 uppercase font-bold tracking-widest">
                                          MOD: {{ getModuleName(item.moduleId) }}
                                      </p>
                                  </div>

                                  <!-- Status Badge -->
                                  @if (item.completed) {
                                      <span class="shrink-0 text-[9px] font-bold uppercase px-2 py-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                                          Check
                                      </span>
                                  } @else {
                                      <span class="shrink-0 text-[9px] font-bold uppercase px-2 py-1 rounded bg-orange-100 text-orange-700 border border-orange-200">
                                          Pendente
                                      </span>
                                  }
                              </div>
                          </div>
                      }
                   </div>
                </div>
            }

          </div>
        }
      </div>

      <!-- Non Conformità Section -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="h-10 w-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
              <i class="fa-solid fa-triangle-exclamation text-lg"></i>
            </div>
            <div>
              <h3 class="font-bold text-base text-slate-800">Non Conformità Segnalate</h3>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anomalie registrate dagli operatori</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3 py-1.5 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs font-black">
              {{ nonConformitiesFiltered().length }} OPEN
            </span>
            <span class="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-black">
              {{ nonConformitiesClosed().length }} CHIUSE
            </span>
          </div>
        </div>

        @if (state.filteredNonConformities().length === 0) {
          <div class="p-10 flex flex-col items-center gap-3 text-center">
            <div class="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-400">
              <i class="fa-solid fa-circle-check text-2xl"></i>
            </div>
            <p class="text-sm font-bold text-slate-500">Nessuna non conformità segnalata</p>
            <p class="text-xs text-slate-400">Tutte le verifiche sono conformi per l'azienda selezionata</p>
          </div>
        } @else {
          <div class="divide-y divide-slate-100">
            @for (nc of state.filteredNonConformities(); track nc.id) {
              <div class="p-4 hover:bg-slate-50 transition-colors flex gap-4">
                <!-- Status icon -->
                <div class="shrink-0 mt-0.5">
                  @if (nc.status === 'OPEN') {
                    <div class="h-8 w-8 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center text-red-500">
                      <i class="fa-solid fa-exclamation text-sm font-black"></i>
                    </div>
                  } @else if (nc.status === 'IN_PROGRESS') {
                    <div class="h-8 w-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600">
                      <i class="fa-solid fa-spinner text-sm"></i>
                    </div>
                  } @else {
                    <div class="h-8 w-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <i class="fa-solid fa-check text-sm"></i>
                    </div>
                  }
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span class="text-sm font-bold text-slate-800">{{ nc.itemName || 'Anomalia' }}</span>
                    <span class="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border"
                          [class.bg-red-50]="nc.status === 'OPEN'" [class.text-red-600]="nc.status === 'OPEN'" [class.border-red-200]="nc.status === 'OPEN'"
                          [class.bg-amber-50]="nc.status === 'IN_PROGRESS'" [class.text-amber-700]="nc.status === 'IN_PROGRESS'" [class.border-amber-200]="nc.status === 'IN_PROGRESS'"
                          [class.bg-emerald-50]="nc.status === 'CLOSED'" [class.text-emerald-700]="nc.status === 'CLOSED'" [class.border-emerald-200]="nc.status === 'CLOSED'">
                      {{ nc.status === 'OPEN' ? 'APERTA' : nc.status === 'IN_PROGRESS' ? 'IN CORSO' : 'CHIUSA' }}
                    </span>
                    <span class="text-[9px] font-bold uppercase text-slate-400 px-2 py-0.5 rounded bg-slate-50 border border-slate-100 tracking-widest">
                      {{ getModuleLabel(nc.moduleId) }}
                    </span>
                  </div>

                  <p class="text-xs text-slate-600 leading-relaxed mb-2">{{ nc.description }}</p>

                  <div class="flex items-center gap-4 text-[10px] text-slate-400 font-bold">
                    <span><i class="fa-solid fa-calendar-day mr-1"></i>{{ nc.date }}</span>
                    @if (nc.createdAt) {
                      <span><i class="fa-solid fa-clock mr-1"></i>{{ formatTime(nc.createdAt) }}</span>
                    }
                  </div>
                </div>

                <!-- Actions -->
                @if (nc.status === 'OPEN') {
                  <div class="flex flex-col gap-1.5 shrink-0">
                    <button (click)="updateNcStatus(nc.id, 'IN_PROGRESS')"
                            class="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 font-bold text-[10px] uppercase tracking-widest transition-colors">
                      In Corso
                    </button>
                    <button (click)="updateNcStatus(nc.id, 'CLOSED')"
                            class="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[10px] uppercase tracking-widest transition-colors">
                      Chiudi
                    </button>
                  </div>
                } @else if (nc.status === 'IN_PROGRESS') {
                  <button (click)="updateNcStatus(nc.id, 'CLOSED')"
                          class="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[10px] uppercase tracking-widest transition-colors">
                    <i class="fa-solid fa-check mr-1"></i>Chiudi
                  </button>
                }
              </div>
            }
          </div>
        }
      </div>

    </div>
  `,
    styles: [`
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  `]
})
export class GeneralChecksViewComponent {
    state = inject(AppStateService);
    toast = inject(ToastService);
    showStandardInfo = signal(false);
    expandedCategoryIds = signal<Set<string>>(new Set());

    // Injecting effect to handle global sync
    private _syncEffect = effect(() => {
        const filterId = this.state.filterCollaboratorId();
        if (filterId) {
            const user = this.state.systemUsers().find(u => u.id === filterId);
            if (user && user.clientId) {
                this.selectedCompanyId.set(user.clientId);
            }
        } else {
            this.selectedCompanyId.set('');
        }
    });

    // Local filter state
    selectedCompanyId = signal<string>('');

    // Use global filter instead of local selector
    selectedClient = computed(() => {
        // First check if there's a local selection from the dropdown
        const localId = this.selectedCompanyId();
        if (localId) {
            return this.state.clients().find(c => c.id === localId) || null;
        }

        // Otherwise fallback to global filter
        const filterId = this.state.filterCollaboratorId();
        if (!filterId) return null;
        const user = this.state.systemUsers().find(u => u.id === filterId);
        return user ? this.state.clients().find(c => c.id === user.clientId) : null;
    });

    // Real logic to check if a specific checklist is completed for current selection
    checkIsCompleted(moduleId: string): boolean {
        const client = this.selectedClient();
        const date = this.state.filterDate();
        if (!client) return false;

        return this.state.checklistRecords().some(r => 
            r.moduleId === moduleId && 
            r.clientId === client.id && 
            r.date === date
        );
    }

    categories = computed((): CheckCategory[] => {
        return [
            {
                id: 'pre-operative',
                name: 'Fase Pre-operativa',
                icon: 'fa-eye',
                color: '#3b82f6',
                items: [
                    { id: 'pre-1', label: 'Monitoraggio Igiene Ambienti / Attrezzature', moduleId: 'pre-op-checklist', completed: this.checkIsCompleted('pre-op-checklist') },
                    { id: 'pre-2', label: 'Controllo Stoccaggio e Materie Prime', moduleId: 'pre-op-checklist', completed: this.checkIsCompleted('pre-op-checklist') },
                    { id: 'pre-3', label: 'Verifica DPI e Abbigliamento Operatori', moduleId: 'pre-op-checklist', completed: this.checkIsCompleted('pre-op-checklist') }
                ]
            },
            {
                id: 'operative',
                name: 'Fase Operativa',
                icon: 'fa-fire-burner',
                color: '#6366f1',
                items: [
                    { id: 'op-1', label: 'Monitoraggio Temperature in Fase di Lavoro', moduleId: 'operative-checklist', completed: this.checkIsCompleted('operative-checklist') },
                    { id: 'op-2', label: 'Procedure di Rispetto Allergeni', moduleId: 'operative-checklist', completed: this.checkIsCompleted('operative-checklist') },
                    { id: 'op-3', label: 'Rispetto Tempistiche di Preparazione', moduleId: 'operative-checklist', completed: this.checkIsCompleted('operative-checklist') },
                    { id: 'op-4', label: 'Gestione Rintracciabilità Operativa', moduleId: 'operative-checklist', completed: this.checkIsCompleted('operative-checklist') }
                ]
            },
            {
                id: 'post-operative',
                name: 'Fase Post-operativa',
                icon: 'fa-broom',
                color: '#8b5cf6',
                items: [
                    { id: 'post-1', label: 'Sanificazione Superfici e Fine Turno', moduleId: 'post-op-checklist', completed: this.checkIsCompleted('post-op-checklist') },
                    { id: 'post-2', label: 'Smaltimento Scarti e Rifiuti Alimentari', moduleId: 'post-op-checklist', completed: this.checkIsCompleted('post-op-checklist') },
                    { id: 'post-3', label: 'Stoccaggio Semilavorati e Coperture', moduleId: 'post-op-checklist', completed: this.checkIsCompleted('post-op-checklist') },
                    { id: 'post-4', label: 'Messa in Sicurezza Utenze e Impianti', moduleId: 'post-op-checklist', completed: this.checkIsCompleted('post-op-checklist') }
                ]
            }
        ];
    });

    totalChecks = computed(() => {
        return this.categories().reduce((acc, cat) => acc + cat.items.length, 0);
    });

    completedChecks = computed(() => {
        return this.categories().reduce((acc, cat) =>
            acc + cat.items.filter(item => item.completed).length, 0
        );
    });

    pendingChecks = computed(() => {
        return this.totalChecks() - this.completedChecks();
    });

    completionRate = computed(() => {
        const total = this.totalChecks();
        if (total === 0) return 0;
        return Math.round((this.completedChecks() / total) * 100);
    });

    isCategoryExpanded(id: string): boolean {
        return this.expandedCategoryIds().has(id);
    }

    toggleCategory(id: string) {
        this.expandedCategoryIds.update(set => {
            const newSet = new Set(set);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }

    getCategoryCompletedCount(category: CheckCategory): number {
        return category.items.filter(item => item.completed).length;
    }

    getModuleName(moduleId: string): string {
        const moduleNames: Record<string, string> = {
            'operational-checklist': 'Checklist Operativa',
            'operative-checklist': 'Fase Operativa',
            'pre-op-checklist': 'Fase Pre-Operativa',
            'post-op-checklist': 'Fase Post-Operativa',
            'temperatures': 'Temperature',
            'staff-hygiene': 'Igiene Personale',
            'traceability': 'Rintracciabilità',
            'cleaning-maintenance': 'Pulizia/Manutenzione'
        };
        return moduleNames[moduleId] || moduleId;
    }

    getModuleLabel(moduleId: string): string {
        return this.getModuleName(moduleId);
    }

    // Non-conformity computed signals
    nonConformitiesFiltered = computed(() =>
        this.state.filteredNonConformities().filter(nc => nc.status !== 'CLOSED')
    );

    nonConformitiesClosed = computed(() =>
        this.state.filteredNonConformities().filter(nc => nc.status === 'CLOSED')
    );

    async updateNcStatus(id: string, status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED') {
        await this.state.updateNonConformityStatus(id, status);
        const label = status === 'CLOSED' ? 'chiusa' : status === 'IN_PROGRESS' ? 'in lavorazione' : 'aperta';
        this.toast.success('Non Conformità Aggiornata', `La segnalazione è stata marcata come ${label}.`);
    }

    formatTime(date: Date | undefined): string {
        if (!date) return '';
        try {
            return new Date(date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        } catch { return ''; }
    }

    printCompleteList() {
        const company = this.selectedClient();
        if (!company) return;

        const printContent = this.generatePrintHTML(company);
        const printWindow = window.open('', '_blank');

        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();

            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    }

    generatePrintHTML(company: any): string {
        const date = new Date(this.state.filterDate()).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        const categories = this.categories();
        const totalChecks = this.totalChecks();
        const completedChecks = this.completedChecks();
        const completionRate = this.completionRate();

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Lista Controlli Completa - ${company.name}</title>
                <style>
                    @page { size: A4; margin: 2cm; }
                    body { font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; }
                    .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo { font-size: 32px; font-weight: bold; color: #10b981; margin-bottom: 10px; }
                    .company-name { font-size: 24px; font-weight: bold; margin: 20px 0 10px; }
                    .meta { color: #64748b; font-size: 14px; margin-bottom: 5px; }
                    .summary-box { background: #f1f5f9; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
                    .category { margin: 30px 0; page-break-inside: avoid; }
                    .category-header { background: #f8fafc; padding: 12px; border-left: 4px solid; font-weight: bold; font-size: 18px; margin-bottom: 15px; }
                    .check-item { padding: 10px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px; }
                    .check-icon { width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-center; font-size: 12px; }
                    .check-icon.done { background: #10b981; color: white; }
                    .check-icon.pending { background: #f59e0b; color: white; }
                    .check-label { flex: 1; }
                    .check-status { font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; }
                    .check-status.done { background: #d1fae5; color: #065f46; }
                    .check-status.pending { background: #fed7aa; color: #92400e; }
                    .signature-area { margin-top: 60px; border-top: 2px solid #e2e8f0; padding-top: 30px; }
                    .signature-line { border-top: 1px solid #000; width: 300px; margin-top: 40px; padding-top: 5px; }
                    .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; page-break-inside: avoid; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">🛡️ HACCP Pro</div>
                    <div style="color: #64748b; font-size: 14px;">Sistema di Gestione Controlli Igienico-Sanitari</div>
                </div>

                <h1 class="company-name">${company.name}</h1>
                <div class="meta">P.IVA: ${company.piva}</div>
                <div class="meta">Indirizzo: ${company.address}</div>
                <div class="meta">Data Report: ${date}</div>

                <div class="summary-box">
                    <strong>Riepilogo Generale:</strong> ${completedChecks} controlli completati su ${totalChecks} totali 
                    (${completionRate}% di completamento)
                </div>

                <h2 style="margin-top: 30px; color: #10b981;">Lista Completa Controlli HACCP</h2>

                ${categories.map(category => {
            const catCompleted = this.getCategoryCompletedCount(category);
            const catTotal = category.items.length;
            const catRate = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0;

            return `
                        <div class="category">
                            <div class="category-header" style="border-left-color: ${category.color}; color: ${category.color};">
                                ${category.name} (${catCompleted}/${catTotal} - ${catRate}%)
                            </div>
                            ${category.items.map(item => `
                                <div class="check-item">
                                    <div class="check-icon ${item.completed ? 'done' : 'pending'}">
                                        ${item.completed ? '✓' : '−'}
                                    </div>
                                    <div class="check-label">${item.label}</div>
                                    <div class="check-status ${item.completed ? 'done' : 'pending'}">
                                        ${item.completed ? 'Fatto' : 'Da Fare'}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
        }).join('')}

                <div class="signature-area">
                    <p><strong>Firma del Responsabile HACCP:</strong></p>
                    <div class="signature-line">
                        <div style="text-align: center; font-size: 12px; color: #64748b;">Firma e Timbro</div>
                    </div>
                </div>

                <div class="footer">
                    <p>Documento generato automaticamente da HACCP Pro - ${new Date().toLocaleString('it-IT')}</p>
                    <p>Lista completa dei controlli HACCP per ${company.name}</p>
                </div>
            </body>
            </html>
        `;
    }
}

