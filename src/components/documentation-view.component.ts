import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService, AppDocument } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';

@Component({
    selector: 'app-documentation-view',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="animate-fade-in p-6 max-w-7xl mx-auto pb-24">
        <!-- Header -->
        <div class="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[40px] p-10 mb-8 border border-slate-700 shadow-2xl relative overflow-hidden">
            <div class="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                <i class="fa-solid fa-folder-tree text-9xl text-white"></i>
            </div>
            <div class="relative z-10">
                <h2 class="text-4xl font-black text-white mb-2">Archivio Documentale</h2>
                <p class="text-slate-400 font-medium max-w-xl">Gestione centralizzata della documentazione aziendale. I documenti caricati rimangono salvati nel sistema e garantiscono la conformità operativa.</p>
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
                                    class="w-full flex items-center justify-between p-4 rounded-2xl transition-all group text-left"
                                    [class.bg-indigo-600]="selectedDocType() === def.id"
                                    [class.text-white]="selectedDocType() === def.id"
                                    [class.hover:bg-slate-50]="selectedDocType() !== def.id">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                                         [class.bg-white/20]="selectedDocType() === def.id"
                                         [class.bg-slate-100]="selectedDocType() !== def.id"
                                         [class.text-indigo-600]="selectedDocType() !== def.id">
                                        <i [class]="'fa-solid ' + def.icon + ' text-xs'"></i>
                                    </div>
                                    <span class="text-xs font-bold">{{ def.label }}</span>
                                </div>
                                @if (getDocsByType(def.id).length > 0) {
                                    <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                                         [class.bg-white/20]="selectedDocType() === def.id"
                                         [class.bg-emerald-500]="selectedDocType() !== def.id"
                                         [class.text-white]="true">
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
                    <div class="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden animate-slide-up">
                        <div class="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <div class="flex items-center gap-5">
                                <div class="w-16 h-16 rounded-[24px] bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 text-2xl">
                                    <i [class]="'fa-solid ' + getSelectedDef()?.icon"></i>
                                </div>
                                <div>
                                    <h3 class="text-2xl font-black text-slate-800">{{ getSelectedDef()?.label }}</h3>
                                    <p class="text-sm font-medium text-slate-500">Gestione e caricamento file per {{ getSelectedDef()?.label }}</p>
                                </div>
                            </div>
                            
                            <label class="cursor-pointer group">
                                <input type="file" class="hidden" (change)="handleFileSelect($event, selectedDocType() || '')" multiple>
                                <div class="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-slate-200 flex items-center gap-3">
                                    <i class="fa-solid fa-cloud-arrow-up text-sm"></i>
                                    CARICA NUOVO FILE
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
                                    <div class="flex items-center justify-between bg-slate-50 p-5 rounded-3xl border border-slate-100 group transition-all hover:bg-white hover:shadow-lg">
                                        <div class="flex items-center gap-5 overflow-hidden">
                                            <div class="w-12 h-12 rounded-2xl bg-white text-emerald-500 flex items-center justify-center shadow-sm text-xl transition-all group-hover:bg-emerald-500 group-hover:text-white shrink-0">
                                                <i class="fa-solid fa-file-pdf"></i>
                                            </div>
                                            <div class="truncate">
                                                <span class="text-sm font-black text-slate-800 block truncate">{{ doc.fileName }}</span>
                                                <div class="flex items-center gap-3 mt-1">
                                                    <span class="text-[10px] text-slate-400 font-bold uppercase">{{ doc.uploadDate | date:'dd/MM/yyyy HH:mm' }}</span>
                                                    <span class="w-1 h-1 rounded-full bg-slate-200"></span>
                                                    <span class="text-[10px] text-indigo-500 font-black uppercase tracking-widest cursor-pointer hover:text-indigo-700" (click)="previewFile(doc)">Visualizza Anteprima</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="flex items-center gap-2 shrink-0">
                                            <button (click)="downloadDoc(doc)" class="w-10 h-10 rounded-xl bg-white text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm flex items-center justify-center" title="Scarica">
                                                <i class="fa-solid fa-download text-xs"></i>
                                            </button>
                                            <button (click)="askDeleteDoc(doc)" class="w-10 h-10 rounded-xl bg-white text-slate-400 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center" title="Elimina">
                                                <i class="fa-solid fa-trash-can text-xs"></i>
                                            </button>
                                        </div>
                                    </div>
                                } @empty {
                                    <div class="text-center py-20 border-4 border-dashed border-slate-50 rounded-[40px]">
                                        <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-300">
                                            <i class="fa-solid fa-file-circle-plus text-3xl"></i>
                                        </div>
                                        <p class="text-sm font-black text-slate-300 uppercase tracking-widest">Nessun file caricato</p>
                                        <p class="text-xs text-slate-400 mt-2">I documenti saranno disponibili per tutti gli operatori aziendali.</p>
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
        <div class="fixed inset-0 z-[110] flex items-center justify-center p-8 animate-fade-in">
            <div class="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" (click)="previewDoc.set(null)"></div>
            <div class="relative w-full max-w-5xl h-full flex flex-col animate-slide-up">
                <div class="flex items-center justify-between p-4 px-8 bg-white/10 backdrop-blur-md rounded-t-[32px] border border-white/20">
                    <div class="flex items-center gap-4 text-white">
                        <i class="fa-solid fa-file-lines text-2xl text-emerald-400"></i>
                        <div>
                            <h4 class="font-black text-lg leading-tight">{{ previewDoc()?.fileName }}</h4>
                            <p class="text-[10px] font-bold text-white/50 uppercase tracking-widest">{{ previewDoc()?.type }} • {{ previewDoc()?.uploadDate | date:'dd/MM/yyyy HH:mm' }}</p>
                        </div>
                    </div>
                    <button (click)="previewDoc.set(null)" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <!-- SIMULATED PREVIEW AREA -->
                <div class="flex-1 bg-white rounded-b-[32px] p-10 flex items-center justify-center relative group overflow-hidden">
                    <div class="text-center">
                        <div class="w-32 h-32 bg-slate-50 rounded-[40px] flex items-center justify-center mx-auto mb-6 shadow-xl text-5xl text-slate-200">
                             <i [class]="'fa-solid ' + (previewDoc()?.fileType?.includes('pdf') ? 'fa-file-pdf' : 'fa-file-image')"></i>
                        </div>
                        <h3 class="text-4xl font-black text-slate-800 mb-4 italic">Anteprima Documentale</h3>
                        <p class="text-slate-500 font-medium max-w-md mx-auto text-lg leading-relaxed">Visualizzazione completa del file archiviato per la conformità HACCP.</p>
                        
                        <div class="mt-10 flex justify-center gap-4">
                            <button (click)="downloadDoc(previewDoc())" class="px-10 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xs tracking-widest uppercase shadow-2xl shadow-indigo-200 transition-all hover:scale-105 active:scale-95">
                                <i class="fa-solid fa-download mr-2 text-sm"></i> SCARICA DOCUMENTO
                            </button>
                        </div>
                    </div>
                    <!-- Watermark -->
                    <div class="absolute bottom-8 right-8 opacity-20 hidden md:block">
                        <img src="/logo.png" class="h-10 grayscale brightness-0" alt="HACCP Pro">
                    </div>
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
