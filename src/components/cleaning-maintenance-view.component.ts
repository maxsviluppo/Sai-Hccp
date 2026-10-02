import { Component, inject, signal, effect, computed, OnInit } from '@angular/core';
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
    <div class="print:hidden pb-24 animate-fade-in relative px-2 max-md:px-3 space-y-4 max-md:space-y-5 clean-mobile">

        <div class="bg-white rounded-2xl max-md:rounded-xl p-6 max-md:p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-rose-50/80 to-transparent pointer-events-none"></div>

            <div class="flex items-center gap-5 relative z-10 w-full md:w-auto">
                <button type="button"
                        (click)="goQuickHome()"
                        class="md:hidden clean-touch h-14 w-14 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-md shrink-0 border-2 border-rose-700 active:scale-95"
                        aria-label="Torna al menu">
                    <i class="fa-solid fa-house-chimney text-2xl"></i>
                </button>
                <div class="hidden md:flex h-14 w-14 bg-rose-600 text-white rounded-xl items-center justify-center shadow-md border-2 border-rose-700">
                    <i class="fa-solid fa-broom text-2xl"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h2 class="text-2xl max-md:text-xl font-bold text-slate-800 tracking-tight">Sanificazione</h2>
                    <div class="flex items-center gap-3 mt-1 max-md:mt-0.5 flex-wrap">
                        <span class="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                            <i class="fa-solid fa-user-check text-[10px]"></i> {{ getDisplayName() || 'Operatore' }}
                        </span>
                        <span class="text-xs font-medium text-slate-400 max-md:hidden">|</span>
                        <span class="text-xs font-medium text-slate-500 max-md:hidden">{{ state.filterDate() | date:'dd/MM/yyyy' }}</span>
                    </div>
                </div>
            </div>

            <div class="w-full md:w-auto relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button type="button"
                        (click)="setAllOk()"
                        [disabled]="!canEdit()"
                        class="hidden md:flex px-5 py-3 rounded-xl bg-emerald-50 text-emerald-600 font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-100 transition-colors border border-emerald-100 items-center justify-center gap-2 disabled:opacity-30 shadow-sm active:scale-95 shrink-0"
                        title="Imposta tutto come Conforme">
                    <i class="fa-solid fa-check-double text-base"></i><span>IMPOSTA TUTTI OK</span>
                </button>

                <div class="bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 flex flex-col gap-2 min-w-[200px] flex-1 sm:flex-initial">
                    <div class="flex items-center justify-between mb-0.5">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Avanzamento</p>
                        <span class="text-sm font-black text-slate-700 leading-none">{{ completedCount() }}/{{ checks().length || 0 }}</span>
                    </div>
                    <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div class="h-full bg-rose-500 rounded-full transition-all duration-1000"
                             [style.width.%]="progressPercent()"></div>
                    </div>
                </div>
            </div>
        </div>

        <button type="button"
                (click)="showStandardInfo.set(true)"
                class="clean-touch w-full h-14 px-6 rounded-xl border-2 border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 shadow-sm flex flex-row items-center justify-center gap-3 active:scale-[0.98]">
            <i class="fa-solid fa-circle-info text-xl leading-none"></i>
            <span class="text-xs font-black uppercase tracking-wide">Info protocollo sanificazione</span>
            <i class="fa-solid fa-chevron-right text-sm opacity-60 ml-auto md:ml-2"></i>
        </button>

        <div class="md:hidden">
            <button type="button"
                    (click)="setAllOk()"
                    [disabled]="!canEdit()"
                    class="clean-touch w-full aspect-[2.2/1] max-h-[5.5rem] rounded-xl border-[3px] border-emerald-700 bg-emerald-600 text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-900/20 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none">
                <i class="fa-solid fa-check-double text-4xl leading-none"></i>
                <span class="text-lg font-black uppercase tracking-wide leading-tight">Tutti conformi</span>
            </button>
            <p class="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Un tocco · tutte le voci</p>
        </div>

        @if (checks().length > 0) {
            <div class="space-y-3">
                <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                    <i class="fa-solid fa-clipboard-check text-rose-500"></i> Piano sanificazione
                </h3>
                <div class="grid grid-cols-1 gap-3 max-md:gap-4">
                    @for (check of checks(); track check.id; let i = $index) {
                        <ng-container *ngTemplateOutlet="checkCard; context: { $implicit: check, index: i }"></ng-container>
                    }
                </div>
            </div>
        }

        @if (checks().length === 0) {
            <div class="bg-white rounded-xl border border-slate-200 p-12 text-center opacity-60">
                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
                    <i class="fa-solid fa-broom text-2xl text-slate-300"></i>
                </div>
                <p class="font-black uppercase tracking-[0.2em] text-[10px] md:text-xs">Nessun elemento da verificare</p>
            </div>
        }

        <ng-template #checkCard let-check let-index="index">
            <div class="bg-white rounded-xl max-md:rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden"
                 [class.border-emerald-200]="check.status === 'ok'"
                 [class.border-rose-200]="check.status === 'issue'">
                <div class="p-4 max-md:p-5 flex flex-col gap-4"
                     [class.bg-emerald-50/30]="check.status === 'ok'"
                     [class.bg-rose-50/30]="check.status === 'issue'">
                    <div class="flex items-start gap-3">
                        <span class="text-xs font-black text-white w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">{{ index + 1 }}</span>
                        <div class="h-11 w-11 rounded-xl shrink-0 flex items-center justify-center border-2 shadow-sm"
                             [class.bg-emerald-600]="check.status === 'ok'" [class.border-emerald-700]="check.status === 'ok'" [class.text-white]="check.status === 'ok'"
                             [class.bg-rose-600]="check.status === 'issue'" [class.border-rose-700]="check.status === 'issue'"
                             [class.bg-white]="check.status === 'pending'" [class.border-slate-200]="check.status === 'pending'" [class.text-slate-400]="check.status === 'pending'">
                            <i [class]="'fa-solid text-lg ' + (check.status === 'ok' ? 'fa-check' : (check.status === 'issue' ? 'fa-triangle-exclamation' : check.icon))"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-bold text-slate-800 text-base max-md:text-lg leading-snug">{{ check.label }}</h3>
                            <span class="inline-block mt-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                                  [class.bg-emerald-100]="check.status === 'ok'" [class.text-emerald-800]="check.status === 'ok'"
                                  [class.bg-red-100]="check.status === 'issue'" [class.text-red-800]="check.status === 'issue'"
                                  [class.bg-slate-100]="check.status === 'pending'" [class.text-slate-500]="check.status === 'pending'">
                                {{ check.status === 'ok' ? 'Conforme' : (check.status === 'issue' ? 'Non conforme' : 'In attesa') }}
                            </span>
                            @if (check.status === 'issue' && check.note) {
                                <p class="text-xs text-rose-700 mt-2 leading-snug font-medium border-l-2 border-rose-300 pl-2">{{ check.note }}</p>
                            }
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3 w-full max-md:gap-4">
                        <button type="button"
                                (click)="setStatus(check.id, 'ok')"
                                [disabled]="!canEdit()"
                                class="clean-touch clean-btn-ok aspect-square max-md:aspect-square md:aspect-auto md:h-16 rounded-xl md:rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 md:flex-row md:gap-3 shadow-sm active:scale-95 disabled:opacity-30 text-emerald-900"
                                [class.clean-btn-ok-active]="check.status === 'ok'">
                            <i class="fa-solid fa-check text-3xl md:text-2xl leading-none text-emerald-600/90"></i>
                            <span class="text-sm max-md:text-base font-black uppercase tracking-wide md:text-xs md:tracking-widest">OK</span>
                        </button>
                        <button type="button"
                                (click)="setStatus(check.id, 'issue')"
                                [disabled]="!canEdit()"
                                class="clean-touch clean-btn-no aspect-square max-md:aspect-square md:aspect-auto md:h-16 rounded-xl md:rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1 md:flex-row md:gap-3 shadow-sm active:scale-95 disabled:opacity-30 text-rose-900"
                                [class.clean-btn-no-active]="check.status === 'issue'">
                            <i class="fa-solid fa-xmark text-3xl md:text-2xl leading-none text-rose-600/90"></i>
                            <span class="text-sm max-md:text-base font-black uppercase tracking-wide md:text-xs md:tracking-widest">No</span>
                        </button>
                    </div>
                </div>
            </div>
        </ng-template>

        @if (completedCount() === checks().length && checks().length > 0 && canEdit()) {
            <button type="button" (click)="onFinalSubmit()"
                    class="clean-touch w-full h-14 rounded-xl border-2 border-emerald-700 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex flex-row items-center justify-center gap-3 active:scale-[0.98]">
                <i class="fa-solid fa-cloud-arrow-up text-xl"></i>
                <span class="text-xs font-black uppercase tracking-wide">Registra sanificazione</span>
            </button>
        }

        @if (!canEdit()) {
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 md:p-4 flex items-start gap-3 shadow-sm">
                <i class="fa-solid fa-lock text-amber-500 mt-0.5 text-sm"></i>
                <div class="flex-1">
                    <p class="text-[10px] md:text-xs text-amber-700 font-black uppercase tracking-widest mb-0.5">Visore in Sola Lettura</p>
                    <p class="text-xs md:text-sm text-amber-800/80 font-medium leading-tight">Seleziona un&#39;unità operativa dal menu superiore per poter interagire, oppure sei posizionato su una data passata.</p>
                </div>
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
                                <i class="fa-solid fa-broom text-lg text-rose-100"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold">Sanificazione</h3>
                                <p class="text-[10px] md:text-xs text-rose-200 uppercase tracking-widest">Protocollo Standard</p>
                            </div>
                        </div>
                        <button (click)="showStandardInfo.set(false)" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors relative z-10 text-white">
                            <i class="fa-solid fa-xmark text-sm"></i>
                        </button>
                    </div>
                    
                    <div class="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
                        <!-- Sezione Integrità -->
                        <div class="space-y-2">
                            <h4 class="text-[10px] md:text-xs font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-gears text-[10px]"></i> 01. Integrità
                            </h4>
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p class="text-[11px] md:text-sm text-slate-600 leading-relaxed font-medium">
                                    Verificare lo stato di usura delle attrezzature, la tenuta delle guarnizioni e il corretto funzionamento dei motori. Segnalare anomalie strutturali come mattonelle o pavimenti danneggiati.
                                </p>
                            </div>
                        </div>

                        <!-- Sezione Detergenti/Lavaggio -->
                        <div class="space-y-2">
                            <h4 class="text-[10px] md:text-xs font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-soap text-[10px]"></i> 02. Azione Detergenti
                            </h4>
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p class="text-[11px] md:text-sm text-slate-600 leading-relaxed italic">
                                    Utilizzare prodotti anionici per rimuovere lo sporco grasso e prodotti cationici per un effetto disinfettante. Non mescolare prodotti diversi e rispettare i tempi di contatto previsti.
                                </p>
                            </div>
                        </div>

                        <!-- Sezione Sicurezza -->
                        <div class="space-y-2">
                            <h4 class="text-[10px] md:text-xs font-black text-violet-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-triangle-exclamation text-[10px]"></i> 03. Segnalazione
                            </h4>
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p class="text-[11px] md:text-sm text-slate-600 font-medium italic">
                                    In caso di malfunzionamento grave, apporre cartello "FUORI SERVIZIO" e isolare l'area. Registrare ogni anomalia nel box note per l'intervento tecnico.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        }

        <!-- ANOMALY REPORTING MODAL -->
        @if (isAnomalyModalOpen()) {
            <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in" (click)="closeAnomalyModal()"></div>
                <div class="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up border border-slate-200">
                    
                    <!-- Header -->
                    <div class="px-6 py-5 bg-gradient-to-r from-red-600 to-rose-600 text-white flex items-center justify-between">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-white/20 border border-white/20 flex items-center justify-center">
                                <i class="fa-solid fa-triangle-exclamation text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-black uppercase tracking-tight leading-none mb-1">Segnalazione Anomalia</h3>
                                <p class="text-rose-100 text-[10px] font-bold uppercase tracking-widest opacity-80">Piano Sanificazione</p>
                            </div>
                        </div>
                        <button (click)="closeAnomalyModal()" class="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div class="p-8 space-y-6 bg-slate-50/50">
                        <div class="p-4 bg-white rounded-2xl border border-red-100 shadow-sm">
                            <h4 class="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                <i class="fa-solid fa-circle-info"></i> Controllo Selezionato
                            </h4>
                            <p class="text-lg font-bold text-slate-700 leading-tight">
                                {{ currentAnomalyStep()?.label }}
                            </p>
                        </div>

                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Dettaglio Anomalia / Azione Correttiva</label>
                            <textarea #anomalyText
                                      placeholder="Descrivi l'anomalia riscontrata e l'eventuale azione correttiva immediata intrapresa..."
                                      class="w-full h-32 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none text-base font-medium text-slate-700 transition-all shadow-sm bg-white resize-none"></textarea>
                        </div>

                        <div class="flex gap-4 pt-2">
                            <button (click)="closeAnomalyModal()"
                                    class="flex-1 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                                ANNULLA
                            </button>
                            <button (click)="confirmAnomaly(anomalyText.value)"
                                    class="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95">
                                REGISTRA NON CONFORMITÀ
                            </button>
                        </div>
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
    @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-slide-down { animation: slideDown 0.3s ease-out; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); opacity: 1; max-height: 1000px; } }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    .clean-btn-ok {
      border-color: rgb(167 243 208 / 0.55);
      background-color: rgb(236 253 245 / 0.45);
    }
    .clean-btn-ok-active {
      border-color: rgb(110 231 183 / 0.75);
      background-color: rgb(209 250 229 / 0.65);
    }
    .clean-btn-no {
      border-color: rgb(254 202 202 / 0.55);
      background-color: rgb(255 241 242 / 0.4);
    }
    .clean-btn-no-active {
      border-color: rgb(252 165 165 / 0.75);
      background-color: rgb(254 226 226 / 0.6);
    }
    @media (max-width: 767px) {
      .clean-mobile .clean-touch {
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }
    }
  `]
})
export class CleaningMaintenanceViewComponent implements OnInit {
    state = inject(AppStateService);
    toast = inject(ToastService);
    showStandardInfo = signal(false);
    moduleId = 'cleaning-maintenance';
    checks = signal<CheckItem[]>([]);

    // Anomaly Modal State
    isAnomalyModalOpen = signal(false);
    currentAnomalyStep = signal<{id: string, label: string} | null>(null);

    completedCount = computed<number>(() => {
        return this.checks().filter((c: CheckItem) => c.status !== 'pending').length;
    });

    progressPercent = computed(() => {
        const total = this.checks().length;
        if (!total) return 0;
        return (this.completedCount() / total) * 100;
    });

    ngOnInit() {
        this.state.scrollMainContentToTop();
    }

    goQuickHome() {
        this.state.setModule(this.state.isAdmin() ? 'dashboard' : 'operator-dashboard');
    }

    setAllOk() {
        if (!this.canEdit()) return;
        this.checks.update(items =>
            items.map(item => ({ ...item, status: 'ok' as const, note: undefined }))
        );
        this.save();
        this.toast.success('Conforme', 'Tutte le voci impostate come OK.');
    }

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
            { id: 'env-pavimenti', label: 'Pavimenti', icon: 'fa-border-all', status: 'pending', note: '' },
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

        if (status === 'issue') {
            const check = this.checks().find(c => c.id === id);
            if (check) {
                this.currentAnomalyStep.set({ id, label: check.label });
                this.isAnomalyModalOpen.set(true);
            }
            return;
        }

        this.checks.update(items => items.map(item => {
            if (item.id === id) {
                const newStatus = item.status === status ? 'pending' : status;
                return { ...item, status: newStatus, note: undefined };
            }
            return item;
        }));

        this.save();
    }

    closeAnomalyModal() {
        this.isAnomalyModalOpen.set(false);
        this.currentAnomalyStep.set(null);
    }

    confirmAnomaly(note: string) {
        const anomaly = this.currentAnomalyStep();
        if (!anomaly) return;

        this.checks.update(items => items.map(item => {
            if (item.id === anomaly.id) {
                return { ...item, status: 'issue', note };
            }
            return item;
        }));

        this.save();
        this.state.saveNonConformity({
            id: Math.random().toString(36).substring(2, 9),
            moduleId: this.moduleId,
            date: this.state.filterDate(),
            description: note || 'Anomalia rilevata durante il controllo sanificazione',
            itemName: anomaly.label
        });

        this.closeAnomalyModal();
    }

    onFinalSubmit() {
        if (!this.canEdit()) return;
        this.save();
        this.toast.success('Registrato', 'Sanificazione archiviata con successo.');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    private save() {
        this.state.saveRecord(this.moduleId, this.checks());
    }
}

