import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CheckItem {
    id: string;
    label: string;
    checked: boolean;
}

@Component({
    selector: 'app-cleaning-products-view',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="space-y-6 animate-fade-in h-full flex flex-col">
        <!-- Header -->
        <div>
            <h2 class="text-2xl font-bold text-slate-800">Prodotti Pulizia</h2>
            <p class="text-slate-500 text-sm">Verifiche igiene e pulizia</p>
        </div>

        <!-- LIST OF CHECKS -->
        <div class="space-y-4 mt-2">
            @for (check of checks(); track check.id) {
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all" (click)="toggleCheck(check.id)">
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
    </div>
  `,
    styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class CleaningProductsViewComponent {
    checks = signal<CheckItem[]>([
        { id: 'abiti', label: 'PULIZIA ABITI DA LAVORO', checked: false },
        { id: 'igiene', label: 'IGIENE DELLA PERSONA (CAPELLI RACCOLTI, UNGHIE PULITE, ASSENZA FERITE, TOSSE O ALTRO)', checked: false }
    ]);

    toggleCheck(id: string) {
        this.checks.update(items =>
            items.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
        );
    }
}
