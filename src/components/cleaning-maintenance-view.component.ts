import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';

interface CheckItem {
    id: string;
    label: string;
    icon: string;
    status: 'pending' | 'ok' | 'issue';
    note?: string;
}

@Component({
    selector: 'app-cleaning-maintenance-view',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <!-- UI CONTENT (Hidden on print) -->
    <div class="print:hidden pb-20 animate-fade-in relative px-2 space-y-8">
        
        <!-- Premium Hero Header -->
        <div class="relative overflow-hidden rounded-[2rem] bg-slate-900 p-6 shadow-xl border border-slate-800">
            <div class="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-violet-600/15 blur-3xl"></div>
            <div class="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-fuchsia-600/10 blur-3xl"></div>
            
            <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div class="flex items-center gap-5">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-700 shadow-lg shadow-violet-500/20 ring-1 ring-white/20">
                        <i class="fa-solid fa-screwdriver-wrench text-3xl text-white"></i>
                    </div>
                    <div>
                        <h2 class="text-4xl font-black tracking-tight text-white mb-1"><span class="text-violet-400">Manutenzione</span> & Igiene</h2>
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm font-bold text-slate-300 border border-white/10">
                                <i class="fa-solid fa-circle text-[9px] animate-pulse text-violet-400"></i>
                                Registro Attrezzature
                            </span>
                            <button (click)="showStandardInfo.set(true)" 
                                    class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 transition-all text-xs font-black border border-violet-500/20">
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
                            <span class="text-xl font-black text-white leading-none tabular-nums">{{ completedCount() }} / {{ checks().length }}</span>
                         </div>
                         <div class="w-px h-8 bg-white/10 mx-1"></div>
                         <div class="h-10 w-10 rounded-full border-2 border-violet-500/30 flex items-center justify-center">
                            <i class="fa-solid fa-check-double text-violet-400"></i>
                         </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Checklist List Layout -->
        <div class="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
            <div class="divide-y divide-slate-100">
                @for (check of checks(); track check.id) {
                    <div class="p-4 flex flex-col hover:bg-slate-50 transition-colors">
                        <div class="flex items-center justify-between gap-4">
                            <div class="flex items-center gap-4 flex-1">
                                <div class="h-12 w-12 rounded-2xl flex items-center justify-center text-xl transition-all shadow-inner shrink-0"
                                     [class.bg-emerald-100]="check.status === 'ok'" [class.text-emerald-600]="check.status === 'ok'"
                                     [class.bg-rose-100]="check.status === 'issue'" [class.text-rose-600]="check.status === 'issue'"
                                     [class.bg-slate-100]="check.status === 'pending'" [class.text-slate-500]="check.status === 'pending'">
                                    <i [class]="'fa-solid ' + (check.status === 'ok' ? 'fa-check' : (check.status === 'issue' ? 'fa-triangle-exclamation' : check.icon))"></i>
                                </div>
                                <div class="min-w-0">
                                    <h3 class="font-bold text-slate-800 text-base leading-tight truncate uppercase tracking-tight">{{ check.label }}</h3>
                                    <div class="flex items-center gap-2 mt-0.5">
                                        <span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                                              [class.bg-emerald-100]="check.status === 'ok'" [class.text-emerald-700]="check.status === 'ok'"
                                              [class.bg-red-100]="check.status === 'issue'" [class.text-red-700]="check.status === 'issue'"
                                              [class.bg-slate-100]="check.status === 'pending'" [class.text-slate-500]="check.status === 'pending'">
                                            {{ check.status === 'ok' ? 'Conforme' : (check.status === 'issue' ? 'Anomalia' : 'In attesa') }}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div class="flex items-center gap-2 shrink-0">
                                @if (check.status === 'pending') {
                                    <button (click)="setStatus(check.id, 'ok')" 
                                            [disabled]="!canEdit()"
                                            class="w-10 h-10 rounded-full bg-white border border-emerald-200 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center justify-center">
                                        <i class="fa-solid fa-check"></i>
                                    </button>
                                    <button (click)="setStatus(check.id, 'issue')" 
                                            [disabled]="!canEdit()"
                                            class="w-10 h-10 rounded-full bg-white border border-rose-200 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center">
                                        <i class="fa-solid fa-triangle-exclamation"></i>
                                    </button>
                                } @else {
                                    <button (click)="setStatus(check.id, 'pending')" 
                                            [disabled]="!canEdit()"
                                            class="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all text-[9px] font-black uppercase tracking-widest border border-slate-200">
                                        RESET
                                    </button>
                                }
                            </div>
                        </div>

                        <!-- Anomaly Details (Full Width below if issue) -->
                        @if (check.status === 'issue') {
                            <div class="mt-4 animate-slide-down">
                                <div class="relative">
                                    <textarea [(ngModel)]="check.note" 
                                              (ngModelChange)="onNoteUpdate()"
                                              [disabled]="!canEdit()"
                                              placeholder="Descrivi l'anomalia riscontrata..."
                                              class="w-full bg-slate-50 border border-rose-100 rounded-xl p-4 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-300 transition-all min-h-[80px]"></textarea>
                                    <div class="absolute top-3 right-3 text-rose-200">
                                        <i class="fa-solid fa-pen-nib text-xs"></i>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                } @empty {
                    <div class="p-20 text-center opacity-40">
                        <i class="fa-solid fa-microchip text-4xl mb-4"></i>
                        <p class="font-black uppercase tracking-[0.2em] text-xs">Nessun elemento</p>
                    </div>
                }
            </div>
        </div>

        @if (!canEdit()) {
            <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3 mx-2 shadow-sm animate-pulse">
                <i class="fa-solid fa-lock text-yellow-600 mt-0.5"></i>
                <div class="flex-1">
                    <p class="text-xs text-yellow-800 font-black uppercase tracking-widest mb-1">Sola Lettura</p>
                    <p class="text-xs text-yellow-800/70 font-bold leading-tight">Seleziona un&#39;unità operativa dal menu superiore per inserire i dati.</p>
                </div>
            </div>
        }

        <!-- FIXED SUBMIT BUTTON (Right Bottom) -->
        <div class="fixed bottom-6 right-6 z-50 animate-bounce-in">
            <button (click)="onFinalSubmit()"
                    [disabled]="completedCount() < checks().length || !canEdit()"
                    class="h-16 px-8 bg-slate-900 border-b-4 border-slate-950 text-white rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center gap-4 disabled:opacity-40 disabled:grayscale group"
                    [class.hover:bg-emerald-600]="completedCount() === checks().length && canEdit()"
                    [class.hover:border-emerald-700]="completedCount() === checks().length && canEdit()"
                    [class.bg-emerald-600]="completedCount() === checks().length && canEdit()"
                    [class.border-emerald-700]="completedCount() === checks().length && canEdit()">
                <div class="flex flex-col items-end">
                    <span class="text-[8px] opacity-60 font-bold tracking-widest group-hover:opacity-100 transition-opacity">ARCHIVIA REGISTRO</span>
                    <span class="text-xs">REGISTRA OPERAZIONI</span>
                </div>
                <div class="w-px h-6 bg-white/20"></div>
                <i class="fa-solid fa-cloud-arrow-up text-xl group-hover:scale-110 transition-transform"></i>
            </button>
        </div>

        <!-- Informational Modal -->
        @if (showStandardInfo()) {
            <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" (click)="showStandardInfo.set(false)"></div>
                <div class="relative bg-white w-full max-w-md max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden animate-slide-up border border-slate-100 flex flex-col">
                    <div class="p-8 bg-gradient-to-br from-violet-700 to-purple-900 text-white relative flex-shrink-0">
                        <div class="absolute top-0 right-0 p-6 opacity-10 pointer-events-none -rotate-12 translate-x-2">
                            <i class="fa-solid fa-screwdriver-wrench text-8xl"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-2xl font-black mb-1">Manutenzione</h3>
                            <p class="text-violet-200 text-[11px] font-bold leading-tight italic max-w-[280px]">
                                "La manutenzione e la sanificazione sono interventi globali per garantire l'integrità delle attrezzature e l'igiene dei locali."
                            </p>
                        </div>
                    </div>
                    
                    <div class="p-8 pt-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                        <!-- Sezione Integrità -->
                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-gears text-xs"></i> 01. Integrità
                            </h4>
                            <div class="bg-violet-50/50 p-5 rounded-2xl border border-violet-100">
                                <p class="text-xs text-slate-700 leading-relaxed font-medium font-bold">
                                    Verificare lo stato di usura delle attrezzature, la tenuta delle guarnizioni e il corretto funzionamento dei motori. Segnalare anomalie strutturali come mattonelle o pavimenti danneggiati.
                                </p>
                            </div>
                        </div>

                        <!-- Sezione Detergenti/Lavaggio -->
                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-soap text-xs"></i> 02. Azione Detergenti
                            </h4>
                            <div class="bg-violet-50/50 p-5 rounded-2xl border border-violet-100">
                                <p class="text-[10px] text-slate-500 font-bold leading-relaxed italic">
                                    Utilizzare prodotti anionici per rimuovere lo sporco grasso e prodotti cationici per un effetto disinfettante. 
                                    Non mescolare prodotti diversi e rispettare i tempi di contatto previsti.
                                </p>
                            </div>
                        </div>

                        <!-- Sezione Sicurezza -->
                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-triangle-exclamation text-xs"></i> 03. Segnalazione
                            </h4>
                            <div class="bg-violet-50/50 p-5 rounded-2xl border border-violet-100 text-[10px] font-bold text-slate-500 italic">
                                In caso di malfunzionamento grave, apporre cartello "FUORI SERVIZIO" e isolare l'area. Registrare ogni anomalia nel box note per l'intervento tecnico.
                            </div>
                        </div>
                    </div>

                    <div class="p-6 bg-slate-50 border-t border-slate-100 flex-shrink-0">
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
    .animate-bounce-in { animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55); }
    @keyframes bounceIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-slide-down { animation: slideDown 0.3s ease-out; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  `]
})
export class CleaningMaintenanceViewComponent {
    state = inject(AppStateService);
    toast = inject(ToastService);
    showStandardInfo = signal(false);
    moduleId = 'cleaning-maintenance';

    checks = signal<CheckItem[]>([]);

    completedCount = computed<number>(() => {
        return this.checks().filter((c: CheckItem) => c.status !== 'pending').length;
    });

    constructor() {
        effect(() => {
            // React to state changes
            this.state.filterDate();
            this.state.filterCollaboratorId();
            this.state.currentUser();
            // Also react to groupedEquipment changes
            this.state.groupedEquipment();
            this.loadData();
        }, { allowSignalWrites: true });
    }

    loadData() {
        const equipment = this.state.groupedEquipment();
        const savedData = this.state.getRecord(this.moduleId);

        // Static items for Work Environments
        const staticItems: CheckItem[] = [
            { id: 'env-pavimenti', label: 'Pavimenti e Scarichi', icon: 'fa-border-all', status: 'pending', note: '' },
            { id: 'env-mattonelle', label: 'Pareti e Mattonelle', icon: 'fa-grip-lines-vertical', status: 'pending', note: '' },
            { id: 'env-infissi', label: 'Infissi e Zanzariere', icon: 'fa-window-maximize', status: 'pending', note: '' },
            { id: 'env-illuminazione', label: 'Sistemi di Illuminazione', icon: 'fa-lightbulb', status: 'pending', note: '' },
            { id: 'env-deposito', label: 'Deposito / Magazzino', icon: 'fa-warehouse', status: 'pending', note: '' },
            { id: 'env-spogliatoio', label: 'Spogliatoio', icon: 'fa-shirt', status: 'pending', note: '' },
            { id: 'env-ambienti-generico', label: 'Ambienti di Lavoro Generico', icon: 'fa-compass-drafting', status: 'pending', note: '' }
        ];

        const equipmentChecks = equipment.map(eq => {
            const saved = Array.isArray(savedData) ? savedData.find((s: any) => s.id === eq.name) : null;
            return {
                id: eq.name,
                label: eq.name,
                icon: this.state.getEquipmentIcon(eq.name),
                status: saved ? saved.status : 'pending',
                note: saved ? saved.note : ''
            } as CheckItem;
        });

        const environmentChecks = staticItems.map(item => {
            const saved = Array.isArray(savedData) ? savedData.find((s: any) => s.id === item.id) : null;
            return saved ? { ...item, status: saved.status, note: saved.note } : item;
        });

        this.checks.set([...environmentChecks, ...equipmentChecks]);
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

    setStatus(id: string, status: 'ok' | 'issue') {
        if (!this.canEdit()) return;

        this.checks.update(items => items.map(item => {
            if (item.id === id) {
                // If clicking the same status, toggle back to pending? 
                // Or just keep it. Let's toggle to pending if already selected.
                const newStatus = item.status === status ? 'pending' : status;
                return { ...item, status: newStatus };
            }
            return item;
        }));

        this.save();
    }

    onFinalSubmit() {
        if (!this.canEdit()) return;
        this.save();
        this.toast.success('Successo', 'Registro Manutenzione archiviato con successo');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    private save() {
        this.state.saveRecord(this.moduleId, this.checks());
    }
}

