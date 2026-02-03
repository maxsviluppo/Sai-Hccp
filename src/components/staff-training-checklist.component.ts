
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
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
  selector: 'app-staff-training-checklist',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      
      <!-- Header -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-slate-800 flex items-center">
            <i class="fa-solid fa-graduation-cap mr-3 text-indigo-600"></i>
            Formazione Personale
          </h2>
          <p class="text-slate-500 text-sm mt-1">
            Verifiche periodiche competenze e aggiornamenti sicurezza alimentare.
          </p>
        </div>
        <div class="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200">
           <div class="flex flex-col">
             <label for="date-select-training" class="text-xs text-slate-400 font-bold uppercase mb-0.5">Data Controllo</label>
             <input 
               id="date-select-training"
               type="date" 
               [ngModel]="selectedDate()" 
               (ngModelChange)="onDateChange($event)"
               class="font-medium text-slate-800 bg-white border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm cursor-pointer hover:border-slate-300 min-w-[130px]"
             />
           </div>
           <div class="h-8 w-px bg-slate-200"></div>
           <div class="flex flex-col">
             <span class="text-xs text-slate-400 font-bold uppercase mb-0.5">Responsabile</span>
             <div class="flex items-center px-1 py-1 h-[28px]">
               <span class="font-medium text-slate-800">{{ state.currentUser()?.name }}</span>
             </div>
           </div>
        </div>
      </div>

      <!-- Checklist Sections -->
      <div class="grid grid-cols-1 gap-6">
        @for (section of sections(); track section.title) {
          <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full transition-all duration-300"
               [class.ring-2]="getSectionStatus(section) === 'complete'"
               [class.ring-indigo-500]="getSectionStatus(section) === 'complete'"
               [class.ring-offset-2]="getSectionStatus(section) === 'complete'">
            
            <!-- Section Header -->
            <div [class]="'p-4 border-b flex items-center justify-between gap-3 ' + section.colorClass">
               <div class="flex items-center gap-3">
                 <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                   <i [class]="'fa-solid ' + section.icon"></i>
                 </div>
                 <div>
                   <h3 class="font-bold text-white leading-tight">{{ section.title }}</h3>
                   <p class="text-[10px] text-white/80 font-medium">
                     {{ getCheckedCount(section) }}/{{ section.items.length }} Requisiti Soddisfatti
                   </p>
                 </div>
               </div>

               <!-- Status Icon Badge -->
               @switch (getSectionStatus(section)) {
                 @case ('complete') {
                    <div class="w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-lg transform transition-transform scale-110">
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
            <div class="p-6 flex-1 space-y-4">
              @for (item of section.items; track item.id) {
                <label class="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 group select-none shadow-sm"
                       [class.bg-indigo-50]="item.checked"
                       [class.border-indigo-100]="item.checked">
                  
                  <div class="relative flex items-center mt-0.5">
                    <input type="checkbox" [(ngModel)]="item.checked" (change)="markDirty()" class="peer h-6 w-6 cursor-pointer appearance-none rounded-md border border-slate-300 shadow-sm checked:border-indigo-600 checked:bg-indigo-600 hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:ring-offset-0 transition-all duration-200"/>
                    <i class="fa-solid fa-check absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-sm text-white opacity-0 scale-50 peer-checked:opacity-100 peer-checked:scale-100 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"></i>
                  </div>
                  
                  <div class="flex-1">
                     <span [class]="'text-base font-medium transition-all duration-300 block ' + (item.checked ? 'text-indigo-900' : 'text-slate-800')">
                       {{ item.label }}
                     </span>
                     @if(item.checked) {
                        <p class="text-xs text-indigo-500 mt-1 animate-fade-in"><i class="fa-solid fa-check-double mr-1"></i> Verificato e validato</p>
                     }
                  </div>
                </label>
              }
            </div>
          </div>
        }
      </div>

      <!-- Footer Actions -->
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
         
         <div class="flex flex-col gap-1 max-w-lg">
           <div class="text-xs text-slate-400 flex items-center">
             <i class="fa-solid fa-circle-info mr-2 text-xl"></i>
             <span>Archiviazione digitale conforme normativa 81/08 e Pacchetto Igiene.</span>
           </div>
           
           <!-- Auto-Save Indicator -->
           <div class="flex items-center gap-3 ml-7 mt-1 h-5">
             @if (isAutoSaving()) {
               <span class="text-xs text-blue-500 font-medium flex items-center animate-pulse">
                 <i class="fa-solid fa-cloud-arrow-up mr-1.5"></i> Salvataggio automatico...
               </span>
             } @else if (lastAutoSave()) {
               <span class="text-[10px] text-slate-400 font-medium flex items-center transition-opacity duration-500">
                 <i class="fa-solid fa-cloud mr-1.5 text-slate-300"></i> 
                 Ultimo salvataggio: {{ lastAutoSave() | date:'HH:mm:ss' }}
                 @if(hasUnsavedChanges()) { <span class="ml-1 text-orange-400">(Bozza)</span> }
               </span>
             }
           </div>
         </div>

         <div class="flex items-center gap-4">
           @if (showSuccess()) {
             <span class="text-indigo-600 font-bold flex items-center animate-pulse">
               <i class="fa-solid fa-circle-check mr-2"></i> Report Aggiornato!
             </span>
           }
           <button (click)="saveChecklist('MANUAL')" [disabled]="isSaving() || !isAllChecked()" class="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-300 font-bold flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
             @if (isSaving()) {
               <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Elaborazione...
             } @else {
               <i class="fa-solid fa-save mr-2"></i> Salva Report Formazione
             }
           </button>
         </div>
      </div>
    </div>
  `
})
export class StaffTrainingChecklistComponent implements OnInit, OnDestroy {
  state = inject(AppStateService);
  selectedDate = signal(new Date().toISOString().split('T')[0]);
  
  showSuccess = signal(false);
  isSaving = signal(false);
  isAutoSaving = signal(false);
  
  hasUnsavedChanges = signal(false);
  lastAutoSave = signal<Date | null>(null);
  private autoSaveTimer: any;

  // Specific data for Training
  sections = signal<ChecklistSection[]>([
    {
      title: 'Audit Formazione & Procedure',
      colorClass: 'bg-indigo-600 border-indigo-700',
      icon: 'fa-book-open-reader',
      items: [
        { id: 't-1', label: 'VERIFICA POSSESSO ATTESTATO DI FORMAZIONE (HACCP / Sicurezza)', checked: false },
        { id: 't-2', label: 'PROCEDERE CON GLI AGGIORNAMENTI IN SICUREZZA ALIMENTARE', checked: false },
        { id: 't-3', label: 'CONTROLLARE LE ISTRUZIONI DI LAVORO E PROCEDURE OPERATIVE', checked: false }
      ]
    }
  ]);

  ngOnInit() {
    this.autoSaveTimer = setInterval(() => {
      if (this.hasUnsavedChanges()) {
        this.saveChecklist('AUTO');
      }
    }, 60000);
  }

  ngOnDestroy() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
  }

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

  markDirty() {
    this.hasUnsavedChanges.set(true);
  }

  onDateChange(newDate: string) {
    this.selectedDate.set(newDate);
    this.showSuccess.set(false);
    this.hasUnsavedChanges.set(false);
    this.lastAutoSave.set(null);
    
    const isToday = newDate === new Date().toISOString().split('T')[0];
    if (!isToday) {
       this.sections.update(sections => sections.map(s => ({
         ...s,
         items: s.items.map(i => ({ ...i, checked: Math.random() > 0.5 }))
       })));
    }
  }

  saveChecklist(mode: 'MANUAL' | 'AUTO' = 'MANUAL') {
    if (mode === 'MANUAL' && !this.isAllChecked()) return;

    if (mode === 'MANUAL') {
      this.isSaving.set(true);
    } else {
      this.isAutoSaving.set(true);
    }
    
    setTimeout(() => {
      if (mode === 'MANUAL') {
        this.isSaving.set(false);
        this.showSuccess.set(true);
        setTimeout(() => { this.showSuccess.set(false); }, 3000);
      } else {
        this.isAutoSaving.set(false);
        this.lastAutoSave.set(new Date());
      }
      this.hasUnsavedChanges.set(false);
      console.log(`Training Check saved (${mode})`);
    }, 1500);
  }
}
