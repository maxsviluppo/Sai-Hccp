import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state.service';
import { ToastService } from '../../services/toast.service';

interface ChecklistItem {
   id: string;
   label: string;
   icon: string;
   status: 'pending' | 'ok' | 'issue';
   note?: string;
   category?: string;
}

@Component({
   selector: 'app-operative-checklist',
   standalone: true,
   imports: [CommonModule],
   template: `
    <div class="pb-20 animate-fade-in relative max-w-2xl mx-auto">

       <!-- PRINT ONLY HEADER -->
       <div class="hidden print:block font-sans text-black p-4">
          <div class="border-b-2 border-slate-800 pb-4 mb-6">
             <h1 class="text-2xl font-bold uppercase mb-1">{{ state.adminCompany().name || 'Azienda' }}</h1>
             <h2 class="text-xl font-light text-slate-600">Checklist Operativa (Area 2)</h2>
             <div class="flex justify-between mt-4 text-sm text-slate-500">
                <span><span class="font-bold">Data:</span> {{ getFormattedDate() }}</span>
                <span><span class="font-bold">Responsabile:</span> {{ state.currentUser()?.name || 'Operatore' }}</span>
             </div>
          </div>

          <table class="w-full text-left text-sm border-collapse">
             <thead>
                <tr class="border-b border-slate-400">
                   <th class="py-2 font-bold w-1/2">Controllo</th>
                   <th class="py-2 font-bold w-1/4">Esito</th>
                   <th class="py-2 font-bold w-1/4">Note / Non Conformità</th>
                </tr>
             </thead>
             <tbody>
                @for (item of items(); track item.id) {
                   @if (item.label) {
                    <tr class="border-b border-slate-100">
                       <td class="py-3 pr-2 font-medium">{{ item.label }}</td>
                       <td class="py-3">
                          @if(item.status === 'ok') { <span class="font-bold">CONFORME</span> }
                          @if(item.status === 'issue') { <span class="font-bold">NON CONFORME</span> }
                          @if(item.status === 'pending') { <span>NON ESEGUITO</span> }
                       </td>
                       <td class="py-3 italic text-slate-600 font-serif">
                          {{ item.note || '-' }}
                       </td>
                    </tr>
                   }
                }
             </tbody>
          </table>

          <div class="mt-8 pt-4 border-t border-slate-300 flex justify-between text-xs text-slate-400">
             <span>Documento generato da HACCP Pro</span>
             <span>Firma: ________________________</span>
          </div>
       </div>
      
       <!-- Enhanced UI Header (Hidden on print) -->
       <div class="print:hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-8 rounded-3xl shadow-xl border border-indigo-500/30 relative overflow-hidden mb-6">
         <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
           <i class="fa-solid fa-briefcase text-9xl text-white"></i>
         </div>
         <div class="relative z-10">
           <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
             <div class="flex items-center gap-4">
               <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30">
                 <i class="fa-solid fa-briefcase text-white text-2xl"></i>
               </div>
               <div>
                 <h2 class="text-3xl font-black text-white">Fase Operativa</h2>
                 <p class="text-indigo-100 text-sm font-medium mt-1">Gestione catena del freddo e produzione</p>
               </div>
             </div>

             <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
               <!-- Progress Indicator -->
               <div class="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex-1 sm:flex-initial">
                 <div class="flex justify-between items-end mb-1.5">
                   <span class="text-[10px] text-indigo-100 uppercase font-bold tracking-wider">Avanzamento</span>
                   <span class="text-sm font-black text-white">{{ completedCount() }}/{{ items().length }}</span>
                 </div>
                 <div class="w-40 h-2 bg-white/20 rounded-full overflow-hidden">
                   <div class="h-full bg-white rounded-full transition-all duration-700"
                        [style.width.%]="progressPercentage()"></div>
                 </div>
               </div>

               <div class="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex items-center gap-3">
                 <div class="text-left">
                   <div class="text-[10px] text-indigo-100 uppercase font-bold tracking-wider">Stato</div>
                   <div class="text-sm font-bold text-white flex items-center">
                     <i class="fa-solid fa-circle-check mr-2"></i> In Compilazione
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>

        <!-- Date Selector & Quick Actions (Hidden on Print) -->
        <div class="print:hidden bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center justify-between mx-auto max-w-2xl relative z-20 -mt-4">
           <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                 <i class="fa-solid fa-calendar-day"></i>
              </div>
              <div class="flex-1">
                 <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data di Registrazione</label>
                 <input type="date" [value]="selectedDate()" (change)="selectedDate.set($any($event.target).value)" 
                        class="w-full font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer border-none p-0 text-base">
              </div>
           </div>

           <!-- Quick Set All Ok -->
           <button (click)="setAllOk()" 
                   class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors shadow-sm border border-emerald-100"
                   title="Imposta tutto come Conforme">
              <i class="fa-solid fa-check-double"></i>
           </button>
        </div>

        <!-- Quick Action Grid -->
        <div class="print:hidden space-y-3 mb-24 md:mb-0">
          @for (item of items(); track item.id) {
             <div class="bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden relative shadow-sm"
                  [class.border-slate-100]="item.status === 'pending'"
                  [class.border-emerald-500]="item.status === 'ok'"
                  [class.border-red-500]="item.status === 'issue'"
                  [class.bg-emerald-50/30]="item.status === 'ok'"
                  [class.bg-red-50/30]="item.status === 'issue'">
                
                <div class="p-4 flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm transition-colors flex-shrink-0"
                         [class.bg-slate-100]="item.status === 'pending'"
                         [class.text-slate-400]="item.status === 'pending'"
                         [class.bg-emerald-100]="item.status === 'ok'"
                         [class.text-emerald-600]="item.status === 'ok'"
                         [class.bg-red-100]="item.status === 'issue'"
                         [class.text-red-600]="item.status === 'issue'">
                        <i [class]="'fa-solid ' + item.icon"></i>
                    </div>

                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-slate-800 text-sm md:text-base">
                            {{ item.label }}
                        </h4>
                        @if (item.status === 'issue' && item.note) {
                          <p class="text-[10px] text-red-600 italic mt-0.5">Note: {{ item.note }}</p>
                        } @else {
                          <p class="text-[10px] uppercase tracking-wide font-black mt-0.5"
                             [class.text-slate-400]="item.status === 'pending'"
                             [class.text-emerald-600]="item.status === 'ok'"
                             [class.text-red-600]="item.status === 'issue'">
                              {{ item.status === 'pending' ? 'In Attesa' : (item.status === 'ok' ? 'Conforme' : 'Non Conforme') }}
                          </p>
                        }
                    </div>

                    <div class="flex gap-2">
                      @if (item.status === 'pending') {
                        <button (click)="setStatus(item.id, 'ok')" 
                                class="w-10 h-10 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-300 hover:text-emerald-600 flex items-center justify-center transition-all border border-slate-200">
                          <i class="fa-solid fa-check text-lg"></i>
                        </button>
                        <button (click)="openIssueModal(item)"
                                class="w-10 h-10 rounded-full bg-slate-100 hover:bg-red-100 text-slate-300 hover:text-red-500 flex items-center justify-center transition-all border border-slate-200">
                          <i class="fa-solid fa-triangle-exclamation text-sm"></i>
                        </button>
                      } @else {
                        <button (click)="setStatus(item.id, 'pending')" 
                                class="w-8 h-8 rounded-full bg-white/50 hover:bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all border border-black/5 shadow-sm">
                          <i class="fa-solid fa-rotate-left text-xs"></i>
                        </button>
                      }
                    </div>
                 </div>
              </div>

         }
       </div>

       <!-- Footer Actions -->
       <div class="print:hidden fixed bottom-6 right-6 z-30 md:absolute md:bottom-0 md:right-0 md:relative md:mt-8 w-full md:w-auto">
         
         @if (!isSubmitted()) {
             @if (isAllCompleted()) {
                <button (click)="submitChecklist()" 
                        class="ml-auto bg-emerald-600 text-white rounded-2xl px-6 py-4 shadow-2xl shadow-emerald-500/40 font-bold text-lg flex items-center gap-3 hover:bg-emerald-700 hover:scale-105 transition-all">
                   <div>
                      <div class="leading-none text-[10px] uppercase opacity-80 text-left">Checklist Completa</div>
                      <div class="flex items-center">REGISTRA ORA <i class="fa-solid fa-check-double ml-2"></i></div>
                   </div>
                </button>
             } @else {
                <div class="bg-slate-800 text-white rounded-full px-5 py-3 shadow-lg text-xs font-bold opacity-80 backdrop-blur-md float-right">
                   {{ items().length - completedCount() - 1 }} Rimanenti
                </div>
             }
         } @else {
             <div class="mb-4 flex justify-center animate-slide-up">
                  <div class="bg-white/90 backdrop-blur rounded-full px-6 py-2 shadow-lg border border-slate-200 flex items-center gap-3 select-none"
                       [class.border-emerald-500]="!hasIssues()"
                       [class.border-red-500]="hasIssues()">
                      <div class="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm transition-colors duration-300"
                           [class.bg-emerald-500]="!hasIssues()"
                           [class.bg-red-500]="hasIssues()">
                          @if(!hasIssues()) { <i class="fa-solid fa-check text-sm"></i> }
                          @else { <i class="fa-solid fa-triangle-exclamation text-sm"></i> }
                      </div>
                      <div class="font-bold uppercase text-sm"
                           [class.text-emerald-600]="!hasIssues()"
                           [class.text-red-600]="hasIssues()">
                           {{ hasIssues() ? 'Non Conforme' : 'Conforme' }}
                      </div>
                  </div>
             </div>

             <div class="bg-gradient-to-r from-indigo-600 to-blue-500 text-white p-3 rounded-2xl shadow-2xl animate-slide-up mx-4 md:mx-0">
                 <div class="flex flex-wrap items-center justify-center gap-2">
                     <button (click)="submitChecklist()" class="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2 border border-emerald-400/50 ring-2 ring-emerald-500/20">
                         <i class="fa-solid fa-floppy-disk"></i> Salva
                     </button>
                     <div class="w-px h-8 bg-white/20 mx-1 hidden sm:block"></div>
                     <button (click)="printReport()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 backdrop-blur-sm border border-white/10">
                         <i class="fa-solid fa-print"></i> <span class="hidden sm:inline">Stampa</span>
                     </button>
                     <button (click)="sendEmail()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 backdrop-blur-sm border border-white/10">
                         <i class="fa-solid fa-envelope"></i> <span class="hidden sm:inline">Email</span>
                     </button>
                     <button (click)="sendInternalMessage()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 backdrop-blur-sm border border-white/10">
                         <i class="fa-solid fa-comments"></i> <span class="hidden sm:inline">Chat</span>
                     </button>
                     <div class="w-px h-8 bg-white/20 mx-1 hidden sm:block"></div>
                     <button (click)="startNewChecklist()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-blue-100 hover:text-white flex items-center justify-center gap-2 backdrop-blur-sm whitespace-nowrap">
                         <i class="fa-solid fa-rotate-right"></i> <span class="hidden sm:inline">Nuova</span>
                     </button>
                 </div>
             </div>
         }
       </div>

       <!-- Modal for Issues -->
       @if (isModalOpen()) {
          <div class="print:hidden fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
             <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" (click)="closeModal()"></div>
             <div class="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
                <div class="px-6 py-4 bg-red-50 border-b border-red-100 flex items-center gap-3">
                   <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                      <i [class]="'fa-solid ' + currentItem()?.icon"></i>
                   </div>
                   <div>
                      <h3 class="font-black text-red-900">Segnala Problema</h3>
                      <p class="text-xs text-red-700 font-medium">{{ currentItem()?.label }}</p>
                   </div>
                </div>
                <div class="p-6 space-y-4">
                   <textarea #issueInput class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none h-24" placeholder="Dettaglio non conformità..."></textarea>
                   <div class="flex gap-2">
                      <button class="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl" (click)="closeModal()">Annulla</button>
                      <button class="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200" (click)="confirmIssue(issueInput.value)">Conferma</button>
                   </div>
                </div>
             </div>
          </div>
       }

    </div>
  `,
   styles: [`
    .bg-grid-slate-700\/25 {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(51 65 85 / 0.25)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
    }
  `]
})
export class OperativeChecklistComponent {
   state = inject(AppStateService);
   toast = inject(ToastService);

   frigoCount = signal(2);
   congelatoreCount = signal(1);
   pozzettoCount = signal(1);

   isModalOpen = signal(false);
   currentItem = signal<ChecklistItem | null>(null);
   selectedDate = signal(new Date().toISOString().split('T')[0]);
   isSubmitted = signal(false);
   currentRecordId = signal<string | undefined>(undefined);

   // Status Map to preserve status even when counts change
   statusMap = signal<Record<string, { status: ChecklistItem['status'], note?: string }>>({});

   constructor() {
      effect(() => {
         const record = this.state.recordToEdit();
         if (record && record.moduleId === 'operative-checklist') {
            this.loadRecord(record);
            setTimeout(() => this.state.completeEditing(), 100);
         }
      }, { allowSignalWrites: true });
   }

   items = computed(() => {
      const s = this.statusMap();

      return [
         { id: '1', label: 'Verifica temperature di lavorazione', icon: 'fa-temperature-half', status: s['1']?.status || 'pending', note: s['1']?.note },
         { id: '2', label: 'Monitoraggio catena del freddo', icon: 'fa-snowflake', status: s['2']?.status || 'pending', note: s['2']?.note },
         { id: '3', label: 'Controllo materie prime e semilavorati', icon: 'fa-box-open', status: s['3']?.status || 'pending', note: s['3']?.note },
         { id: '4', label: 'Verifica tracciabilità di produzione', icon: 'fa-barcode', status: s['4']?.status || 'pending', note: s['4']?.note },
         { id: '5', label: 'Gestione allergeni e separazione', icon: 'fa-triangle-exclamation', status: s['5']?.status || 'pending', note: s['5']?.note },
         { id: '6', label: 'Rispetto tempistiche di ricettazione', icon: 'fa-clock', status: s['6']?.status || 'pending', note: s['6']?.note },
      ];
   });

   completedCount = computed(() => this.items().filter(i => i.id !== 'sep-dynamic' && i.status !== 'pending').length);
   progressPercentage = computed(() => {
      const total = this.items().length - 1; // excluding separator
      return total > 0 ? (this.completedCount() / total) * 100 : 0;
   });
   isAllCompleted = computed(() => this.items().every(i => i.id === 'sep-dynamic' || i.status !== 'pending'));
   hasIssues = computed(() => this.items().some(i => i.status === 'issue'));

   updateCount(type: 'frigo' | 'congelatore' | 'pozzetto', delta: number) {
      if (type === 'frigo') this.frigoCount.update(c => Math.max(0, c + delta));
      if (type === 'congelatore') this.congelatoreCount.update(c => Math.max(0, c + delta));
      if (type === 'pozzetto') this.pozzettoCount.update(c => Math.max(0, c + delta));
   }

   setStatus(id: string, status: ChecklistItem['status']) {
      this.statusMap.update(map => ({
         ...map,
         [id]: { status, note: status === 'ok' ? undefined : map[id]?.note }
      }));
   }

   setAllOk() {
      const newMap: Record<string, { status: ChecklistItem['status'], note?: string }> = {};
      this.items().forEach(item => {
         if (item.id !== 'sep-dynamic') {
            newMap[item.id] = { status: 'ok' };
         }
      });
      this.statusMap.set(newMap);
      this.toast.info('Tutto Conforme', 'Tutte le voci sono state impostate come conformi.');
   }

   openIssueModal(item: ChecklistItem) {
      this.currentItem.set(item);
      this.isModalOpen.set(true);
   }

   closeModal() {
      this.isModalOpen.set(false);
      this.currentItem.set(null);
   }

   confirmIssue(note: string) {
      if (this.currentItem()) {
         const id = this.currentItem()!.id;
         this.statusMap.update(map => ({
            ...map,
            [id]: { status: 'issue', note: note || 'Non conformità' }
         }));
      }
      this.closeModal();
   }

   submitChecklist() {
      const recordId = this.currentRecordId() || Math.random().toString(36).substring(2, 11);
      this.currentRecordId.set(recordId);

      this.state.saveChecklist({
         id: recordId,
         moduleId: 'operative-checklist',
         date: this.selectedDate(),
         data: {
            items: this.items().filter(i => i.id !== 'sep-dynamic'),
            counts: {
               frigo: this.frigoCount(),
               congelatore: this.congelatoreCount(),
               pozzetto: this.pozzettoCount()
            },
            status: this.hasIssues() ? 'Non Conforme' : 'Conforme',
            summary: this.hasIssues() ? 'Rilevate non conformità' : 'Tutto conforme'
         }
      });

      this.toast.success('Checklist Registrata', 'Salvata nello storico.');
      this.isSubmitted.set(true);
   }

   startNewChecklist() {
      this.statusMap.set({});
      this.isSubmitted.set(false);
      this.currentRecordId.set(undefined);
      this.selectedDate.set(new Date().toISOString().split('T')[0]);
   }

   loadRecord(record: any) {
      this.currentRecordId.set(record.id);
      this.selectedDate.set(record.date);

      const counts = record.data.counts || { frigo: 0, congelatore: 0, pozzetto: 0 };
      this.frigoCount.set(counts.frigo);
      this.congelatoreCount.set(counts.congelatore);
      this.pozzettoCount.set(counts.pozzetto);

      const map: Record<string, any> = {};
      record.data.items.forEach((item: any) => {
         map[item.id] = { status: item.status, note: item.note };
      });
      this.statusMap.set(map);
      this.isSubmitted.set(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
   }

   getFormattedDate() {
      const parts = this.selectedDate().split('-');
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : this.selectedDate();
   }

   printReport() { window.print(); }
   sendEmail() { this.toast.success('Email Inviata', 'Report inviato alla sede.'); }
   sendInternalMessage() { this.toast.success('Inviato', 'Report inviato in chat.'); }
}
