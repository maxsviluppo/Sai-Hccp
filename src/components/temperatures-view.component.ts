import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';

interface CheckItem {
    id: string;
    label: string;
    checked: boolean;
}

@Component({
    selector: 'app-temperatures-view',
    standalone: true,
    imports: [CommonModule],
    template: `
    <!-- UI CONTENT (Hidden on print) -->
    <div class="print:hidden pb-20 animate-fade-in relative px-2 space-y-8">
        
        <!-- Premium Hero Header -->
        <div class="relative overflow-hidden rounded-[2rem] bg-slate-900 p-6 shadow-xl border border-slate-800">
            <div class="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-600/15 blur-3xl"></div>
            <div class="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl"></div>
            
            <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div class="flex items-center gap-5">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
                        <i class="fa-solid fa-temperature-three-quarters text-3xl text-white"></i>
                    </div>
                    <div>
                        <h2 class="text-4xl font-black tracking-tight text-white mb-1"><span class="text-cyan-400">Rilevazione</span> Temperature</h2>
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm font-bold text-slate-300 border border-white/10">
                                <i class="fa-solid fa-circle text-[9px] animate-pulse text-cyan-400"></i>
                                Catena del Freddo
                            </span>
                            <button (click)="showStandardInfo.set(true)" 
                                    class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-all text-xs font-black border border-cyan-500/20">
                                <i class="fa-solid fa-circle-info"></i>
                                INFO PROTOCOLLO
                            </button>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col items-end gap-2">
                    <div class="flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-inner">
                         <div class="flex flex-col items-end">
                            <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Completamento</span>
                            <span class="text-xl font-black text-white leading-none tabular-nums">{{ checkedCount() }} / {{ checks().length }}</span>
                         </div>
                         <div class="w-px h-8 bg-white/10 mx-1"></div>
                         <div class="h-10 w-10 rounded-full border-2 border-cyan-500/30 flex items-center justify-center">
                            <i class="fa-solid fa-snowflake text-cyan-400"></i>
                         </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (check of checks(); track check.id) {
                <div class="bg-white p-6 rounded-2xl shadow-sm border-2 transition-all duration-300 group"
                     [class.cursor-pointer]="canEdit()" [class.cursor-not-allowed]="!canEdit()" [class.opacity-60]="!canEdit()"
                     [class.border-cyan-100]="!check.checked" [class.border-cyan-500]="check.checked"
                     [class.bg-cyan-50]="check.checked" [class.shadow-lg]="check.checked" [class.shadow-cyan-200/50]="check.checked"
                     (click)="toggleCheck(check.id)">
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
                             [class.bg-cyan-500]="check.checked" [class.text-white]="check.checked" [class.shadow-lg]="check.checked"
                             [class.shadow-cyan-200]="check.checked" [class.bg-slate-100]="!check.checked" [class.text-slate-400]="!check.checked">
                            <i class="fa-solid text-2xl" [class.fa-check-circle]="check.checked" [class.fa-snowflake]="!check.checked"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-bold text-slate-800 text-base leading-tight mb-2">{{ check.label }}</h3>
                            <div class="flex items-center gap-2">
                                @if (check.checked) {
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500 text-white text-xs font-bold rounded-full">
                                        <i class="fa-solid fa-circle-check"></i> VERIFICATO
                                    </span>
                                } @else {
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">
                                        <i class="fa-regular fa-circle"></i> DA VERIFICARE
                                    </span>
                                }
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
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" (click)="showStandardInfo.set(false)"></div>
                <div class="relative bg-white w-full max-w-md max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden animate-slide-up border border-slate-100 flex flex-col">
                    <div class="p-8 bg-gradient-to-br from-cyan-700 to-blue-900 text-white relative flex-shrink-0">
                        <div class="absolute top-0 right-0 p-6 opacity-10 pointer-events-none -rotate-12 translate-x-2">
                            <i class="fa-solid fa-temperature-half text-8xl"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-2xl font-black mb-1">Temperature</h3>
                            <p class="text-cyan-200 text-[10px] font-black uppercase tracking-[0.2em]">Standard HACCP Pro</p>
                        </div>
                    </div>
                    
                    <div class="p-8 pt-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-snowflake text-xs"></i> 01. Catena del Freddo
                            </h4>
                            <div class="bg-cyan-50/50 p-5 rounded-2xl border border-cyan-100 text-xs text-slate-700 font-medium leading-relaxed">
                                Mantenimento costante delle temperature per prevenire la proliferazione batterica.
                            </div>
                        </div>

                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-clock-rotate-left text-xs"></i> 02. Frequenza
                            </h4>
                            <div class="bg-cyan-50/50 p-5 rounded-2xl border border-cyan-100 text-xs text-slate-700 font-medium leading-relaxed">
                                Le temperature devono essere rilevate e registrate almeno due volte al giorno (mattina e sera).
                            </div>
                        </div>

                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-triangle-exclamation text-xs"></i> 03. Allarmi
                            </h4>
                            <div class="bg-cyan-50/50 p-5 rounded-2xl border border-cyan-100 text-[10px] font-bold text-slate-500 italic">
                                Scostamenti superiori a 2°C per più di 2 ore richiedono azioni correttive e verifica dell'idoneità degli alimenti.
                            </div>
                        </div>
                    </div>

                    <div class="p-6 bg-slate-50 border-t border-slate-100">
                        <button (click)="showStandardInfo.set(false)"
                                class="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">
                            HO PRESO VISIONE
                        </button>
                    </div>
                </div>
            </div>
        }
    </div>
    `,
    styles: [`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  `]
})
export class TemperaturesViewComponent {
    state = inject(AppStateService);
    moduleId = 'temperatures';
    showStandardInfo = signal(false);

    checks = signal<CheckItem[]>([
        { id: 'fridge', label: 'TEMPERATURE FRIGORIGERI +4°C - +8°C', checked: false },
        { id: 'freezer', label: 'TEMPERATURE CONGELATORI -18°C – 24°C', checked: false }
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
        this.checks.update(items =>
            items.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
        );
        this.state.saveRecord(this.moduleId, this.checks());
    }
}

