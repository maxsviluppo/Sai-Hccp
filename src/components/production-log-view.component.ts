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
        
        <!-- Minimal Hero Header -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 flex flex-col md:flex-row justify-between md:items-center gap-6 relative overflow-hidden">
            <!-- Subtle accent -->
            <div class="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            
            <div class="relative z-10 flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-100 shadow-sm shrink-0">
                    <i class="fa-solid fa-barcode text-xl"></i>
                </div>
                <div>
                    <h2 class="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Rintracciabilità Prodotti</h2>
                    <div class="flex flex-wrap items-center gap-2 mt-1">
                        <span class="flex items-center gap-1.5 px-2 py-0.5 bg-slate-50 text-slate-500 rounded border border-slate-200 text-xs font-black uppercase tracking-widest leading-none">
                            <i class="fa-solid fa-circle text-[10px] animate-pulse text-teal-500"></i>
                            Registro Produzione
                        </span>
                        <span class="flex items-center gap-1.5 px-2 py-0.5 bg-teal-50 text-teal-600 rounded border border-teal-100 text-xs font-black uppercase tracking-widest leading-none">
                            <i class="fa-solid fa-user-check text-[10px]"></i> {{ state.currentUser()?.name }}
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

    handleFile(event: any) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => this.tempPhoto = e.target?.result as string;
            reader.readAsDataURL(file);
        }
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

        this.state.productionRecords.update(list => {
            const others = list.filter(r => r.id !== finalRecord.id);
            return [finalRecord, ...others];
        });

        this.toast.success('Archiviato', `Lotto ${finalRecord.lotto} registrato correttamente.`);
        this.isEditing.set(false);
    }

    deleteRecord(id: string) {
        this.state.productionRecords.update(list => list.filter(r => r.id !== id));
        this.toast.success('Eliminato', 'Scheda di produzione rimossa permanentemente.');
    }
}
