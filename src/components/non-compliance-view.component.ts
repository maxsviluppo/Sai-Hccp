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
    <div class="space-y-8 pb-10">
        <!-- Premium Header Banner -->
        <div class="bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 p-8 rounded-3xl shadow-xl border border-rose-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <i class="fa-solid fa-triangle-exclamation text-9xl text-white"></i>
            </div>
            
            <div class="relative z-10">
                <h2 class="text-3xl font-black text-white flex items-center tracking-tight">
                    <span class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mr-4 shadow-lg border border-white/30">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                    </span>
                    Non Conformità
                </h2>
                <div class="flex items-center gap-4 mt-2">
                    <p class="text-rose-100 text-sm font-medium ml-1">Gestione anomalie, richiami e azioni correttoive</p>
                    <button (click)="showStandardInfo.set(true)" 
                            class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white text-white hover:text-rose-700 transition-all text-[10px] font-black border border-white/30 shadow-md group">
                        <i class="fa-solid fa-circle-info text-sm group-hover:scale-110 transition-transform"></i>
                        <span>INFO PROTOCOLLO</span>
                    </button>
                </div>
            </div>
            
            <div class="relative z-10 flex flex-col gap-2">
                <div class="text-xs text-rose-100 font-medium flex items-center justify-end gap-2">
                    <i class="fa-regular fa-calendar"></i> {{ state.filterDate() | date:'dd/MM/yyyy' }}
                    @if (getDisplayName()) {
                        <span class="mx-1">•</span>
                        <i class="fa-regular fa-user"></i>
                        {{ getDisplayName() }}
                    }
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            @for (check of checks(); track check.id) {
                <div class="bg-white p-8 rounded-[32px] shadow-sm border-2 transition-all duration-300 group flex flex-col justify-between h-full"
                     [class.border-rose-100]="!check.checked" [class.border-rose-500]="check.checked"
                     [class.bg-rose-50/30]="check.checked" [class.shadow-xl]="check.checked" [class.shadow-rose-100]="check.checked">
                    
                    <div class="flex items-start gap-5 mb-8">
                        <div class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all border shadow-sm group-hover:scale-105 shrink-0"
                             [class.bg-rose-500]="check.checked" [class.border-rose-400]="check.checked" [class.text-white]="check.checked"
                             [class.bg-slate-50]="!check.checked" [class.border-slate-100]="!check.checked" [class.text-slate-300]="!check.checked">
                            <i class="fa-solid text-2xl" [class.fa-file-circle-check]="check.checked" [class.fa-file-circle-plus]="!check.checked"></i>
                        </div>
                        <div class="min-w-0">
                            <h4 class="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight mb-1">{{ check.label }}</h4>
                            <p class="text-[10px] font-black text-rose-500/60 uppercase tracking-widest">Procedura Operativa Standard</p>
                        </div>
                    </div>

                    <div class="flex flex-col gap-3">
                        <button (click)="downloadModule()" 
                                class="w-full py-4 px-6 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white hover:border-rose-200 transition-all flex items-center justify-center gap-2 group">
                            <i class="fa-solid fa-download text-sm group-hover:-translate-y-0.5 transition-transform"></i> SCARICA MODULO PDF
                        </button>
                        
                        <button (click)="toggleCheck(check.id)" [disabled]="!canEdit()"
                                class="w-full py-5 px-8 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95"
                                [class.bg-white]="check.checked" [class.text-rose-600]="check.checked" [class.border-2]="check.checked" [class.border-rose-500]="check.checked"
                                [class.bg-rose-600]="!check.checked" [class.text-white]="!check.checked" [class.hover:bg-rose-700]="!check.checked" [class.shadow-rose-200]="!check.checked"
                                [class.opacity-50]="!canEdit()" [class.cursor-not-allowed]="!canEdit()">
                            @if (check.checked) {
                                <i class="fa-solid fa-check-double text-base"></i>
                                <span>ARCHIVIATO CON SUCCESSO</span>
                            } @else {
                                <i class="fa-solid fa-floppy-disk text-base"></i>
                                <span>SALVA REGISTRO ANOMALIA</span>
                            }
                        </button>
                    </div>
                </div>
            }

            <!-- Additional Help Card -->
            <div class="bg-slate-900 p-8 rounded-[32px] text-white flex flex-col justify-between border border-white/10 relative overflow-hidden group">
                <div class="absolute top-0 right-0 p-8 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                    <i class="fa-solid fa-file-invoice text-7xl"></i>
                </div>
                <div class="relative z-10">
                    <h4 class="text-xl font-black mb-2 italic">Supporto Qualità</h4>
                    <p class="text-slate-400 text-xs font-medium leading-relaxed">
                        Per anomalie non previste dai modelli standard, contattare il Responsabile Qualità per l'apertura di un fascicolo dedicato.
                    </p>
                </div>
                <div class="pt-8 relative z-10">
                    <div class="flex items-center gap-4 py-3 px-5 bg-white/5 rounded-2xl border border-white/10">
                        <i class="fa-solid fa-phone-volume text-rose-500"></i>
                        <span class="text-xs font-bold font-mono tracking-widest">HELP-LINE: 800 123 456</span>
                    </div>
                </div>
            </div>
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
                    <div class="p-8 bg-gradient-to-br from-rose-700 to-pink-900 text-white relative flex-shrink-0">
                        <div class="absolute top-0 right-0 p-6 opacity-10 pointer-events-none -rotate-12 translate-x-2">
                            <i class="fa-solid fa-triangle-exclamation text-8xl"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-2xl font-black mb-1">Non Conformità</h3>
                            <p class="text-rose-200 text-[10px] font-black uppercase tracking-[0.2em]">Protocollo Sicurezza</p>
                        </div>
                    </div>
                    
                    <div class="p-8 pt-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-search text-xs"></i> 01. Identificazione
                            </h4>
                            <div class="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 text-xs text-slate-700 font-medium leading-relaxed">
                                Qualsiasi deviazione dai parametri critici o dai limiti di legge deve essere formalizzata.
                            </div>
                        </div>
                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-bolt text-xs"></i> 02. Azione Immediata
                            </h4>
                            <div class="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 text-xs text-slate-700 font-medium leading-relaxed">
                                In caso di pericolo imminente, isolare il lotto interessato e bloccare la vendita/produzione.
                            </div>
                        </div>

                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-pen-nib text-xs"></i> 03. Tracciabilità
                            </h4>
                            <div class="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 text-[10px] font-bold text-slate-500 italic">
                                La registrazione cartacea (Stampa Modulo) deve essere sempre firmata e conservata nell'archivio fisico.
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

    downloadModule() {
        window.open('/mod_RICHIAMO.pdf', '_blank');
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
