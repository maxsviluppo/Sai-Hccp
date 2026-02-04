import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-suppliers-view',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="space-y-6 pb-10 animate-fade-in h-full flex flex-col">
        <!-- Premium Header with Gradient -->
        <div class="bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-600 p-8 rounded-3xl shadow-2xl border border-blue-500/20 relative overflow-hidden">
          <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <i class="fa-solid fa-truck-field text-9xl text-white"></i>
          </div>

          <div class="relative z-10">
            <h2 class="text-3xl font-black text-white flex items-center tracking-tight">
              <span class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4 shadow-lg border border-white/30">
                  <i class="fa-solid fa-truck-field text-white"></i>
              </span>
              Elenco Fornitori
            </h2>
            <p class="text-blue-50 text-sm mt-2 font-medium ml-1">
              Gestione conformità e requisiti di legge
            </p>
          </div>
        </div>

        <!-- Global Verification Card -->
        <div class="bg-white p-6 rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
             [class.border-blue-300]="globalCheck()"
             [class.shadow-blue-200]="globalCheck()"
             [class.border-slate-200]="!globalCheck()"
             (click)="toggleGlobalCheck()">
            <div class="flex items-center justify-between gap-5">
                <div class="flex items-center gap-5 flex-1">
                    <!-- Large Icon/Checkbox -->
                    <div [class]="'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ' + (globalCheck() ? 'bg-gradient-to-br from-blue-500 to-cyan-600 text-white scale-110 animate-bounce' : 'bg-slate-100 text-slate-300 group-hover:bg-slate-200')">
                        <i class="fa-solid fa-check text-3xl"></i>
                    </div>
                    
                    <div class="flex-1">
                        <h3 class="font-black text-slate-800 text-lg leading-tight tracking-tight"
                            [class.text-blue-700]="globalCheck()">
                          Verifica Requisiti di Legge
                        </h3>
                        <p class="text-slate-500 text-sm mt-1 font-medium">
                          Verifica per tutti i fornitori del possesso dei requisiti di legge
                        </p>
                    </div>
                </div>
                
                <!-- Status Badge -->
                @if (globalCheck()) {
                    <span class="bg-blue-100 text-blue-700 font-black text-sm px-4 py-2 rounded-xl tracking-wide uppercase border-2 border-blue-300 shadow-md">
                      <i class="fa-solid fa-circle-check mr-2"></i>Verificato
                    </span>
                } @else {
                    <span class="bg-slate-100 text-slate-500 font-bold text-sm px-4 py-2 rounded-xl tracking-wide uppercase border-2 border-slate-200">
                      <i class="fa-regular fa-circle mr-2"></i>Da Verificare
                    </span>
                }
            </div>
        </div>
    </div>
  `,
    styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SuppliersViewComponent {
    globalCheck = signal(false);

    toggleGlobalCheck() {
        this.globalCheck.update(v => !v);
    }
}
