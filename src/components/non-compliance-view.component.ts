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
        <div class="bg-indigo-50 border-2 border-indigo-200 rounded-[40px] p-8 mb-8 relative overflow-hidden group shadow-xl shadow-indigo-900/5">
            <div class="absolute top-0 right-0 p-8 opacity-5 pointer-events-none -rotate-12 translate-x-4">
                <i class="fa-solid fa-file-signature text-9xl text-indigo-900"></i>
            </div>
            
            <div class="relative z-10">
                <div class="flex items-center gap-4 mb-6">
                    <div class="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner border border-indigo-200/50">
                        <i class="fa-solid fa-clipboard-check text-2xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-black text-indigo-900 uppercase tracking-widest leading-none">Gestione Modelli</h3>
                        <p class="text-indigo-400 text-[10px] font-bold uppercase tracking-tighter mt-1 italic">Compilazione e archiviazione anomalie</p>
                    </div>
                </div>

                <div class="space-y-4">
                    @for (check of checks(); track check.id) {
                        <div class="bg-white p-6 rounded-3xl border-2 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                             [class.border-indigo-100]="!check.checked" [class.border-indigo-500]="check.checked"
                             [class.bg-indigo-50/30]="check.checked">
                            <div class="flex items-center gap-4">
                                <button (click)="toggleCheck(check.id)"
                                        class="w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
                                        [class.bg-indigo-600]="check.checked" [class.text-white]="check.checked"
                                        [class.bg-slate-100]="!check.checked" [class.text-slate-400]="!check.checked">
                                    <i class="fa-solid" [class.fa-check]="check.checked" [class.fa-circle]="!check.checked"></i>
                                </button>
                                <div>
                                    <h4 class="font-black text-slate-800 uppercase text-sm tracking-tight">{{ check.label }}</h4>
                                    <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Procedura di registrazione ufficiale</p>
                                </div>
                            </div>
                            
                            <div class="flex gap-2 w-full sm:w-auto">
                                <button (click)="printModel(check.label)" 
                                        class="flex-1 sm:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                                    <i class="fa-solid fa-print"></i> STAMPA MODULO
                                </button>
                                <button (click)="toggleCheck(check.id)" 
                                        class="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                                    <i class="fa-solid fa-floppy-disk"></i> {{ check.checked ? 'REGISTRATO' : 'REGISTRA' }}
                                </button>
                            </div>
                        </div>
                    }
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
                    <div class="p-8 bg-gradient-to-br from-amber-600 to-orange-900 text-white relative flex-shrink-0">
                        <div class="absolute top-0 right-0 p-6 opacity-10 pointer-events-none -rotate-12 translate-x-2">
                            <i class="fa-solid fa-triangle-exclamation text-8xl"></i>
                        </div>
                        <div class="relative z-10">
                            <h3 class="text-2xl font-black mb-1">Non Conformità</h3>
                            <p class="text-amber-200 text-[10px] font-black uppercase tracking-[0.2em]">Standard HACCP Pro</p>
                        </div>
                    </div>
                    
                    <div class="p-8 pt-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-file-circle-exclamation text-xs"></i> 01. Identificazione
                            </h4>
                            <div class="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                                <p class="text-xs text-slate-700 leading-relaxed font-medium">
                                    "Qualsiasi deviazione dai parametri critici o anomalia riscontrata deve essere formalizzata mediante l'apposito modello di Non Conformità."
                                </p>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-bolt text-xs"></i> 02. Azione Correttiva
                            </h4>
                            <div class="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                                <p class="text-[10px] text-slate-500 font-bold leading-relaxed italic">
                                    Definire la causa, isolare i prodotti o le aree coinvolte e implementare soluzioni immediate per il ripristino della conformità.
                                </p>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <h4 class="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-print text-xs"></i> 03. Registrazione
                            </h4>
                            <div class="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 text-[10px] font-bold text-slate-500 italic">
                                Il modello compilato deve essere stampato e conservato nell'archivio cartaceo, oltre alla registrazione digitale nel sistema.
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

