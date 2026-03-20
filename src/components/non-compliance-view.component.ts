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

        <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div class="divide-y divide-slate-100">
                @for (check of checks(); track check.id) {
                    <div class="p-8 flex flex-col lg:flex-row items-center justify-between gap-6 hover:bg-slate-50 transition-colors group relative overflow-hidden">
                        <div class="flex items-center gap-6 w-full lg:w-auto">
                            <div class="w-16 h-16 rounded-2xl flex items-center justify-center transition-all border shadow-sm group-hover:scale-105"
                                 [class.bg-rose-500]="check.checked" [class.border-rose-400]="check.checked" [class.text-white]="check.checked"
                                 [class.bg-slate-50]="!check.checked" [class.border-slate-100]="!check.checked" [class.text-slate-300]="!check.checked">
                                <i class="fa-solid text-2xl" [class.fa-file-circle-check]="check.checked" [class.fa-file-circle-plus]="!check.checked"></i>
                            </div>
                            <div class="min-w-0">
                                <h4 class="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight">{{ check.label }}</h4>
                                <div class="flex items-center gap-2 mt-1">
                                   <span class="text-[10px] font-black text-rose-500 uppercase tracking-widest">Procedura Operativa Standard</span>
                                   @if (check.checked) {
                                      <span class="h-1.5 w-1.5 rounded-full bg-rose-300"></span>
                                      <span class="text-[10px] font-black text-emerald-500 uppercase tracking-widest">ARCHIVIATO</span>
                                   }
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex items-center gap-3 w-full lg:w-auto">
                            <button (click)="downloadModule()" 
                                    class="flex-1 lg:flex-none py-4 px-6 bg-white text-slate-600 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm group">
                                <i class="fa-solid fa-download text-sm group-hover:-translate-y-0.5 transition-transform"></i> SCARICA MODULO
                            </button>
                            
                            <button (click)="toggleCheck(check.id)" [disabled]="!canEdit()"
                                    class="flex-[2] lg:flex-none py-4 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-rose-200/50 group relative overflow-hidden flex items-center justify-center gap-2"
                                    [class.bg-slate-100]="check.checked" [class.text-slate-400]="check.checked" [class.border-slate-200]="check.checked" [class.shadow-none]="check.checked"
                                    [class.bg-rose-600]="!check.checked" [class.text-white]="!check.checked" [class.border-rose-500]="!check.checked" [class.hover:bg-rose-700]="!check.checked"
                                    [class.opacity-50]="!canEdit()" [class.cursor-not-allowed]="!canEdit()">
                                <i class="fa-solid text-sm" [class.fa-check-double]="check.checked" [class.fa-floppy-disk]="!check.checked"></i>
                                {{ check.checked ? 'Archiviato' : 'Salva Registro' }}
                            </button>
                        </div>
                    </div>
                }
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
