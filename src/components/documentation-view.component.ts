import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService, AppDocument } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';

@Component({
    selector: 'app-documentation-view',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="animate-fade-in px-2 relative space-y-6 pb-24">
        <!-- Premium Hero Header -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div class="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-blue-50 to-transparent pointer-events-none"></div>
            
            <div class="relative z-10 flex items-center gap-5">
                <div class="h-14 w-14 rounded-xl bg-white border border-blue-100 flex items-center justify-center shadow-sm text-blue-600 shrink-0">
                    <i class="fa-solid fa-folder-tree text-2xl"></i>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Archivio Documentale</h2>
                    <div class="flex flex-wrap items-center gap-2 mt-1">
                        <span class="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-200 text-[10px] font-black uppercase tracking-widest leading-none">
                            <i class="fa-solid fa-cloud text-slate-400"></i> Cloud
                        </span>
                        <span class="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 text-[10px] font-black uppercase tracking-widest leading-none">
                            <i class="fa-solid fa-id-card"></i> {{ getTargetUnitName() }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="w-full md:w-auto relative z-10 flex gap-4 pr-1">
                <div class="flex items-center gap-4 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 w-full justify-between">
                    <div>
                        <p class="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">File Archiviati</p>
                        <p class="text-base font-bold text-slate-700 leading-none">{{ state.filteredDocuments().length }}</p>
                    </div>
                    <i class="fa-solid fa-box-archive text-slate-300 text-xl"></i>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Sidebar: Categories -->
            <div class="lg:col-span-1 space-y-4">
                <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm sticky top-6">
                    <h3 class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">Categorie Documenti</h3>
                    <div class="space-y-1">
                        <!-- All Documents View -->
                        <button (click)="selectedDocType.set('all')"
                                class="w-full flex items-center justify-between p-3 rounded-lg transition-all group text-left border mb-2"
                                [class.bg-blue-50]="selectedDocType() === 'all'"
                                [class.border-blue-200]="selectedDocType() === 'all'"
                                [class.text-blue-700]="selectedDocType() === 'all'"
                                [class.bg-white]="selectedDocType() !== 'all'"
                                [class.border-slate-100]="selectedDocType() !== 'all'"
                                [class.hover:bg-slate-50]="selectedDocType() !== 'all'">
                             <div class="flex items-center gap-3">
                                 <div class="w-8 h-8 rounded-md flex items-center justify-center transition-all bg-white shadow-sm border border-slate-100"
                                      [class.text-blue-600]="selectedDocType() === 'all'"
                                      [class.text-slate-500]="selectedDocType() !== 'all'">
                                     <i class="fa-solid fa-layer-group text-xs"></i>
                                 </div>
                                 <span class="text-[11px] font-black uppercase tracking-widest">Tutti i Documenti</span>
                             </div>
                             <div class="w-6 h-6 rounded flex items-center justify-center text-[9px] font-black shadow-sm"
                                  [class.bg-blue-600]="selectedDocType() === 'all'"
                                  [class.text-white]="selectedDocType() === 'all'"
                                  [class.bg-slate-100]="selectedDocType() !== 'all'"
                                  [class.text-slate-600]="selectedDocType() !== 'all'">
                                 {{ state.filteredDocuments().length }}
                             </div>
                        </button>

                        <div class="h-px bg-slate-100 mx-2 mb-2"></div>

                        @for (def of docDefinitions; track def.id) {
                            <button (click)="selectedDocType.set(def.id)"
                                    class="w-full flex items-center justify-between p-2.5 rounded-lg transition-all group text-left border border-transparent"
                                    [class.bg-blue-600]="selectedDocType() === def.id"
                                    [class.text-white]="selectedDocType() === def.id"
                                    [class.shadow-sm]="selectedDocType() === def.id"
                                    [class.hover:bg-slate-50]="selectedDocType() !== def.id"
                                    [class.hover:border-slate-200]="selectedDocType() !== def.id">
                                 <div class="flex items-center gap-3">
                                     <div class="w-7 h-7 rounded flex items-center justify-center transition-all shadow-sm"
                                          [class.bg-white/20]="selectedDocType() === def.id"
                                          [class.bg-white]="selectedDocType() !== def.id"
                                          [class.border]="selectedDocType() !== def.id"
                                          [class.border-slate-200]="selectedDocType() !== def.id"
                                          [class.text-white]="selectedDocType() === def.id"
                                          [class.text-blue-600]="selectedDocType() !== def.id">
                                         <i [class]="'fa-solid ' + def.icon + ' text-[10px]'"></i>
                                     </div>
                                     <span class="text-[10px] font-black uppercase tracking-widest truncate max-w-[120px]" [title]="def.label">{{ def.label }}</span>
                                 </div>
                                 @if (getDocsByType(def.id).length > 0) {
                                     <div class="w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shadow-sm"
                                          [class.bg-white]="selectedDocType() === def.id"
                                          [class.text-blue-600]="selectedDocType() === def.id"
                                          [class.bg-slate-100]="selectedDocType() !== def.id"
                                          [class.text-slate-600]="selectedDocType() !== def.id">
                                         {{ getDocsByType(def.id).length }}
                                     </div>
                                 }
                            </button>
                        }
                    </div>
                </div>
            </div>

            <!-- Main Content: Document Details & Upload -->
            <div class="lg:col-span-3 space-y-6">
                @if (selectedDocType()) {
                    @if (!isTargetUnitSelected()) {
                         <div class="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden p-8 text-center flex flex-col items-center justify-center h-full min-h-[300px]">
                            <div class="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 text-2xl border border-amber-100">
                                <i class="fa-solid fa-user-gear"></i>
                            </div>
                            <h3 class="text-base font-bold text-slate-800 mb-2">Selezione Unità Richiesta</h3>
                            <p class="text-sm text-slate-500 max-w-sm mx-auto mb-6">Per gestire l'archivio documentale come amministratore, seleziona l'unità operativa in alto.</p>
                            <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                <i class="fa-solid fa-arrow-up animate-bounce"></i> Seleziona Unità Operativa
                            </div>
                         </div>
                    } @else {
                        <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-slide-up">
                        <div class="p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-lg bg-white border border-slate-200 text-blue-600 flex items-center justify-center shadow-sm text-xl shrink-0">
                                    <i [class]="'fa-solid ' + getSelectedDef()?.icon"></i>
                                </div>
                                <div>
                                    <h3 class="text-lg font-bold text-slate-800 leading-none mb-1">{{ getSelectedDef()?.label }}</h3>
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gestione Documentazione Compliance</p>
                                </div>
                            </div>
                            
                            <label class="cursor-pointer group/btn w-full sm:w-auto">
                                <input type="file" class="hidden" (change)="handleFileSelect($event, selectedDocType() || '')" multiple>
                                <div class="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2 w-full">
                                    <i class="fa-solid fa-cloud-arrow-up text-xs"></i>
                                    Carica
                                </div>
                            </label>
                        </div>

                        <div class="p-6">
                            @if (getSelectedDef()?.hasExpiry) {
                                <div class="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-100 flex items-center justify-between gap-4">
                                    <div class="flex items-center gap-4 flex-1">
                                        <div class="w-10 h-10 rounded-md bg-white border border-amber-200 text-amber-500 flex items-center justify-center shrink-0 shadow-sm">
                                            <i class="fa-solid fa-calendar-days text-sm"></i>
                                        </div>
                                        <div class="flex-1">
                                            <label class="block text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Scadenza Certificazione</label>
                                            <input type="date" 
                                                   [value]="getExpiryDate(selectedDocType() || '')"
                                                   (change)="updateExpiryDate(selectedDocType() || '', $event)"
                                                   class="bg-white border text-xs border-amber-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-sm text-amber-800 w-full max-w-[180px]">
                                        </div>
                                    </div>
                                    <div class="text-right hidden sm:block shrink-0">
                                        <span class="text-[9px] font-black text-amber-400 uppercase tracking-widest block mb-0.5">Stato</span>
                                        <span class="text-[10px] font-bold text-amber-600 px-2 py-0.5 bg-amber-100 rounded border border-amber-200">Rinnovo periodico</span>
                                    </div>
                                </div>
                            }

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                @for (doc of getDocsByType(selectedDocType() || ''); track doc.id) {
                                    <div class="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors shadow-sm relative group">
                                        <div class="flex items-center gap-4 overflow-hidden pr-2">
                                            <div class="w-10 h-10 rounded-md bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                                <i class="fa-solid fa-file-pdf text-lg"></i>
                                            </div>
                                            <div class="min-w-0">
                                                <span class="text-sm font-bold text-slate-700 block truncate mb-0.5" [title]="doc.fileName">{{ doc.fileName }}</span>
                                                <div class="flex items-center gap-2 text-[10px] text-slate-500">
                                                    <span>{{ doc.uploadDate | date:'dd/MM/yy' }}</span>
                                                    <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                                                    <span class="truncate">{{ getDocTypeLabel(doc.type) }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white pl-2 absolute right-4 top-1/2 -translate-y-1/2">
                                            <button (click)="previewFile(doc)" class="w-8 h-8 rounded shrink-0 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors tooltip" title="Anteprima">
                                                <i class="fa-solid fa-eye text-xs"></i>
                                            </button>
                                            <button (click)="downloadDoc(doc)" class="w-8 h-8 rounded shrink-0 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors tooltip" title="Scarica">
                                                <i class="fa-solid fa-download text-xs"></i>
                                            </button>
                                            <div class="w-px h-4 bg-slate-200 mx-1"></div>
                                            <button (click)="askDeleteDoc(doc)" class="w-8 h-8 rounded shrink-0 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors tooltip" title="Elimina">
                                                <i class="fa-solid fa-trash-can text-xs"></i>
                                            </button>
                                        </div>
                                    </div>
                                } @empty {
                                    <div class="col-span-1 md:col-span-2 text-center py-16 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                        <div class="w-12 h-12 bg-white rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-200 text-slate-300">
                                            <i class="fa-solid fa-cloud-arrow-up text-xl"></i>
                                        </div>
                                        <h4 class="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Nessun file presente</h4>
                                        <p class="text-[10px] text-slate-400">Carica i documenti in questa categoria.</p>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                }
            } @else {
                    <div class="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm text-center px-6 h-full min-h-[400px]">
                        <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 text-slate-300 text-2xl">
                            <i class="fa-solid fa-folder-open"></i>
                        </div>
                        <h3 class="text-base font-bold text-slate-700 mb-1">Seleziona categoria</h3>
                        <p class="text-xs text-slate-500 max-w-[250px]">Scegli una tipologia dalla barra laterale per visualizzare o caricare documenti.</p>
                    </div>
                }
            </div>
        </div>
    </div>

    <!-- PREVIEW OVERLAY -->
    @if (previewDoc()) {
        <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in" (click)="previewDoc.set(null)"></div>
            <div class="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 animate-slide-up flex flex-col max-h-[90vh]">
                <div class="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-sm shrink-0">
                            <i class="fa-solid fa-file-shield text-lg"></i>
                        </div>
                        <div class="min-w-0 pr-4">
                            <h4 class="font-bold text-slate-800 text-sm truncate" [title]="previewDoc()?.fileName">{{ previewDoc()?.fileName }}</h4>
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{{ previewDoc()?.type }} • {{ previewDoc()?.uploadDate | date:'dd/MM/yy HH:mm' }}</p>
                        </div>
                    </div>
                    <button (click)="previewDoc.set(null)" class="w-8 h-8 rounded shrink-0 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center border border-slate-200 shadow-sm">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                <div class="flex-1 bg-slate-50 flex flex-col items-center justify-center relative p-8 md:p-12 overflow-y-auto">
                    <div class="absolute inset-0 opacity-5 pointer-events-none select-none flex items-center justify-center text-9xl font-black text-slate-900 -rotate-12">
                         HACCP
                    </div>
                    
                    <div class="relative z-10 text-center max-w-sm mx-auto">
                        <div class="w-24 h-24 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200 text-4xl group">
                             <i [class]="'fa-solid ' + (previewDoc()?.fileType?.includes('pdf') ? 'fa-file-pdf text-emerald-500' : 'fa-file-image text-blue-500')"></i>
                        </div>
                        <h3 class="text-xl font-bold text-slate-800 mb-2">Anteprima Documento</h3>
                        <p class="text-xs text-slate-500 mb-8 leading-relaxed">Il documento è archiviato in modo sicuro nel cloud aziendale ed è pronto per essere consultato.</p>
                        
                        <button (click)="downloadDoc(previewDoc())" class="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-black text-[10px] tracking-widest uppercase shadow-sm transition-all hover:bg-blue-700 active:scale-95 flex items-center justify-center gap-2 w-full max-w-[200px] mx-auto">
                            <i class="fa-solid fa-cloud-arrow-down"></i> Scarica
                        </button>
                    </div>
                </div>
                
                <div class="p-3 bg-white border-t border-slate-100 flex items-center justify-between text-[10px]">
                    <div class="flex items-center gap-1.5 text-emerald-600 font-bold uppercase tracking-widest">
                        <i class="fa-solid fa-shield-check"></i> Archiviazione Sicura
                    </div>
                    <span class="text-slate-400 font-medium">HACCP Pro</span>
                </div>
            </div>
        </div>
    }

    <!-- DELETE CONFIRMATION -->
    @if (isDeleteModalOpen()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="isDeleteModalOpen.set(false)"></div>
            <div class="relative bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 text-center animate-slide-up border border-slate-200">
                <div class="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100 text-2xl">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-800 mb-1">Elimina Documento</h3>
                <p class="text-xs text-slate-500 mb-6 px-4">Sei sicuro di voler eliminare <span class="font-bold text-slate-700">"{{ docToDelete()?.fileName }}"</span>? L'azione non può essere annullata.</p>
                
                <div class="flex gap-3">
                    <button (click)="isDeleteModalOpen.set(false)" class="flex-1 py-2 px-4 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors">Annulla</button>
                    <button (click)="confirmDelete()" class="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-sm">Elimina</button>
                </div>
            </div>
        </div>
    }
    
    `
})
export class DocumentationViewComponent {
    state = inject(AppStateService);
    toast = inject(ToastService);

    selectedDocType = signal<string | 'all'>('all');
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
        if (this.selectedDocType() === 'all') {
            return { id: 'all', label: 'Archivio Completo', icon: 'fa-layer-group', hasExpiry: false };
        }
        return this.docDefinitions.find(d => d.id === this.selectedDocType());
    }

    getDocTypeLabel(type: string): string {
        if (type === 'generale') return 'Generico';
        const def = this.docDefinitions.find(d => d.id === type);
        return def ? def.label : type.toUpperCase();
    }

    getTargetUnitName(): string {
        const adminSelectedId = this.state.filterCollaboratorId();
        const user = this.state.currentUser();
        
        if (this.state.isAdmin()) {
            if (adminSelectedId) {
                const target = this.state.systemUsers().find(u => u.id === adminSelectedId);
                return target ? target.name : 'Unità Selezionata';
            }
            return 'Nessuna Unità Selezionata';
        }
        return user?.name || 'Mia Unità';
    }

    isTargetUnitSelected(): boolean {
        if (!this.state.isAdmin()) return true;
        return !!this.state.filterCollaboratorId();
    }

    getDocsByType(type: string) {
        if (type === 'all') return this.state.filteredDocuments();
        return this.state.filteredDocuments().filter(d => d.type === type);
    }

    handleFileSelect(event: any, type: string) {
        if (!this.isTargetUnitSelected()) {
            this.toast.error('Errore', 'Seleziona un\'unità operativa prima di caricare documenti.');
            return;
        }
        const files = event.target.files;
        if (!files || files.length === 0) return;

        const uploadType = type === 'all' ? 'generale' : type;

        Array.from(files).forEach((file: any) => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                this.state.saveDocument({
                    clientId: '', // Managed by state.saveDocument
                    category: 'regolarita-documentazione',
                    type: uploadType,
                    fileName: file.name,
                    fileType: file.type,
                    fileData: e.target.result,
                    uploadDate: new Date()
                });
            };
            reader.readAsDataURL(file);
        });
        
        this.toast.success('Documenti Caricati', `${files.length} file sono stati aggiunti all'archivio.`);
        if (type === 'all') {
            this.selectedDocType.set('all');
        } else {
            this.selectedDocType.set(type);
        }
    }

    getExpiryDate(type: string) {
        const docs = this.getDocsByType(type);
        return docs.length > 0 ? docs[0].expiryDate : '';
    }

    updateExpiryDate(type: string, event: any) {
        const expiryDate = event.target.value;
        const targetClientId = this.state.activeTargetClientId();
        
        if (!targetClientId) {
            this.toast.error('Errore', 'Impossibile determinare l\'azienda di riferimento.');
            return;
        }

        this.state.documents.update(allDocs => allDocs.map(d => {
            if (d.type === type && d.clientId === targetClientId) {
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
