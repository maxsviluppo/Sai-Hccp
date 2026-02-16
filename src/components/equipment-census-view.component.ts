import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';

@Component({
    selector: 'app-equipment-census-view',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="animate-fade-in p-6 max-w-7xl mx-auto pb-24">
        <!-- Header -->
        <div class="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-[40px] p-10 mb-8 border border-white/10 shadow-2xl relative overflow-hidden">
            <div class="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
                <i class="fa-solid fa-microchip text-9xl text-white"></i>
            </div>
            <div class="relative z-10">
                <h2 class="text-4xl font-black text-white mb-2">Censimento Attrezzature</h2>
                <p class="text-indigo-100 font-medium max-w-xl">Elenco completo dei macchinari e delle attrezzature suddivisi per area operativa aziendale.</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- Selector Card -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl sticky top-6">
                    <div class="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 text-2xl shadow-inner">
                        <i class="fa-solid fa-plus-circle"></i>
                    </div>
                    <h3 class="text-xl font-black text-slate-800 mb-2">Aggiungi Elemento</h3>
                    <p class="text-xs text-slate-400 font-bold uppercase tracking-widest mb-8">Seleziona area e macchinario</p>

                    <div class="space-y-4">
                        <div class="space-y-2">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Selettore Rapido</label>
                            <div class="relative group">
                                <select #equipSelector 
                                        (change)="onAdd(equipSelector.value); equipSelector.value = ''"
                                        class="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:bg-white focus:outline-none shadow-sm transition-all appearance-none cursor-pointer">
                                    <option value="" disabled selected>Scegli attrezzatura...</option>
                                    @for (group of masterEquipmentList; track group.area) {
                                        <optgroup [label]="group.area">
                                            @for (item of group.items; track item) {
                                                <option [value]="group.area + '|' + item">{{ item }}</option>
                                            }
                                        </optgroup>
                                    }
                                </select>
                                <div class="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <i class="fa-solid fa-chevron-down text-xs"></i>
                                </div>
                            </div>
                        </div>
                        
                        <div class="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <p class="text-[10px] text-indigo-500 font-bold leading-relaxed italic">
                                L'attrezzatura selezionata verrà inserita automaticamente nel registro della sede aziendale corrente.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- List Card -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Counters -->
                <div class="flex items-center gap-4 mb-2">
                    <div class="px-5 py-2.5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Totale<br>Censiti</span>
                        <span class="text-2xl font-black text-indigo-600 leading-none">{{ state.selectedEquipment().length }}</span>
                    </div>
                </div>

                <!-- Equipment List -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    @for (eq of state.selectedEquipment(); track eq.id) {
                        <div class="bg-white p-6 rounded-[32px] border border-slate-100 shadow-md flex items-center justify-between group animate-slide-up hover:border-indigo-200 transition-all">
                            <div class="flex items-center gap-5">
                                <div class="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all shadow-inner">
                                    <i class="fa-solid fa-microchip text-lg"></i>
                                </div>
                                <div>
                                    <span class="block font-black text-slate-800 text-sm leading-tight mb-1">{{ eq.name }}</span>
                                    <span class="inline-flex px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-lg uppercase tracking-tighter border border-indigo-100">{{ eq.area }}</span>
                                </div>
                            </div>
                            <button (click)="onRemove(eq.id)" 
                                    class="w-10 h-10 rounded-xl bg-red-50 text-red-400 hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-sm active:scale-90">
                                <i class="fa-solid fa-trash-can text-xs"></i>
                            </button>
                        </div>
                    } @empty {
                        <div class="col-span-full flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100 shadow-inner">
                            <div class="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-6 text-slate-200 shadow-sm">
                                <i class="fa-solid fa-list-check text-4xl"></i>
                            </div>
                            <h4 class="text-lg font-black text-slate-300 uppercase tracking-widest">Nessuna Attrezzatura</h4>
                            <p class="text-xs text-slate-400 mt-2 font-medium italic">Usa il pannello laterale per iniziare il censimento</p>
                        </div>
                    }
                </div>
            </div>
        </div>
    </div>
    `
})
export class EquipmentCensusViewComponent {
    state = inject(AppStateService);
    toast = inject(ToastService);

    masterEquipmentList = [
        { area: 'Area Lavaggio', items: ['Mobile pensile', 'Lavello n.1', 'Lavello n.2', 'Tavolo da lavoro'] },
        { area: 'Area Passe 1 e 2', items: ['Frigo n.1', 'Frigo n.2', 'Frigo n.3'] },
        { area: 'Area Somministrazione', items: ['Congelatore', 'Piano cottura'] },
        { area: 'Area Laboratorio', items: ['Frigo n.1', 'Frigo n.2', 'Frigo n.3', 'Griglie', 'Banchi lavori', 'Forno a legna', 'Lavello', 'Lavabicchieri', 'Affettatrice', 'Taglia verdure', 'Campana sottovuoto', 'Banco frigo', 'Cappa aspirante'] },
        { area: 'Area Deposito', items: ['Frigo n.1', 'Frigo n.2', 'Cella frigorifero'] },
        { area: 'Area Spogliatoi', items: ['Armadietto n.1', 'Armadietto n.2', 'Armadietto n.3', 'Armadietto n.4', 'Microonde'] }
    ];

    onAdd(value: string) {
        if (!value) return;
        const [area, name] = value.split('|');
        this.state.addEquipment(area, name);
        this.toast.success('Aggiunto', `${name} in ${area}`);
    }

    onRemove(id: string) {
        this.state.removeEquipment(id);
        this.toast.info('Rimosso', 'Elemento eliminato dal censimento.');
    }
}
