import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';

interface CheckItem {
    id: string;
    label: string;
    checked: boolean;
}

@Component({
    selector: 'app-microbio-monitor-view',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="space-y-6 animate-fade-in p-4 pb-12 max-w-7xl mx-auto">
        
        <!-- App-style Header -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-xl shadow-sm border border-rose-100/50">
                    <i class="fa-solid fa-vial-virus"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold text-slate-800 tracking-tight">Monitoraggio Microbiologico</h2>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Analisi di Laboratorio & Tamponi</p>
                </div>
            </div>

            <div class="flex items-center gap-3 w-full sm:w-auto">
                <button (click)="showStandardInfo.set(true)" 
                        class="h-10 px-4 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm whitespace-nowrap">
                    <i class="fa-solid fa-circle-info text-rose-500"></i> Protocollo
                </button>
                
                <div class="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shrink-0 shadow-inner">
                    <div class="text-right">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Eseguite</p>
                        <p class="text-xs font-bold text-slate-700 leading-none">{{ checkedCount() }} / {{ checks().length }}</p>
                    </div>
                    <div class="h-8 w-8 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-rose-500 shadow-sm">
                        <i class="fa-solid fa-flask-vial text-sm"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modern App Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (check of checks(); track check.id) {
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-all group relative overflow-hidden"
                     [class.opacity-60]="!canEdit()">
                    
                    <!-- Decorative Element -->
                    <div class="absolute -right-4 -top-4 h-16 w-16 bg-rose-50/30 rounded-full blur-2xl group-hover:bg-rose-50/50 transition-colors"></div>

                    <div class="flex items-start justify-between mb-6 relative z-10">
                        <div class="h-12 w-12 rounded-2xl flex items-center justify-center text-xl border shadow-sm transition-all group-hover:scale-110"
                             [class.bg-slate-50]="!check.checked" [class.text-slate-300]="!check.checked" [class.border-slate-100]="!check.checked"
                             [class.bg-rose-50]="check.checked" [class.text-rose-600]="check.checked" [class.border-rose-100]="check.checked">
                            <i [class]="'fa-solid ' + (check.checked ? 'fa-square-check' : 'fa-flask-vial')"></i>
                        </div>
                        
                        <span class="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md shadow-sm border"
                              [class.bg-emerald-50]="check.checked" [class.text-emerald-600]="check.checked" [class.border-emerald-100]="check.checked"
                              [class.bg-slate-100]="!check.checked" [class.text-slate-500]="!check.checked" [class.border-slate-200/50]="!check.checked">
                            {{ check.checked ? 'VERIFICATO' : 'DA ESEGUIRE' }}
                        </span>
                    </div>

                    <div class="relative z-10 mb-6">
                       <h3 class="text-sm font-bold text-slate-800 mb-1 leading-tight uppercase tracking-tight group-hover:text-rose-950 transition-colors">{{ check.label }}</h3>
                       <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocollo Periodico Ufficiale</p>
                    </div>

                    <button (click)="toggleCheck(check.id)" [disabled]="!canEdit()"
                         class="w-full h-11 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm border relative z-10"
                         [class.bg-rose-600]="!check.checked" [class.text-white]="!check.checked" [class.border-rose-500]="!check.checked" [class.hover:bg-rose-700]="!check.checked"
                         [class.bg-slate-50]="check.checked" [class.text-slate-400]="check.checked" [class.border-slate-200/50]="check.checked" [class.hover:bg-slate-100]="check.checked">
                        <i [class]="'fa-solid ' + (check.checked ? 'fa-check-double' : 'fa-flask') + ' text-sm'"></i>
                        {{ check.checked ? 'ANNULLA ARCHIVIAZIONE' : 'ARCHIVIA RISULTATO' }}
                    </button>
                </div>
            }
        </div>

        @if (!canEdit()) {
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center gap-3">
                <i class="fa-solid fa-lock text-slate-400 text-xs"></i>
                <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Modalità sola lettura attiva</p>
            </div>
        }

        <!-- Informational Modal (Modern App Style) -->
        @if (showStandardInfo()) {
            <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" (click)="showStandardInfo.set(false)"></div>
                <div class="relative bg-white w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up border border-slate-200 rounded-2xl">
                    <div class="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                        <div class="flex items-center gap-3">
                           <div class="h-8 w-8 rounded-lg bg-rose-600 text-white flex items-center justify-center text-sm shadow-md shadow-rose-100">
                              <i class="fa-solid fa-microscope"></i>
                           </div>
                           <h3 class="font-bold text-slate-800 tracking-tight">Protocollo Analisi</h3>
                        </div>
                        <button (click)="showStandardInfo.set(false)" class="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors border border-slate-100 bg-white">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <div class="p-6 space-y-5">
                       <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 group">
                          <h4 class="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <span class="w-5 h-5 rounded bg-rose-100 flex items-center justify-center text-[10px]">01</span>
                             Frequenza Prestabilita
                          </h4>
                          <p class="text-xs text-slate-600 leading-relaxed font-medium">Le analisi devono seguire il calendario previsto dal piano di sanificazione aziendale.</p>
                       </div>
                       
                       <div class="p-4 rounded-xl bg-slate-50 border border-slate-100 group">
                          <h4 class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <span class="w-5 h-5 rounded bg-indigo-100 flex items-center justify-center text-[10px]">02</span>
                             Laboratori Accreditati
                          </h4>
                          <p class="text-xs text-slate-600 leading-relaxed font-medium">I campioni devono essere analizzati esclusivamente da laboratori esterni certificati.</p>
                       </div>

                       <div class="p-4 rounded-xl bg-rose-50/50 border border-rose-100 group">
                          <h4 class="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <span class="w-5 h-5 rounded bg-rose-100 flex items-center justify-center text-[10px]">!</span>
                             Gestione Non Conformità
                          </h4>
                          <p class="text-xs text-slate-600 leading-relaxed font-medium italic">In caso di carica batterica superiore ai limiti, attivare immediatamente la procedura di ri-sanificazione.</p>
                       </div>
                    </div>

                    <div class="p-6 bg-slate-50 border-t border-slate-100">
                        <button (click)="showStandardInfo.set(false)" class="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all uppercase tracking-widest shadow-sm">Ho Compreso</button>
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
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  `]
})
export class MicrobioMonitorViewComponent {
    state = inject(AppStateService);
    moduleId = 'micro-bio';
    showStandardInfo = signal(false);

    checks = signal<CheckItem[]>([
        { id: 'lab-test', label: 'TESTS DI LABORATORIO', checked: false },
        { id: 'rapid-tests', label: 'TESTS RAPIDI (RILEVAMENTO RESIDUI PROTEINE, GRASSI E ZUCCHERI)', checked: false }
    ]);

    checkedCount = computed<number>(() => {
        return this.checks().filter((c: CheckItem) => c.checked).length;
    });

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
            this.checks.update(current =>
                current.map(item => {
                    const savedItem = savedData.find((s: CheckItem) => s.id === item.id);
                    return savedItem ? { ...item, checked: savedItem.checked } : { ...item, checked: false };
                })
            );
        } else {
            this.checks.update(current => current.map(i => ({ ...i, checked: false })));
        }
    }

    canEdit(): boolean {
        return this.state.isContextEditable();
    }

    getDisplayName() {
        if (this.state.filterCollaboratorId()) {
            return this.state.systemUsers().find(u => u.id === this.state.filterCollaboratorId())?.name;
        }
        return this.state.currentUser()?.name;
    }

    toggleCheck(id: string) {
        if (!this.canEdit()) return;
        this.checks.update(items => items.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
        this.state.saveRecord(this.moduleId, this.checks());
    }
}
