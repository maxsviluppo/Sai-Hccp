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
    <!-- UI CONTENT (Hidden on print) -->
    <div class="print:hidden pb-20 animate-fade-in relative px-2 space-y-8">
        
        <!-- Minimal Hero Header -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 lg:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6 relative overflow-hidden">
            <!-- Subtle accent -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div class="relative z-10 flex items-center gap-3 md:gap-4">
                <div class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-sm shrink-0">
                    <i class="fa-solid fa-vial text-lg md:text-xl"></i>
                </div>
                <div>
                    <h2 class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Monitoraggio Microbiologico</h2>
                    <div class="flex flex-wrap items-center gap-2 mt-1">
                        <span class="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-200 text-[10px] md:text-xs font-black uppercase tracking-widest leading-none">
                            <i class="fa-solid fa-circle text-[8px] animate-pulse text-rose-500"></i>
                            Analisi & Test
                        </span>
                        <button (click)="showStandardInfo.set(true)" 
                                class="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded border border-rose-100 text-[10px] md:text-xs font-black uppercase tracking-widest leading-none transition-colors">
                            <i class="fa-solid fa-circle-info"></i> Info Protocollo
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <div class="w-full md:w-auto relative z-10 flex gap-4 pr-1">
                <div class="flex items-center gap-4 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 w-full justify-between">
                    <div class="min-w-[120px]">
                        <p class="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Completamento</p>
                        <div class="flex items-center gap-3">
                            <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex-1">
                                <div class="h-full bg-rose-500 rounded-full transition-all duration-1000" [style.width.%]="(checkedCount() / checks().length) * 100"></div>
                            </div>
                            <span class="text-sm md:text-base font-bold text-slate-700 leading-none whitespace-nowrap">{{ checkedCount() }}/{{ (checks().length || 1) }}</span>
                        </div>
                    </div>
                    <i class="fa-solid fa-microscope text-slate-300 text-lg md:text-xl ml-2"></i>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (check of checks(); track check.id) {
                <div class="bg-white p-5 md:p-6 rounded-2xl shadow-sm border transition-all duration-300 group relative overflow-hidden flex flex-col h-full"
                     [class.cursor-pointer]="canEdit()" [class.cursor-not-allowed]="!canEdit()" [class.opacity-60]="!canEdit()"
                     [class.border-slate-200]="!check.checked" [class.border-rose-200]="check.checked"
                     [class.bg-slate-50/50]="!check.checked" [class.bg-rose-50/40]="check.checked"
                     (click)="toggleCheck(check.id)">

                    <!-- Status side border indicator -->
                    <div class="absolute left-0 top-0 bottom-0 w-1 transition-colors"
                         [class.bg-transparent]="!check.checked" [class.bg-rose-400]="check.checked"></div>
                         
                    <div class="flex items-start gap-4 pl-2 h-full flex-col sm:flex-row">
                        <div class="flex-[1] flex items-start gap-3 md:gap-4 w-full">
                            <div class="shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex flex-col items-center justify-center transition-all duration-300 border shadow-sm group-hover:scale-[1.03]"
                                 [class.bg-rose-50]="check.checked" [class.border-rose-200]="check.checked" [class.text-rose-500]="check.checked"
                                 [class.bg-white]="!check.checked" [class.border-slate-200]="!check.checked" [class.text-slate-300]="!check.checked">
                                <i class="fa-solid text-xl md:text-2xl" [class.fa-check-circle]="check.checked" [class.fa-flask-vial]="!check.checked"></i>
                            </div>
                            <div class="flex-1 min-w-0 flex flex-col justify-center mt-1 sm:mt-0">
                                <h3 class="font-bold text-slate-800 text-sm md:text-base leading-tight mb-2 md:mb-3">{{ check.label }}</h3>
                                <div class="flex items-center gap-2 mt-auto">
                                    @if (check.checked) {
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-100 text-rose-700 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-md border border-rose-200">
                                            <i class="fa-solid fa-circle-check"></i> Verificato
                                        </span>
                                    } @else {
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-md border border-slate-200">
                                            <i class="fa-regular fa-circle"></i> Da Verificare
                                        </span>
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>

        @if (!canEdit()) {
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <i class="fa-solid fa-lock text-yellow-600 mt-0.5"></i>
                <p class="text-sm text-yellow-800 font-medium">Modalità di sola lettura. Seleziona un'unità operativa per modificare i dati.</p>
            </div>
        }

        <!-- Informational Modal -->
        @if (showStandardInfo()) {
            <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="showStandardInfo.set(false)"></div>
                <div class="relative bg-white w-full max-w-md max-h-[90vh] rounded-2xl shadow-xl overflow-hidden flex flex-col animate-slide-up border border-slate-200">
                    <div class="bg-rose-600 px-6 py-5 text-white flex justify-between items-center relative overflow-hidden flex-shrink-0">
                        <div class="absolute inset-0 bg-gradient-to-r from-rose-700/50 to-transparent pointer-events-none"></div>
                        <div class="flex items-center gap-4 relative z-10">
                            <div class="w-10 h-10 rounded-lg bg-rose-500/30 flex items-center justify-center border border-rose-400/30">
                                <i class="fa-solid fa-microscope text-lg text-rose-100"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold">Micro Monitoring</h3>
                                <p class="text-[10px] md:text-xs text-rose-200 uppercase tracking-widest">Protocollo HACCP</p>
                            </div>
                        </div>
                        <button (click)="showStandardInfo.set(false)" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors relative z-10 text-white">
                            <i class="fa-solid fa-xmark text-sm"></i>
                        </button>
                    </div>
                    
                    <div class="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
                        <div class="space-y-2">
                            <h4 class="text-[10px] md:text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-vial-circle-check text-[10px]"></i> 01. Analisi Superfici
                            </h4>
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-rose-400">
                                <p class="text-[11px] md:text-sm text-slate-600 font-medium leading-relaxed">
                                    Tamponi periodici su piani di lavoro, attrezzature e mani degli operatori per verificare l'efficacia della sanificazione.
                                </p>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <h4 class="text-[10px] md:text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-droplet text-[10px]"></i> 02. Analisi Acqua
                            </h4>
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p class="text-[11px] md:text-sm text-slate-600 font-medium leading-relaxed">
                                    Controllo della potabilità e assenza di cariche batteriche (Legionella, Pseudomonas) nelle reti idriche.
                                </p>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <h4 class="text-[10px] md:text-xs font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-clipboard-check text-[10px]"></i> 03. Validazione
                            </h4>
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p class="text-[11px] md:text-sm text-slate-600 font-medium leading-relaxed">
                                    Tutti i risultati devono essere archiviati e confrontati con i <strong class="text-slate-800">limiti di legge</strong> previsti dal piano di autocontrollo.
                                </p>
                            </div>
                        </div>
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

