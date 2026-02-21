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
}

@Component({
   selector: 'app-operative-checklist',
   standalone: true,
   imports: [CommonModule],
   template: `
    <div class="pb-20 animate-fade-in relative max-w-2xl mx-auto">

       <!-- PRINT ONLY HEADER (HACCP Requirement) -->
       <div class="hidden print:block font-sans text-black p-4">
          <div class="border-b-2 border-slate-800 pb-4 mb-6 text-center">
             <h1 class="text-2xl font-bold uppercase mb-1">{{ state.adminCompany().name || 'Azienda' }}</h1>
             <h2 class="text-xl font-light text-slate-600">Registro Fase Operativa</h2>
             <div class="flex justify-between mt-4 text-sm text-slate-500">
                <span>Data: {{ getFormattedDate() }}</span>
                <span>Operatore: {{ state.currentUser()?.name }}</span>
             </div>
          </div>

          <table class="w-full text-left text-sm border-collapse">
             <thead>
                <tr class="border-b border-slate-400 bg-slate-50">
                   <th class="py-2 px-3 font-bold">Controllo</th>
                   <th class="py-2 px-3 font-bold">Esito</th>
                   <th class="py-2 px-3 font-bold">Note</th>
                </tr>
             </thead>
             <tbody>
                @for (item of items(); track item.id) {
                    <tr class="border-b border-slate-100">
                       <td class="py-3 px-3 font-medium">{{ item.label }}</td>
                       <td class="py-3 px-3 font-bold uppercase">
                          {{ item.status === 'ok' ? 'Conforme' : (item.status === 'issue' ? 'Non Conforme' : 'N.E.') }}
                       </td>
                       <td class="py-3 px-3 italic">{{ item.note || '-' }}</td>
                    </tr>
                }
             </tbody>
          </table>
       </div>
      
       <!-- Enhanced UI Header (Hidden on print) -->
       <div class="print:hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-8 rounded-3xl shadow-xl border border-indigo-500/30 relative overflow-hidden mb-8 mt-4">
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
                 <p class="text-indigo-100 text-sm font-medium mt-1">Gestione Ricezione e Stoccaggio</p>
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

        <!-- GROUP 1: Ricezione Merci -->
        <div class="print:hidden mb-12">
            <div class="flex items-center gap-4 mb-6">
                <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider whitespace-nowrap">Ricezione merci</h3>
                <div class="h-0.5 flex-1 bg-slate-200"></div>
            </div>

            <div class="space-y-4">
                @for (item of group1Items(); track item.id) {
                    <ng-container *ngTemplateOutlet="checklistCard; context: { $implicit: item }"></ng-container>
                }
            </div>
        </div>

        <!-- GROUP 2: Verifica temperature e contenuto... -->
        <div class="print:hidden mb-8">
            <div class="flex items-center gap-4 mb-2">
                <h3 class="text-sm font-black text-slate-800 uppercase tracking-wider text-center flex-1">Verifica temperature e contenuto frigoriferi e congelatori</h3>
            </div>
            <div class="h-0.5 w-full bg-slate-200 mb-6"></div>

            <!-- Dynamic & Final List -->
            <div class="space-y-4">
                @for (item of group2Items(); track item.id) {
                    <ng-container *ngTemplateOutlet="checklistCard; context: { $implicit: item }"></ng-container>
                }
            </div>

        </div>

        <!-- REUSABLE CARD TEMPLATE -->
        <ng-template #checklistCard let-item>
            <div class="bg-white rounded-[28px] border-2 transition-all duration-300 relative overflow-hidden group/card shadow-sm"
                 [class.border-slate-100]="item.status === 'pending'"
                 [class.border-emerald-500]="item.status === 'ok'"
                 [class.border-red-500]="item.status === 'issue'"
                 [class.bg-emerald-50/10]="item.status === 'ok'"
                 [class.bg-red-50/10]="item.status === 'issue'">
                
                <div class="p-5 flex items-center gap-5">
                    <!-- Dynamic Icon Wrapper -->
                    <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-all shrink-0"
                         [class.bg-slate-50]="item.status === 'pending'"
                         [class.text-slate-400]="item.status === 'pending'"
                         [class.bg-emerald-100]="item.status === 'ok'"
                         [class.text-emerald-600]="item.status === 'ok'"
                         [class.bg-red-100]="item.status === 'issue'"
                         [class.text-red-600]="item.status === 'issue'">
                        <i [class]="'fa-solid ' + item.icon"></i>
                    </div>

                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-slate-800 text-sm md:text-base leading-tight">
                            {{ item.label }}
                        </h4>
                        @if (item.status === 'issue' && item.note) {
                          <p class="text-[11px] text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded mt-1.5 inline-block">Nota: {{ item.note }}</p>
                        } @else {
                          <p class="text-[10px] uppercase tracking-[0.1em] font-black mt-1.5"
                             [class.text-slate-400]="item.status === 'pending'"
                             [class.text-emerald-500]="item.status === 'ok'"
                             [class.text-red-500]="item.status === 'issue'">
                               {{ item.status === 'pending' ? 'Da Registrare' : (item.status === 'ok' ? 'CONFORME' : 'NON CONFORME') }}
                          </p>
                        }
                    </div>

                    <!-- Action Buttons as Tondini -->
                    <div class="flex gap-2">
                      @if (item.status === 'pending') {
                        <!-- OK Button: Verde con cerchio check -->
                        <button (click)="setStatus(item.id, 'ok')" 
                                class="w-10 h-10 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-300 hover:text-emerald-600 flex items-center justify-center transition-all border border-slate-200">
                          <i class="fa-solid fa-circle-check text-lg"></i>
                        </button>
                        <!-- ISSUE Button: Rosso con triangolo -->
                        <button (click)="openIssueModal(item)"
                                class="w-10 h-10 rounded-full bg-slate-100 hover:bg-red-100 text-slate-300 hover:text-red-500 flex items-center justify-center transition-all border border-slate-200">
                          <i class="fa-solid fa-triangle-exclamation text-sm"></i>
                        </button>
                      } @else {
                        <!-- Reset Button -->
                        <button (click)="setStatus(item.id, 'pending')" 
                                class="w-8 h-8 rounded-full bg-white/50 hover:bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all border border-black/5 shadow-sm">
                          <i class="fa-solid fa-rotate-left text-xs"></i>
                        </button>
                      }
                    </div>
                 </div>
            </div>
        </ng-template>

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
                    {{ items().length - completedCount() }} Rimanenti
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

              <div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-2xl shadow-2xl animate-slide-up mx-4 md:mx-0">
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

        <!-- Non-Conformity Modal -->
        @if (isModalOpen()) {
           <div class="print:hidden fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
              <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-md" (click)="closeModal()"></div>
              <div class="relative w-full max-w-sm bg-white rounded-[48px] shadow-2xl overflow-hidden animate-slide-up border border-slate-100">
                 <div class="px-8 py-10 bg-red-50/50 text-center">
                    <div class="w-20 h-20 rounded-[32px] bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-red-200">
                       <i class="fa-solid fa-triangle-exclamation text-4xl"></i>
                    </div>
                    <h3 class="text-2xl font-black text-red-950 uppercase tracking-tight">Non Conformità</h3>
                    <p class="text-sm text-red-800 font-bold mt-2 leading-tight px-4">{{ currentItem()?.label }}</p>
                 </div>
                 <div class="p-8 space-y-4">
                    <textarea #issueInput class="w-full bg-slate-50 border-2 border-slate-100 rounded-[32px] p-6 text-slate-800 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 focus:outline-none h-40 transition-all font-medium text-sm" placeholder="Specifica il motivo della non conformità..."></textarea>
                    <div class="flex gap-4">
                       <button class="flex-1 py-5 bg-slate-50 text-slate-400 font-black rounded-[24px] hover:bg-slate-100 transition-colors uppercase tracking-widest text-[10px]" (click)="closeModal()">Annulla</button>
                       <button class="flex-1 py-5 bg-red-600 text-white font-black rounded-[24px] shadow-xl shadow-red-300 hover:bg-red-700 transition-all active:scale-95 uppercase tracking-widest text-[10px]" (click)="confirmIssue(issueInput.value)">Salva</button>
                    </div>
                 </div>
              </div>
           </div>
        }

    </div>
  `,
   styles: [`
    .animate-slide-up { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-fade-in { animation: fadeIn 0.6s ease-out; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
  `]
})
export class OperativeChecklistComponent {
   state = inject(AppStateService);
   toast = inject(ToastService);

   isModalOpen = signal(false);
   currentItem = signal<ChecklistItem | null>(null);
   selectedDate = signal(new Date().toISOString().split('T')[0]);
   isSubmitted = signal(false);
   currentRecordId = signal<string | undefined>(undefined);

   statusMap = signal<Record<string, { status: ChecklistItem['status'], note?: string }>>({});

   frigoCount = signal(0);
   congelatoreCount = signal(0);
   pozzettoCount = signal(0);

   constructor() {
      effect(() => {
         const record = this.state.recordToEdit();
         if (record && record.moduleId === 'operative-checklist') {
            this.loadRecord(record);
            setTimeout(() => this.state.completeEditing(), 100);
         }
      }, { allowSignalWrites: true });

      effect(() => {
         this.state.filterDate();
         this.loadByDate();
      }, { allowSignalWrites: true });
   }

   // GROUP 1: Ricezione Merci
   group1Items = computed(() => {
      const s = this.statusMap();
      return [
         { id: 'op-1', label: 'Ricezione merci, verificare aspetto imballi che siano privi di polvere e di ammaccature', icon: 'fa-box', status: s['op-1']?.status || 'pending', note: s['op-1']?.note },
         { id: 'op-2', label: 'Verifica il rispetto della catena del freddo dei prodotti in ricezione: temperatura da +4° a +8°C. Per i prodotti congelati ≤ -18°C. La catena del caldo deve avere la temperatura ≥ 65°C', icon: 'fa-temperature-low', status: s['op-2']?.status || 'pending', note: s['op-2']?.note }
      ];
   });

   // GROUP 2: Dynamic Machines (from Census) + Final Items
   group2Items = computed(() => {
      const s = this.statusMap();
      const list: ChecklistItem[] = [];
      const census = this.state.selectedEquipment();

      // For each equipment in census
      census.forEach(eq => {
         const icon = eq.name.toLowerCase().includes('congelatore') ? 'fa-icicles' :
            (eq.name.toLowerCase().includes('pozzetto') ? 'fa-box-archive' : 'fa-snowflake');
         list.push({
            id: `eq-${eq.id}`,
            label: `${eq.name} (${eq.area})`,
            icon: icon,
            status: s[`eq-${eq.id}`]?.status || 'pending',
            note: s[`eq-${eq.id}`]?.note
         });
      });

      // Final Required Items
      list.push({ id: 'op-5', label: 'Sostanze allergene', icon: 'fa-triangle-exclamation', status: s['op-5']?.status || 'pending', note: s['op-5']?.note });
      list.push({ id: 'op-6', label: 'Rintracciabilità ed etichette', icon: 'fa-file-invoice-dollar', status: s['op-6']?.status || 'pending', note: s['op-6']?.note });
      list.push({ id: 'op-7', label: 'Libro ingredienti', icon: 'fa-book-open', status: s['op-7']?.status || 'pending', note: s['op-7']?.note });

      return list;
   });

   items = computed(() => [...this.group1Items(), ...this.group2Items()]);

   completedCount = computed(() => this.items().filter(i => i.status !== 'pending').length);
   progressPercentage = computed(() => {
      const total = this.items().length;
      return total > 0 ? (this.completedCount() / total) * 100 : 0;
   });
   isAllCompleted = computed(() => this.items().length > 0 && this.items().every(i => i.status !== 'pending'));


   setStatus(id: string, status: ChecklistItem['status']) {
      this.statusMap.update(map => ({
         ...map,
         [id]: { status, note: status === 'ok' ? undefined : map[id]?.note }
      }));
   }

   setAllOk() {
      const newMap: Record<string, any> = {};
      this.items().forEach(item => {
         newMap[item.id] = { status: 'ok' };
      });
      this.statusMap.set(newMap);
      this.toast.info('HACCP OK', 'Tutte le voci impostate come conformi.');
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
            [id]: { status: 'issue', note: note || 'Anomalia riscontrata' }
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
            items: this.items(),
            counts: {
               frigo: this.frigoCount(),
               congelatore: this.congelatoreCount(),
               pozzetto: this.pozzettoCount()
            },
            timestamp: new Date()
         }
      });

      this.toast.success('Registro Inviato', 'I dati sono stati salvati correttamente.');
      this.isSubmitted.set(true);
   }

   startNewChecklist() {
      this.statusMap.set({});
      this.frigoCount.set(0);
      this.congelatoreCount.set(0);
      this.pozzettoCount.set(0);
      this.isSubmitted.set(false);
      this.currentRecordId.set(undefined);
      this.selectedDate.set(new Date().toISOString().split('T')[0]);
   }

   loadByDate() {
      const record = this.state.getRecord('operative-checklist');
      if (record) {
         this.loadRecord({ id: 'saved', date: this.state.filterDate(), data: record });
      } else {
         this.isSubmitted.set(false);
         this.statusMap.set({});
         this.frigoCount.set(0);
         this.congelatoreCount.set(0);
         this.pozzettoCount.set(0);
      }
   }

   loadRecord(record: any) {
      this.currentRecordId.set(record.id);
      this.selectedDate.set(record.date);
      const data = record.data;
      const counts = data.counts || { frigo: 0, congelatore: 0, pozzetto: 0 };
      this.frigoCount.set(counts.frigo);
      this.congelatoreCount.set(counts.congelatore);
      this.pozzettoCount.set(counts.pozzetto);

      const map: Record<string, any> = {};
      data.items?.forEach((item: any) => {
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

   hasIssues = computed(() => this.items().some(i => i.status === 'issue'));

   printReport() { window.print(); }
   sendEmail() { this.toast.success('Email Inviata', 'Report inviato alla sede.'); }
   sendInternalMessage() { this.toast.success('Inviato', 'Report inviato in chat.'); }
}
