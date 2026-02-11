import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';

interface CheckItem {
    id: string;
    label: string;
    checked: boolean;
}

@Component({
    selector: 'app-temperatures-view',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="space-y-8 pb-10">
        <!-- Enhanced UI Header -->
        <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-700 relative overflow-hidden">
            <div class="absolute inset-0 bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
            <div class="relative z-10">
                <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg border border-white/10">
                            <i class="fa-solid fa-temperature-three-quarters text-white text-2xl"></i>
                        </div>
                        <div>
                            <h2 class="text-3xl font-black text-white">Temperature</h2>
                            <p class="text-slate-400 text-sm font-medium">Monitoraggio catena del freddo</p>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                        <!-- Checked Indicator -->
                        <div class="bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex-1 sm:flex-initial">
                            <div class="flex justify-between items-end mb-1.5">
                                <span class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Verificati</span>
                                <span class="text-sm font-black text-white">{{ checkedCount() }} / {{ checks().length }}</span>
                            </div>
                            <div class="w-40 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full transition-all duration-700"
                                     [style.width.%]="(checkedCount() / (checks().length || 1)) * 100"></div>
                            </div>
                        </div>

                        <div class="bg-emerald-500/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-emerald-500/20 flex items-center gap-3">
                            <div class="text-left">
                                <div class="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Sistema</div>
                                <div class="text-sm font-bold text-white flex items-center">
                                    <i class="fa-solid fa-circle-check mr-2 text-emerald-400"></i> {{ canEdit() ? 'Operativo' : 'Sola Lettura' }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (check of checks(); track check.id) {
                <div class="bg-white p-6 rounded-2xl shadow-sm border-2 transition-all duration-300 group"
                     [class.cursor-pointer]="canEdit()" [class.cursor-not-allowed]="!canEdit()" [class.opacity-60]="!canEdit()"
                     [class.border-cyan-200]="!check.checked" [class.border-cyan-500]="check.checked"
                     [class.bg-cyan-50]="check.checked" [class.shadow-lg]="check.checked" [class.shadow-cyan-200/50]="check.checked"
                     (click)="toggleCheck(check.id)">
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
                             [class.bg-cyan-500]="check.checked" [class.text-white]="check.checked" [class.shadow-lg]="check.checked"
                             [class.shadow-cyan-200]="check.checked" [class.bg-slate-100]="!check.checked" [class.text-slate-400]="!check.checked">
                            <i class="fa-solid text-2xl" [class.fa-check-circle]="check.checked" [class.fa-temperature-arrow-down]="!check.checked"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h3 class="font-bold text-slate-800 text-base leading-tight mb-2">{{ check.label }}</h3>
                            <div class="flex items-center gap-2">
                                @if (check.checked) {
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500 text-white text-xs font-bold rounded-full">
                                        <i class="fa-solid fa-circle-check"></i> VERIFICATO
                                    </span>
                                } @else {
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">
                                        <i class="fa-regular fa-circle"></i> DA VERIFICARE
                                    </span>
                                }
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
        @if (!canEdit()) {
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <i class="fa-solid fa-lock text-yellow-600 mt-0.5"></i>
                <p class="text-sm text-yellow-800 font-medium">Modalità di sola lettura. Seleziona un'unità operativa per modificare i dati.</p>
            </div>
        }
    </div>
  `,
    styles: [`
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .bg-grid-slate-700\/25 {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(51 65 85 / 0.25)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
    }
  `]
})
export class TemperaturesViewComponent {
    state = inject(AppStateService);
    moduleId = 'temperatures';

    checks = signal<CheckItem[]>([
        { id: 'fridge', label: 'TEMPERATURE FRIGORIGERI +4°C - +8°C', checked: false },
        { id: 'freezer', label: 'TEMPERATURE CONGELATORI -18°C – 24°C', checked: false }
    ]);

    checkedCount = computed<number>(() => {
        return this.checks().filter((c: CheckItem) => c.checked).length;
    });

    constructor() {
        // React to global filter changes (Date or User)
        effect(() => {
            // Dependencies
            this.state.filterDate();
            this.state.filterCollaboratorId();
            this.state.currentUser();

            this.loadData();
        }, { allowSignalWrites: true });
    }

    loadData() {
        const savedData = this.state.getRecord(this.moduleId);
        if (savedData && Array.isArray(savedData)) {
            // Merge saved state with current structure
            this.checks.update(current =>
                current.map(item => {
                    const savedItem = savedData.find((s: CheckItem) => s.id === item.id);
                    return savedItem ? { ...item, checked: savedItem.checked } : { ...item, checked: false };
                })
            );
        } else {
            // Reset if no data
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

        this.checks.update(items =>
            items.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
        );

        // Auto-save to central store
        this.state.saveRecord(this.moduleId, this.checks());
    }
}
