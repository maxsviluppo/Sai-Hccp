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
    <div class="space-y-6 animate-fade-in p-4 pb-12 max-w-7xl mx-auto">
        
        <!-- App-style Header -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div class="flex items-center gap-4">
                <div class="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shadow-sm border border-amber-100/50">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold text-slate-800 tracking-tight">Non Conformità</h2>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestione Anomalie & Richiami</p>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                <a href="/mod_RICHIAMO.pdf" 
                   download="mod_RICHIAMO.pdf"
                   class="w-full sm:w-auto h-10 px-4 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap group">
                    <i class="fa-solid fa-file-pdf text-rose-500 group-hover:scale-110 transition-transform"></i> 
                    Modello PDF
                </a>
                
                <div class="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 shrink-0 shadow-inner">
                    <div class="text-right">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Archiviate</p>
                        <p class="text-xs font-bold text-slate-700 leading-none">{{ checkedCount() }} / {{ checks().length }}</p>
                    </div>
                    <div class="h-8 w-8 flex items-center justify-center bg-white rounded-lg border border-slate-200 text-amber-500 shadow-sm">
                        <i class="fa-solid fa-folder-tree text-sm"></i>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modern App List -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="p-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <h3 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocolli Disponibili</h3>
                <button (click)="showStandardInfo.set(true)" class="text-[10px] font-bold text-amber-600 hover:text-amber-700 transition-colors flex items-center gap-1.5">
                   <i class="fa-solid fa-circle-info"></i> INFO PROTOCOLLO
                </button>
            </div>
            
            <div class="divide-y divide-slate-100">
                @for (check of checks(); track check.id) {
                    <div class="p-6 flex flex-col sm:flex-row items-center justify-between gap-6 hover:bg-slate-50 transition-colors group relative overflow-hidden">
                        <!-- Left side -->
                        <div class="flex items-center gap-5 w-full sm:w-auto">
                            <div class="w-12 h-12 rounded-2xl flex items-center justify-center transition-all border shadow-sm group-hover:scale-105"
                                    [class.bg-amber-50]="check.checked" [class.border-amber-100]="check.checked" [class.text-amber-600]="check.checked"
                                    [class.bg-slate-50]="!check.checked" [class.border-slate-100]="!check.checked" [class.text-slate-300]="!check.checked">
                                <i class="fa-solid" [class.fa-file-circle-check]="check.checked" [class.fa-file-circle-plus]="!check.checked"></i>
                            </div>
                            <div class="min-w-0">
                                <h4 class="font-bold text-slate-800 text-sm md:text-base leading-tight uppercase tracking-tight">{{ check.label }}</h4>
                                <div class="flex items-center gap-2 mt-1">
                                   <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">HACCP Standard 2024</span>
                                   @if (check.checked) {
                                      <span class="h-1 w-1 rounded-full bg-slate-300"></span>
                                      <span class="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">ARCHIVIATO</span>
                                   }
                                </div>
                            </div>
                        </div>
                        
                        <!-- Right side (Actions) -->
                        <div class="flex items-center gap-3 w-full sm:w-auto">
                            <button (click)="printModel(check.label)" 
                                    class="flex-1 sm:flex-none h-10 px-6 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm">
                                <i class="fa-solid fa-print"></i> Stampa
                            </button>
                            
                            <button (click)="toggleCheck(check.id)" [disabled]="!canEdit()"
                                    class="flex-[2] sm:flex-none h-10 px-8 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-md group relative overflow-hidden flex items-center justify-center gap-2"
                                    [class.bg-slate-100]="check.checked" [class.text-slate-400]="check.checked" [class.border-slate-200]="check.checked"
                                    [class.bg-amber-600]="!check.checked" [class.text-white]="!check.checked" [class.border-amber-500]="!check.checked" [class.hover:bg-amber-700]="!check.checked" [class.shadow-amber-100]="!check.checked"
                                    [class.opacity-50]="!canEdit()" [class.cursor-not-allowed]="!canEdit()">
                                <i class="fa-solid" [class.fa-check-double]="check.checked" [class.fa-floppy-disk]="!check.checked"></i>
                                {{ check.checked ? 'Reg. Salvata' : 'Salva Reg.' }}
                            </button>
                        </div>
                    </div>
                }
            </div>
        </div>

        @if (!canEdit()) {
            <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center gap-3">
                <i class="fa-solid fa-lock text-slate-400 text-xs"></i>
                <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Modalità sola lettura attiva</p>
            </div>
        }

        <!-- Informational Modal (Dashboard Style) -->
        @if (showStandardInfo()) {
            <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" (click)="showStandardInfo.set(false)"></div>
                <div class="relative bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-slide-up border border-slate-200">
                    <div class="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h3 class="font-bold text-slate-800 tracking-tight">Protocollo Non Conformità</h3>
                        <button (click)="showStandardInfo.set(false)" class="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    
                    <div class="p-6 space-y-6">
                        <div class="flex gap-4">
                            <div class="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold border border-amber-100">1</div>
                            <div>
                                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Identificazione</h4>
                                <p class="text-sm text-slate-600 leading-relaxed">Qualsiasi deviazione dai parametri critici deve essere formalizzata mediante l'apposito modello.</p>
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <div class="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold border border-amber-100">2</div>
                            <div>
                                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Azione Correttiva</h4>
                                <p class="text-sm text-slate-600 leading-relaxed italic">Definire la causa, isolare i prodotti e implementare soluzioni immediate.</p>
                            </div>
                        </div>
                        <div class="flex gap-4">
                            <div class="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-bold border border-amber-100">3</div>
                            <div>
                                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Registrazione</h4>
                                <p class="text-sm text-slate-600 leading-relaxed">Il modello deve essere stampato e conservato nell'archivio cartaceo aziendale.</p>
                            </div>
                        </div>
                    </div>

                    <div class="p-6 bg-slate-50 border-t border-slate-100">
                        <button (click)="showStandardInfo.set(false)" class="w-full py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all">HO COMPRESO</button>
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
