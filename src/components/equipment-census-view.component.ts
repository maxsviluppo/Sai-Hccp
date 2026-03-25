import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';

@Component({
    selector: 'app-equipment-census-view',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="animate-fade-in space-y-6 max-w-7xl mx-auto p-4 pb-24">

        <!-- Premium Header -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden mb-2">
            <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
            <div class="relative z-10 flex items-center gap-5">
                <div class="h-14 w-14 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-sm text-indigo-600 shrink-0">
                    <i class="fa-solid fa-microchip text-2xl"></i>
                </div>
                <div>
                    <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Censimento Attrezzature</h2>
                    <p class="text-xs font-semibold text-slate-500 mt-1">Registro attrezzature per monitoraggio HACCP — <span class="text-indigo-600">{{ state.companyConfig().name }}</span></p>
                </div>
            </div>
            <!-- Stats -->
            <div class="flex items-center gap-3 relative z-10 flex-wrap">
                <div class="px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-center min-w-[80px]">
                    <div class="text-2xl font-black text-indigo-600">{{ state.groupedEquipment().length }}</div>
                    <div class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Totale</div>
                </div>
                <div class="px-4 py-2 bg-sky-50 rounded-xl border border-sky-100 text-center min-w-[80px]">
                    <div class="text-2xl font-black text-sky-600">{{ coldCount() }}</div>
                    <div class="text-[9px] font-black text-sky-400 uppercase tracking-widest">Freddo</div>
                </div>
                <div class="px-4 py-2 bg-orange-50 rounded-xl border border-orange-100 text-center min-w-[80px]">
                    <div class="text-2xl font-black text-orange-500">{{ hotCount() }}</div>
                    <div class="text-[9px] font-black text-orange-400 uppercase tracking-widest">Caldo</div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- ===== ADD PANEL ===== -->
            <div class="lg:col-span-1">
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
                    <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                            <i class="fa-solid fa-plus text-sm"></i>
                        </div>
                        <div>
                            <h3 class="text-sm font-bold text-slate-800">Aggiungi Attrezzatura</h3>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dal selettore rapido o a mano</p>
                        </div>
                    </div>

                    <div class="p-5 space-y-4">
                        <!-- Tipo Controllo -->
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tipologia Monitoraggio</label>
                            <div class="flex gap-2">
                                @for (t of types; track t.value) {
                                    <button (click)="selectedType.set(t.value)"
                                            class="flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-1.5"
                                            [class.bg-indigo-600]="selectedType() === t.value && t.value === 'Altro'"
                                            [class.text-white]="selectedType() === t.value"
                                            [class.border-indigo-600]="selectedType() === t.value && t.value === 'Altro'"
                                            [class.bg-sky-500]="selectedType() === t.value && t.value === 'Freddo'"
                                            [class.border-sky-500]="selectedType() === t.value && t.value === 'Freddo'"
                                            [class.bg-orange-500]="selectedType() === t.value && t.value === 'Caldo'"
                                            [class.border-orange-500]="selectedType() === t.value && t.value === 'Caldo'"
                                            [class.bg-white]="selectedType() !== t.value"
                                            [class.text-slate-500]="selectedType() !== t.value"
                                            [class.border-slate-200]="selectedType() !== t.value">
                                        <i [class]="'fa-solid text-xs ' + t.icon"></i>
                                        {{ t.label }}
                                    </button>
                                }
                            </div>
                        </div>

                        <!-- Selettore rapido -->
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Selettore Rapido</label>
                            <div class="relative">
                                <select #equipSelector
                                        (change)="onAddFromSelect(equipSelector.value); equipSelector.value = ''"
                                        class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer hover:border-indigo-200 shadow-sm">
                                    <option value="" disabled selected>Scegli dal catalogo...</option>
                                    @for (group of masterEquipmentList; track group.area) {
                                        <optgroup [label]="group.area">
                                            @for (item of group.items; track item) {
                                                <option [value]="item">{{ item }}</option>
                                            }
                                        </optgroup>
                                    }
                                </select>
                                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <i class="fa-solid fa-chevron-down text-xs"></i>
                                </div>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <div class="flex-1 h-px bg-slate-100"></div>
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">oppure</span>
                            <div class="flex-1 h-px bg-slate-100"></div>
                        </div>

                        <!-- Nome personalizzato -->
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nome Personalizzato</label>
                            <div class="flex gap-2">
                                <div class="relative flex-1">
                                    <i class="fa-solid fa-keyboard absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                                    <input type="text"
                                           [(ngModel)]="customName"
                                           placeholder="Es. Abbattitore celle A"
                                           (keydown.enter)="onAddCustom()"
                                           class="w-full pl-8 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white transition-all hover:border-indigo-200 shadow-sm placeholder:font-normal">
                                </div>
                                <button (click)="onAddCustom()"
                                        [disabled]="!customName.trim()"
                                        class="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
                                    <i class="fa-solid fa-plus"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Info box -->
                        <div class="p-3 rounded-xl border text-[10px] font-bold leading-relaxed flex items-start gap-2 transition-all"
                             [class.bg-sky-50]="selectedType() === 'Freddo'" [class.border-sky-100]="selectedType() === 'Freddo'" [class.text-sky-600]="selectedType() === 'Freddo'"
                             [class.bg-orange-50]="selectedType() === 'Caldo'" [class.border-orange-100]="selectedType() === 'Caldo'" [class.text-orange-600]="selectedType() === 'Caldo'"
                             [class.bg-slate-50]="selectedType() === 'Altro'" [class.border-slate-100]="selectedType() === 'Altro'" [class.text-slate-500]="selectedType() === 'Altro'">
                            <i [class]="'fa-solid mt-0.5 ' + currentTypeIcon()"></i>
                            <span>{{ currentTypeInfo() }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ===== EQUIPMENT LIST ===== -->
            <div class="lg:col-span-2">
                @if (state.groupedEquipment().length === 0) {
                    <div class="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm text-center">
                        <div class="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 text-slate-300 shadow-sm">
                            <i class="fa-solid fa-list-check text-3xl"></i>
                        </div>
                        <h4 class="text-base font-bold text-slate-400 mb-1">Nessuna Attrezzatura</h4>
                        <p class="text-xs text-slate-400 font-medium">Usa il pannello laterale per aggiungere le prime attrezzature.</p>
                    </div>
                } @else {
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        @for (eq of state.groupedEquipment(); track eq.id) {
                            @let eqType = getType(eq);
                            <div class="group bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between transition-all hover:shadow-md animate-slide-up"
                                 [class.border-sky-200]="eqType === 'Freddo'" [class.hover:border-sky-300]="eqType === 'Freddo'"
                                 [class.border-orange-200]="eqType === 'Caldo'" [class.hover:border-orange-300]="eqType === 'Caldo'"
                                 [class.border-slate-200]="eqType === 'Altro'" [class.hover:border-indigo-200]="eqType === 'Altro'">

                                <div class="flex items-center gap-3">
                                    <!-- Icon -->
                                    <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm transition-all group-hover:scale-105"
                                         [class.bg-sky-50]="eqType === 'Freddo'" [class.border-sky-200]="eqType === 'Freddo'" [class.text-sky-500]="eqType === 'Freddo'"
                                         [class.bg-orange-50]="eqType === 'Caldo'" [class.border-orange-200]="eqType === 'Caldo'" [class.text-orange-500]="eqType === 'Caldo'"
                                         [class.bg-slate-50]="eqType === 'Altro'" [class.border-slate-200]="eqType === 'Altro'" [class.text-slate-400]="eqType === 'Altro'">
                                        <i [class]="'fa-solid text-base ' + getIcon(eq, eqType)"></i>
                                    </div>
                                    <!-- Info -->
                                    <div>
                                        <span class="block font-bold text-slate-800 text-sm leading-tight">{{ eq.name }}</span>
                                        <div class="flex items-center gap-1.5 mt-0.5">
                                            <span class="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border"
                                                  [class.bg-sky-50]="eqType === 'Freddo'" [class.border-sky-200]="eqType === 'Freddo'" [class.text-sky-600]="eqType === 'Freddo'"
                                                  [class.bg-orange-50]="eqType === 'Caldo'" [class.border-orange-200]="eqType === 'Caldo'" [class.text-orange-600]="eqType === 'Caldo'"
                                                  [class.bg-slate-50]="eqType === 'Altro'" [class.border-slate-200]="eqType === 'Altro'" [class.text-slate-500]="eqType === 'Altro'">
                                                <i [class]="'fa-solid mr-1 ' + (eqType === 'Freddo' ? 'fa-snowflake' : eqType === 'Caldo' ? 'fa-fire' : 'fa-circle-check')"></i>
                                                {{ eqType === 'Freddo' ? 'Catena Freddo' : eqType === 'Caldo' ? 'Catena Caldo' : 'Semplice' }}
                                            </span>
                                            <span class="text-[9px] text-slate-400 font-bold">{{ eq.area }}</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Delete -->
                                <button (click)="onRemoveByName(eq.name)"
                                        class="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:border-red-300 hover:bg-red-50 hover:text-red-500 transition-all flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 active:scale-90">
                                    <i class="fa-solid fa-trash-can text-xs"></i>
                                </button>
                            </div>
                        }
                    </div>
                }
            </div>
        </div>
    </div>
    `,
    styles: [`
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    `]
})
export class EquipmentCensusViewComponent {
    state = inject(AppStateService);
    toast = inject(ToastService);

    selectedType = signal<string>('Altro');
    customName = '';

    types = [
        { value: 'Altro', label: 'Semplice', icon: 'fa-circle-check' },
        { value: 'Freddo', label: 'Freddo', icon: 'fa-snowflake' },
        { value: 'Caldo', label: 'Caldo', icon: 'fa-fire' }
    ];

    coldCount = computed(() => this.state.selectedEquipment().filter((e: any) => e.type === 'Freddo').length);
    hotCount  = computed(() => this.state.selectedEquipment().filter((e: any) => e.type === 'Caldo').length);

    masterEquipmentList = [
        { area: 'Cucina', items: ['Frigo', 'Congelatore', 'Piano cottura', 'Forno', 'Griglie', 'Friggitrice', 'Banchi lavori', 'Forno a legna', 'Affettatrice', 'Taglia verdure', 'Campana sottovuoto', 'Banco frigo', 'Cappa aspirante', 'Abbattitore'] },
        { area: 'Area Lavaggio', items: ['Lavello', 'Lavastoviglie', 'Mobile pensile', 'Tavolo da lavoro'] },
        { area: 'Deposito', items: ['Cella frigorifero', 'Pozzetto congelatore'] },
        { area: 'Sala', items: ['Vetrina espositiva', 'Banco frigo espositivo'] },
        { area: 'Spogliatoi', items: ['Microonde'] }
    ];

    currentTypeIcon = computed(() => {
        const t = this.selectedType();
        if (t === 'Freddo') return 'fa-snowflake';
        if (t === 'Caldo') return 'fa-fire';
        return 'fa-circle-check';
    });

    currentTypeInfo = computed(() => {
        const t = this.selectedType();
        if (t === 'Freddo') return 'Monitoraggio catena del freddo: richiederà inserimento temperatura nel registro operativo (target: ≤ +4°C / ≤ -18°C).';
        if (t === 'Caldo') return 'Monitoraggio catena del caldo: richiederà inserimento temperatura nel registro operativo (target: ≥ 65°C).';
        return 'Controllo semplice: nessuna rilevazione temperatura richiesta.';
    });

    getType(eq: any): string {
        return (eq as any).type || 'Altro';
    }

    getIcon(eq: any, type: string): string {
        const n = eq.name.toLowerCase();
        if (n.includes('congelatore') || n.includes('abbattitore') || n.includes('pozzetto')) return 'fa-icicles';
        if (n.includes('frigo') || n.includes('cella') || type === 'Freddo') return 'fa-snowflake';
        if (n.includes('forno') || n.includes('cottura') || n.includes('griglie') || n.includes('friggitrice') || type === 'Caldo') return 'fa-fire';
        if (n.includes('lavello') || n.includes('lavastoviglie')) return 'fa-sink';
        if (n.includes('cappa')) return 'fa-fan';
        if (n.includes('affettatrice')) return 'fa-circle-notch';
        if (n.includes('bilancia')) return 'fa-weight-hanging';
        return 'fa-microchip';
    }

    onAddFromSelect(name: string) {
        if (!name) return;
        this.addEquipment(name);
    }

    onAddCustom() {
        const name = this.customName.trim();
        if (!name) return;
        this.addEquipment(name);
        this.customName = '';
    }

    private addEquipment(name: string) {
        if (this.state.groupedEquipment().some(eq => eq.name === name)) {
            this.toast.info('Già Presente', `"${name}" è già nel censimento.`);
            return;
        }
        this.state.addEquipment('Generale', name, this.selectedType());
        this.toast.success('Aggiunto ✓', `${name} — ${this.selectedType() === 'Freddo' ? 'Catena Freddo' : this.selectedType() === 'Caldo' ? 'Catena Caldo' : 'Controllo Semplice'}`);
    }

    onRemoveByName(name: string) {
        const raw = this.state.selectedEquipment();
        const toRemove = raw.filter((e: any) => {
            const cleaned = e.name.replace(/\s+n\.\d+/i, '').replace(/\s+\d+$/i, '').trim();
            return cleaned === name;
        });
        toRemove.forEach((e: any) => this.state.removeEquipment(e.id));
        this.toast.info('Rimosso', `"${name}" eliminato dal censimento.`);
    }
}
