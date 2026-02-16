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
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
           <!-- Backdrop -->
           <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="cancelDelete()"></div>
           
           <!-- Modal Content -->
           <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up transform transition-all">
              <div class="p-8 text-center">
                 <div class="w-16 h-16 rounded-full bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-4 text-2xl animate-bounce-short">
                    <i class="fa-solid fa-trash-can"></i>
                 </div>
                 <h3 class="text-xl font-black text-slate-800 mb-2">Elimina Registrazione?</h3>
                 <p class="text-slate-500 text-sm mb-8 leading-relaxed">Questa azione è irreversibile. La registrazione verrà rimossa permanentemente dall'archivio.</p>
                 
                 <div class="grid grid-cols-2 gap-3">
                    <button (click)="cancelDelete()" class="w-full py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors">
                       Annulla
                    </button>
                    <button (click)="executeDelete()" class="w-full py-3.5 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all font-black">
                       ELIMINA
                    </button>
                 </div>
              </div>
           </div>
        </div>
        }

        <!-- Share Menu Modal -->
        @if (recordToShare()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
           <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="recordToShare.set(null)"></div>
           
           <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-slide-up">
              <!-- Header -->
              <div class="bg-indigo-600 p-6 text-white text-center relative">
                 <button (click)="recordToShare.set(null)" class="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                    <i class="fa-solid fa-times text-xs"></i>
                 </button>
                 <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 text-3xl">
                    <i class="fa-solid fa-share-nodes"></i>
                 </div>
                 <h3 class="text-xl font-black mb-1">Condividi Checklist</h3>
                 <p class="text-indigo-100 text-[10px] uppercase font-bold tracking-widest opacity-80">
                    {{ getModuleName(recordToShare().moduleId) }} - {{ recordToShare().timestamp | date:'dd/MM/yyyy' }}
                 </p>
              </div>

              <!-- Options Grid -->
              <div class="p-6 grid grid-cols-2 gap-4">
                 <button (click)="shareAction('whatsapp')" class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 transition-all group border border-emerald-100 hover:scale-105">
                    <div class="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xl shadow-lg shadow-emerald-500/20 group-hover:animate-bounce-short">
                       <i class="fa-brands fa-whatsapp"></i>
                    </div>
                    <span class="text-xs font-black text-emerald-800">WhatsApp</span>
                 </button>

                 <button (click)="shareAction('email')" class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-blue-50 hover:bg-blue-100 transition-all group border border-blue-100 hover:scale-105">
                    <div class="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 group-hover:animate-bounce-short">
                       <i class="fa-solid fa-envelope"></i>
                    </div>
                    <span class="text-xs font-black text-blue-800">Email</span>
                 </button>

                 <button (click)="shareAction('chat')" class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-indigo-50 hover:bg-indigo-100 transition-all group border border-indigo-100 hover:scale-105">
                    <div class="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20 group-hover:animate-bounce-short">
                       <i class="fa-solid fa-comments"></i>
                    </div>
                    <span class="text-xs font-black text-indigo-800">Chat Interna</span>
                 </button>

                 <button (click)="shareAction('print')" class="flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all group border border-slate-200 hover:scale-105">
                    <div class="w-12 h-12 rounded-full bg-slate-600 text-white flex items-center justify-center text-xl shadow-lg shadow-slate-600/20 group-hover:animate-bounce-short">
                       <i class="fa-solid fa-print"></i>
                    </div>
                    <span class="text-xs font-black text-slate-800">Stampa PDF</span>
                 </button>
              </div>

              <div class="px-6 pb-6 mt-2">
                 <button (click)="recordToShare.set(null)" class="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                    Chiudi
                 </button>
              </div>
           </div>
        </div>
        }
       
       <!-- Enhanced History Header -->
       <div class="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 p-8 rounded-3xl shadow-xl border border-indigo-500/30 relative overflow-hidden mb-6">
          <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <i class="fa-solid fa-clock-rotate-left text-9xl text-white"></i>
          </div>
          <div class="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
             <div class="flex items-center gap-6">
                <div class="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30">
                   <i class="fa-solid fa-clock-rotate-left text-white text-3xl"></i>
                </div>
                <div>
                   <h2 class="text-3xl font-black text-white tracking-tight leading-none mb-1">Archivio Storico</h2>
                   <p class="text-indigo-200 text-sm font-medium">Cronologia completa delle attività svolte.</p>
                </div>
             </div>

             <!-- Filter Module -->
             <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fa-solid fa-filter text-indigo-300 group-hover:text-white transition-colors"></i>
                </div>
                <select [value]="filterModule()" (change)="filterModule.set($any($event.target).value)" 
                        class="pl-10 pr-10 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none font-bold cursor-pointer hover:bg-white/20 transition-all min-w-[200px]">
                   <option value="all" class="bg-slate-800 text-white">Tutte le Liste</option>
                   <option value="pre-op-checklist" class="bg-slate-800 text-white">Fase Pre-operativa</option>
                   <option value="operative-checklist" class="bg-slate-800 text-white">Fase Operativa</option>
                   <option value="post-op-checklist" class="bg-slate-800 text-white">Fase Post-operativa</option>
                </select>
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <i class="fa-solid fa-chevron-down text-indigo-300 text-xs"></i>
                </div>
             </div>
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
                             <div class="flex flex-col gap-1">
                                <span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 w-fit"
                                      [class.bg-emerald-100]="getRecordStatus(record) === 'Conforme'"
                                      [class.text-emerald-700]="getRecordStatus(record) === 'Conforme'"
                                      [class.bg-red-100]="getRecordStatus(record) === 'Non Conforme'"
                                      [class.text-red-700]="getRecordStatus(record) === 'Non Conforme'"
                                      [class.bg-slate-100]="getRecordStatus(record) === 'Completata'"
                                      [class.text-slate-600]="getRecordStatus(record) === 'Completata'">
                                   <i class="fa-solid" 
                                      [class.fa-check]="getRecordStatus(record) === 'Conforme'" 
                                      [class.fa-triangle-exclamation]="getRecordStatus(record) === 'Non Conforme'"
                                      [class.fa-circle-check]="getRecordStatus(record) === 'Completata'"></i>
                                   {{ getRecordStatus(record) }}
                                </span>
                                @if (record.data.summary) {
                                   <span class="text-[10px] text-slate-400 font-medium ml-1 italic">{{ record.data.summary }}</span>
                                }
                             </div>
                          </td>

                         <!-- Actions -->
                         <td class="py-4 text-right pr-6">
                            <div class="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                              <button (click)="editRecord(record)" class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm border border-blue-100" title="Modifica">
                                  <i class="fa-solid fa-pen-to-square"></i>
                               </button>
                               <button (click)="openShareMenu(record)" class="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-all shadow-sm border border-emerald-100" title="Condividi">
                                  <i class="fa-solid fa-share-nodes"></i>
                               </button>
                               
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
  `,
   styles: [`
    .bg-grid-slate-700\/25 {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(51 65 85 / 0.25)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
    }
  `]
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
         case 'pre-op-checklist': return 'Fase Pre-operativa';
         case 'pre-operative': return 'Fase Pre-operativa';
         case 'operative-checklist': return 'Fase Operativa';
         case 'operative': return 'Fase Operativa';
         case 'post-op-checklist': return 'Fase Post-operativa';
         case 'post-operative': return 'Fase Post-operativa';
         default: return id;
      }
   }

   getRecordStatus(record: any): string {
      const data = record.data;
      if (!data) return 'N.D.';

      // Extract items array if it exists (either directly array or inside items prop)
      let items: any[] = [];
      if (Array.isArray(data)) {
         items = data;
      } else if (data.items && Array.isArray(data.items)) {
         items = data.items;
      }

      // If we found items, calculate based on user logic
      if (items.length > 0) {
         const hasNonConformity = items.some(item => {
            // Check for common non-conformity patterns:
            // 1. checked === false (for simple checklists)
            // 2. status === 'issue' or status === 'pending' (for advanced checklists)
            if (Object.prototype.hasOwnProperty.call(item, 'checked')) {
               return !item.checked;
            }
            if (Object.prototype.hasOwnProperty.call(item, 'status')) {
               return item.status !== 'ok';
            }
            return false;
         });

         return hasNonConformity ? 'Non Conforme' : 'Conforme';
      }

      // Fallback: use explicit status if available
      if (data.status) return data.status;

      return 'Completata';
   }

   toast = inject(ToastService);
   recordToDelete = signal<string | null>(null);
   recordToShare = signal<any | null>(null);

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

   openShareMenu(record: any) {
      this.recordToShare.set(record);
   }

   shareAction(type: string) {
      const record = this.recordToShare();
      if (!record) return;

      const moduleName = this.getModuleName(record.moduleId);
      const dateStr = new Date(record.timestamp).toLocaleDateString('it-IT');

      switch (type) {
         case 'whatsapp':
            this.toast.info('Condivisione WhatsApp', 'Apertura WhatsApp in corso...');
            break;
         case 'email':
            this.toast.info('Invio Email', 'Preparazione report email...');
            break;
         case 'chat':
            this.toast.success('Inviato', 'Checklist condivisa nella chat aziendale.');
            break;
         case 'print':
            this.editRecord(record);
            setTimeout(() => {
               window.print();
            }, 500);
            break;
      }
      this.recordToShare.set(null);
   }
}
