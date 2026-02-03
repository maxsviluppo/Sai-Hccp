
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';
import { FormsModule } from '@angular/forms';

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

interface ChecklistSection {
  title: string;
  colorClass: string;
  icon: string;
  items: ChecklistItem[];
}

@Component({
  selector: 'app-operational-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Header -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 flex items-center">
            <i class="fa-solid fa-clipboard-check mr-3 text-emerald-600"></i>
            Controllo Operativo Giornaliero
          </h2>
          <p class="text-slate-500 text-sm mt-1">
            Lista di verifica per le fasi Pre-Operativa, Operativa e Post-Operativa.
          </p>
        </div>
        <div class="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
           <div class="flex flex-col">
             <span class="text-xs text-slate-400 font-bold uppercase">Data Verifica</span>
             <span class="font-medium text-slate-800">{{ today | date:'dd/MM/yyyy' }}</span>
           </div>
           <div class="h-8 w-px bg-slate-200"></div>
           <div class="flex flex-col">
             <span class="text-xs text-slate-400 font-bold uppercase">Operatore</span>
             <span class="font-medium text-slate-800">{{ state.currentUser()?.name }}</span>
           </div>
        </div>
      </div>

      <!-- Checklist Sections -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        @for (section of sections(); track section.title) {
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full transition-all duration-300"
               [class.ring-2]="getSectionStatus(section) === 'complete'"
               [class.ring-emerald-500]="getSectionStatus(section) === 'complete'"
               [class.ring-offset-2]="getSectionStatus(section) === 'complete'">
            
            <!-- Section Header -->
            <div [class]="'p-4 border-b flex items-center justify-between gap-3 ' + section.colorClass">
               <div class="flex items-center gap-3">
                 <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                   <i [class]="'fa-solid ' + section.icon"></i>
                 </div>
                 <div>
                   <h3 class="font-bold text-white leading-tight">{{ section.title }}</h3>
                   <!-- Progress Text Small -->
                   <p class="text-[10px] text-white/80 font-medium">
                     {{ getCheckedCount(section) }}/{{ section.items.length }} Completati
                   </p>
                 </div>
               </div>

               <!-- Status Icon Badge -->
               @switch (getSectionStatus(section)) {
                 @case ('complete') {
                    <div class="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-lg transform transition-transform scale-110">
                      <i class="fa-solid fa-check text-lg"></i>
                    </div>
                 }
                 @case ('progress') {
                    <div class="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center border border-white/40">
                      <i class="fa-solid fa-spinner fa-spin text-sm"></i>
                    </div>
                 }
                 @case ('pending') {
                    <div class="w-8 h-8 rounded-full bg-white/10 text-white/50 flex items-center justify-center border border-white/20">
                      <i class="fa-solid fa-minus text-sm"></i>
                    </div>
                 }
               }
            </div>
            
            <!-- Items -->
            <div class="p-4 flex-1 space-y-3">
              @for (item of section.items; track item.id) {
                <label class="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-slate-100 group select-none active:scale-[0.99] active:bg-slate-50"
                       [class.bg-slate-50]="item.checked">
                  
                  <div class="relative flex items-center mt-1">
                    <input type="checkbox" [(ngModel)]="item.checked" class="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 shadow-sm checked:border-emerald-500 checked:bg-emerald-500 hover:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:ring-offset-0 transition-all duration-200"/>
                    <!-- Enhanced Checkmark Animation with Pop/Spring Effect -->
                    <i class="fa-solid fa-check absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-white opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"></i>
                  </div>
                  
                  <span [class]="'text-sm leading-snug transition-all duration-300 ' + (item.checked ? 'text-slate-400 line-through opacity-75' : 'text-slate-700 font-medium')">
                    {{ item.label }}
                  </span>
                </label>
              }
            </div>
          </div>
        }
      </div>

      <!-- Footer Actions -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
         <div class="text-xs text-slate-400 flex items-center max-w-lg">
           <i class="fa-solid fa-circle-info mr-2 text-xl"></i>
           <span>Riferirsi sempre al piano di autocontrollo alimentare applicazione sistema H.A.C.C.P. per i dettagli specifici sulle procedure correttive in caso di non conformità.</span>
         </div>

         <div class="flex items-center gap-4">
           @if (showSuccess()) {
             <span class="text-emerald-600 font-bold flex items-center animate-pulse">
               <i class="fa-solid fa-circle-check mr-2"></i> Verifica Salvata!
             </span>
           }
           <button (click)="saveChecklist()" [disabled]="isSaving() || !isAllChecked()" class="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-300 font-bold flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
             @if (isSaving()) {
               <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Salvataggio...
             } @else {
               <i class="fa-solid fa-save mr-2"></i> Registra Controlli
             }
           </button>
         </div>
      </div>
      
      @if (!isAllChecked() && !showSuccess()) {
        <p class="text-center text-xs text-orange-500 font-medium">
          * Completa tutte le voci per abilitare il salvataggio.
        </p>
      }

    </div>
  `
})
export class OperationalChecklistComponent {
  state = inject(AppStateService);
  today = new Date();
  
  showSuccess = signal(false);
  isSaving = signal(false);

  sections = signal<ChecklistSection[]>([
    {
      title: 'Fase Pre-Operativa',
      colorClass: 'bg-blue-600 border-blue-700',
      icon: 'fa-eye',
      items: [
        { id: 'pre-1', label: 'Ispezione visiva degli ambienti di lavoro', checked: false },
        { id: 'pre-2', label: 'Verifica integrità delle attrezzature', checked: false },
        { id: 'pre-3', label: 'Verifica pulizia superfici prima dell\'uso', checked: false }
      ]
    },
    {
      title: 'Fase Operativa',
      colorClass: 'bg-orange-500 border-orange-600',
      icon: 'fa-fire-burner',
      items: [
        { id: 'op-1', label: 'Controllo temperature (Valori positivi)', checked: false },
        { id: 'op-2', label: 'Controllo temperature (Valori negativi)', checked: false },
        { id: 'op-3', label: 'Evitare contaminazioni crociate (Sporco/Pulito)', checked: false },
        { id: 'op-4', label: 'Compilazione schede monitoraggio produzione', checked: false }
      ]
    },
    {
      title: 'Fase Post-Operativa',
      colorClass: 'bg-emerald-600 border-emerald-700',
      icon: 'fa-broom',
      items: [
        { id: 'post-1', label: 'Pulizia e disinfezione ambienti di lavoro', checked: false },
        { id: 'post-2', label: 'Sanificazione attrezzature utilizzate', checked: false },
        { id: 'post-3', label: 'Adeguata conservazione prodotti finiti', checked: false },
        { id: 'post-4', label: 'Stoccaggio semilavorati e materie prime', checked: false }
      ]
    }
  ]);

  getCheckedCount(section: ChecklistSection): number {
    return section.items.filter(i => i.checked).length;
  }

  getSectionStatus(section: ChecklistSection): 'complete' | 'progress' | 'pending' {
    const checkedCount = this.getCheckedCount(section);
    if (checkedCount === section.items.length) return 'complete';
    if (checkedCount > 0) return 'progress';
    return 'pending';
  }

  isAllChecked(): boolean {
    return this.sections().every(section => 
      section.items.every(item => item.checked)
    );
  }

  saveChecklist() {
    if (!this.isAllChecked()) return;

    this.isSaving.set(true);
    
    // Simulate API call
    setTimeout(() => {
      this.isSaving.set(false);
      this.showSuccess.set(true);
      
      // Reset after delay or keep it shown? Let's reset for demo purposes
      setTimeout(() => {
        this.showSuccess.set(false);
        // Optional: Reset checkboxes
        // this.resetChecks(); 
      }, 3000);
      
      console.log('Checklist saved to database:', {
        date: this.today,
        user: this.state.currentUser()?.id,
        data: this.sections()
      });
    }, 1500);
  }

  resetChecks() {
    this.sections.update(sections => 
      sections.map(s => ({
        ...s,
        items: s.items.map(i => ({ ...i, checked: false }))
      }))
    );
  }
}
