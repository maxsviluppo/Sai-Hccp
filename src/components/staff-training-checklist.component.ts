import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';

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
          
          <div class="relative z-10 mt-6 flex flex-col gap-2">
            <div class="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 w-fit">
                <i class="fa-solid fa-graduation-cap text-white text-lg"></i>
                <span class="text-white font-bold">{{ checkedCount() }} / {{ checks().length }}</span>
            </div>
            <div class="text-xs text-purple-100 font-medium flex items-center gap-2">
                <i class="fa-regular fa-calendar"></i>
                {{ state.filterDate() | date:'dd/MM/yyyy' }}
            </div>
          </div>
        </div>

        <!-- LIST OF CHECKS -->
        <div class="space-y-4">
            @for (check of checks(); track check.id) {
                <div class="bg-white p-6 rounded-2xl shadow-lg border-2 transition-all duration-300 group"
                     [class.cursor-pointer]="canEdit()"
                     [class.cursor-not-allowed]="!canEdit()"
                     [class.opacity-60]="!canEdit()"
                     [class.border-purple-300]="check.checked"
                     [class.shadow-purple-200]="check.checked"
                     [class.border-slate-200]="!check.checked"
                     (click)="toggleCheck(check.id)">
                    <div class="flex items-center justify-between gap-5">
                        <div class="flex items-center gap-5 flex-1">
                            <!-- Large Icon/Checkbox -->
                            <div [class]="'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ' + (check.checked ? 'bg-gradient-to-br from-purple-500 to-violet-600 text-white scale-110' : 'bg-slate-100 text-slate-300')">
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

        @if (!canEdit()) {
            <div class="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                <i class="fa-solid fa-lock text-yellow-600 mt-0.5"></i>
                <p class="text-sm text-yellow-800 font-medium">
                    Modalità di sola lettura. Seleziona un'unità operativa per modificare i dati.
                </p>
            </div>
        }
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StaffTrainingChecklistComponent {
  state = inject(AppStateService);
  moduleId = 'staff-training';

  checks = signal<CheckItem[]>([
    { id: 't-1', label: 'VERIFICA POSSESSO ATTESTATO DI FORMAZIONE (HACCP / Sicurezza)', checked: false },
    { id: 't-2', label: 'PROCEDERE CON GLI AGGIORNAMENTI IN SICUREZZA ALIMENTARE', checked: false },
    { id: 't-3', label: 'CONTROLLARE LE ISTRUZIONI DI LAVORO E PROCEDURE OPERATIVE', checked: false }
  ]);

  checkedCount = computed<number>(() => {
    return this.checks().filter((c: CheckItem) => c.checked).length;
  });

  constructor() {
    effect(() => {
      this.state.filterDate();
      this.state.filterCollaboratorId();
      this.state.currentUser();
      this.loadData();
    }, { allowSignalWrites: true });
  }

  loadData() {
    const savedData = this.state.getRecord(this.moduleId);
    if (savedData && Array.isArray(savedData)) {
      this.checks.update(current =>
        current.map(item => {
          const savedItem = savedData.find((s: CheckItem) => s.id === item.id);
          return savedItem ? { ...item, checked: savedItem.checked } : { ...item, checked: false };
        })
      );
    } else {
      this.checks.update(current => current.map(i => ({ ...i, checked: false })));
    }
  }

  canEdit(): boolean {
    return this.state.isContextEditable();
  }

  toggleCheck(id: string) {
    if (!this.canEdit()) return;
    this.checks.update(items =>
      items.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    );
    this.state.saveRecord(this.moduleId, this.checks());
  }
}
