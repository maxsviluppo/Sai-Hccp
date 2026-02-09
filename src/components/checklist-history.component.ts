import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';

@Component({
   selector: 'app-checklist-history',
   standalone: true,
   imports: [CommonModule],
   template: `
    <div class="space-y-6 animate-fade-in relative pb-20">
        
        <!-- Custom Delete Confirmation Modal -->
        @if (recordToDelete()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
           <!-- Backdrop -->
           <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="cancelDelete()"></div>
           
           <!-- Modal Content -->
           <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up transform transition-all">
              <div class="p-6 text-center">
                 <div class="w-16 h-16 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-4 text-2xl animate-bounce-short">
                    <i class="fa-solid fa-trash-can"></i>
                 </div>
                 <h3 class="text-lg font-black text-slate-800 mb-2">Elimina Registrazione?</h3>
                 <p class="text-slate-500 text-sm mb-6">Questa azione è irreversibile. La registrazione verrà rimossa permanentemente dall'archivio.</p>
                 
                 <div class="flex gap-3 justify-center">
                    <button (click)="cancelDelete()" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors">
                       Annulla
                    </button>
                    <button (click)="executeDelete()" class="px-5 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all transform hover:scale-105">
                       Elimina
                    </button>
                 </div>
              </div>
           </div>
        </div>
        }
       
       <!-- Header & Filters -->
       <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div class="flex items-center gap-4">
             <div class="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <i class="fa-solid fa-clock-rotate-left text-xl"></i>
             </div>
             <div>
                <h2 class="text-xl font-bold text-slate-800">Archivio Registrazioni</h2>
                <p class="text-slate-500 text-xs">Consulta e gestisci lo storico delle attività.</p>
             </div>
          </div>
          
          <!-- Filter Module -->
          <div class="relative">
             <i class="fa-solid fa-filter absolute left-3 top-3 text-slate-400 text-xs"></i>
             <select [value]="filterModule()" (change)="filterModule.set($any($event.target).value)" 
                     class="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none font-medium cursor-pointer">
                <option value="all">Tutte le Liste</option>
                <option value="pre-op-checklist">Pre-Operativa (Area 1)</option>
                <option value="operative-checklist">Operativa (Area 2)</option>
                <option value="post-operative" disabled>Post-Operativa (In Sviluppo)</option>
             </select>
          </div>
       </div>

       <!-- Table -->
       <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div class="overflow-x-auto">
             <table class="w-full text-left text-sm">
                <thead>
                   <tr class="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[10px] tracking-wider font-bold">
                      <th class="py-4 pl-6">Data & Ora</th>
                      <th class="py-4">Tipo Lista</th>
                      <th class="py-4">Esito</th>
                      <th class="py-4 text-right pr-6">Azioni</th>
                   </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                   @for (record of filteredHistory(); track record.id) {
                      <tr class="group hover:bg-indigo-50/30 transition-colors">
                         <!-- Date -->
                         <td class="py-4 pl-6 font-medium text-slate-700">
                            <div class="flex flex-col">
                               <span class="text-slate-900 font-bold">{{ record.timestamp | date:'dd/MM/yyyy' }}</span>
                               <span class="text-slate-400 text-xs">{{ record.timestamp | date:'HH:mm' }}</span>
                            </div>
                         </td>
                         
                         <!-- Type -->
                         <td class="py-4">
                            <span class="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-wide border border-slate-200">
                               {{ getModuleName(record.moduleId) }}
                            </span>
                         </td>

                         <!-- Status -->
                         <td class="py-4">
                            <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1"
                                  [class.bg-emerald-100]="record.data.status === 'Conforme'"
                                  [class.text-emerald-700]="record.data.status === 'Conforme'"
                                  [class.bg-red-100]="record.data.status !== 'Conforme'"
                                  [class.text-red-700]="record.data.status !== 'Conforme'">
                               <i class="fa-solid" [class.fa-check]="record.data.status === 'Conforme'" [class.fa-triangle-exclamation]="record.data.status !== 'Conforme'"></i>
                               {{ record.data.status }}
                            </span>
                         </td>

                         <!-- Actions -->
                         <td class="py-4 text-right pr-6">
                            <div class="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button (click)="editRecord(record)" class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm border border-blue-100" title="Modifica">
                                  <i class="fa-solid fa-pen-to-square"></i>
                               </button>
                               <!-- Print direct logic could allow printing PDF from here? Re-generating PDF requires the component view. 
                                    So 'Edit' opens the view, then they can print. -->
                               
                               <button (click)="deleteRecord(record.id)" class="w-9 h-9 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all shadow-sm border border-red-100" title="Elimina">
                                  <i class="fa-solid fa-trash-can"></i>
                               </button>
                            </div>
                         </td>
                      </tr>
                   }
                   @if (filteredHistory().length === 0) {
                      <tr>
                         <td colspan="4" class="py-12 text-center">
                            <div class="flex flex-col items-center gap-3">
                               <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                  <i class="fa-solid fa-box-open text-3xl"></i>
                               </div>
                               <p class="text-slate-400 font-medium italic">Nessuna registrazione trovata nell'archivio.</p>
                            </div>
                         </td>
                      </tr>
                   }
                </tbody>
             </table>
          </div>
       </div>

    </div>
  `
})
export class ChecklistHistoryComponent {
   state = inject(AppStateService);
   filterModule = signal('all');

   filteredHistory = computed(() => {
      let records = this.state.checklistRecords();
      const filter = this.filterModule();
      if (filter !== 'all') {
         if (filter === 'pre-op-checklist') {
            records = records.filter(r => r.moduleId === 'pre-op-checklist' || r.moduleId === 'pre-operative');
         } else {
            records = records.filter(r => r.moduleId === filter);
         }
      }
      return records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
   });

   getModuleName(id: string) {
      switch (id) {
         case 'pre-op-checklist': return 'Pre-Operativa';
         case 'pre-operative': return 'Pre-Operativa';
         case 'operative-checklist': return 'Operativa (Area 2)';
         case 'operative': return 'Operativa';
         case 'post-operative': return 'Post-Operativa';
         default: return id;
      }
   }

   toast = inject(ToastService);
   recordToDelete = signal<string | null>(null);

   editRecord(record: any) {
      // Fix legacy moduleId for routing compatibility
      const targetRecord = { ...record };
      if (targetRecord.moduleId === 'pre-operative') {
         targetRecord.moduleId = 'pre-op-checklist';
      }
      this.state.startEditingRecord(targetRecord);
   }

   deleteRecord(id: string) {
      this.confirmDelete(id);
   }

   confirmDelete(id: string) {
      this.recordToDelete.set(id);
   }

   executeDelete() {
      const id = this.recordToDelete();
      if (id) {
         this.state.deleteChecklist(id);
         this.toast.success('Eliminato', 'Registrazione rimossa con successo.');
         this.recordToDelete.set(null);
      }
   }

   cancelDelete() {
      this.recordToDelete.set(null);
   }
}
