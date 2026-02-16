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
    <div class="animate-fade-in p-6 max-w-7xl mx-auto pb-24">
        <!-- Header -->
        <div class="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[40px] p-10 mb-8 border border-white/10 shadow-2xl relative overflow-hidden">
            <div class="absolute top-0 right-0 p-10 opacity-10 pointer-events-none rotate-12">
                <i class="fa-solid fa-boxes-packing text-9xl text-white"></i>
            </div>
            <div class="relative z-10">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 truncate shadow-inner">
                         <i class="fa-solid fa-barcode text-white text-3xl"></i>
                    </div>
                    <div>
                        <h2 class="text-4xl font-black text-white">Rintracciabilità Prodotti</h2>
                        <p class="text-emerald-100 font-black uppercase tracking-[0.2em] text-[10px]">Registro Permanente Produzione e Trasformazione</p>
                    </div>
                </div>
            </div>
        </div>

        @if (isEditing()) {
            <!-- EDITING / CREATION VIEW -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-slide-up">
                <!-- Main Product Card -->
                <div class="lg:col-span-1 space-y-6">
                    <div class="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl overflow-hidden sticky top-6">
                        <div class="flex items-center justify-between mb-8">
                            <h3 class="text-xl font-black text-slate-800">Scheda Prodotto</h3>
                            <div class="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">Master</div>
                        </div>

                        <div class="space-y-6">
                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome Alimento Principale</label>
                                <input type="text" [(ngModel)]="currentRecord.mainProductName" 
                                       placeholder="es. Sugo alla Genovese"
                                       class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold text-slate-800 focus:border-emerald-500 focus:bg-white transition-all outline-none">
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confezionamento</label>
                                    <input type="date" [(ngModel)]="currentRecord.packagingDate"
                                           class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-800 outline-none">
                                </div>
                                <div class="space-y-2">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Scadenza</label>
                                    <input type="date" [(ngModel)]="currentRecord.expiryDate"
                                           class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-800 outline-none border-red-50">
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Numero Lotto (L-XXXX)</label>
                                <input type="text" [(ngModel)]="currentRecord.lotto"
                                       class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-mono font-bold text-emerald-700 outline-none placeholder:font-sans"
                                       placeholder="Genera o inserisci lotto">
                            </div>

                            <div class="pt-6 border-t border-slate-50 flex gap-3">
                                <button (click)="cancelEdit()" class="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Annulla</button>
                                <button (click)="saveRecord()" [disabled]="!currentRecord.mainProductName"
                                        class="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50">
                                    Salva Registro
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Ingredients Section -->
                <div class="lg:col-span-2 space-y-8">
                    <!-- Ingrediente Form -->
                    <div class="bg-indigo-950 rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl">
                        <div class="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                        
                        <div class="relative z-10">
                            <h4 class="text-sm font-black uppercase tracking-[0.2em] mb-8 text-indigo-300">Aggiungi Ingrediente / Materia Prima</h4>
                            
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <!-- Photo Upload -->
                                <div class="col-span-1">
                                    <div class="aspect-square rounded-3xl bg-white/5 border-2 border-dashed border-indigo-400/30 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all group relative"
                                         (click)="photoInput.click()">
                                        @if (tempPhoto) {
                                            <img [src]="tempPhoto" class="w-full h-full object-cover">
                                            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                <i class="fa-solid fa-camera-rotate text-2xl"></i>
                                            </div>
                                        } @else {
                                            <i class="fa-solid fa-camera text-3xl text-indigo-400 mb-2 group-hover:scale-110 transition-transform"></i>
                                            <span class="text-[9px] font-black uppercase tracking-widest text-indigo-300">Carica Foto JPG</span>
                                        }
                                    </div>
                                    <input #photoInput type="file" accept="image/*" class="hidden" (change)="handleFile($event)">
                                </div>

                                <!-- Ingredient Details -->
                                <div class="col-span-2 space-y-4">
                                    <div class="space-y-1">
                                        <label class="text-[9px] font-black text-indigo-300 uppercase tracking-widest px-1">Nome Prodotto</label>
                                        <input type="text" [(ngModel)]="newIngredient.name"
                                               class="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/20 transition-all">
                                    </div>

                                    <div class="grid grid-cols-2 gap-4">
                                        <div class="space-y-1">
                                            <label class="text-[9px] font-black text-indigo-300 uppercase tracking-widest px-1">Produzione/Arrivo</label>
                                            <input type="date" [(ngModel)]="newIngredient.packingDate"
                                                   class="w-full bg-white/10 border border-white/20 rounded-2xl p-3 text-xs font-bold text-white outline-none">
                                        </div>
                                        <div class="space-y-1">
                                            <label class="text-[9px] font-black text-indigo-300 uppercase tracking-widest px-1">Scadenza</label>
                                            <input type="date" [(ngModel)]="newIngredient.expiryDate"
                                                   class="w-full bg-white/10 border border-white/20 rounded-2xl p-3 text-xs font-bold text-white outline-none">
                                        </div>
                                    </div>

                                    <div class="space-y-1">
                                        <label class="text-[9px] font-black text-indigo-300 uppercase tracking-widest px-1">Lotto o Rif. Fattura (Opzionale)</label>
                                        <input type="text" [(ngModel)]="newIngredient.lotto"
                                               class="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm font-bold text-white outline-none">
                                    </div>

                                    <button (click)="addIngredient()" [disabled]="!newIngredient.name"
                                            class="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-xl shadow-indigo-900/50 disabled:opacity-50">
                                        Aggiungi alla Genovese
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Ingredients Table -->
                    <div class="bg-white rounded-[40px] border border-slate-100 shadow-xl overflow-hidden">
                        <div class="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <h4 class="text-sm font-black text-slate-800 uppercase tracking-widest">Elenco Componenti Associati</h4>
                            <span class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-lg">
                                {{ ingredientsList().length }}
                            </span>
                        </div>

                        <div class="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar">
                            <table class="w-full text-left">
                                <thead class="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th class="px-8 py-4">Foto</th>
                                        <th class="px-8 py-4">Prodotto</th>
                                        <th class="px-8 py-4">Lotto / Factory</th>
                                        <th class="px-8 py-4">Scadenze</th>
                                        <th class="px-8 py-4 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-50">
                                    @for (ing of ingredientsList(); track ing.id) {
                                        <tr class="hover:bg-slate-50 transition-colors group">
                                            <td class="px-8 py-4">
                                                <div class="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-inner group-hover:scale-105 transition-transform">
                                                    @if (ing.photo) {
                                                        <img [src]="ing.photo" class="w-full h-full object-cover">
                                                    } @else {
                                                        <div class="w-full h-full flex items-center justify-center text-slate-300">
                                                            <i class="fa-solid fa-image text-lg"></i>
                                                        </div>
                                                    }
                                                </div>
                                            </td>
                                            <td class="px-8 py-4">
                                                <span class="block font-black text-slate-800 text-sm leading-tight">{{ ing.name }}</span>
                                            </td>
                                            <td class="px-8 py-4">
                                                <span class="text-[10px] font-mono font-bold bg-slate-100 px-2 py-1 rounded-lg text-slate-600 border border-slate-200">{{ ing.lotto || 'N/A' }}</span>
                                            </td>
                                            <td class="px-8 py-4">
                                                <div class="flex flex-col gap-1">
                                                    <span class="text-[9px] text-slate-400 font-black uppercase">Scad: {{ ing.expiryDate | date:'dd/MM/yy' }}</span>
                                                    <span class="text-[9px] text-emerald-500 font-bold">Prod: {{ ing.packingDate | date:'dd/MM/yy' }}</span>
                                                </div>
                                            </td>
                                            <td class="px-8 py-4 text-right">
                                                <button (click)="removeIngredient(ing.id)" class="w-10 h-10 rounded-xl bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center">
                                                    <i class="fa-solid fa-trash-can text-xs"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    } @empty {
                                        <tr>
                                            <td colspan="5" class="px-8 py-16 text-center">
                                                <i class="fa-solid fa-layer-group text-4xl text-slate-100 mb-4"></i>
                                                <p class="text-xs font-bold text-slate-300 uppercase tracking-widest italic">Nessun ingrediente inserito</p>
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
            <div class="space-y-8 animate-fade-in">
                <!-- Filter & Actions -->
                <div class="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl">
                    <div class="flex items-center gap-6">
                        <div class="relative group">
                             <div class="flex items-center gap-4 px-6 py-4 bg-slate-50 rounded-3xl border-2 border-slate-100 group-hover:border-emerald-500 transition-all cursor-pointer">
                                <i class="fa-solid fa-calendar-alt text-emerald-600 text-xl"></i>
                                <div class="flex flex-col">
                                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Giorno Archivio</span>
                                    <input type="date" [value]="state.filterDate()" (change)="state.filterDate.set($any($event.target).value)" 
                                           class="bg-transparent border-none p-0 outline-none text-sm font-black text-slate-800">
                                </div>
                             </div>
                        </div>
                    </div>

                    <button (click)="startNew()" 
                            class="px-8 py-5 bg-slate-900 border-b-4 border-slate-950 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 hover:border-emerald-700 transition-all shadow-xl active:scale-95 flex items-center gap-3">
                        <i class="fa-solid fa-plus-circle text-lg"></i> Inizia Registrazione Lotto
                    </button>
                </div>

                <!-- Grid of Records -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    @for (rec of filteredRecords(); track rec.id) {
                        <div class="group bg-white rounded-[40px] p-8 border border-slate-100 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all relative overflow-hidden flex flex-col h-full">
                            <div class="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-emerald-50 transition-colors"></div>
                            
                            <div class="relative z-10 flex-1">
                                <div class="flex items-center justify-between mb-6">
                                    <span class="px-4 py-1.5 bg-slate-900 text-white text-[9px] font-black rounded-full uppercase tracking-widest shadow-lg">Lotto {{ rec.lotto }}</span>
                                    <span class="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{{ rec.recordedDate | date:'HH:mm' }}</span>
                                </div>
                                
                                <h3 class="text-2xl font-black text-slate-800 mb-2 leading-tight group-hover:text-emerald-600 transition-colors">{{ rec.mainProductName }}</h3>
                                <div class="flex items-center gap-2 mb-6">
                                    <i class="fa-solid fa-clock-rotate-left text-xs text-slate-300"></i>
                                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Confezionato: {{ rec.packagingDate | date:'dd MMMM yyyy' }}</span>
                                </div>

                                <div class="bg-slate-50 rounded-3xl p-5 mb-8 border border-slate-100 flex items-center justify-between">
                                    <div class="flex -space-x-3">
                                        @for (ing of rec.ingredients.slice(0, 4); track ing.id) {
                                            <div class="w-10 h-10 rounded-full border-2 border-white bg-white overflow-hidden shadow-sm">
                                                @if (ing.photo) {
                                                    <img [src]="ing.photo" class="w-full h-full object-cover">
                                                } @else {
                                                    <div class="w-full h-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-300 font-black">{{ ing.name[0] }}</div>
                                                }
                                            </div>
                                        }
                                        @if (rec.ingredients.length > 4) {
                                            <div class="w-10 h-10 rounded-full border-2 border-white bg-slate-800 text-white flex items-center justify-center text-[10px] font-black shadow-lg">
                                                +{{ rec.ingredients.length - 4 }}
                                            </div>
                                        }
                                    </div>
                                    <div class="text-right">
                                        <span class="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Componenti</span>
                                        <span class="text-lg font-black text-slate-800">{{ rec.ingredients.length }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="pt-6 border-t border-slate-50 flex gap-2">
                                <button (click)="openDetail(rec)" class="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">Dettagli</button>
                                <button (click)="deleteRecord(rec.id)" class="w-14 py-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    } @empty {
                        <div class="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[60px] border-4 border-dashed border-slate-50 opacity-60">
                            <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 text-slate-200 shadow-inner">
                                <i class="fa-solid fa-clipboard-list text-4xl"></i>
                            </div>
                            <h4 class="text-xl font-black text-slate-300 uppercase tracking-[0.2em]">Archivio Vuoto</h4>
                            <p class="text-xs text-slate-400 mt-2 font-bold italic">Nessuna produzione registrata per la data selezionata.</p>
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
        const client = this.state.currentUser()?.clientId || 'demo';
        return this.state.productionRecords().filter(r =>
            r.clientId === client && r.recordedDate.startsWith(selDate)
        ).sort((a, b) => b.recordedDate.localeCompare(a.recordedDate));
    });

    startNew() {
        this.currentRecord = {
            id: Math.random().toString(36).substring(2, 9),
            mainProductName: '',
            packagingDate: new Date().toISOString().split('T')[0],
            expiryDate: '',
            lotto: 'L-' + (Date.now() % 100000).toString().padStart(5, '0'),
            recordedDate: new Date().toISOString(),
            ingredients: [],
            userId: this.state.currentUser()?.id || 'demo',
            clientId: this.state.currentUser()?.clientId || 'demo'
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
            packingDate: new Date().toISOString().split('T')[0],
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

        const finalRecord: ProductionRecord = {
            ...(this.currentRecord as ProductionRecord),
            ingredients: this.ingredientsList(),
            recordedDate: new Date().toISOString() // Update to current time saved
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
