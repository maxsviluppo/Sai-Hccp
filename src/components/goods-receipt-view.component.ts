import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CheckItem {
    id: string;
    label: string;
    checked: boolean;
}

@Component({
    selector: 'app-goods-receipt-view',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="space-y-8 pb-10">
        <!-- Premium Header Banner -->
        <div class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 rounded-3xl shadow-xl border border-indigo-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <i class="fa-solid fa-box-open text-9xl text-white"></i>
            </div>
            
            <div class="relative z-10">
                <h2 class="text-3xl font-black text-white flex items-center tracking-tight">
                    <span class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mr-4 shadow-lg border border-white/30">
                        <i class="fa-solid fa-box-open"></i>
                    </span>
                    Ricezione Prodotti
                </h2>
                <p class="text-purple-100 text-sm mt-2 font-medium ml-1">
                    Controllo conformità merce in arrivo
                </p>
            </div>
            
            <div class="relative z-10">
                <div class="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20">
                    <i class="fa-solid fa-clipboard-check text-white text-lg"></i>
                    <span class="text-white font-bold">{{ checkedCount() }} / {{ checks().length }}</span>
                </div>
            </div>
        </div>

        <!-- Checks Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (check of checks(); track check.id) {
                <div class="bg-white p-6 rounded-2xl shadow-sm border-2 transition-all duration-300 cursor-pointer group"
                     [class.border-indigo-200]="!check.checked"
                     [class.border-indigo-500]="check.checked"
                     [class.bg-indigo-50]="check.checked"
                     [class.shadow-lg]="check.checked"
                     [class.shadow-indigo-200/50]="check.checked"
                     (click)="toggleCheck(check.id)">
                    
                    <div class="flex items-start gap-4">
                        <div class="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
                             [class.bg-indigo-500]="check.checked"
                             [class.text-white]="check.checked"
                             [class.shadow-lg]="check.checked"
                             [class.shadow-indigo-200]="check.checked"
                             [class.bg-slate-100]="!check.checked"
                             [class.text-slate-400]="!check.checked">
                            <i class="fa-solid text-2xl"
                               [class.fa-check-circle]="check.checked"
                               [class.fa-box]="!check.checked"></i>
                        </div>
                        
                        <div class="flex-1 min-w-0">
                            <h3 class="font-bold text-slate-800 text-base leading-tight mb-2">
                                {{ check.label }}
                            </h3>
                            
                            <div class="flex items-center gap-2">
                                @if (check.checked) {
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500 text-white text-xs font-bold rounded-full">
                                        <i class="fa-solid fa-circle-check"></i>
                                        VERIFICATO
                                    </span>
                                } @else {
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">
                                        <i class="fa-regular fa-circle"></i>
                                        DA VERIFICARE
                                    </span>
                                }
                            </div>
                        </div>
                    </div>
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
export class GoodsReceiptViewComponent {
    checks = signal<CheckItem[]>([
        { id: 'packaging', label: 'VERIFICA ASPETTO IMBALLI', checked: false },
        { id: 'expiry', label: 'VERIFICA SCADENZA E LOTTO', checked: false },
        { id: 'transport', label: 'VERIFICA CORRETTE CONDIZIONI DI TRASPORTO', checked: false }
    ]);

    checkedCount = computed<number>(() => {
        return this.checks().filter((c: CheckItem) => c.checked).length;
    });

    toggleCheck(id: string) {
        this.checks.update(items =>
            items.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
        );
    }
}
