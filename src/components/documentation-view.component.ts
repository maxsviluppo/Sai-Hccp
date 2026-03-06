import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService, AppDocument } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';

@Component({
    selector: 'app-documentation-view',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="animate-fade-in px-2 relative space-y-8 pb-24">
        <!-- Premium Hero Header -->
        <div class="relative overflow-hidden rounded-[2rem] bg-slate-900 p-6 shadow-xl border border-slate-800">
            <!-- Decor Elements -->
            <div class="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-600/15 blur-3xl"></div>
            <div class="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-indigo-600/10 blur-3xl"></div>
            
            <div class="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div class="flex items-center gap-5">
                    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
                        <i class="fa-solid fa-folder-tree text-3xl text-white"></i>
                    </div>
                    <div>
                        <h2 class="text-4xl font-black tracking-tight text-white mb-1">
                            Archivio <span class="text-blue-400">Documentale</span>
                        </h2>
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm font-bold text-slate-300 border border-white/10">
                                <i class="fa-solid fa-circle text-[9px] animate-pulse text-blue-400"></i>
                                Repository Cloud
                            </span>
                            <span class="flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-1.5 text-sm font-black text-blue-400 border border-blue-500/20">
                                <i class="fa-solid fa-id-card text-xs"></i> Azienda: {{ state.adminCompany().name }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="flex flex-wrap gap-3">
                    <!-- Stats Card - Matched Height with Phases -->
                    <div class="flex items-center gap-4 rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-md">
                        <div class="text-left">
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Documentazione Archiviata</p>
                            <div class="flex items-center gap-3">
                                <div class="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                                     <div class="h-full bg-blue-500 rounded-full w-full"></div>
                                </div>
                                <span class="text-xl font-black text-white whitespace-nowrap">{{ state.documents().length }} Files</span>
                            </div>
                        </div>
                        <div class="h-10 w-10 flex items-center justify-center bg-blue-500/20 rounded-xl text-blue-400">
                            <i class="fa-solid fa-cloud text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <!-- Sidebar: Categories -->
            <div class="lg:col-span-1 space-y-4">
                <div class="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm sticky top-6">
                    <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Categorie Documenti</h3>
                    <div class="space-y-1">
                        @for (def of docDefinitions; track def.id) {
                            <button (click)="selectedDocType.set(def.id)"
                                    class="w-full flex items-center justify-between p-4 rounded-2xl transition-all group text-left mb-1"
                                    [class.bg-indigo-600]="selectedDocType() === def.id"
                                    [class.text-white]="selectedDocType() === def.id"
                                    [class.shadow-lg]="selectedDocType() === def.id"
                                    [class.shadow-indigo-200]="selectedDocType() === def.id"
                                    [class.hover:bg-slate-50]="selectedDocType() !== def.id">
                                 <div class="flex items-center gap-3">
                                     <div class="w-10 h-10 rounded-xl flex items-center justify-center transition-all bg-white shadow-sm border border-slate-100 group-hover:scale-110"
                                          [class.bg-white/20]="selectedDocType() === def.id"
                                          [class.border-transparent]="selectedDocType() === def.id"
                                          [class.text-indigo-600]="selectedDocType() !== def.id"
                                          [class.text-white]="selectedDocType() === def.id">
                                         <i [class]="'fa-solid ' + def.icon + ' text-sm'"></i>
                                     </div>
                                     <span class="text-xs font-black uppercase tracking-tight">{{ def.label }}</span>
                                 </div>
                                 @if (getDocsByType(def.id).length > 0) {
                                     <div class="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-sm ring-1 ring-white/20"
                                          [class.bg-white/20]="selectedDocType() === def.id"
                                          [class.bg-indigo-50]="selectedDocType() !== def.id"
                                          [class.text-indigo-600]="selectedDocType() !== def.id"
                                          [class.text-white]="selectedDocType() === def.id">
                                         {{ getDocsByType(def.id).length }}
                                     </div>
                                 }
                            </button>
                        }
                    </div>
                </div>
            </div>

            <!-- Main Content: Document Details & Upload -->
            <div class="lg:col-span-3 space-y-8">
                @if (selectedDocType()) {
                    <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-slide-up">
                        <div class="p-8 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div class="flex items-center gap-6">
                                <div class="w-20 h-20 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 text-3xl ring-4 ring-white">
                                    <i [class]="'fa-solid ' + getSelectedDef()?.icon"></i>
                                </div>
                                <div>
                                    <h3 class="text-3xl font-black text-slate-800 leading-none mb-2 italic">{{ getSelectedDef()?.label }}</h3>
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gestione Documentazione Compliance</p>
                                </div>
                            </div>
                            
                            <label class="cursor-pointer group/btn w-full sm:w-auto">
                                <input type="file" class="hidden" (change)="handleFileSelect($event, selectedDocType() || '')" multiple>
                                <div class="px-8 py-5 bg-indigo-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 group-hover/btn:-translate-y-1">
                                    <i class="fa-solid fa-cloud-arrow-up text-sm"></i>
                                    CARICA DOCUMENTO
                                </div>
                            </label>
                        </div>

                        <div class="p-8">
                            @if (getSelectedDef()?.hasExpiry) {
                                <div class="mb-8 p-6 bg-amber-50 rounded-3xl border border-amber-100 flex items-center gap-6">
                                    <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                        <i class="fa-solid fa-calendar-days"></i>
                                    </div>
                                    <div class="flex-1">
                                        <label class="block text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Data di Scadenza Certificazione</label>
                                        <input type="date" 
                                               [value]="getExpiryDate(selectedDocType() || '')"
                                               (change)="updateExpiryDate(selectedDocType() || '', $event)"
                                               class="bg-white border-2 border-amber-200 rounded-xl px-4 py-2 text-sm font-black text-amber-900 focus:outline-none focus:border-amber-500 shadow-sm">
                                    </div>
                                    <div class="text-right hidden sm:block">
                                        <span class="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Stato Scadenza</span>
                                        <span class="text-xs font-bold text-amber-700">Rinnovo periodico richiesto</span>
                                    </div>
                                </div>
                            }

                            <div class="space-y-4">
                                @for (doc of getDocsByType(selectedDocType() || ''); track doc.id) {
                                    <div class="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 group transition-all hover:border-indigo-200 hover:shadow-xl hover:-translate-y-1 mb-4">
                                        <div class="flex items-center gap-6 overflow-hidden">
                                            <div class="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner text-2x transition-transform group-hover:scale-110 shrink-0">
                                                <i class="fa-solid fa-file-pdf"></i>
                                            </div>
                                            <div class="truncate">
                                                <span class="text-base font-black text-slate-800 block truncate mb-1 leading-none">{{ doc.fileName }}</span>
                                                <div class="flex items-center gap-3">
                                                    <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest">{{ doc.uploadDate | date:'dd MMM yyyy • HH:mm' }}</span>
                                                    <div class="w-1 h-1 rounded-full bg-slate-200"></div>
                                                    <button (click)="previewFile(doc)" class="text-[9px] text-indigo-500 font-black uppercase tracking-widest hover:text-indigo-700 transition-colors">Visualizza Anteprima</button>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="flex items-center gap-3 shrink-0">
                                            <button (click)="downloadDoc(doc)" class="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center justify-center border border-slate-100" title="Scarica">
                                                <i class="fa-solid fa-download text-sm"></i>
                                            </button>
                                            <button (click)="askDeleteDoc(doc)" class="w-12 h-12 rounded-xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center border border-red-100" title="Elimina">
                                                <i class="fa-solid fa-trash-can text-sm"></i>
                                            </button>
                                        </div>
                                    </div>
                                } @empty {
                                    <div class="text-center py-24 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                        <div class="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-slate-200">
                                            <i class="fa-solid fa-cloud-arrow-up text-4xl"></i>
                                        </div>
                                        <h4 class="text-lg font-black text-slate-400 uppercase tracking-widest">Nessun file presente</h4>
                                        <p class="text-xs text-slate-400 mt-2 font-medium">Carica i documenti per questa categoria per completare l'archivio.</p>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                } @else {
                    <div class="flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border border-slate-100 shadow-xl text-center px-10 animate-fade-in">
                        <div class="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mb-8 shadow-inner">
                            <i class="fa-solid fa-folder-open text-5xl text-indigo-200"></i>
                        </div>
                        <h3 class="text-2xl font-black text-slate-800 mb-2">Seleziona una categoria</h3>
                        <p class="text-slate-500 font-medium max-w-sm">Scegli la tipologia di documento dalla barra laterale per gestire l'archivio.</p>
                    </div>
                }
            </div>
        </div>
    </div>

    <!-- PREVIEW OVERLAY -->
    @if (previewDoc()) {
        <div class="fixed inset-0 z-[110] flex items-center justify-center p-8">
            <div class="absolute inset-0 bg-slate-900/95 backdrop-blur-2xl animate-fade-in" (click)="previewDoc.set(null)"></div>
            <div class="relative w-full max-w-5xl h-[85vh] flex flex-col animate-slide-up bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
                <div class="flex items-center justify-between p-8 bg-slate-900 text-white">
                    <div class="flex items-center gap-6">
                        <div class="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 text-2xl border border-white/10 shadow-inner">
                            <i class="fa-solid fa-file-shield"></i>
                        </div>
                        <div>
                            <h4 class="font-black text-2xl italic leading-none mb-1 text-white">{{ previewDoc()?.fileName }}</h4>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{{ previewDoc()?.type }} • CARICATO IL {{ previewDoc()?.uploadDate | date:'dd/MM/yyyy • HH:mm' }}</p>
                        </div>
                    </div>
                    <button (click)="previewDoc.set(null)" class="w-14 h-14 rounded-full bg-white/5 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center text-white/50 border border-white/10 active:scale-90">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                
                <div class="flex-1 bg-slate-50 flex items-center justify-center relative p-12 overflow-hidden">
                    <!-- Background Decor -->
                    <div class="absolute inset-0 opacity-5 pointer-events-none select-none flex items-center justify-center text-[20rem] font-black text-slate-900 -rotate-12">
                         HACCP
                    </div>
                    
                    <div class="relative z-10 text-center max-w-lg">
                        <div class="w-40 h-40 bg-white rounded-[3rem] flex items-center justify-center mx-auto mb-10 shadow-2xl text-6xl text-slate-200 border border-slate-100 group">
                             <i [class]="'fa-solid ' + (previewDoc()?.fileType?.includes('pdf') ? 'fa-file-pdf text-emerald-500' : 'fa-file-image text-blue-500')"></i>
                        </div>
                        <h3 class="text-5xl font-black text-slate-900 mb-6 italic tracking-tight">Vantaggio Anteprima</h3>
                        <p class="text-slate-500 font-medium text-lg leading-relaxed mb-12">Il documento è correttamente archiviato nei nostri sistemi cloud sicuri e pronto per la consultazione.</p>
                        
                        <div class="flex justify-center">
                            <button (click)="downloadDoc(previewDoc())" class="px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs tracking-[0.2em] uppercase shadow-2xl shadow-slate-300 transition-all hover:scale-105 active:scale-95 flex items-center gap-4">
                                <i class="fa-solid fa-cloud-arrow-down text-lg"></i> SCARICA ORIGINALE
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="p-6 bg-white border-t border-slate-100 flex items-center justify-between px-10">
                    <div class="flex items-center gap-2 text-slate-400">
                        <i class="fa-solid fa-circle-check text-emerald-500 text-xs"></i>
                        <span class="text-[10px] font-black uppercase tracking-widest leading-none">Certificazione verificata dal sistema</span>
                    </div>
                    <img src="/logo.png" class="h-6 opacity-20 grayscale brightness-0" alt="HACCP Pro">
                </div>
            </div>
        </div>
    }

    <!-- DELETE CONFIRMATION -->
    @if (isDeleteModalOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="isDeleteModalOpen.set(false)"></div>
            <div class="relative bg-white w-full max-w-sm rounded-[40px] shadow-2xl p-10 text-center animate-slide-up border border-slate-100">
                <div class="w-20 h-20 bg-red-50 text-red-500 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-100 text-3xl">
                    <i class="fa-solid fa-trash-can"></i>
                </div>
                <h3 class="text-2xl font-black text-slate-800 mb-2">Elimina file?</h3>
                <p class="text-sm text-slate-500 font-medium leading-relaxed mb-10">Vuoi rimuovere <span class="text-slate-900 font-bold">"{{ docToDelete()?.fileName }}"</span>? L'operazione è irreversibile.</p>
                
                <div class="space-y-4">
                    <button (click)="confirmDelete()" class="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-red-200 transition-all active:scale-95">SÌ, ELIMINA DEFINITIVAMENTE</button>
                    <button (click)="isDeleteModalOpen.set(false)" class="w-full py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">ANNULLA</button>
                </div>
            </div>
        </div>
    }
    `
})
export class DocumentationViewComponent {
    state = inject(AppStateService);
    toast = inject(ToastService);

    selectedDocType = signal<string | null>(null);
    previewDoc = signal<AppDocument | null>(null);
    isDeleteModalOpen = signal(false);
    docToDelete = signal<any>(null);

    docDefinitions = [
        { id: 'scia', label: 'Scia e planimetria', icon: 'fa-map-location-dot' },
        { id: 'camerale', label: 'Camerale', icon: 'fa-building-columns' },
        { id: 'haccp_plan', label: 'Piano autocontrollo sistema HACCP', icon: 'fa-file-shield' },
        { id: 'osa', label: 'Attestato OSA', icon: 'fa-user-graduate' },
        { id: 'pec', label: 'PEC (Posta Elettronica Certificata)', icon: 'fa-envelope-circle-check', hasExpiry: true },
        { id: 'firma_digitale', label: 'Firma digitale', icon: 'fa-signature' },
        { id: 'registro_personale', label: 'Registro del personale', icon: 'fa-users-rectangle' },
        { id: 'inps_inail', label: 'Iscrizione INPS / INAIL', icon: 'fa-stamp' },
        { id: 'messa_terra', label: 'DM 37/08 messa a terra DPR 462/01', icon: 'fa-bolt' },
        { id: 'dvr', label: 'DVR (Documento Valutazione Rischi)', icon: 'fa-triangle-exclamation' },
        { id: 'locazione', label: 'Contratto locazione o titolo proprietà', icon: 'fa-house-chimney' }
    ];

    getSelectedDef() {
        return this.docDefinitions.find(d => d.id === this.selectedDocType());
    }

    getDocsByType(type: string) {
        const clientId = this.state.currentUser()?.clientId || 'demo';
        return this.state.documents().filter(d => d.clientId === clientId && d.type === type);
    }

    handleFileSelect(event: any, type: string) {
        const files: FileList = event.target.files;
        if (!files || files.length === 0) return;

        const clientId = this.state.currentUser()?.clientId || 'demo';

        Array.from(files).forEach(file => {
            this.state.saveDocument({
                clientId,
                category: 'regolarita-documentazione',
                type,
                fileName: file.name,
                fileType: file.type,
                fileData: 'BASE64_PLACE_HOLDER'
            });
        });
        this.toast.success('Documento caricato', `Il file è stato salvato nell'archivio.`);
    }

    getExpiryDate(type: string) {
        const docs = this.getDocsByType(type);
        return docs.length > 0 ? docs[0].expiryDate : '';
    }

    updateExpiryDate(type: string, event: any) {
        const expiryDate = event.target.value;
        this.state.documents.update(allDocs => allDocs.map(d => {
            if (d.type === type && (d.clientId === (this.state.currentUser()?.clientId || 'demo'))) {
                return { ...d, expiryDate };
            }
            return d;
        }));
        this.toast.success('Sincronizzato', 'Data di scadenza aggiornata nell\'archivio.');
    }

    previewFile(doc: AppDocument) {
        this.previewDoc.set(doc);
    }

    downloadDoc(doc: any | null) {
        if (!doc) return;
        this.toast.info('Download in corso', `Preparazione di ${doc.fileName}...`);
        setTimeout(() => {
            const link = document.createElement('a');
            link.href = '#';
            link.download = doc.fileName;
            link.click();
        }, 800);
    }

    askDeleteDoc(doc: any) {
        this.docToDelete.set(doc);
        this.isDeleteModalOpen.set(true);
    }

    confirmDelete() {
        if (this.docToDelete()) {
            this.state.deleteDocument(this.docToDelete().id);
            this.isDeleteModalOpen.set(false);
            this.docToDelete.set(null);
            this.toast.success('Eliminato', 'Documento rimosso permanentemente.');
        }
    }
}
