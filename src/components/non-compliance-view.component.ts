import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';

interface CheckItem {
    id: string;
    label: string;
    checked: boolean;
}

@Component({
    selector: 'app-non-compliance-view',
    standalone: true,
    imports: [CommonModule],
    template: `
    <!-- UI CONTENT (Hidden on print) -->
    <div class="print:hidden pb-20 animate-fade-in relative px-2 space-y-8">
        
        <!-- Minimal Hero Header -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 lg:p-8 flex flex-col md:flex-row justify-between md:items-center gap-6 relative overflow-hidden">
            <!-- Subtle accent -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div class="relative z-10 flex items-center gap-3 md:gap-4">
                <div class="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-sm shrink-0">
                    <i class="fa-solid fa-triangle-exclamation text-lg md:text-xl"></i>
                </div>
                <div>
                    <h2 class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Non Conformità</h2>
                    <div class="flex flex-wrap items-center gap-2 mt-1">
                        <span class="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-200 text-[10px] md:text-xs font-black uppercase tracking-widest leading-none">
                            <i class="fa-solid fa-circle text-[8px] animate-pulse text-amber-500"></i>
                            Gestione Anomalie
                        </span>
                        <button (click)="showStandardInfo.set(true)" 
                                class="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded border border-amber-100 text-[10px] md:text-xs font-black uppercase tracking-widest leading-none transition-colors">
                            <i class="fa-solid fa-circle-info"></i> Info Protocollo
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <div class="w-full md:w-auto relative z-10 flex gap-4 pr-1">
                <div class="flex items-center gap-4 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 w-full justify-between">
                    <div class="min-w-[120px]">
                        <p class="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Registrazioni</p>
                        <div class="flex items-center gap-3">
                            <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden flex-1">
                                <div class="h-full bg-amber-500 rounded-full transition-all duration-1000" [style.width.%]="(checkedCount() / checks().length) * 100"></div>
                            </div>
                            <span class="text-sm md:text-base font-bold text-slate-700 leading-none whitespace-nowrap">{{ checkedCount() }}/{{ (checks().length || 1) }}</span>
                        </div>
                    </div>
                    <i class="fa-solid fa-clipboard-check text-slate-300 text-lg md:text-xl ml-2"></i>
                </div>
            </div>
        </div>

                <div class="space-y-4">
                    @for (check of checks(); track check.id) {
                        <div class="bg-white p-4 md:p-6 rounded-2xl border shadow-sm transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative overflow-hidden group"
                             [class.border-slate-200]="!check.checked" [class.border-amber-200]="check.checked"
                             [class.bg-slate-50/50]="!check.checked" [class.bg-amber-50/40]="check.checked">
                             
                            <!-- Status side border indicator -->
                            <div class="absolute left-0 top-0 bottom-0 w-1 transition-colors"
                                 [class.bg-transparent]="!check.checked" [class.bg-amber-400]="check.checked"></div>
                                 
                            <div class="flex items-center gap-3 md:gap-4 pl-2">
                                <button (click)="toggleCheck(check.id)" [disabled]="!canEdit()"
                                        class="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all shadow-sm border focus:outline-none"
                                        [class.bg-amber-100]="check.checked" [class.border-amber-200]="check.checked" [class.text-amber-600]="check.checked"
                                        [class.bg-white]="!check.checked" [class.border-slate-200]="!check.checked" [class.text-slate-300]="!check.checked"
                                        [class.hover:bg-amber-200]="check.checked && canEdit()" [class.hover:bg-slate-50]="!check.checked && canEdit()"
                                        [class.cursor-not-allowed]="!canEdit()" [class.opacity-50]="!canEdit()">
                                    <i class="fa-solid" [class.fa-check]="check.checked" [class.fa-circle]="!check.checked"></i>
                                </button>
                                <div class="cursor-pointer" (click)="toggleCheck(check.id)">
                                    <h4 class="font-bold text-slate-800 text-sm md:text-base leading-tight tracking-tight">{{ check.label }}</h4>
                                    <p class="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest mt-0.5 md:mt-1 group-hover:text-amber-600 transition-colors">Procedura di registrazione ufficiale</p>
                                </div>
                            </div>
                            
                            <div class="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                <button (click)="printModel(check.label)" 
                                        class="flex-1 sm:flex-none px-4 md:px-5 py-2.5 md:py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-slate-50 hover:text-amber-600 transition-all flex items-center justify-center gap-2 shadow-sm focus:outline-none">
                                    <i class="fa-solid fa-print"></i> Stampa
                                </button>
                                <button (click)="toggleCheck(check.id)" [disabled]="!canEdit()"
                                        class="flex-[2] sm:flex-none px-4 md:px-5 py-2.5 md:py-3 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm border focus:outline-none"
                                        [class.bg-slate-100]="check.checked" [class.text-slate-500]="check.checked" [class.border-slate-200]="check.checked" [class.hover:bg-slate-200]="check.checked && canEdit()"
                                        [class.bg-emerald-600]="!check.checked" [class.text-white]="!check.checked" [class.border-emerald-500]="!check.checked" [class.hover:bg-emerald-700]="!check.checked && canEdit()"
                                        [class.opacity-60]="!canEdit()" [class.cursor-not-allowed]="!canEdit()">
                                    <i class="fa-solid fa-floppy-disk"></i> {{ check.checked ? 'Registrato' : 'Registra' }}
                                </button>
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
                    <div class="bg-amber-600 px-6 py-5 text-white flex justify-between items-center relative overflow-hidden flex-shrink-0">
                        <div class="absolute inset-0 bg-gradient-to-r from-amber-700/50 to-transparent pointer-events-none"></div>
                        <div class="flex items-center gap-4 relative z-10">
                            <div class="w-10 h-10 rounded-lg bg-amber-500/30 flex items-center justify-center border border-amber-400/30">
                                <i class="fa-solid fa-triangle-exclamation text-lg text-amber-100"></i>
                            </div>
                            <div>
                                <h3 class="text-lg font-bold">Non Conformità</h3>
                                <p class="text-[10px] md:text-xs text-amber-200 uppercase tracking-widest">Protocollo HACCP</p>
                            </div>
                        </div>
                        <button (click)="showStandardInfo.set(false)" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors relative z-10 text-white">
                            <i class="fa-solid fa-xmark text-sm"></i>
                        </button>
                    </div>
                    
                    <div class="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-50">
                        <div class="space-y-2">
                            <h4 class="text-[10px] md:text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-file-circle-exclamation text-[10px]"></i> 01. Identificazione
                            </h4>
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p class="text-[11px] md:text-sm text-slate-600 leading-relaxed font-medium">
                                    Qualsiasi deviazione dai parametri critici o anomalia riscontrata deve essere formalizzata mediante l'apposito modello di Non Conformità.
                                </p>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <h4 class="text-[10px] md:text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-bolt text-[10px]"></i> 02. Azione Correttiva
                            </h4>
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm border-l-4 border-l-amber-400">
                                <p class="text-[11px] md:text-sm text-slate-700 leading-relaxed italic">
                                    Definire la causa, isolare i prodotti o le aree coinvolte e implementare soluzioni immediate per il ripristino della conformità.
                                </p>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <h4 class="text-[10px] md:text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-print text-[10px]"></i> 03. Registrazione
                            </h4>
                            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                <p class="text-[11px] md:text-sm font-medium text-slate-600">
                                    Il modello compilato deve essere <strong class="text-slate-800">stampato e conservato</strong> nell'archivio cartaceo, oltre alla registrazione digitale nel sistema.
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
export class NonComplianceViewComponent {
    state = inject(AppStateService);
    moduleId = 'non-compliance';
    showStandardInfo = signal(false);

    checks = signal<CheckItem[]>([
        { id: 'nc_model', label: 'COMPILAZIONE MODELLO NON CONFORMITÀ / RICHIAMO', checked: false }
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

    printModel(label: string) {
        const client = this.state.clients().find(c => c.id === this.state.currentUser()?.clientId) || { name: 'Azienda' };
        const date = new Date(this.state.filterDate()).toLocaleDateString('it-IT');

        const printContent = `
            <html>
                <head>
                    <title>Stampa Modulo - ${label}</title>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        .header { border-bottom: 2px solid #333; margin-bottom: 30px; text-align: center; }
                        .content { border: 1px solid #ccc; padding: 20px; min-height: 500px; }
                        .footer { margin-top: 50px; display: flex; justify-content: space-between; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>${client.name}</h1>
                        <h2>${label}</h2>
                        <p>Data: ${date}</p>
                    </div>
                    <div class="content">
                        <p><strong>Descrizione della Non Conformità:</strong></p>
                        <div style="border-bottom: 1px dotted #000; height: 100px;"></div>
                        <p><strong>Azione Correttiva Intrappresa:</strong></p>
                        <div style="border-bottom: 1px dotted #000; height: 100px;"></div>
                        <p><strong>Esito della Verifica:</strong></p>
                        <div style="border-bottom: 1px dotted #000; height: 50px;"></div>
                    </div>
                    <div class="footer">
                        <p>Firma Operatore: _________________________</p>
                        <p>Firma Responsabile: _________________________</p>
                    </div>
                    <script>window.print();</script>
                </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
        }
    }
}

