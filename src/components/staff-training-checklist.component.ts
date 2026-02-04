import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CheckItem {
  id: string;
  label: string;
  checked: boolean;
}

@Component({
  selector: 'app-staff-training-checklist',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 pb-10 animate-fade-in h-full flex flex-col">
        <!-- Premium Header with Gradient -->
        <div class="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 p-8 rounded-3xl shadow-2xl border border-purple-500/20 relative overflow-hidden">
          <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <i class="fa-solid fa-user-graduate text-9xl text-white"></i>
          </div>

          <div class="relative z-10">
            <h2 class="text-3xl font-black text-white flex items-center tracking-tight">
              <span class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4 shadow-lg border border-white/30">
                  <i class="fa-solid fa-user-graduate text-white"></i>
              </span>
              Formazione Personale
            </h2>
            <p class="text-purple-50 text-sm mt-2 font-medium ml-1">
              Verifica competenze e procedure di sicurezza alimentare
            </p>
          </div>
        </div>

        <!-- LIST OF CHECKS -->
        <div class="space-y-4">
            @for (check of checks(); track check.id) {
                <div class="bg-white p-6 rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer group"
                     [class.border-purple-300]="check.checked"
                     [class.shadow-purple-200]="check.checked"
                     [class.border-slate-200]="!check.checked"
                     (click)="toggleCheck(check.id)">
                    <div class="flex items-center justify-between gap-5">
                        <div class="flex items-center gap-5 flex-1">
                            <!-- Large Icon/Checkbox -->
                            <div [class]="'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ' + (check.checked ? 'bg-gradient-to-br from-purple-500 to-violet-600 text-white scale-110 animate-bounce' : 'bg-slate-100 text-slate-300 group-hover:bg-slate-200')">
                                <i class="fa-solid fa-check text-3xl"></i>
                            </div>
                            
                            <div class="flex-1">
                                <h3 class="font-black text-slate-800 text-lg leading-tight tracking-tight"
                                    [class.text-purple-700]="check.checked">
                                  {{ check.label }}
                                </h3>
                            </div>
                        </div>
                        
                        <!-- Status Badge -->
                        @if (check.checked) {
                            <span class="bg-purple-100 text-purple-700 font-black text-sm px-4 py-2 rounded-xl tracking-wide uppercase border-2 border-purple-300 shadow-md">
                              <i class="fa-solid fa-circle-check mr-2"></i>Verificato
                            </span>
                        } @else {
                            <span class="bg-slate-100 text-slate-500 font-bold text-sm px-4 py-2 rounded-xl tracking-wide uppercase border-2 border-slate-200">
                              <i class="fa-regular fa-circle mr-2"></i>Da Verificare
                            </span>
                        }
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
export class StaffTrainingChecklistComponent {
  checks = signal<CheckItem[]>([
    { id: 't-1', label: 'VERIFICA POSSESSO ATTESTATO DI FORMAZIONE (HACCP / Sicurezza)', checked: false },
    { id: 't-2', label: 'PROCEDERE CON GLI AGGIORNAMENTI IN SICUREZZA ALIMENTARE', checked: false },
    { id: 't-3', label: 'CONTROLLARE LE ISTRUZIONI DI LAVORO E PROCEDURE OPERATIVE', checked: false }
  ]);

  toggleCheck(id: string) {
    this.checks.update(items =>
      items.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    );
  }
}
