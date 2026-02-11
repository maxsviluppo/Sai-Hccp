import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService } from '../../services/app-state.service';
import { ToastService } from '../../services/toast.service';

interface ChecklistItem {
   id: string;
   label: string;
   icon: string; // FontAwesome icon class
   status: 'pending' | 'ok' | 'issue';
   note?: string;
   photo?: string; // Placeholder for future photo evidence
}

@Component({
   selector: 'app-pre-operative-checklist',
   standalone: true,
   imports: [CommonModule],
   template: `
    <div class="pb-20 animate-fade-in relative max-w-2xl mx-auto">

       <!-- PRINT ONLY HEADER & TABLE -->
       <div class="hidden print:block font-sans text-black p-4">
          <div class="border-b-2 border-slate-800 pb-4 mb-6">
             <h1 class="text-2xl font-bold uppercase mb-1">{{ state.adminCompany().name || 'Azienda' }}</h1>
             <h2 class="text-xl font-light text-slate-600">Checklist Pre-Operativa</h2>
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
                <tr class="border-b border-slate-100">
                   <td class="py-3 pr-2 font-medium">{{ item.label }}</td>
                   <td class="py-3">
                      @if(item.status === 'ok') { <span class="font-bold">CONFORME</span> }
                      @if(item.status === 'issue') { <span class="font-bold">NON CONFORME</span> }
                      @if(item.status === 'pending') { <span>NON ESEGUITO</span> }
                   </td>
                   <td class="py-3 italic text-slate-600">
                      {{ item.note || '-' }}
                   </td>
                </tr>
                }
             </tbody>
          </table>

          <div class="mt-8 pt-4 border-t border-slate-300 flex justify-between text-xs text-slate-400">
             <span>Documento generato da HACCP Pro</span>
             <span>Firma: ________________________</span>
          </div>
       </div>
      
      <!-- Enhanced UI Header (Hidden on print) -->
      <div class="print:hidden bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 p-8 rounded-3xl shadow-xl border border-blue-500/30 relative overflow-hidden mb-6">
        <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <i class="fa-solid fa-clipboard-check text-9xl text-white"></i>
        </div>
        <div class="relative z-10">
          <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div class="flex items-center gap-4">
              <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30">
                <i class="fa-solid fa-clipboard-check text-white text-2xl"></i>
              </div>
              <div>
                <h2 class="text-3xl font-black text-white">Fase Pre-Operativa</h2>
                <p class="text-blue-100 text-sm font-medium mt-1">Controlli preliminari e apertura turno</p>
              </div>
            </div>

            <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <!-- Progress Indicator -->
              <div class="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex-1 sm:flex-initial">
                <div class="flex justify-between items-end mb-1.5">
                  <span class="text-[10px] text-blue-100 uppercase font-bold tracking-wider">Avanzamento</span>
                  <span class="text-sm font-black text-white">{{ completedCount() }}/{{ items().length }}</span>
                </div>
                <div class="w-40 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div class="h-full bg-white rounded-full transition-all duration-700"
                       [style.width.%]="progressPercentage()"></div>
                </div>
              </div>

              <div class="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 flex items-center gap-3">
                <div class="text-left">
                  <div class="text-[10px] text-blue-100 uppercase font-bold tracking-wider">Stato</div>
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
            <div class="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
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

      <!-- Quick Action Grid (Hidden on Print) -->
      <div class="print:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 px-1 md:px-0 mb-24 md:mb-0">
        @for (item of items(); track item.id) {
          <div class="bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 overflow-hidden relative"
               [class.border-slate-100]="item.status === 'pending'"
               [class.border-emerald-500]="item.status === 'ok'"
               [class.border-red-500]="item.status === 'issue'"
               [class.bg-emerald-50]="item.status === 'ok'"
               [class.bg-red-50]="item.status === 'issue'"
               [class.shadow-md]="item.status !== 'pending'"
               [class.shadow-md]="item.status !== 'pending'">
            
            <div class="p-4 flex items-center gap-4">
              <!-- Icon Container -->
              <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm transition-colors flex-shrink-0"
                   [class.bg-slate-100]="item.status === 'pending'"
                   [class.text-slate-400]="item.status === 'pending'"
                   [class.bg-emerald-100]="item.status === 'ok'"
                   [class.text-emerald-600]="item.status === 'ok'"
                   [class.bg-red-100]="item.status === 'issue'"
                   [class.text-red-600]="item.status === 'issue'">
                <i [class]="'fa-solid ' + item.icon"></i>
              </div>

              <!-- Label -->
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-slate-800 text-sm md:text-base pr-1"
                    [class.text-emerald-900]="item.status === 'ok'"
                    [class.text-red-900]="item.status === 'issue'">
                  {{ item.label }}
                </h3>
                <p class="text-[10px] uppercase tracking-wide font-bold mt-0.5"
                   [class.text-slate-400]="item.status === 'pending'"
                   [class.text-emerald-600]="item.status === 'ok'"
                   [class.text-red-600]="item.status === 'issue'">
                   @if(item.status === 'pending') { In Attesa }
                   @if(item.status === 'ok') { Conforme }
                   @if(item.status === 'issue') { Non Conforme }
                </p>
              </div>

              <!-- Actions (Tap Areas) -->
              <!-- Actions (Tap Areas) -->
                  @if (item.status === 'pending') {
                    <div class="flex gap-2">
                       <!-- OK Button -->
                       <button (click)="setStatus(item.id, 'ok')" 
                               class="w-10 h-10 rounded-full bg-slate-100 hover:bg-emerald-100 text-slate-300 hover:text-emerald-600 flex items-center justify-center transition-all active:scale-95 border border-slate-200">
                          <i class="fa-solid fa-check text-lg"></i>
                       </button>
                       <!-- KO Button -->
                       <button (click)="openIssueModal(item)"
                               class="w-10 h-10 rounded-full bg-slate-100 hover:bg-red-100 text-slate-300 hover:text-red-500 flex items-center justify-center transition-all active:scale-95 border border-slate-200">
                          <i class="fa-solid fa-triangle-exclamation text-sm"></i>
                       </button>
                    </div>
                  } @else {
                     <!-- Undo Button if already set -->
                     <button (click)="setStatus(item.id, 'pending')" 
                             class="w-8 h-8 rounded-full bg-white/50 hover:bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all border border-black/5 shadow-sm">
                        <i class="fa-solid fa-rotate-left text-xs"></i>
                     </button>
                  }
            </div>

            <!-- Issue Note Indicator -->
            @if (item.status === 'issue' && item.note) {
              <div class="px-4 pb-3 pt-0 text-xs text-red-700 italic border-t border-red-200/50 mt-1">
                 "{{ item.note }}"
              </div>
            }
          </div>
        }
      </div>

      <!-- Footer Actions: Submit OR Post-Actions -->
      <div class="print:hidden fixed bottom-6 right-6 z-30 md:absolute md:bottom-0 md:right-0 md:relative md:mt-8 md:text-right w-full md:w-auto">
        
        @if (!isSubmitted()) {
            @if (isAllCompleted()) {
               <button (click)="submitChecklist()" 
                       class="ml-auto bg-emerald-600 text-white rounded-2xl px-6 py-4 shadow-2xl shadow-emerald-500/40 font-bold text-lg flex items-center gap-3 hover:bg-emerald-700 hover:scale-105 transition-all animate-bounce-short">
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
            <!-- Post Submission Status (Moved Out) -->
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

            <!-- Action Bar (Centered) -->
            <div class="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-3 rounded-2xl shadow-2xl animate-slide-up mx-4 md:mx-0">
                <div class="flex flex-wrap items-center justify-center gap-2">
                    <button (click)="submitChecklist()" class="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2 border border-emerald-400/50 ring-2 ring-emerald-500/20">
                        <i class="fa-solid fa-floppy-disk"></i> Salva
                    </button>

                    <div class="w-px h-8 bg-white/20 mx-1 hidden sm:block"></div>

                    <button (click)="printReport()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 backdrop-blur-sm border border-white/10" title="Stampa">
                        <i class="fa-solid fa-print text-white"></i> <span class="hidden sm:inline">Stampa</span>
                    </button>
                    <button (click)="sendEmail()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 backdrop-blur-sm border border-white/10" title="Email">
                        <i class="fa-solid fa-envelope text-white"></i> <span class="hidden sm:inline">Email</span>
                    </button>
                    <button (click)="sendInternalMessage()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 backdrop-blur-sm border border-white/10" title="Chat">
                        <i class="fa-solid fa-comments text-white"></i> <span class="hidden sm:inline">Chat</span>
                    </button>
                    
                    <div class="w-px h-8 bg-white/20 mx-1 hidden sm:block"></div>

                    <button (click)="startNewChecklist()" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-blue-100 hover:text-white transition-colors border border-white/10 flex items-center justify-center gap-2 backdrop-blur-sm whitespace-nowrap" title="Nuova Compilazione">
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
                     <h3 class="font-black text-red-900 leading-none">Segnala Problema</h3>
                     <p class="text-xs text-red-700 mt-1 font-medium">{{ currentItem()?.label }}</p>
                  </div>
               </div>

               <div class="p-6 space-y-4">
                  <div>
                     <label class="block text-xs font-bold text-slate-500 uppercase mb-2">Descrizione Non Conformità</label>
                     <textarea #issueInput class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none resize-none h-24 capitalize" placeholder="Es. Pavimento sporco, maniglia rotta..."></textarea>
                  </div>
                  
                  <div class="flex gap-2">
                     <button class="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors" (click)="closeModal()">
                        Annulla
                     </button>
                     <button class="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-colors" 
                             (click)="confirmIssue(issueInput.value)">
                        Conferma
                     </button>
                  </div>
               </div>
            </div>
         </div>
      }

    </div>
  `,
   styles: [`
    .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .bg-grid-slate-700\/25 {
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(51 65 85 / 0.25)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e");
    }
  `]
})
export class PreOperationalChecklistComponent {
   state = inject(AppStateService);
   toast = inject(ToastService);

   constructor() {
      effect(() => {
         const record = this.state.recordToEdit();
         if (record && (record.moduleId === 'pre-operative' || record.moduleId === 'pre-op-checklist')) {
            this.loadRecord(record);
            setTimeout(() => this.state.completeEditing(), 100);
         }
      });
   }

   // --- STATE ---
   items = signal<ChecklistItem[]>([
      { id: '1', label: 'Regolarità documentazione', icon: 'fa-file-signature', status: 'pending' },
      { id: '2', label: 'Sanificazione piani e attrezzature', icon: 'fa-soap', status: 'pending' },
      { id: '3', label: 'Verifica DPI e abbigliamento idoneo', icon: 'fa-shirt', status: 'pending' },
      { id: '4', label: 'Cucina e sale', icon: 'fa-utensils', status: 'pending' },
      { id: '5', label: 'Area lavaggio', icon: 'fa-sink', status: 'pending' },
      { id: '6', label: 'Deposito', icon: 'fa-boxes-stacked', status: 'pending' },
      { id: '7', label: 'Spogliatoio', icon: 'fa-shirt', status: 'pending' },
      { id: '8', label: 'Antibagno e bagno personale', icon: 'fa-restroom', status: 'pending' },
      { id: '9', label: 'Bagno clienti', icon: 'fa-people-arrows', status: 'pending' },
      { id: '10', label: 'Pavimenti', icon: 'fa-table-cells', status: 'pending' },
      { id: '11', label: 'Pareti', icon: 'fa-border-all', status: 'pending' },
      { id: '12', label: 'Soffitto', icon: 'fa-cloud', status: 'pending' },
      { id: '13', label: 'Infissi', icon: 'fa-door-closed', status: 'pending' },
      { id: '14', label: 'Anti-intrusione', icon: 'fa-shield-cat', status: 'pending' },
   ]);

   isModalOpen = signal(false);
   currentItem = signal<ChecklistItem | null>(null);
   selectedDate = signal(new Date().toISOString().split('T')[0]);

   isSubmitted = signal(false);
   currentRecordId = signal<string | undefined>(undefined);

   // History Computed
   history = computed(() => this.state.checklistRecords()
      .filter(r => r.moduleId === 'pre-op-checklist' || r.moduleId === 'pre-operative')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
   );

   // --- COMPUTED ---
   completedCount = computed(() => this.items().filter(i => i.status !== 'pending').length);

   progressPercentage = computed(() => {
      if (this.items().length === 0) return 0;
      return (this.completedCount() / this.items().length) * 100;
   });

   isAllCompleted = computed(() => this.items().every(i => i.status !== 'pending'));

   hasIssues = computed(() => this.items().some(i => i.status === 'issue'));

   // --- ACTIONS ---

   getTodayDate(): string {
      return new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
   }

   setStatus(id: string, status: 'ok' | 'issue' | 'pending') {
      this.items.update(items => items.map(i => i.id === id ? { ...i, status } : i));
   }

   setAllOk() {
      this.items.update(items => items.map(i => ({ ...i, status: 'ok' })));
      this.toast.info('Tutto Conforme', 'Tutti i controlli sono stati impostati come conformi.');
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
         this.items.update(items =>
            items.map(i => i.id === id ? { ...i, status: 'issue', note: note || 'Non conformità generica' } : i)
         );
      }
      this.closeModal();
   }

   submitChecklist() {
      // Collect all issues for report
      const issues = this.items().filter(i => i.status === 'issue');
      const isClean = issues.length === 0;

      const recordId = this.currentRecordId() || Math.random().toString(36).substr(2, 9);
      this.currentRecordId.set(recordId);

      // Save to App State (Historical)
      this.state.saveChecklist({
         id: recordId,
         moduleId: 'pre-op-checklist',
         date: this.selectedDate(),
         data: {
            items: this.items(),
            status: isClean ? 'Conforme' : 'Non Conforme',
            summary: isClean ? 'Tutto Conforme' : `Rilevate ${issues.length} non conformità`
         }
      });

      this.toast.success(
         'Checklist Registrata',
         'I dati sono stati salvati nello storico.'
      );

      this.isSubmitted.set(true);
   }

   // --- POST SUBMISSION ACTIONS ---

   printReport() {
      window.print();
   }

   sendEmail() {
      const adminEmail = this.state.adminCompany().email || 'amministrazione@haccp-pro.it';
      // In a real app, this would call a backend API
      this.toast.success('Email Inviata', `Il report PDF è stato inviato a ${adminEmail}`);
   }

   sendInternalMessage() {
      const issuesCount = this.items().filter(i => i.status === 'issue').length;
      const statusText = issuesCount === 0 ? 'Tutto Conforme' : `Rilevate ${issuesCount} Non Conformità`;

      // Simulate sending a message
      const newMessage = {
         id: Date.now().toString(),
         senderId: this.state.currentUser()?.id || 'unknown',
         senderName: this.state.currentUser()?.name || 'Operatore',
         content: `Report Pre-Operativo di oggi completato. Esito: ${statusText}. Vedi allegato.`,
         timestamp: new Date(),
         isRead: false,
         attachments: ['Report_PreOp_' + new Date().toLocaleDateString().replace(/\//g, '-') + '.pdf']
      };

      this.state.addMessage(newMessage);
      this.toast.success('Messaggio Inviato', 'Il report è stato allegato alla messaggistica interna.');
   }

   startNewChecklist() {
      this.resetForm();
      this.isSubmitted.set(false);
      this.currentRecordId.set(undefined);
      this.selectedDate.set(new Date().toISOString().split('T')[0]);
   }

   loadRecord(record: any) {
      this.currentRecordId.set(record.id);
      this.selectedDate.set(record.date);
      // Deep copy to avoid mutating state directly
      const loadedItems = JSON.parse(JSON.stringify(record.data.items));
      this.items.set(loadedItems);
      this.isSubmitted.set(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.toast.info('Record Caricato', 'Puoi modificare e registrare nuovamente.');
   }

   deleteRecord(id: string) {
      if (confirm('Sei sicuro di voler eliminare questa registrazione?')) {
         this.state.deleteChecklist(id);
         if (this.currentRecordId() === id) {
            this.startNewChecklist();
         }
      }
   }

   resetForm() {
      this.items.update(items => items.map(i => ({ ...i, status: 'pending', note: undefined })));
   }

   getFormattedDate() {
      if (!this.selectedDate()) return '';
      const parts = this.selectedDate().split('-');
      if (parts.length === 3) {
         return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return this.selectedDate();
   }
}
