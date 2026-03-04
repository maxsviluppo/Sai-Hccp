import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';

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
    <div class="space-y-8 pb-10">
        <!-- Premium Header Banner -->
        <div class="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 p-8 rounded-3xl shadow-xl border border-violet-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <i class="fa-solid fa-screwdriver-wrench text-9xl text-white"></i>
            </div>
            <div class="relative z-10">
                <h2 class="text-3xl font-black text-white flex items-center tracking-tight">
                    <span class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mr-4 shadow-lg border border-white/30">
                        <i class="fa-solid fa-screwdriver-wrench"></i>
                    </span>
                    Manutenzione
                </h2>
                <div class="flex items-center gap-4 mt-2">
                    <p class="text-violet-100 text-sm font-medium ml-1">Registro manutenzione e integrità attrezzature</p>
                    <button (click)="showStandardInfo.set(true)" 
                            class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-violet-700 transition-all text-[10px] font-black border border-white/30 shadow-md group">
                        <i class="fa-solid fa-circle-info text-sm group-hover:scale-110 transition-transform"></i>
                        <span>INFO PROTOCOLLO</span>
                    </button>
                </div>
            </div>
            <div class="relative z-10 flex flex-col gap-2">
                <div class="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <i class="fa-solid fa-check-double text-white text-lg"></i>
                    <span class="text-white font-bold">{{ completedCount() }} / {{ checks().length }}</span>
                </div>
                <div class="text-xs text-violet-100 font-medium flex items-center gap-2">
                    <i class="fa-regular fa-calendar"></i> {{ state.filterDate() | date:'dd/MM/yyyy' }}
                    @if (getDisplayName()) { <span class="mx-1">•</span> <i class="fa-regular fa-user"></i> {{ getDisplayName() }} }
                </div>
            </div>
        </div>

        <!-- Dynamic Equipment Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            @for (check of checks(); track check.id) {
                <div class="bg-white rounded-[32px] p-6 shadow-sm border-2 transition-all duration-300 relative overflow-hidden group"
                     [class.border-slate-100]="check.status === 'pending'"
                     [class.border-emerald-500/30]="check.status === 'ok'"
                     [class.border-rose-500/30]="check.status === 'issue'"
                     [class.bg-emerald-50/30]="check.status === 'ok'"
                     [class.bg-rose-50/30]="check.status === 'issue'">
                    
                    <div class="flex flex-col gap-6">
                        <!-- Card Header -->
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <div class="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg border"
                                     [class.bg-emerald-500]="check.status === 'ok'"
                                     [class.text-white]="check.status === 'ok'"
                                     [class.border-emerald-400]="check.status === 'ok'"
                                     [class.bg-rose-500]="check.status === 'issue'"
                                     [class.text-white]="check.status === 'issue'"
                                     [class.border-rose-400]="check.status === 'issue'"
                                     [class.bg-slate-50]="check.status === 'pending'"
                                     [class.text-slate-400]="check.status === 'pending'"
                                     [class.border-slate-200]="check.status === 'pending'">
                                    <i [class]="'fa-solid text-2xl ' + check.icon"></i>
                                </div>
                                <div>
                                    <h3 class="font-black text-slate-800 text-lg uppercase tracking-tight">{{ check.label }}</h3>
                                    <span class="text-[10px] font-black uppercase tracking-widest"
                                          [class.text-emerald-600]="check.status === 'ok'"
                                          [class.text-rose-600]="check.status === 'issue'"
                                          [class.text-slate-400]="check.status === 'pending'">
                                        {{ check.status === 'ok' ? 'Conforme' : (check.status === 'issue' ? 'Non Conforme' : 'Da Verificare') }}
                                    </span>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <div class="flex items-center gap-2">
                                <button (click)="setStatus(check.id, 'ok')" 
                                        [disabled]="!canEdit()"
                                        class="w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2"
                                        [class]="check.status === 'ok' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white border-slate-100 text-slate-300 hover:border-emerald-500 hover:text-emerald-500'">
                                    <i class="fa-solid fa-check"></i>
                                </button>
                                <button (click)="setStatus(check.id, 'issue')" 
                                        [disabled]="!canEdit()"
                                        class="w-12 h-12 rounded-xl flex items-center justify-center transition-all border-2"
                                        [class]="check.status === 'issue' ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200' : 'bg-white border-slate-100 text-slate-300 hover:border-rose-500 hover:text-rose-500'">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Non-conformity Note -->
                        @if (check.status === 'issue') {
                            <div class="animate-slide-down">
                                <label class="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 block">Dettagli Non Conformità</label>
                                <div class="relative group/textarea">
                                    <textarea [(ngModel)]="check.note" 
                                              (ngModelChange)="onNoteUpdate()"
                                              [disabled]="!canEdit()"
                                              placeholder="Descrivi il malfunzionamento o il problema riscontrato..."
                                              class="w-full bg-white border-2 border-rose-100 rounded-2xl p-4 text-sm text-slate-700 focus:outline-none focus:border-rose-500 transition-all min-h-[100px] shadow-inner"></textarea>
                                    <div class="absolute bottom-4 right-4 text-rose-300 opacity-50">
                                        <i class="fa-solid fa-pen-nib"></i>
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            } @empty {
                <div class="lg:col-span-2 bg-slate-100 border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center">
                    <div class="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <i class="fa-solid fa-microchip text-4xl text-slate-300"></i>
                    </div>
                    <h3 class="text-xl font-black text-slate-400 uppercase tracking-tight">Nessuna attrezzatura censita</h3>
                    <p class="text-slate-400 text-sm mt-2">Aggiungi le attrezzature nel "Censimento Attrezzature" per visualizzarle qui.</p>
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
                                <p class="text-xs text-slate-700 leading-relaxed font-medium">
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

    onNoteUpdate() {
        this.save();
    }

    private save() {
        this.state.saveRecord(this.moduleId, this.checks());
    }
}

