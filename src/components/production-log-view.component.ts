import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService, ProductionRecord, ProductionIngredient } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-production-log-view',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <!-- UI CONTENT (Hidden on print) -->
    <div class="print:hidden pb-20 animate-fade-in relative px-2 space-y-6">
        
        <!-- Sleek Professional Dashboard Header -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
            <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
            
            <div class="flex items-center gap-5 relative z-10">
                <div class="h-14 w-14 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-md">
                    <i class="fa-solid fa-barcode text-2xl"></i>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Rintracciabilità Prodotti</h2>
                    <p class="text-sm font-medium text-slate-500 mt-1">Registro produzione e monitoraggio lotti</p>
                </div>
            </div>

            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4 relative z-10">
                <div class="bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 flex items-center gap-6">
                    <div class="text-right">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Registri</p>
                        <p class="text-sm font-bold text-slate-700 leading-none">{{ filteredRecords().length }} Schede</p>
                    </div>
                    <div class="w-px h-8 bg-slate-200"></div>
                    <div class="flex flex-col items-end">
                        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 leading-none">Data Filtro</p>
                        <span class="text-[10px] font-black px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                            {{ state.filterDate() | date:'dd/MM/yyyy' }}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        @if (isEditing()) {
            <!-- EDITING / CREATION VIEW -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
                <!-- Main Product Card -->
                <div class="lg:col-span-1 space-y-4">
                    <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm sticky top-6">
                        <div class="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                            <h3 class="text-lg font-bold text-slate-800">Scheda Prodotto</h3>
                            <div class="px-2 py-0.5 bg-teal-50 border border-teal-100 text-teal-600 rounded text-[10px] font-black uppercase tracking-widest">Master</div>
                        </div>

                        <div class="space-y-5">
                            <div class="space-y-1.5">
                                <label class="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Nome Alimento Principale</label>
                                <input type="text" [(ngModel)]="currentRecord.mainProductName" 
                                       placeholder="es. Sugo alla Genovese"
                                       class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm md:text-base font-bold text-slate-800 focus:border-teal-400 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-teal-100">
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-1.5">
                                    <label class="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Confezionamento</label>
                                    <input type="date" [(ngModel)]="currentRecord.packagingDate"
                                           class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs md:text-sm font-bold text-slate-800 focus:border-teal-400 focus:bg-white transition-all outline-none">
                                </div>
                                <div class="space-y-1.5">
                                    <label class="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Scadenza</label>
                                    <input type="date" [(ngModel)]="currentRecord.expiryDate"
                                           class="w-full bg-slate-50 border border-rose-200 rounded-xl px-3 py-3 text-xs md:text-sm font-bold text-slate-800 focus:border-rose-400 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-rose-100">
                                </div>
                            </div>

                            <div class="space-y-1.5">
                                <label class="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest pl-1">Numero Lotto</label>
                                <div class="relative">
                                    <input type="text" [(ngModel)]="currentRecord.lotto"
                                           class="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm md:text-base font-mono font-bold text-teal-700 outline-none placeholder:font-sans focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all focus:bg-white"
                                           placeholder="Genera o inserisci lotto">
                                    <i class="fa-solid fa-barcode absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                </div>
                            </div>

                            <div class="pt-5 border-t border-slate-100 flex gap-3">
                                <button (click)="cancelEdit()" class="flex-1 py-3 bg-slate-50 text-slate-500 border border-slate-200 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all">Annulla</button>
                                <button (click)="saveRecord()" [disabled]="!currentRecord.mainProductName"
                                        class="flex-[2] py-3 bg-teal-600 text-white border border-teal-500 flex items-center justify-center gap-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-teal-700 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                    <i class="fa-solid fa-cloud-arrow-up"></i> Salva Registro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Ingredients Section -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Ingrediente Form Banner -->
                    <div class="bg-slate-100 rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                        <div class="relative z-10">
                            <h4 class="text-sm md:text-base font-black uppercase tracking-widest mb-5 text-slate-700 flex items-center gap-2">
                                <i class="fa-solid fa-plus-circle text-teal-600"></i> Aggiungi Ingrediente / Materia Prima
                            </h4>
                            
                            <div class="grid grid-cols-1 sm:grid-cols-4 gap-6">
                                <!-- Photo Upload -->
                                <div class="sm:col-span-1">
                                    <div class="aspect-square rounded-xl bg-white border border-dashed border-slate-300 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors group relative shadow-sm"
                                         (click)="photoInput.click()">
                                        @if (tempPhoto) {
                                            <img [src]="tempPhoto" class="w-full h-full object-cover">
                                            <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <i class="fa-solid fa-camera-rotate text-white text-xl"></i>
                                            </div>
                                        } @else {
                                            <i class="fa-solid fa-camera text-2xl text-slate-300 mb-2 group-hover:scale-110 transition-transform group-hover:text-teal-500"></i>
                                            <span class="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400 px-2 text-center">Carica Immagine</span>
                                        }
                                    </div>
                                    <input #photoInput type="file" accept="image/*" class="hidden" (change)="handleFile($event)">
                                </div>

                                <!-- Ingredient Details -->
                                <div class="sm:col-span-3 space-y-4">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div class="space-y-1.5 md:col-span-2">
                                            <label class="text-[11px] md:text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Nome Prodotto *</label>
                                            <input type="text" [(ngModel)]="newIngredient.name"
                                                   class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm md:text-base font-bold text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all shadow-sm">
                                        </div>

                                        <div class="space-y-1.5">
                                            <label class="text-[11px] md:text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Produzione/Arrivo</label>
                                            <div class="relative">
                                                 <input type="date" [(ngModel)]="newIngredient.packingDate"
                                                        class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pl-10 text-xs md:text-sm font-bold text-slate-800 outline-none focus:border-teal-400 transition-all shadow-sm">
                                                 <i class="fa-solid fa-calendar-plus absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                            </div>
                                        </div>
                                        <div class="space-y-1.5">
                                            <label class="text-[11px] md:text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Scadenza</label>
                                            <div class="relative">
                                                 <input type="date" [(ngModel)]="newIngredient.expiryDate"
                                                        class="w-full bg-white border border-rose-200 rounded-xl px-4 py-3 pl-10 text-xs md:text-sm font-bold text-slate-800 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all shadow-sm">
                                                 <i class="fa-solid fa-calendar-xmark absolute left-3 top-1/2 -translate-y-1/2 text-rose-400"></i>
                                            </div>
                                        </div>

                                        <div class="space-y-1.5 md:col-span-2">
                                            <label class="text-[11px] md:text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Lotto o Rif. Fattura (Opzionale)</label>
                                            <input type="text" [(ngModel)]="newIngredient.lotto"
                                                   class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm md:text-base font-medium font-mono text-slate-600 outline-none focus:border-teal-400 transition-all shadow-sm">
                                        </div>
                                    </div>

                                    <div class="pt-2">
                                        <button (click)="addIngredient()" [disabled]="!newIngredient.name"
                                                class="w-full py-3 bg-slate-800 text-white flex items-center justify-center gap-2 rounded-xl font-bold text-xs md:text-sm uppercase tracking-widest hover:bg-slate-700 transition-all shadow-[0_4px_10px_rgba(0,0,0,0.1)] border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                            <i class="fa-solid fa-plus text-teal-400"></i> Aggiungi Ingrediente
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Ingredients Table -->
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[500px]">
                        <div class="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
                            <h4 class="text-xs md:text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <i class="fa-solid fa-layer-group text-slate-400"></i> Elenco Componenti Associati
                            </h4>
                            <span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black shadow-sm">
                                {{ ingredientsList().length }} INGR.
                            </span>
                        </div>

                        <div class="overflow-y-auto custom-scrollbar flex-1 bg-white">
                            <table class="w-full text-left border-collapse">
                                <thead class="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                                    <tr>
                                        <th class="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Foto</th>
                                        <th class="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Prodotto</th>
                                        <th class="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Lotto / Rif.</th>
                                        <th class="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">Scadenze</th>
                                        <th class="px-4 py-3 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    @for (ing of ingredientsList(); track ing.id) {
                                        <tr class="hover:bg-slate-50 transition-colors group">
                                            <td class="px-4 py-3">
                                                <div class="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center text-slate-300">
                                                    @if (ing.photo) {
                                                        <img [src]="ing.photo" class="w-full h-full object-cover">
                                                    } @else {
                                                        <i class="fa-solid fa-image text-lg"></i>
                                                    }
                                                </div>
                                            </td>
                                            <td class="px-4 py-3">
                                                <span class="block font-bold text-slate-800 text-sm md:text-base leading-tight">{{ ing.name }}</span>
                                            </td>
                                            <td class="px-4 py-3">
                                                <span class="text-xs font-mono font-bold bg-white px-2 py-1 rounded border border-slate-200 text-slate-600">{{ ing.lotto || 'N/A' }}</span>
                                            </td>
                                            <td class="px-4 py-3">
                                                <div class="flex flex-col gap-0.5">
                                                    <span class="text-xs text-slate-500 font-bold uppercase"><i class="fa-solid fa-circle-xmark text-rose-400 w-4"></i> {{ ing.expiryDate | date:'dd/MM/yy' }}</span>
                                                    <span class="text-xs text-teal-600 font-bold uppercase"><i class="fa-solid fa-calendar-check w-4"></i> {{ ing.packingDate | date:'dd/MM/yy' }}</span>
                                                </div>
                                            </td>
                                            <td class="px-4 py-3 text-right">
                                                <button (click)="removeIngredient(ing.id)" class="w-10 h-10 rounded-lg border border-rose-200 bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center ml-auto">
                                                    <i class="fa-solid fa-trash-can"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    } @empty {
                                        <tr>
                                            <td colspan="5" class="px-4 py-12 text-center bg-slate-50/50">
                                                <i class="fa-solid fa-layer-group text-4xl text-slate-200 mb-3"></i>
                                                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Nessun ingrediente inserito</p>
                                            </td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

        } @else {
            <!-- HISTORY / LIST VIEW -->
            <div class="space-y-6 animate-fade-in">
                <!-- Filter & Actions -->
                <div class="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div class="flex items-center gap-4 w-full md:w-auto">
                        <div class="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 hover:border-teal-400 transition-colors cursor-pointer w-full md:w-auto">
                            <i class="fa-solid fa-calendar-alt text-teal-600"></i>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data Riferimento</span>
                                <input type="date" [value]="state.filterDate()" (change)="state.filterDate.set($any($event.target).value)" 
                                       class="bg-transparent border-none p-0 outline-none text-xs md:text-sm font-bold text-slate-800">
                            </div>
                        </div>
                    </div>

                    <button (click)="startNew()" 
                            class="w-full md:w-auto px-5 py-2.5 bg-teal-600 border border-teal-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-teal-700 hover:-translate-y-0.5 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95">
                        <i class="fa-solid fa-folder-plus text-sm"></i> Nuovo Registro
                    </button>
                </div>

                <!-- Grid of Records -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    @for (rec of filteredRecords(); track rec.id) {
                        <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col h-full group">
                            <!-- Label at top -->
                            <div class="flex items-start justify-between mb-4">
                                <div class="px-2 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold font-mono rounded inline-flex items-center gap-1.5 shadow-sm">
                                    <i class="fa-solid fa-barcode text-slate-400"></i> {{ rec.lotto }}
                                </div>
                                <span class="text-[11px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1.5"><i class="fa-regular fa-clock"></i> {{ rec.recordedDate | date:'HH:mm' }}</span>
                            </div>
                            
                            <h3 class="text-xl md:text-2xl font-bold text-slate-800 mb-2 leading-tight group-hover:text-teal-600 transition-colors line-clamp-2">{{ rec.mainProductName }}</h3>
                            <div class="flex flex-col gap-1.5 mb-6 flex-1">
                                <p class="text-[11px] md:text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <i class="fa-solid fa-box-open w-4 text-center"></i> Conf: <span class="text-slate-700">{{ rec.packagingDate | date:'dd/MM/yy' }}</span>
                                </p>
                                <p class="text-[11px] md:text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <i class="fa-solid fa-calendar-xmark w-4 text-center text-rose-400"></i> Scad: <span class="text-rose-600">{{ rec.expiryDate | date:'dd/MM/yy' }}</span>
                                </p>
                            </div>

                            <!-- Ingredients row summary -->
                            <div class="bg-slate-50/80 rounded-xl p-3 mb-4 border border-slate-100 flex items-center justify-between shadow-inner">
                                <div class="flex -space-x-2">
                                    @for (ing of rec.ingredients.slice(0, 4); track ing.id) {
                                        <div class="w-10 h-10 rounded-full border-2 border-white bg-white overflow-hidden shadow-sm flex items-center justify-center text-xs text-slate-400 font-bold">
                                            @if (ing.photo) {
                                                <img [src]="ing.photo" class="w-full h-full object-cover">
                                            } @else {
                                                {{ ing.name[0] | uppercase }}
                                            }
                                        </div>
                                    }
                                    @if (rec.ingredients.length > 4) {
                                        <div class="w-10 h-10 rounded-full border-2 border-white bg-slate-200 text-slate-600 flex items-center justify-center text-[11px] font-black shadow-sm z-10">
                                            +{{ rec.ingredients.length - 4 }}
                                        </div>
                                    }
                                </div>
                                <div class="text-right flex flex-col items-end">
                                    <span class="block text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Voci Conf.</span>
                                    <span class="text-base md:text-lg font-black text-slate-700">{{ rec.ingredients.length }}</span>
                                </div>
                            </div>

                            <div class="flex gap-2 shrink-0">
                                <button (click)="openDetail(rec)" class="flex-1 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-lg font-bold text-xs uppercase hover:bg-slate-50 hover:text-teal-600 transition-all shadow-sm flex items-center justify-center gap-2">
                                    <i class="fa-solid fa-eye"></i> Apri
                                </button>
                                <button (click)="openLabelPreview(rec)" class="w-12 py-2.5 bg-teal-50 border border-teal-200 text-teal-600 rounded-lg hover:bg-teal-600 hover:text-white transition-all flex items-center justify-center shadow-sm tooltip" title="Etichetta">
                                    <i class="fa-solid fa-print"></i>
                                </button>
                                <button (click)="deleteRecord(rec.id)" class="w-12 py-2.5 bg-white border border-rose-200 text-rose-500 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center shadow-sm tooltip" title="Elimina">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    } @empty {
                        <div class="col-span-full py-20 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                            <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 text-slate-300 shadow-sm border border-slate-100">
                                <i class="fa-solid fa-clipboard-list text-2xl"></i>
                            </div>
                            <h4 class="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Archivio Vuoto</h4>
                            <p class="text-xs text-slate-500 font-medium">Nessuna produzione per la data selezionata.</p>
                        </div>
                    }
                </div>
            </div>
        }

        <!-- LABEL PREVIEW MODAL -->
        @if (isLabelPreviewOpen() && selectedRecordForLabel()) {
            <div class="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" (click)="isLabelPreviewOpen.set(false)"></div>
                
                <div class="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-slide-up border border-slate-200 flex flex-col">
                    <!-- Header Modal -->
                    <div class="px-6 py-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                           <i class="fa-solid fa-print text-teal-600"></i>
                           <h3 class="text-sm font-black text-slate-800 uppercase tracking-widest">Anteprima Etichetta</h3>
                        </div>
                        <button (click)="isLabelPreviewOpen.set(false)" class="text-slate-400 hover:text-slate-600">
                           <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <!-- PREVIEW AREA (The Sticker) -->
                    <div class="p-8 bg-slate-50 flex justify-center items-center overflow-auto min-h-[400px]">
                        <!-- Simulate the Thermal Sticker -->
                        <div id="print-label-sticker" 
                             [class]="'bg-white border-2 border-slate-300 shadow-xl p-6 font-sans text-slate-900 transition-all overflow-hidden ' + 
                                     (state.companyConfig().labelFormat === '12mm' ? 'w-[400px] h-[120px] scale-y-125' : 
                                      state.companyConfig().labelFormat === '29mm' ? 'w-[400px] h-[260px]' : 
                                      'w-[400px] h-[600px]')">
                            
                            <!-- Header Azienda -->
                            <div [class]="'text-center border-b-2 border-black pb-2 mb-4 ' + (state.companyConfig().labelFormat === '12mm' ? 'hidden' : '')">
                                <h4 class="text-xs font-black uppercase tracking-widest">{{ state.companyConfig().name }}</h4>
                                <p class="text-[8px] font-bold opacity-70 uppercase tracking-tighter">{{ state.companyConfig().address }}</p>
                            </div>

                            <!-- Title Section (EVIDENCE) -->
                            <div [class]="(state.companyConfig().labelFormat === '12mm' ? 'mb-2' : 'mb-4')">
                                <p [class]="'text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ' + (state.companyConfig().labelFormat === '12mm' ? 'hidden' : '')">Denominazione Alimento</p>
                                <h2 [class]="'font-black text-black leading-tight uppercase italic break-words ' + 
                                          (state.companyConfig().labelFormat === '12mm' ? 'text-sm' : 'text-xl md:text-2xl')">
                                    {{ selectedRecordForLabel()?.mainProductName }}
                                </h2>
                            </div>

                            <!-- Dates Section (EVIDENCE) -->
                            <div [class]="'grid grid-cols-2 gap-4 ' + (state.companyConfig().labelFormat === '12mm' ? 'mb-2' : 'mb-4')">
                                <div class="p-2 bg-slate-100/50 rounded-lg border border-slate-200">
                                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Produzione</p>
                                    <p [class]="'font-black text-black ' + (state.companyConfig().labelFormat === '12mm' ? 'text-[10px]' : 'text-xs')">
                                        {{ selectedRecordForLabel()?.packagingDate | date:'dd/MM/yy' }}
                                    </p>
                                </div>
                                <div class="p-2 bg-slate-900 text-white rounded-lg">
                                    <p class="text-[8px] font-black text-white/60 uppercase tracking-widest mb-0.5">Scadenza</p>
                                    <p [class]="'font-black ' + (state.companyConfig().labelFormat === '12mm' ? 'text-[10px]' : 'text-xs')">
                                        {{ selectedRecordForLabel()?.expiryDate | date:'dd/MM/yy' }}
                                    </p>
                                </div>
                            </div>

                            <!-- Lotto Section (EVIDENCE) -->
                            <div [class]="(state.companyConfig().labelFormat === '12mm' ? 'mb-0' : 'mb-4') + ' flex items-center gap-3'">
                                <div class="flex-1 bg-white border-2 border-black p-2 rounded-lg text-center">
                                    <p [class]="'font-black text-black uppercase tracking-[0.2em] ' + (state.companyConfig().labelFormat === '12mm' ? 'text-[6px]' : 'text-[8px] mb-0.5')">LOTTO</p>
                                    <p [class]="'font-black text-black tracking-widest font-mono uppercase ' + (state.companyConfig().labelFormat === '12mm' ? 'text-xs' : 'text-base')">
                                        {{ selectedRecordForLabel()?.lotto }}
                                    </p>
                                </div>
                            </div>

                            <!-- Ingredients Section -->
                            <div [class]="'border-t border-slate-200 pt-3 ' + (state.companyConfig().labelFormat === '12mm' ? 'hidden' : '')">
                                <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                   <i class="fa-solid fa-list-ul text-[6px]"></i> Elenco Ingredienti
                                </p>
                                <div class="space-y-0.5">
                                   @for (ing of selectedRecordForLabel()?.ingredients; track ing.id) {
                                      <p class="text-[9px] font-bold text-slate-700 leading-tight flex items-start gap-1">
                                         <span class="text-slate-300 italic">•</span> 
                                         {{ ing.name }}
                                      </p>
                                   }
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer Modal Actions -->
                    <div class="p-6 bg-white border-t border-slate-100 flex gap-4">
                        <button (click)="isLabelPreviewOpen.set(false)" class="flex-1 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                           CHIUDI ANTEPRIMA
                        </button>
                        <button (click)="printLabel(selectedRecordForLabel()!)" class="flex-[2] py-4 bg-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg flex items-center justify-center gap-2">
                           <i class="fa-solid fa-print"></i> LANCIA STAMPA ETICHETTA
                        </button>
                    </div>
                </div>
            </div>
        }
    </div>
    `,
    styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class ProductionLogViewComponent {
    state = inject(AppStateService);
    toast = inject(ToastService);

    isEditing = signal(false);
    isLabelPreviewOpen = signal(false);
    selectedRecordForLabel = signal<ProductionRecord | null>(null);
    ingredientsList = signal<ProductionIngredient[]>([]);
    tempPhoto: string | null = null;

    currentRecord: Partial<ProductionRecord> = {
        mainProductName: '',
        packagingDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        lotto: '',
        ingredients: []
    };

    newIngredient: Partial<ProductionIngredient> = {
        name: '',
        packingDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        lotto: ''
    };

    filteredRecords = computed(() => {
        const selDate = this.state.filterDate(); // Format: YYYY-MM-DD
        const targetClientId = this.state.activeTargetClientId();
        return this.state.productionRecords().filter(r =>
            (targetClientId ? r.clientId === targetClientId : true) && 
            r.recordedDate.startsWith(selDate)
        ).sort((a, b) => b.recordedDate.localeCompare(a.recordedDate));
    });

    startNew() {
        const targetClientId = this.state.activeTargetClientId() || 'demo';
        const selDate = this.state.filterDate(); // Use the global filter date
        const currentTime = new Date().toISOString().split('T')[1];
        
        this.currentRecord = {
            id: Math.random().toString(36).substring(2, 9),
            mainProductName: '',
            packagingDate: selDate,
            expiryDate: '',
            lotto: 'L-' + (Date.now() % 100000).toString().padStart(5, '0'),
            recordedDate: selDate + 'T' + currentTime,
            ingredients: [],
            userId: this.state.currentUser()?.id || 'demo',
            clientId: targetClientId
        };
        this.ingredientsList.set([]);
        this.isEditing.set(true);
    }

    openDetail(rec: ProductionRecord) {
        this.currentRecord = JSON.parse(JSON.stringify(rec));
        this.ingredientsList.set(rec.ingredients || []);
        this.isEditing.set(true);
    }

    cancelEdit() {
        this.isEditing.set(false);
        this.resetForm();
    }

    resetForm() {
        this.tempPhoto = null;
        this.newIngredient = {
            name: '',
            packingDate: this.state.filterDate(),
            expiryDate: '',
            lotto: ''
        };
    }

    async handleFile(event: any) {
        const file = event.target.files[0];
        if (!file) return;

        // Check size: if > 1.5MB, we must compress or warn
        if (file.size > 1.5 * 1024 * 1024) {
             this.toast.info('Ottimizzazione', 'La foto è grande, la sto ottimizzando...');
        }

        try {
            const base64 = await this.compressImage(file);
            this.tempPhoto = base64;
        } catch (err) {
            console.error('Compression failed', err);
            this.toast.error('Errore Foto', 'Impossibile elaborare l\'immagine.');
        }
    }

    private compressImage(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Max dimension 1280px for ingredients photos
                    const max_size = 1200;
                    if (width > height) {
                        if (width > max_size) {
                            height *= max_size / width;
                            width = max_size;
                        }
                    } else {
                        if (height > max_size) {
                            width *= max_size / height;
                            height = max_size;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    // Compress to JPEG with 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }

    addIngredient() {
        if (!this.newIngredient.name) return;

        const ing: ProductionIngredient = {
            id: Math.random().toString(36).substring(2, 9),
            name: this.newIngredient.name,
            packingDate: this.newIngredient.packingDate || '',
            expiryDate: this.newIngredient.expiryDate || '',
            lotto: this.newIngredient.lotto || '',
            photo: this.tempPhoto || undefined
        };

        this.ingredientsList.update(list => [ing, ...list]);
        this.toast.success('Aggiunto', `${ing.name} inserito nella ricetta.`);
        this.resetForm();
    }

    removeIngredient(id: string) {
        this.ingredientsList.update(list => list.filter(i => i.id !== id));
        this.toast.info('Rimosso', 'Ingrediente rimosso dalla produzione.');
    }

    saveRecord() {
        if (!this.currentRecord.mainProductName) return;

        const selDate = this.state.filterDate();
        const currentTime = new Date().toISOString().split('T')[1];

        const finalRecord: ProductionRecord = {
            ...(this.currentRecord as ProductionRecord),
            ingredients: this.ingredientsList(),
            recordedDate: selDate + 'T' + currentTime // Archive on the filtered date
        };

        // Call persistent save
        this.state.saveProductionRecord(finalRecord);

        this.toast.success('Archiviato', `Lotto ${finalRecord.lotto} registrato correttamente.`);
        this.isEditing.set(false);
    }

    deleteRecord(id: string) {
        this.state.deleteProductionRecord(id);
    }

    openLabelPreview(rec: ProductionRecord) {
        this.selectedRecordForLabel.set(rec);
        this.isLabelPreviewOpen.set(true);
    }

    printLabel(rec: ProductionRecord) {
        this.toast.info('Stampa', `Invio etichetta ${rec.lotto} alla stampante Brother...`);
        // We'll simulate the print call here. In a real scenario, this could trigger a browser domestic print 
        // with a specifically styled print stylesheet or use the thermal print drivers if integrated via browser (e.g. print.js).
        setTimeout(() => {
            window.print();
            this.isLabelPreviewOpen.set(false);
            this.toast.success('OK', 'Etichetta inviata con successo.');
        }, 1000);
    }
}
