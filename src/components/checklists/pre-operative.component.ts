import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state.service';
import { ToastService } from '../../services/toast.service';

interface AreaChecklist {
    id: string;
    label: string;
    icon: string;
    steps: { id: string; label: string; icon: string; status: 'pending' | 'ok' | 'issue' }[];
    expanded: boolean;
}

@Component({
    selector: 'app-pre-operative-checklist',
    standalone: true,
    imports: [CommonModule],
    template: `
    <!-- PRINT ONLY HEADER & TABLE -->
    <div class="hidden print:block font-sans text-black p-4">
        <div class="border-b-2 border-slate-800 pb-4 mb-6">
            <h1 class="text-2xl font-bold uppercase mb-1">{{ state.adminCompany().name || 'Azienda' }}</h1>
            <h2 class="text-xl font-light text-slate-600">Fase Pre-operativa (Ispezione e Avvio)</h2>
            <div class="flex justify-between mt-4 text-sm text-slate-500">
                <span><span class="font-bold">Data:</span> {{ getFormattedDate() }}</span>
                <span><span class="font-bold">Operatore:</span> {{ state.currentUser()?.name || 'Operatore' }}</span>
            </div>
        </div>

        <table class="w-full text-left text-sm border-collapse">
            <thead>
                <tr class="border-b border-slate-400">
                    <th class="py-2 font-bold w-1/2">Area / Operazione</th>
                    <th class="py-2 font-bold w-1/4">Esito</th>
                    <th class="py-2 font-bold w-1/4">Note / Verifica</th>
                </tr>
            </thead>
            <tbody>
                <!-- Global Checks -->
                @for (item of globalItems(); track item.id) {
                    <tr class="border-b border-slate-100 italic bg-blue-50/20">
                        <td class="py-2 font-bold">{{ item.label }}</td>
                        <td class="py-2 font-bold">{{ item.status === 'ok' ? 'CONFORME' : (item.status === 'issue' ? 'NON CONFORME' : 'NON ESEGUITO') }}</td>
                        <td class="py-2">{{ item.note || '-' }}</td>
                    </tr>
                }

                @for (area of areas(); track area.id) {
                    <tr class="border-b border-slate-100 bg-slate-50/50">
                        <td class="py-2 pr-2 font-bold uppercase text-[11px]">{{ area.label }}</td>
                        <td class="py-2">
                             @if(getAreaStatusLabel(area.id) === 'Conforme') { 
                                 <span class="font-bold text-emerald-800">CONFORME</span> 
                             } @else if(getAreaStatusLabel(area.id) === 'Rilevate Anomalie') { 
                                 <span class="font-bold text-red-800">NON CONFORME</span> 
                             } @else { 
                                 <span class="text-slate-400">NON ESEGUITO</span> 
                             }
                        </td>
                        <td class="py-2 italic text-slate-400 text-[10px]">Verifica Area completata</td>
                    </tr>
                    @for (step of area.steps; track step.id) {
                        @if(step.status === 'issue') {
                            <tr class="border-b border-slate-100 bg-red-50/30">
                                <td class="py-1 pl-6 pr-2 text-red-800 font-medium text-[10px]">Anomalia: {{ step.label }}</td>
                                <td class="py-1 text-[10px] font-bold text-red-700">NON CONFORME</td>
                                <td class="py-1 italic text-red-600 text-[9px]">Azione correttiva richiesta</td>
                            </tr>
                        }
                    }
                }
            </tbody>
        </table>
    </div>

    <!-- UI CONTENT (Hidden on print) -->
    <div class="print:hidden pb-20 animate-fade-in relative max-w-3xl mx-auto px-4">
        <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 rounded-3xl shadow-xl border border-blue-500/30 relative overflow-hidden mb-8 mt-4">
            <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <i class="fa-solid fa-eye text-9xl text-white"></i>
            </div>
            <div class="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30 text-white text-2xl">
                        <i class="fa-solid fa-eye"></i>
                    </div>
                    <div>
                        <h2 class="text-3xl font-black text-white">Fase Pre-Operativa</h2>
                        <p class="text-blue-100 text-sm font-medium mt-1">Ispezione e avvio attività</p>
                    </div>
                </div>
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div class="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
                        <div class="flex justify-between items-end mb-1.5">
                            <span class="text-[10px] text-blue-100 uppercase font-bold tracking-wider">Progresso</span>
                            <span class="text-sm font-black text-white">{{ completedStepsCount() }}/{{ totalStepsCount() }}</span>
                        </div>
                        <div class="w-40 h-2 bg-white/20 rounded-full overflow-hidden">
                            <div class="h-full bg-white rounded-full transition-all duration-700" [style.width.%]="progressPercentage()"></div>
                        </div>
                    </div>
                    <div class="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex items-center gap-3 shadow-lg">
                        <div class="text-left">
                            <div class="text-[10px] text-blue-100 uppercase font-bold tracking-wider leading-none mb-1">Stato</div>
                            <div class="text-sm font-black text-white flex items-center gap-2">
                                <i class="fa-solid fa-circle text-[8px] animate-pulse" [class.text-emerald-400]="isSubmitted()" [class.text-amber-400]="!isSubmitted()"></i>
                                {{ isSubmitted() ? 'Registrato' : 'In Compilazione' }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Global Items first -->
        <div class="bg-blue-50/50 p-6 rounded-3xl border-2 border-blue-100 mb-6 space-y-3">
            <h3 class="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i class="fa-solid fa-shield-virus"></i> Controlli Generali Avvio
            </h3>
            @for (item of globalItems(); track item.id) {
                <div class="bg-white rounded-2xl border-2 p-4 flex items-center justify-between transition-all"
                     [class.border-blue-500]="item.status === 'ok'"
                     [class.border-red-500]="item.status === 'issue'"
                     [class.border-slate-100]="item.status === 'pending'">
                    <div class="flex items-center gap-4 flex-1">
                        <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i [class]="'fa-solid ' + item.icon"></i>
                        </div>
                        <div class="flex flex-col">
                            <span class="font-bold text-slate-800 leading-tight">{{ item.label }}</span>
                            @if (item.id === 'g_docs') {
                                <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gestione Archivio Digitale</span>
                            }
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <!-- Action Button -->
                        <button (click)="openDocModal(item.id)" 
                                class="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-indigo-600 hover:text-white transition-all text-xs font-bold border border-slate-200">
                             <i [class]="'fa-solid ' + (item.id === 'g_docs' ? 'fa-file-pdf' : 'fa-list-check')"></i>
                             <span class="hidden sm:inline">{{ item.id === 'g_docs' ? 'DOCUMENTI' : 'CENSIMENTO' }}</span>
                             <div class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px]" *ngIf="getItemBadgeCount(item.id) > 0">
                                {{ getItemBadgeCount(item.id) }}
                             </div>
                        </button>

                        <div class="w-px h-8 bg-slate-100 mx-1"></div>

                        <div class="flex items-center gap-2">
                            <button (click)="setGlobalStatus(item.id, 'ok')" 
                                    class="w-10 h-10 rounded-full flex items-center justify-center transition-all border-2"
                                    [class.bg-emerald-500]="item.status === 'ok'"
                                    [class.text-white]="item.status === 'ok'"
                                    [class.border-emerald-500]="item.status === 'ok'"
                                    [class.bg-white]="item.status !== 'ok'"
                                    [class.text-emerald-400]="item.status !== 'ok'"
                                    [class.border-emerald-100]="item.status !== 'ok'"
                                    [class.shadow-lg]="item.status === 'ok'"
                                    [class.shadow-emerald-100]="item.status === 'ok'">
                                <i class="fa-solid fa-check"></i>
                            </button>
                            
                            <button (click)="setGlobalStatus(item.id, 'issue')" 
                                    class="w-10 h-10 rounded-full flex items-center justify-center transition-all border-2"
                                    [class.bg-red-500]="item.status === 'issue'"
                                    [class.text-white]="item.status === 'issue'"
                                    [class.border-red-500]="item.status === 'issue'"
                                    [class.bg-white]="item.status !== 'issue'"
                                    [class.text-red-400]="item.status !== 'issue'"
                                    [class.border-red-100]="item.status !== 'issue'"
                                    [class.shadow-lg]="item.status === 'issue'"
                                    [class.shadow-red-100]="item.status === 'issue'">
                                <i class="fa-solid fa-triangle-exclamation"></i>
                            </button>
                        </div>
                    </div>
                </div>
            }
        </div>

        <!-- DOCUMENT MANAGEMENT MODAL -->
        @if (isDocModalOpen()) {
            <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closeDocModal()"></div>
                <div class="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
                    <!-- Modal Header -->
                    <div class="bg-indigo-600 p-6 text-white flex justify-between items-center">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner">
                                <i class="fa-solid fa-folder-tree text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-black">{{ selectedDocCategory() === 'g_docs' ? 'Archivio Regolarità Documentale' : 'Censimento Attrezzature Cucina' }}</h3>
                                <p class="text-xs text-indigo-100 font-medium opacity-80 uppercase tracking-widest">{{ selectedDocCategory() === 'g_docs' ? 'Caricamento PDF, JPG, PNG' : 'Selezione macchinari e area operativa' }}</p>
                            </div>
                        </div>
                        <button (click)="closeDocModal()" class="w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-colors">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <!-- Modal Body -->
                    <div class="p-6 overflow-y-auto bg-slate-50 flex-1">
                        @if (selectedDocCategory() === 'g_docs') {
                            <div class="space-y-4">
                                @for (def of docDefinitions; track def.id) {
                                    <div class="bg-white p-5 rounded-[32px] border-2 transition-all group relative overflow-hidden"
                                         [class.border-slate-100]="!disabledDocs()[def.id]"
                                         [class.opacity-60]="disabledDocs()[def.id]"
                                         [class.border-amber-400]="disabledDocs()[def.id]">
                                        
                                        <!-- Header with label and Switch -->
                                        <div class="flex items-start justify-between gap-4 mb-4">
                                            <div class="flex items-center gap-3">
                                                <div class="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 flex items-center justify-center transition-all shadow-inner">
                                                    <i [class]="'fa-solid ' + def.icon + ' text-xl'"></i>
                                                </div>
                                                <div>
                                                    <span class="font-black text-slate-800 text-sm block leading-tight">{{ def.label }}</span>
                                                    <span class="text-[9px] font-bold uppercase tracking-widest" [class.text-amber-600]="disabledDocs()[def.id]" [class.text-slate-400]="!disabledDocs()[def.id]">
                                                        {{ disabledDocs()[def.id] ? 'Escluso dalla verifica' : 'Documento Obbligatorio' }}
                                                    </span>
                                                </div>
                                            </div>

                                            <div class="flex flex-col items-end gap-2">
                                                <button (click)="toggleDocExclusion(def.id)" 
                                                        class="w-10 h-5 rounded-full transition-all relative shadow-inner"
                                                        [class.bg-amber-500]="disabledDocs()[def.id]"
                                                        [class.bg-slate-200]="!disabledDocs()[def.id]">
                                                    <div class="absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm"
                                                         [style.left]="disabledDocs()[def.id] ? '24px' : '3px'"></div>
                                                </button>
                                                
                                                @if (!disabledDocs()[def.id]) {
                                                    <label class="cursor-pointer">
                                                        <input type="file" class="hidden" 
                                                               (change)="handleFileSelect($event, def.id)"
                                                               [accept]="'.pdf,.jpg,.jpeg,.png'">
                                                        <div class="px-3 py-1 bg-indigo-600 text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">
                                                            CARICA
                                                        </div>
                                                    </label>
                                                }
                                            </div>
                                        </div>

                                        <!-- Expiry for PEC -->
                                        @if (def.hasExpiry && !disabledDocs()[def.id]) {
                                            <div class="mb-4 px-4 py-2.5 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-center gap-4">
                                                <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                    <i class="fa-solid fa-calendar-clock"></i>
                                                </div>
                                                <div class="flex-1">
                                                    <label class="block text-[9px] font-black text-amber-700 uppercase tracking-tighter">Data di Scadenza documento</label>
                                                    <input type="date" 
                                                           [value]="getExpiryDate(def.id)"
                                                           (change)="updateExpiryDate(def.id, $event)"
                                                           class="bg-transparent border-none p-0 text-sm font-black text-amber-900 focus:outline-none w-full">
                                                </div>
                                            </div>
                                        }

                                        <!-- List of uploaded files -->
                                        @if (!disabledDocs()[def.id]) {
                                            <div class="space-y-2.5">
                                                @for (doc of getDocsByType(def.id); track doc.id) {
                                                    <div class="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-indigo-100 group/file">
                                                        <div class="flex items-center gap-3 flex-1 truncate">
                                                            <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                                <i class="fa-solid fa-file-pdf"></i>
                                                            </div>
                                                            <div class="flex flex-col truncate">
                                                                <span class="text-xs font-black text-slate-700 truncate">{{ doc.fileName }}</span>
                                                                <span class="text-[9px] text-slate-400 font-bold uppercase">{{ doc.uploadDate | date:'dd/MM/yyyy HH:mm' }}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div class="flex items-center gap-1.5 opacity-0 group-hover/file:opacity-100 transition-opacity">
                                                            <button (click)="downloadDoc(doc)" class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center justify-center" title="Scarica Documento">
                                                                <i class="fa-solid fa-download text-[10px]"></i>
                                                            </button>
                                                            <button (click)="shareDoc(doc)" class="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center justify-center" title="Condividi via Email/WhatsApp">
                                                                <i class="fa-solid fa-share-nodes text-[10px]"></i>
                                                            </button>
                                                            <div class="w-px h-5 bg-slate-100 mx-1"></div>
                                                            <button (click)="askDeleteDoc(doc)" class="w-8 h-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center" title="Elimina Definitivamente">
                                                                <i class="fa-solid fa-trash-alt text-[10px]"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                } @empty {
                                                    <div class="text-center py-3 border-2 border-dashed border-slate-100 rounded-2xl group-hover:border-indigo-50 transition-colors">
                                                        <span class="text-[10px] text-slate-300 font-bold uppercase tracking-widest">In attesa di caricamento</span>
                                                    </div>
                                                }
                                            </div>
                                        } @else {
                                            <div class="flex flex-col items-center justify-center py-4 bg-amber-50/30 rounded-2xl border border-dashed border-amber-200">
                                                <i class="fa-solid fa-eye-slash text-amber-400 text-lg mb-1"></i>
                                                <span class="text-[9px] text-amber-600 font-black uppercase tracking-tighter">Documentazione non richiesta per questa attività</span>
                                            </div>
                                        }
                                    </div>
                                }
                            </div>
                        } @else if (selectedDocCategory() === 'g_cleaning_sanit') {
                            <!-- EQUIPMENT SELECTION SYSTEM -->
                            <div class="space-y-6">
                                <div class="bg-indigo-50 border border-indigo-100 p-6 rounded-[32px]">
                                    <h4 class="text-xs font-black text-indigo-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <i class="fa-solid fa-plus-circle"></i> Aggiungi Attrezzatura Area Cucina
                                    </h4>
                                    
                                    <div class="grid grid-cols-1 gap-3">
                                        <select #equipSelector 
                                                (change)="addEquipment(equipSelector.value); equipSelector.value = ''"
                                                class="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:outline-none shadow-sm transition-all appearance-none cursor-pointer">
                                            <option value="" disabled selected>Fai una scelta dal selettore...</option>
                                            @for (group of masterEquipmentList; track group.area) {
                                                <optgroup [label]="group.area">
                                                    @for (item of group.items; track item) {
                                                        <option [value]="group.area + '|' + item">{{ item }}</option>
                                                    }
                                                </optgroup>
                                            }
                                        </select>
                                        <p class="text-[10px] text-indigo-400 font-bold px-2 uppercase tracking-tight">L'attrezzatura selezionata verrà aggiunta automaticamente alla lista sottostante.</p>
                                    </div>
                                </div>

                                <div class="space-y-3">
                                    <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Elenco Attrezzature Censite</h4>
                                    @for (eq of selectedEquipment(); track eq.id) {
                                        <div class="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group animate-slide-up">
                                            <div class="flex items-center gap-4">
                                                <div class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <i class="fa-solid fa-microchip text-sm"></i>
                                                </div>
                                                <div>
                                                    <span class="block font-black text-slate-800 text-sm leading-tight">{{ eq.name }}</span>
                                                    <span class="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter">{{ eq.area }}</span>
                                                </div>
                                            </div>
                                            <button (click)="removeEquipment(eq.id)" 
                                                    class="w-10 h-10 rounded-xl bg-red-50 text-red-400 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-sm">
                                                <i class="fa-solid fa-trash-can text-xs"></i>
                                            </button>
                                        </div>
                                    } @empty {
                                        <div class="flex flex-col items-center justify-center py-12 bg-slate-100/50 rounded-[40px] border-2 border-dashed border-slate-200">
                                            <div class="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                                                <i class="fa-solid fa-list-check text-2xl text-slate-200"></i>
                                            </div>
                                            <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Nessuna attrezzatura selezionata</p>
                                            <p class="text-[10px] text-slate-400 mt-1 italic">Usa il selettore sopra per censire i macchinari</p>
                                        </div>
                                    }
                                </div>
                            </div>
                        }
                    </div>

                    <!-- Modal Footer -->
                    <div class="p-6 bg-white border-t border-slate-100 text-right">
                        <button (click)="closeDocModal()" class="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
                            CHIUDI ARCHIVIO
                        </button>
                    </div>
                </div>
            </div>
        }

        <!-- CUSTOM DELETE CONFIRMATION MODAL (APP STYLE) -->
        @if (isDeleteModalOpen()) {
            <div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-md" (click)="isDeleteModalOpen.set(false)"></div>
                <div class="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden p-8 animate-slide-up text-center">
                    <div class="w-20 h-20 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-100/50">
                        <i class="fa-solid fa-trash-can-arrow-up text-3xl"></i>
                    </div>
                    
                    <h3 class="text-xl font-black text-slate-800 mb-2">Elimina Documento?</h3>
                    <p class="text-sm text-slate-500 font-medium leading-relaxed mb-8">
                        Sei sicuro di voler rimuovere <span class="text-slate-800 font-bold">"{{ docToDelete()?.fileName }}"</span>? <br>L'azione è definitiva e non può essere annullata.
                    </p>

                    <div class="space-y-3">
                        <button (click)="confirmDelete()" 
                                class="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200">
                            SÌ, ELIMINA DEFINITIVAMENTE
                        </button>
                        <button (click)="isDeleteModalOpen.set(false)" 
                                class="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                            ANNULLA OPERAZIONE
                        </button>
                    </div>
                </div>
            </div>
        }

        <div class="space-y-4 mb-24">
            @for (area of areas(); track area.id) {
                <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300"
                     [class.ring-2]="area.expanded" [class.ring-blue-500/20]="area.expanded">
                    <div class="p-5 flex items-center gap-4">
                        <div (click)="toggleArea(area.id)" class="flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors flex-1 -m-5 p-5 rounded-3xl">
                            <div class="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-colors flex-shrink-0"
                                 [class.bg-blue-100]="isAreaComplete(area.id)" [class.text-blue-600]="isAreaComplete(area.id)"
                                 [class.bg-slate-100]="!isAreaComplete(area.id)" [class.text-slate-400]="!isAreaComplete(area.id)">
                                <i [class]="'fa-solid ' + area.icon"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <h3 class="font-black text-slate-800 text-lg">{{ area.label }}</h3>
                                <div class="flex items-center gap-2 mt-0.5">
                                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter" [class.bg-emerald-100]="isAreaComplete(area.id) && !hasAreaIssues(area.id)" [class.text-emerald-700]="isAreaComplete(area.id) && !hasAreaIssues(area.id)" [class.bg-red-100]="hasAreaIssues(area.id)" [class.text-red-700]="hasAreaIssues(area.id)" [class.bg-slate-100]="!isAreaComplete(area.id)" [class.text-slate-500]="!isAreaComplete(area.id)">{{ getAreaStatusLabel(area.id) }}</span>
                                    <span class="text-[10px] text-slate-400 font-medium">{{ getCompletedStepsInArea(area.id) }} di {{ area.steps.length }} ok</span>
                                </div>
                            </div>
                            <i class="fa-solid fa-chevron-down transition-transform duration-300" [class.rotate-180]="area.expanded"></i>
                        </div>
                        <div class="flex gap-2 ml-2" (click)="$event.stopPropagation()">
                            <button (click)="setAllStepsInArea(area.id, 'ok')" class="w-10 h-10 rounded-full border-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50"><i class="fa-solid fa-check"></i></button>
                        </div>
                    </div>
                    @if (area.expanded) {
                        <div class="px-5 pb-6 pt-2 border-t border-slate-50 bg-slate-50/50">
                            <div class="grid grid-cols-1 gap-3">
                                @for (step of area.steps; track step.id) {
                                    <div class="bg-white rounded-2xl border-2 p-4 flex items-center justify-between"
                                         [class.border-emerald-500]="step.status === 'ok'"
                                         [class.border-red-500]="step.status === 'issue'"
                                         [class.border-slate-100]="step.status === 'pending'">
                                        <div class="flex items-center gap-3">
                                            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400"
                                                 [class.bg-emerald-100]="step.status === 'ok'" [class.text-emerald-600]="step.status === 'ok'"
                                                 [class.bg-red-100]="step.status === 'issue'" [class.text-red-600]="step.status === 'issue'">
                                                <i [class]="'fa-solid ' + step.icon"></i>
                                            </div>
                                            <span class="text-sm font-bold text-slate-700">{{ step.label }}</span>
                                        </div>
                                        <div class="flex gap-2">
                                            @if (step.status === 'pending') {
                                                <button (click)="setStepStatus(areaId(area), step.id, 'ok')" class="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 hover:bg-emerald-100 transition-colors"><i class="fa-solid fa-check text-xs"></i></button>
                                                <button (click)="setStepStatus(areaId(area), step.id, 'issue')" class="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-100 hover:bg-red-100 transition-colors"><i class="fa-solid fa-triangle-exclamation text-xs"></i></button>
                                            } @else {
                                                <button (click)="setStepStatus(areaId(area), step.id, 'pending')" class="text-[10px] font-bold text-slate-400 hover:text-slate-600">Annulla</button>
                                            }
                                        </div>
                                    </div>
                                }
                            </div>
                        </div>
                    }
                </div>
            }
        </div>

        <!-- Footer Actions -->
        <div class="fixed bottom-6 right-6 z-30 md:absolute md:bottom-0 md:right-0 md:relative md:mt-8 w-full md:w-auto">
            @if (!isSubmitted()) {
                <button (click)="submitChecklist()" [disabled]="!isAllCompleted()"
                        class="ml-auto bg-blue-600 text-white rounded-2xl px-6 py-4 shadow-xl font-bold flex items-center gap-3 disabled:opacity-50 disabled:grayscale transition-all active:scale-95">
                    REGISTRA FASE PRE-OPERATIVA <i class="fa-solid fa-check-double text-xl"></i>
                </button>
            } @else {
                <div class="bg-gradient-to-r from-blue-700 to-indigo-700 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-center gap-4 animate-slide-up">
                    <span class="font-black mr-4 border-r border-white/20 pr-4">REGISTRATO!</span>
                    <button (click)="printReport()" class="bg-white/10 px-4 py-2 rounded-xl hover:bg-white/20 flex items-center gap-2 font-bold text-sm transition-colors border border-white/10 shadow-lg"><i class="fa-solid fa-print"></i> Stampa</button>
                    <button (click)="startNewChecklist()" class="bg-blue-500/30 px-4 py-2 rounded-xl hover:bg-blue-500/50 flex items-center gap-2 font-bold text-sm transition-colors border border-blue-400/30 shadow-lg"><i class="fa-solid fa-rotate-right"></i> Nuova</button>
                </div>
            }
        </div>
    </div>
    `,
    styles: [`
    .animate-bounce-short { animation: bounceShort 2s infinite; }
    @keyframes bounceShort { 0%, 20%, 50%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-5px); } 60% { transform: translateY(-3px); } }
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    `]
})
export class PreOperationalChecklistComponent {
    state = inject(AppStateService);
    toast = inject(ToastService);

    isSubmitted = signal(false);
    currentRecordId = signal<string | null>(null);

    // Document Management state
    isDocModalOpen = signal(false);
    selectedDocType = signal<string | null>(null);
    expiryDateInput = signal<string>('');
    disabledDocs = signal<Record<string, boolean>>({}); // Map doc ID to disabled boolean

    // Delete confirmation state
    isDeleteModalOpen = signal(false);
    docToDelete = signal<any>(null);

    // Equipment Selection state
    selectedEquipment = signal<{ id: string; name: string; area: string }[]>([]);

    masterEquipmentList = [
        { area: 'Area Lavaggio', items: ['Mobile pensile', 'Lavello n.1', 'Lavello n.2', 'Tavolo da lavoro'] },
        { area: 'Area Passe 1 e 2', items: ['Frigo n.1', 'Frigo n.2', 'Frigo n.3'] },
        { area: 'Area Somministrazione', items: ['Congelatore', 'Piano cottura'] },
        { area: 'Area Laboratorio', items: ['Frigo n.1', 'Frigo n.2', 'Frigo n.3', 'Griglie', 'Banchi lavori', 'Forno a legna', 'Lavello', 'Lavabicchieri', 'Affettatrice', 'Taglia verdure', 'Campana sottovuoto', 'Banco frigo', 'Cappa aspirante'] },
        { area: 'Area Deposito', items: ['Frigo n.1', 'Frigo n.2', 'Cella frigorifero'] },
        { area: 'Area Spogliatoi', items: ['Armadietto n.1', 'Armadietto n.2', 'Armadietto n.3', 'Armadietto n.4', 'Microonde'] }
    ];

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

    globalItems = signal<{ id: string; label: string; icon: string; status: 'pending' | 'ok' | 'issue'; note?: string }[]>([
        { id: 'g_docs', label: 'Regolarità documentazione', icon: 'fa-folder-open', status: 'pending' },
        { id: 'g_cleaning_sanit', label: 'Prodotti pulizia e sanificazione', icon: 'fa-spray-can-sparkles', status: 'pending' }
    ]);

    stepDefinitions = [
        { id: 'ispezione', label: 'Ispezione visiva', icon: 'fa-eye' },
        { id: 'integrita', label: 'Integrità attrezzature', icon: 'fa-screwdriver-wrench' },
        { id: 'pulizia', label: 'Assenza di residui', icon: 'fa-broom' },
        { id: 'materiali', label: 'Disponibilità materiali', icon: 'fa-box' },
        { id: 'funzionalita', label: 'Funzionalità scarichi/luci', icon: 'fa-lightbulb' }
    ];

    areas = signal<AreaChecklist[]>([
        { id: 'igiene-personale', label: 'Igiene Personale', icon: 'fa-hands-bubbles', steps: this.getInitialSteps(), expanded: false },
        { id: 'cucina-sala', label: 'Cucina e Sala', icon: 'fa-utensils', steps: this.getInitialSteps(), expanded: false },
        { id: 'area-lavaggio', label: 'Area Lavaggio', icon: 'fa-sink', steps: this.getInitialSteps(), expanded: false },
        { id: 'deposito', label: 'Deposito', icon: 'fa-boxes-stacked', steps: this.getInitialSteps(), expanded: false },
        { id: 'spogliatoio', label: 'Spogliatoio', icon: 'fa-shirt', steps: this.getInitialSteps(), expanded: false },
        { id: 'antibagno-bagno-personale', label: 'Antibagno e Bagno Personale', icon: 'fa-restroom', steps: this.getInitialSteps(), expanded: false },
        { id: 'bagno-clienti', label: 'Bagno Clienti', icon: 'fa-people-arrows', steps: this.getInitialSteps(), expanded: false },
        { id: 'pavimenti', label: 'Pavimenti', icon: 'fa-table-cells', steps: this.getInitialSteps(), expanded: false },
        { id: 'pareti', label: 'Pareti', icon: 'fa-border-all', steps: this.getInitialSteps(), expanded: false },
        { id: 'soffitto', label: 'Soffitto', icon: 'fa-cloud', steps: this.getInitialSteps(), expanded: false },
        { id: 'infissi', label: 'Infissi', icon: 'fa-door-closed', steps: this.getInitialSteps(), expanded: false },
        { id: 'reti-antiintrusione', label: 'Reti Anti-intrusione', icon: 'fa-shield-cat', steps: this.getInitialSteps(), expanded: false },
    ]);

    getInitialSteps() {
        return this.stepDefinitions.map(def => ({ ...def, status: 'pending' as const }));
    }

    constructor() {
        effect(() => {
            this.state.filterDate();
            this.loadData();
        }, { allowSignalWrites: true });

        // Auto-update g_docs status based on document availability
        effect(() => {
            const docs = this.state.documents();
            const disabled = this.disabledDocs();
            const clientId = this.state.currentUser()?.clientId || 'demo';

            // Filter only required and active doc types
            const requiredTypes = this.docDefinitions.filter(def => !disabled[def.id]);
            const uploadedTypes = new Set(docs.filter(d => d.clientId === clientId && d.category === 'regolarita-documentazione').map(d => d.type));

            const allPresent = requiredTypes.every(def => uploadedTypes.has(def.id));

            this.globalItems.update(items => items.map(item => {
                if (item.id === 'g_docs') {
                    return { ...item, status: allPresent ? 'ok' : 'issue' };
                }
                return item;
            }));
        }, { allowSignalWrites: true });
    }

    loadData() {
        const historyRecord = this.state.getRecord('pre-op-checklist');

        if (historyRecord && historyRecord.areas) {
            this.areas.set(JSON.parse(JSON.stringify(historyRecord.areas)));
            this.globalItems.set(JSON.parse(JSON.stringify(historyRecord.globalItems || [])));
            this.isSubmitted.set(true);
        } else {
            this.isSubmitted.set(false);
            this.resetForm();
        }
    }

    areaId(area: AreaChecklist) { return area.id; }

    toggleArea(id: string) {
        this.areas.update(areas => areas.map(a => a.id === id ? { ...a, expanded: !a.expanded } : a));
    }

    setStepStatus(areaId: string, stepId: string, status: 'pending' | 'ok' | 'issue') {
        this.areas.update(areas => areas.map(a => {
            if (a.id === areaId) {
                return { ...a, steps: a.steps.map(s => s.id === stepId ? { ...s, status } : s) };
            }
            return a;
        }));
    }

    setGlobalStatus(id: string, status: 'pending' | 'ok' | 'issue') {
        this.globalItems.update(items => items.map(item => {
            if (item.id === id) {
                const newStatus = item.status === status ? 'pending' : status;
                return { ...item, status: newStatus };
            }
            return item;
        }));
    }

    setAllStepsInArea(areaId: string, status: 'ok' | 'issue') {
        this.areas.update(areas => areas.map(a => {
            if (a.id === areaId) {
                return { ...a, steps: a.steps.map(s => ({ ...s, status })), expanded: true };
            }
            return a;
        }));
    }

    isAreaComplete(id: string) {
        const area = this.areas().find(a => a.id === id);
        return area?.steps.every(s => s.status !== 'pending') || false;
    }

    hasAreaIssues(id: string) {
        const area = this.areas().find(a => a.id === id);
        return area?.steps.some(s => s.status === 'issue') || false;
    }

    getCompletedStepsInArea(id: string) {
        const area = this.areas().find(a => a.id === id);
        return area?.steps.filter(s => s.status === 'ok').length || 0;
    }

    getAreaStatusLabel(id: string) {
        if (!this.isAreaComplete(id)) return 'In corso';
        return this.hasAreaIssues(id) ? 'Rilevate Anomalie' : 'Conforme';
    }

    totalStepsCount() { return (this.areas().length * this.stepDefinitions.length) + this.globalItems().length; }

    completedStepsCount() {
        const areaDone = this.areas().reduce((acc, a) => acc + a.steps.filter(s => s.status !== 'pending').length, 0);
        const globalDone = this.globalItems().filter(i => i.status !== 'pending').length;
        return areaDone + globalDone;
    }

    progressPercentage() {
        const total = this.totalStepsCount();
        return total > 0 ? (this.completedStepsCount() / total) * 100 : 0;
    }

    isAllCompleted() { return this.completedStepsCount() === this.totalStepsCount(); }

    submitChecklist() {
        this.state.saveChecklist({
            moduleId: 'pre-op-checklist',
            date: this.state.filterDate(),
            data: {
                areas: this.areas(),
                globalItems: this.globalItems(),
                status: (this.areas().some(a => a.steps.some(s => s.status === 'issue')) || this.globalItems().some(i => i.status === 'issue')) ? 'Non Conforme' : 'Conforme'
            }
        });
        this.isSubmitted.set(true);
        this.toast.success('Registrato', 'Fase Pre-Operativa salvata.');
    }

    resetForm() {
        this.areas.update(areas => areas.map(a => ({
            ...a,
            steps: this.getInitialSteps(),
            expanded: a.id === 'cucina-sala'
        })));
        this.globalItems.update(items => items.map(i => ({ ...i, status: 'pending' })));
    }

    startNewChecklist() {
        this.isSubmitted.set(false);
        this.resetForm();
    }

    printReport() { window.print(); }
    getFormattedDate() { return new Date(this.state.filterDate()).toLocaleDateString('it-IT'); }

    // --- Document Management Methods ---
    selectedDocCategory = signal<string | null>(null);

    openDocModal(categoryId: string) {
        this.selectedDocCategory.set(categoryId);
        this.isDocModalOpen.set(true);
    }

    closeDocModal() {
        this.isDocModalOpen.set(false);
        this.selectedDocCategory.set(null);
    }

    getDocsByType(type: string) {
        const clientId = this.state.currentUser()?.clientId || 'demo';
        return this.state.documents().filter(d => d.clientId === clientId && d.type === type);
    }

    getItemBadgeCount(categoryId: string) {
        if (categoryId === 'g_docs') {
            const clientId = this.state.currentUser()?.clientId || 'demo';
            return this.state.documents().filter(d => d.clientId === clientId && d.category === 'regolarita-documentazione').length;
        }
        if (categoryId === 'g_cleaning_sanit') {
            return this.selectedEquipment().length;
        }
        return 0;
    }

    handleFileSelect(event: any, type: string) {
        const files: FileList = event.target.files;
        if (!files || files.length === 0) return;

        const clientId = this.state.currentUser()?.clientId || 'demo';
        const category = this.selectedDocCategory() === 'g_docs' ? 'regolarita-documentazione' : 'prodotti-pulizia';

        Array.from(files).forEach(file => {
            this.state.saveDocument({
                clientId,
                category,
                type,
                fileName: file.name,
                fileType: file.type,
                fileData: 'BASE64_PLACE_HOLDER'
            });
        });
    }

    getExpiryDate(type: string) {
        const docs = this.getDocsByType(type);
        return docs.length > 0 ? docs[0].expiryDate : '';
    }

    updateExpiryDate(type: string, event: any) {
        const expiryDate = event.target.value;
        const docs = this.getDocsByType(type);
        if (docs.length > 0) {
            // Update existing doc metadata
            this.state.documents.update(allDocs => allDocs.map(d => {
                if (d.id === docs[0].id) return { ...d, expiryDate };
                return d;
            }));
            this.toast.success('Scadenza salvata', 'Data di scadenza aggiornata correttamente.');
        } else {
            this.toast.info('Attenzione', 'Carica prima il documento per poter impostare la data di scadenza.');
        }
    }

    toggleDocExclusion(docId: string) {
        this.disabledDocs.update(prev => ({
            ...prev,
            [docId]: !prev[docId]
        }));

        const isExcluding = this.disabledDocs()[docId];
        this.toast.info(isExcluding ? 'Documento Escluso' : 'Documento Riabilitato',
            isExcluding ? 'L\'elemento non sarà conteggiato nella verifica.' : 'L\'elemento è ora obbligatorio per la conformità.');
    }

    downloadDoc(doc: any) {
        this.toast.info('Download in corso', `Il file ${doc.fileName} sta per essere scaricato.`);

        // Real download simulation using Blob
        const mockContent = 'Dati del documento ' + doc.fileName;
        const blob = new Blob([mockContent], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.toast.success('Completato', 'Download terminato con successo.');
    }

    shareDoc(doc: any) {
        this.toast.info('Condivisione Documento', `Scegli come condividere ${doc.fileName}`);

        // Mocking a share menu with a toast sequence for now
        setTimeout(() => {
            this.toast.success('Inviato', 'Il documento è stato correttamente condiviso via Email e WhatsApp.');
        }, 800);
    }

    askDeleteDoc(doc: any) {
        // Open app-style custom confirmation modal
        this.docToDelete.set(doc);
        this.isDeleteModalOpen.set(true);
    }

    confirmDelete() {
        const doc = this.docToDelete();
        if (doc) {
            this.state.deleteDocument(doc.id);
            this.isDeleteModalOpen.set(false);
            this.docToDelete.set(null);
            // Success toast is already called by state.deleteDocument
        }
    }

    deleteDoc(id: string) {
        this.state.deleteDocument(id);
    }

    addEquipment(value: string) {
        if (!value) return;
        const [area, name] = value.split('|');
        const id = Math.random().toString(36).substring(2, 9);

        this.selectedEquipment.update(list => [...list, { id, area, name }]);
        this.toast.success('Aggiunto', `${name} inserito in ${area}.`);
    }

    removeEquipment(id: string) {
        const item = this.selectedEquipment().find(e => e.id === id);
        this.selectedEquipment.update(list => list.filter(e => e.id !== id));
        if (item) {
            this.toast.info('Rimosso', `${item.name} rimosso dall'elenco.`);
        }
    }
}
