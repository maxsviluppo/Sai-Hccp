import { Component, inject, signal, effect } from '@angular/core';
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
    <div class="space-y-6 animate-fade-in h-full flex flex-col">
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 class="text-2xl font-bold text-slate-800">Temperature</h2>
                <p class="text-slate-500 text-sm">Controllo temperature attrezzature</p>
            </div>
            
            <!-- Read Only / Context Indicator -->
            <div class="px-4 py-2 bg-slate-100 rounded-lg border border-slate-200 text-xs font-medium text-slate-500">
                <span class="block uppercase text-[10px] tracking-wider text-slate-400 font-bold mb-1">Contesto Dati</span>
                <div class="flex items-center gap-2">
                    <i class="fa-regular fa-calendar"></i> {{ state.filterDate() | date:'dd/MM/yyyy' }}
                    <span class="mx-1">•</span>
                    <i class="fa-regular fa-user"></i> 
                    @if (getDisplayName()) { {{ getDisplayName() }} } @else { Utente Corrente }
                </div>
            </div>
        </div>

        <!-- LIST OF CHECKS -->
        <div class="space-y-4 mt-2">
            @for (check of checks(); track check.id) {
                <div [class]="'bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group transition-all ' + (canEdit() ? 'cursor-pointer hover:border-emerald-200 hover:shadow-md' : 'opacity-80 cursor-default')" 
                     (click)="toggleCheck(check.id)">
                    <div class="flex items-center gap-5">
                        <!-- Large Icon/Checkbox Representation -->
                        <div [class]="'w-14 h-14 rounded-full flex items-center justify-center transition-colors duration-300 ' + (check.checked ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-xl' : 'bg-slate-100 text-slate-300')">
                            <i class="fa-solid fa-check text-2xl"></i>
                        </div>
                        
                        <div class="flex-1">
                            <h3 class="font-bold text-slate-800 text-lg leading-tight uppercase tracking-tight">{{ check.label }}</h3>
                        </div>
                    </div>
                    
                    <!-- Checkmark/Status Indicator Text -->
                    @if (check.checked) {
                        <span class="text-emerald-600 font-bold text-sm tracking-widest uppercase animate-pulse">Verificato</span>
                    } @else {
                        <span class="text-slate-400 font-bold text-sm tracking-widest uppercase">Da Verificare</span>
                    }
                </div>
            }
        </div>
        
        @if (!canEdit()) {
            <p class="text-center text-xs text-slate-400 mt-4 italic">
                * Modalità di sola lettura. Seleziona te stesso o la data odierna per modificare.
            </p>
        }
    </div>
  `,
    styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class TemperaturesViewComponent {
    state = inject(AppStateService);
    moduleId = 'temperatures';

    checks = signal<CheckItem[]>([
        { id: 'fridge', label: 'TEMPERATURE FRIGORIGERI +4°C - +8°C', checked: false },
        { id: 'freezer', label: 'TEMPERATURE CONGELATORI -18°C – 24°C', checked: false }
    ]);

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
