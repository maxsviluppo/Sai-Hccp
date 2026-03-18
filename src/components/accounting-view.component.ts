import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppStateService, ClientEntity } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';

interface Payment {
  id: string;
  clientId: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'one-time';
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  notes?: string;
}

interface Installment {
  id: string;
  paymentId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
}

interface JournalEntry {
  id: string;
  clientId: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  category: 'payment' | 'expense' | 'refund' | 'other';
}

interface Reminder {
  id: string;
  clientId: string;
  type: 'payment' | 'deadline' | 'memo';
  message: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  dismissed: boolean;
}

@Component({
  selector: 'app-accounting-view',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="space-y-6 max-w-7xl mx-auto p-4 pb-12">
      
      <!-- Sleek Professional Header -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden mb-6">
        <div class="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-emerald-50 to-transparent pointer-events-none"></div>
        
        <div class="relative z-10 flex items-center gap-5">
           <div class="h-14 w-14 rounded-xl bg-white border border-emerald-100 flex items-center justify-center shadow-sm text-emerald-600 shrink-0 relative">
              <i class="fa-solid fa-euro-sign text-2xl"></i>
           </div>
           <div>
              <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Contabilità e Pagamenti</h2>
              <p class="text-xs font-semibold text-slate-500 mt-1">
                 @if (selectedClient()) {
                   Gestione per: <span class="text-emerald-600">{{ selectedClient()?.name }}</span>
                 } @else {
                   Panoramica Generale - Tutte le Aziende
                 }
              </p>
           </div>
        </div>

        <div class="flex items-center gap-3 relative z-10">
           <div class="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 flex flex-col shadow-sm">
              <span class="text-[9px] text-slate-400 uppercase font-bold tracking-widest leading-tight">Stato Sistema</span>
              <span class="text-xs font-black text-emerald-500 flex items-center gap-1.5 mt-0.5">
                 <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Operativo
              </span>
           </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Incassato -->
        <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
          <div class="absolute -right-4 -top-4 w-16 h-16 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div class="flex items-center justify-between relative z-10">
            <div>
              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Incassato</p>
              <p class="text-2xl font-black text-emerald-600 mt-1 truncate">€{{ totalPaid() }}</p>
            </div>
            <div class="w-10 h-10 rounded border border-emerald-100 bg-white shadow-sm flex items-center justify-center">
              <i class="fa-solid fa-check text-emerald-500"></i>
            </div>
          </div>
        </div>

        <!-- In Attesa -->
        <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
          <div class="absolute -right-4 -top-4 w-16 h-16 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div class="flex items-center justify-between relative z-10">
            <div>
              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">In Attesa</p>
              <p class="text-2xl font-black text-amber-500 mt-1 truncate">€{{ totalPending() }}</p>
            </div>
            <div class="w-10 h-10 rounded border border-amber-100 bg-white shadow-sm flex items-center justify-center">
              <i class="fa-regular fa-clock text-amber-400"></i>
            </div>
          </div>
        </div>

        <!-- Scaduti -->
        <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-colors">
          <div class="absolute -right-4 -top-4 w-16 h-16 bg-red-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div class="flex items-center justify-between relative z-10">
            <div>
              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Scaduti</p>
              <p class="text-2xl font-black text-red-500 mt-1 truncate">€{{ totalOverdue() }}</p>
            </div>
            <div class="w-10 h-10 rounded border border-red-100 bg-white shadow-sm flex items-center justify-center">
              <i class="fa-solid fa-triangle-exclamation text-red-400 text-sm"></i>
            </div>
          </div>
        </div>

        <!-- Solleciti -->
        <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
          <div class="absolute -right-4 -top-4 w-16 h-16 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          <div class="flex items-center justify-between relative z-10">
            <div>
              <p class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Solleciti</p>
              <p class="text-2xl font-black text-indigo-500 mt-1 truncate">{{ overdueClients().length }}</p>
            </div>
            <div class="w-10 h-10 rounded border border-indigo-100 bg-white shadow-sm flex items-center justify-center">
              <i class="fa-regular fa-bell text-indigo-400"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 class="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <i class="fa-solid fa-sliders text-slate-400"></i>
          Filtri e Ricerca
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Month Filter -->
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Mese</label>
            <select [(ngModel)]="filterMonth" (change)="applyFilters()" 
                    class="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors shadow-sm">
              <option value="">Tutti i Mesi</option>
              <option value="01">Gennaio</option>
              <option value="02">Febbraio</option>
              <option value="03">Marzo</option>
              <option value="04">Aprile</option>
              <option value="05">Maggio</option>
              <option value="06">Giugno</option>
              <option value="07">Luglio</option>
              <option value="08">Agosto</option>
              <option value="09">Settembre</option>
              <option value="10">Ottobre</option>
              <option value="11">Novembre</option>
              <option value="12">Dicembre</option>
            </select>
          </div>

          <!-- Client Filter -->
          @if (!selectedClient()) {
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Azienda</label>
            <select [(ngModel)]="filterClientId" (change)="applyFilters()" 
                    class="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors shadow-sm">
              <option value="">Tutte le Aziende</option>
              @for (client of state.clients(); track client.id) {
                <option [value]="client.id">{{ client.name }}</option>
              }
            </select>
          </div>
          }

          <!-- Date From -->
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Data Da</label>
            <input type="date" [(ngModel)]="filterDateFrom" (change)="applyFilters()" 
                   class="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors shadow-sm">
          </div>

          <!-- Date To -->
          <div>
            <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Data A</label>
            <input type="date" [(ngModel)]="filterDateTo" (change)="applyFilters()" 
                   class="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors shadow-sm">
          </div>
        </div>

        <!-- Reset Filters Button -->
        @if (hasActiveFilters()) {
          <div class="mt-4 flex justify-end">
            <button (click)="resetFilters()" 
                    class="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded text-[11px] font-bold transition-all flex items-center gap-1.5 shadow-sm">
              <i class="fa-solid fa-rotate-left"></i> Azzera
            </button>
          </div>
        }
      </div>

      <!-- Tabs and Content Container -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <!-- Tabs Header -->
        <div class="border-b border-slate-100 flex bg-slate-50/50">
          <button (click)="activeTab.set('payments')" 
                  class="flex-1 px-4 py-3 text-[11px] uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2"
                  [class.bg-white]="activeTab() === 'payments'"
                  [class.text-indigo-600]="activeTab() === 'payments'"
                  [class.border-b-2]="activeTab() === 'payments'"
                  [class.border-indigo-500]="activeTab() === 'payments'"
                  [class.text-slate-500]="activeTab() !== 'payments'">
            <i class="fa-solid fa-money-bill-wave"></i> <span class="hidden sm:inline">Pagamenti</span>
          </button>
          <button (click)="activeTab.set('journal')" 
                  class="flex-1 px-4 py-3 text-[11px] uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 border-l border-slate-100"
                  [class.bg-white]="activeTab() === 'journal'"
                  [class.text-indigo-600]="activeTab() === 'journal'"
                  [class.border-b-2]="activeTab() === 'journal'"
                  [class.border-indigo-500]="activeTab() === 'journal'"
                  [class.text-slate-500]="activeTab() !== 'journal'">
            <i class="fa-solid fa-book"></i> <span class="hidden sm:inline">Prima Nota</span>
          </button>
          <button (click)="activeTab.set('reminders')" 
                  class="flex-1 px-4 py-3 text-[11px] uppercase tracking-widest font-black transition-all flex items-center justify-center gap-2 border-l border-slate-100 relative"
                  [class.bg-white]="activeTab() === 'reminders'"
                  [class.text-indigo-600]="activeTab() === 'reminders'"
                  [class.border-b-2]="activeTab() === 'reminders'"
                  [class.border-indigo-500]="activeTab() === 'reminders'"
                  [class.text-slate-500]="activeTab() !== 'reminders'">
            <i class="fa-regular fa-bell"></i> <span class="hidden sm:inline">Promemoria</span>
            @if (activeReminders().length > 0) {
              <div class="absolute top-2 right-4 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold">
                 {{ activeReminders().length }}
              </div>
            }
          </button>
        </div>

        <!-- Payments Tab -->
        @if (activeTab() === 'payments') {
          <div class="p-5">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
              <h3 class="text-[13px] font-black tracking-widest uppercase text-slate-800 flex items-center gap-2">
                 <i class="fa-solid fa-file-invoice text-indigo-400"></i> Gestione Pagamenti
              </h3>
              <button (click)="openPaymentModal()" 
                      class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
                <i class="fa-solid fa-plus"></i> Add Pagamento
              </button>
            </div>

            @if (filteredPayments().length === 0) {
              <div class="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <i class="fa-solid fa-receipt text-slate-300 text-4xl mb-3"></i>
                <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Nessun pagamento registrato</p>
              </div>
            } @else {
              <div class="space-y-2">
                @for (payment of filteredPayments(); track payment.id) {
                  @let client = getClient(payment.clientId);
                  <div class="bg-white border rounded shadow-sm hover:shadow-md transition-all group overflow-hidden"
                       [class.border-emerald-200]="payment.status === 'paid'"
                       [class.border-amber-200]="payment.status === 'pending'"
                       [class.border-red-200]="payment.status === 'overdue'">
                    
                    <div class="p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2.5 mb-1.5">
                          <h4 class="font-bold text-sm text-slate-800 truncate">{{ client?.name || 'Cliente Sconosciuto' }}</h4>
                          <span class="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                                [class.bg-emerald-50]="payment.status === 'paid'" [class.text-emerald-600]="payment.status === 'paid'"
                                [class.bg-amber-50]="payment.status === 'pending'" [class.text-amber-600]="payment.status === 'pending'"
                                [class.bg-red-50]="payment.status === 'overdue'" [class.text-red-600]="payment.status === 'overdue'">
                            {{ getStatusLabel(payment.status) }}
                          </span>
                        </div>
                        
                        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span class="font-bold text-slate-800">
                             <span class="text-[10px] text-slate-400 font-normal uppercase mr-1">Importo:</span>€{{ payment.amount }}
                          </span>
                          <span class="hidden sm:inline text-slate-200">•</span>
                          <span class="font-bold whitespace-nowrap">
                             <span class="text-[10px] text-slate-400 font-normal uppercase mr-1">Scad.:</span>{{ payment.dueDate | date:'dd/MM/yyyy' }}
                          </span>
                          @if (payment.paidDate) {
                            <span class="hidden sm:inline text-slate-200">•</span>
                            <span class="font-bold text-emerald-600 whitespace-nowrap">
                              <span class="text-[10px] text-emerald-400 font-normal uppercase mr-1">Pagato in data:</span> <i class="fa-solid fa-check text-emerald-500 mr-1 text-[10px]"></i>{{ payment.paidDate | date:'dd/MM/yyyy' }}
                            </span>
                          }
                          @if (payment.notes) {
                            <span class="hidden md:inline text-slate-200">•</span>
                            <span class="truncate max-w-[200px]" title="{{ payment.notes }}">
                              <span class="text-[10px] text-slate-400 uppercase mr-1">Note:</span>{{ payment.notes }}
                            </span>
                          }
                        </div>
                      </div>

                      <div class="flex items-center gap-2 self-start md:self-auto shrink-0 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                          <span class="text-[9px] bg-slate-100 text-slate-500 uppercase font-black px-2 py-1 rounded hidden md:inline-block border border-slate-200">
                            {{ getFrequencyLabel(payment.frequency) }}
                          </span>
                        @if (payment.status !== 'paid') {
                          <button (click)="markAsPaid(payment.id)" 
                                  class="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-600 rounded text-xs font-bold transition-colors shadow-sm whitespace-nowrap group-hover:border-emerald-200">
                            <i class="fa-solid fa-check mr-1.5"></i> Saldato
                          </button>
                        }
                        @if (payment.status === 'overdue') {
                          <button (click)="sendReminder(payment.clientId)" 
                                  class="px-2.5 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 rounded text-xs font-bold transition-colors shadow-sm whitespace-nowrap">
                            <i class="fa-solid fa-paper-plane mr-1.5"></i> Sollecito
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }

        <!-- Journal Tab -->
        @if (activeTab() === 'journal') {
          <div class="p-5">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
              <h3 class="text-[13px] font-black tracking-widest uppercase text-slate-800 flex items-center gap-2">
                 <i class="fa-solid fa-book-journal-whills text-indigo-400"></i> Prima Nota
              </h3>
              <button (click)="openJournalModal()" 
                      class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
                <i class="fa-solid fa-plus"></i> Nuova Voce
              </button>
            </div>

            @if (filteredJournalEntries().length === 0) {
              <div class="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <i class="fa-solid fa-book-open text-slate-300 text-4xl mb-3"></i>
                <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Nessuna registrazione in prima nota</p>
              </div>
            } @else {
              <div class="overflow-x-auto border border-slate-200 rounded bg-white">
                <table class="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-widest text-slate-500 font-black">
                      <th class="px-4 py-3">Data</th>
                      @if (!selectedClient()) {
                        <th class="px-4 py-3">Azienda</th>
                      }
                      <th class="px-4 py-3">Descrizione</th>
                      <th class="px-4 py-3 w-32">Categoria</th>
                      <th class="px-4 py-3 text-right">Dare</th>
                      <th class="px-4 py-3 text-right">Avere</th>
                    </tr>
                  </thead>
                  <tbody class="text-sm">
                    @for (entry of filteredJournalEntries(); track entry.id) {
                      @let client = getClient(entry.clientId);
                      <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td class="px-4 py-2.5 text-xs text-slate-500 font-bold font-mono">{{ entry.date | date:'dd/MM/yyyy' }}</td>
                        @if (!selectedClient()) {
                          <td class="px-4 py-2.5 font-bold text-slate-800 text-xs">{{ client?.name }}</td>
                        }
                        <td class="px-4 py-2.5 text-xs">{{ entry.description }}</td>
                        <td class="px-4 py-2.5">
                          <span class="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border"
                                [class.bg-emerald-50]="entry.category === 'payment'" [class.text-emerald-600]="entry.category === 'payment'" [class.border-emerald-200]="entry.category === 'payment'"
                                [class.bg-red-50]="entry.category === 'expense'" [class.text-red-600]="entry.category === 'expense'" [class.border-red-200]="entry.category === 'expense'"
                                [class.bg-amber-50]="entry.category === 'refund'" [class.text-amber-600]="entry.category === 'refund'" [class.border-amber-200]="entry.category === 'refund'"
                                [class.bg-slate-50]="entry.category === 'other'" [class.text-slate-600]="entry.category === 'other'" [class.border-slate-200]="entry.category === 'other'">
                            {{ getCategoryLabel(entry.category) }}
                          </span>
                        </td>
                        <td class="px-4 py-2.5 text-right font-mono text-xs" [class.text-red-600]="entry.debit > 0" [class.font-bold]="entry.debit > 0" [class.text-slate-300]="entry.debit === 0">
                          {{ entry.debit > 0 ? '€' + (entry.debit | number:'1.2-2') : '-' }}
                        </td>
                        <td class="px-4 py-2.5 text-right font-mono text-xs" [class.text-emerald-600]="entry.credit > 0" [class.font-bold]="entry.credit > 0" [class.text-slate-300]="entry.credit === 0">
                          {{ entry.credit > 0 ? '€' + (entry.credit | number:'1.2-2') : '-' }}
                        </td>
                      </tr>
                    }
                    <tr class="bg-indigo-50/50 border-t-2 border-slate-200 text-sm">
                      <td [attr.colspan]="selectedClient() ? 3 : 4" class="px-4 py-3 text-right text-[11px] font-black uppercase tracking-widest text-slate-500">Totali:</td>
                      <td class="px-4 py-3 text-right font-mono font-bold text-red-600">€{{ totalDebit() | number:'1.2-2' }}</td>
                      <td class="px-4 py-3 text-right font-mono font-bold text-emerald-600">€{{ totalCredit() | number:'1.2-2' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- Reminders Tab -->
        @if (activeTab() === 'reminders') {
          <div class="p-5">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
              <h3 class="text-[13px] font-black tracking-widest uppercase text-slate-800 flex items-center gap-2">
                 <i class="fa-solid fa-bell-concierge text-indigo-400"></i> Promemoria attivi
              </h3>
              <button (click)="openReminderModal()" 
                      class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm">
                <i class="fa-solid fa-plus"></i> Add Memo
              </button>
            </div>

            @if (filteredReminders().length === 0) {
              <div class="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <i class="fa-solid fa-calendar-check text-slate-300 text-4xl mb-3"></i>
                <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Nessun promemoria attivo</p>
              </div>
            } @else {
              <div class="space-y-2">
                @for (reminder of filteredReminders(); track reminder.id) {
                  @let client = getClient(reminder.clientId);
                  <div class="bg-white border rounded p-3.5 transition-all flex flex-col md:flex-row gap-4 items-start md:items-center justify-between"
                       [class.border-l-4]="!reminder.dismissed"
                       [class.border-l-red-500]="reminder.priority === 'high' && !reminder.dismissed"
                       [class.border-l-amber-500]="reminder.priority === 'medium' && !reminder.dismissed"
                       [class.border-l-blue-500]="reminder.priority === 'low' && !reminder.dismissed"
                       [class.border-slate-200]="reminder.dismissed"
                       [class.bg-slate-50]="reminder.dismissed"
                       [class.opacity-60]="reminder.dismissed">
                    
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2.5 mb-1.5">
                        <i class="fa-solid text-sm"
                           [class.fa-exclamation-triangle]="reminder.priority === 'high'" [class.text-red-500]="reminder.priority === 'high'"
                           [class.fa-info-circle]="reminder.priority === 'medium'" [class.text-amber-500]="reminder.priority === 'medium'"
                           [class.fa-bell]="reminder.priority === 'low'" [class.text-blue-500]="reminder.priority === 'low'"></i>
                        <h4 class="font-bold text-sm text-slate-800 truncate">{{ client?.name || 'Generale' }}</h4>
                        <span class="text-[9px] bg-slate-100 text-slate-500 font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-slate-200">
                          {{ getReminderTypeLabel(reminder.type) }}
                        </span>
                        @if (reminder.dismissed) {
                          <span class="text-[9px] bg-slate-200 text-slate-500 font-black uppercase tracking-widest px-1.5 py-0.5 rounded">Archiviato</span>
                        }
                      </div>
                      
                      <p class="text-sm text-slate-600 mb-1 pl-6">{{ reminder.message }}</p>
                      <p class="text-[10px] text-slate-500 uppercase font-black tracking-widest pl-6">
                        Scadenza: <span class="font-bold text-slate-700">{{ reminder.dueDate | date:'dd/MM/yyyy' }}</span>
                      </p>
                    </div>

                    @if (!reminder.dismissed) {
                      <div class="shrink-0 flex items-center justify-end w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <button (click)="dismissReminder(reminder.id)" 
                                class="w-8 h-8 rounded border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center shadow-sm" title="Archivia">
                          <i class="fa-solid fa-check text-sm"></i>
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Payment Modal -->
      @if (showPaymentModal()) {
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" (click)="closeModals()">
          <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-slideUp relative" (click)="$event.stopPropagation()">
            <!-- Ribbon -->
            <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>
            
            <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white relative z-10">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                   <i class="fa-solid fa-file-invoice text-sm"></i>
                </div>
                <h3 class="text-base font-black text-slate-800 tracking-tight">Nuovo Pagamento</h3>
              </div>
              <button (click)="closeModals()" class="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center focus:outline-none">
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            
            <form [formGroup]="paymentForm" (ngSubmit)="savePayment()" class="p-6 overflow-y-auto space-y-4">
              <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Azienda</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <i class="fa-solid fa-building text-sm"></i>
                  </div>
                  <select formControlName="clientId" class="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus:bg-white transition-all">
                    <option value="">Seleziona Azienda</option>
                    @for (client of state.clients(); track client.id) {
                      <option [value]="client.id">{{ client.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Importo (€)</label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <i class="fa-solid fa-euro-sign text-sm"></i>
                    </div>
                    <input type="number" formControlName="amount" placeholder="0.00" class="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus:bg-white font-mono">
                  </div>
                </div>
                <div>
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Cadenza</label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <i class="fa-solid fa-clock-rotate-left text-sm"></i>
                    </div>
                    <select formControlName="frequency" class="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus:bg-white transition-all">
                      <option value="monthly">Mensile</option>
                      <option value="quarterly">Trimestrale</option>
                      <option value="yearly">Annuale</option>
                      <option value="one-time">Una Tantum</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Data Scadenza</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <i class="fa-regular fa-calendar text-sm"></i>
                  </div>
                  <input type="date" formControlName="dueDate" class="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus:bg-white font-mono">
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Note (Opzionale)</label>
                <textarea formControlName="notes" rows="2" class="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus:bg-white resize-none" placeholder="Aggiungi una nota..."></textarea>
              </div>

              <div class="flex gap-2 pt-4 border-t border-slate-100 mt-2">
                <button type="button" (click)="closeModals()" class="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-bold transition-colors">
                  Annulla
                </button>
                <button type="submit" [disabled]="!paymentForm.valid" class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <i class="fa-solid fa-save"></i> Salva Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Journal Modal -->
      @if (showJournalModal()) {
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" (click)="closeModals()">
          <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-slideUp relative" (click)="$event.stopPropagation()">
            <!-- Ribbon -->
            <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>

            <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white relative z-10">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                   <i class="fa-solid fa-book-journal-whills text-sm"></i>
                </div>
                <h3 class="text-base font-black text-slate-800 tracking-tight">Nuova Registrazione Prima Nota</h3>
              </div>
              <button (click)="closeModals()" class="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center focus:outline-none">
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            
            <form [formGroup]="journalForm" (ngSubmit)="saveJournal()" class="p-6 overflow-y-auto space-y-4">
              <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Azienda (Opzionale)</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <i class="fa-solid fa-building text-sm"></i>
                  </div>
                  <select formControlName="clientId" class="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus:bg-white transition-all">
                    <option value="">Nessuna Azienda (Generale)</option>
                    @for (client of state.clients(); track client.id) {
                      <option [value]="client.id">{{ client.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Data Competenza</label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <i class="fa-regular fa-calendar text-sm"></i>
                    </div>
                    <input type="date" formControlName="date" class="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus:bg-white font-mono">
                  </div>
                </div>
                <div>
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Categoria (Causale)</label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <i class="fa-solid fa-tag text-sm"></i>
                    </div>
                    <select formControlName="category" class="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus:bg-white transition-all">
                      <option value="payment">Incasso</option>
                      <option value="expense">Spesa</option>
                      <option value="refund">Rimborso</option>
                      <option value="other">Altro / Generale</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Spiegazione Movimento</label>
                <textarea formControlName="description" rows="2" class="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus:bg-white resize-none" placeholder="Inserisci una descrizione coerente..."></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-black text-red-500 uppercase tracking-widest mb-1.5 ml-1">Dare (€) <span class="text-slate-400 font-normal ml-1">(Uscite)</span></label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-red-500 transition-colors">
                      <i class="fa-solid fa-arrow-down text-sm"></i>
                    </div>
                    <input type="number" formControlName="debit" placeholder="0.00" class="w-full pl-10 pr-3 py-2.5 bg-red-50/20 border border-red-100 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors focus:bg-white font-mono">
                  </div>
                </div>
                <div>
                  <label class="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1.5 ml-1">Avere (€) <span class="text-slate-400 font-normal ml-1">(Entrate)</span></label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                      <i class="fa-solid fa-arrow-up text-sm"></i>
                    </div>
                    <input type="number" formControlName="credit" placeholder="0.00" class="w-full pl-10 pr-3 py-2.5 bg-emerald-50/20 border border-emerald-100 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors focus:bg-white font-mono">
                  </div>
                </div>
              </div>

              <div class="flex gap-2 pt-4 border-t border-slate-100 mt-2">
                <button type="button" (click)="closeModals()" class="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-bold transition-colors">
                  Annulla
                </button>
                <button type="submit" [disabled]="!journalForm.valid" class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <i class="fa-solid fa-save"></i> Salva Voci Prima Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Reminder Modal -->
      @if (showReminderModal()) {
        <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" (click)="closeModals()">
          <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-slideUp relative" (click)="$event.stopPropagation()">
            <!-- Ribbon -->
            <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-indigo-600"></div>

            <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white relative z-10">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                   <i class="fa-solid fa-bell-concierge text-sm"></i>
                </div>
                <h3 class="text-base font-black text-slate-800 tracking-tight">Nuovo Promemoria</h3>
              </div>
              <button (click)="closeModals()" class="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center focus:outline-none">
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            
            <form [formGroup]="reminderForm" (ngSubmit)="saveReminder()" class="p-6 overflow-y-auto space-y-4">
              <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Azienda (Opzionale)</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <i class="fa-solid fa-building text-sm"></i>
                  </div>
                  <select formControlName="clientId" class="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus:bg-white transition-all">
                    <option value="">Memo Generale (Senza Azienda)</option>
                    @for (client of state.clients(); track client.id) {
                      <option [value]="client.id">{{ client.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Tipologia</label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <i class="fa-solid fa-layer-group text-sm"></i>
                    </div>
                    <select formControlName="type" class="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus:bg-white transition-all">
                      <option value="payment">Sollecito Pagamento</option>
                      <option value="deadline">Scadenza Documento</option>
                      <option value="memo">Appunto Personale</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Livello Priorità</label>
                  <div class="relative group">
                    <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <i class="fa-solid fa-flag text-sm"></i>
                    </div>
                    <select formControlName="priority" class="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus:bg-white transition-all">
                      <option value="low">Normale (Bassa)</option>
                      <option value="medium">Importante (Media)</option>
                      <option value="high">Critica (Alta)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Testo Promemoria</label>
                <textarea formControlName="message" rows="3" placeholder="Scrivi i dettagli o l'azione da compiere..." class="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus:bg-white resize-none"></textarea>
              </div>

              <div>
                <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Limiti Termine (Scadenza)</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <i class="fa-regular fa-calendar-xmark text-sm"></i>
                  </div>
                  <input type="date" formControlName="dueDate" class="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors focus:bg-white font-mono">
                </div>
              </div>

              <div class="flex gap-2 pt-4 border-t border-slate-100 mt-2">
                <button type="button" (click)="closeModals()" class="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-bold transition-colors">
                  Annulla
                </button>
                <button type="submit" [disabled]="!reminderForm.valid" class="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  <i class="fa-solid fa-save"></i> Genera Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AccountingViewComponent {
  state = inject(AppStateService);
  toastService = inject(ToastService);
  fb = inject(FormBuilder);

  activeTab = signal<'payments' | 'journal' | 'reminders'>('payments');
  showPaymentModal = signal(false);
  showJournalModal = signal(false);
  showReminderModal = signal(false);

  // Filter properties
  filterMonth = '';
  filterClientId = '';
  filterDateFrom = '';
  filterDateTo = '';

  // Mock Data - In production would come from backend
  payments = signal<Payment[]>([
    {
      id: '1',
      clientId: 'c1',
      amount: 150,
      frequency: 'monthly',
      dueDate: '2026-02-15',
      paidDate: '2026-02-10',
      status: 'paid',
      notes: 'Pagamento regolare'
    },
    {
      id: '2',
      clientId: 'c2',
      amount: 200,
      frequency: 'monthly',
      dueDate: '2026-02-01',
      status: 'overdue',
      notes: 'Sollecito inviato'
    },
    {
      id: '3',
      clientId: 'c1',
      amount: 150,
      frequency: 'monthly',
      dueDate: '2026-01-15',
      paidDate: '2026-01-12',
      status: 'paid',
      notes: 'Pagamento Gennaio'
    },
    {
      id: '4',
      clientId: 'c2',
      amount: 200,
      frequency: 'monthly',
      dueDate: '2026-03-01',
      status: 'pending',
      notes: 'Pagamento Marzo'
    },
    {
      id: '5',
      clientId: 'c1',
      amount: 450,
      frequency: 'quarterly',
      dueDate: '2025-12-31',
      paidDate: '2025-12-28',
      status: 'paid',
      notes: 'Pagamento trimestrale Q4 2025'
    }
  ]);

  journalEntries = signal<JournalEntry[]>([
    {
      id: '1',
      clientId: 'c1',
      date: '2026-02-10',
      description: 'Pagamento servizio HACCP Febbraio',
      debit: 0,
      credit: 150,
      category: 'payment'
    },
    {
      id: '2',
      clientId: 'c2',
      date: '2026-01-15',
      description: 'Rimborso spese formazione',
      debit: 50,
      credit: 0,
      category: 'expense'
    },
    {
      id: '3',
      clientId: 'c1',
      date: '2026-01-12',
      description: 'Pagamento servizio HACCP Gennaio',
      debit: 0,
      credit: 150,
      category: 'payment'
    },
    {
      id: '4',
      clientId: 'c2',
      date: '2026-02-20',
      description: 'Spese materiale consumabile',
      debit: 75,
      credit: 0,
      category: 'expense'
    },
    {
      id: '5',
      clientId: 'c1',
      date: '2025-12-28',
      description: 'Pagamento trimestrale Q4 2025',
      debit: 0,
      credit: 450,
      category: 'payment'
    }
  ]);

  reminders = signal<Reminder[]>([
    {
      id: '1',
      clientId: 'c2',
      type: 'payment',
      message: 'Pagamento scaduto da 3 giorni - Inviare sollecito',
      dueDate: '2026-02-01',
      priority: 'high',
      dismissed: false
    }
  ]);

  paymentForm: FormGroup;
  journalForm: FormGroup;
  reminderForm: FormGroup;

  constructor() {
    this.paymentForm = this.fb.group({
      clientId: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      frequency: ['monthly', Validators.required],
      dueDate: ['', Validators.required],
      notes: ['']
    });

    this.journalForm = this.fb.group({
      clientId: ['', Validators.required],
      date: ['', Validators.required],
      description: ['', Validators.required],
      debit: [0, Validators.min(0)],
      credit: [0, Validators.min(0)],
      category: ['payment', Validators.required]
    });

    this.reminderForm = this.fb.group({
      clientId: ['', Validators.required],
      type: ['payment', Validators.required],
      message: ['', Validators.required],
      dueDate: ['', Validators.required],
      priority: ['medium', Validators.required]
    });

    // Show overdue payment reminders on login
    effect(() => {
      const user = this.state.currentUser();
      if (user?.role === 'ADMIN') {
        const overdue = this.overdueClients();
        if (overdue.length > 0) {
          setTimeout(() => {
            this.toastService.warning(
              'Pagamenti Scaduti',
              `${overdue.length} aziende hanno pagamenti in ritardo. Controlla la sezione Contabilità.`
            );
          }, 1000);
        }
      }
    });
  }

  selectedClient = computed(() => {
    const filterId = this.state.filterCollaboratorId();
    if (!filterId) return null;
    const user = this.state.systemUsers().find(u => u.id === filterId);
    return user ? this.state.clients().find(c => c.id === user.clientId) : null;
  });

  filteredPayments = computed(() => {
    let filtered = this.payments();

    // Filter by client
    const client = this.selectedClient();
    if (client) {
      filtered = filtered.filter(p => p.clientId === client.id);
    } else if (this.filterClientId) {
      filtered = filtered.filter(p => p.clientId === this.filterClientId);
    }

    // Apply date filters
    filtered = this.applyDateFilters(filtered, (p) => p.dueDate);

    return filtered;
  });

  filteredJournalEntries = computed(() => {
    let filtered = this.journalEntries();

    // Filter by client
    const client = this.selectedClient();
    if (client) {
      filtered = filtered.filter(e => e.clientId === client.id);
    } else if (this.filterClientId) {
      filtered = filtered.filter(e => e.clientId === this.filterClientId);
    }

    // Apply date filters
    filtered = this.applyDateFilters(filtered, (e) => e.date);

    return filtered;
  });

  filteredReminders = computed(() => {
    let filtered = this.reminders();

    // Filter by client
    const client = this.selectedClient();
    if (client) {
      filtered = filtered.filter(r => r.clientId === client.id);
    } else if (this.filterClientId) {
      filtered = filtered.filter(r => r.clientId === this.filterClientId);
    }

    // Apply date filters
    filtered = this.applyDateFilters(filtered, (r) => r.dueDate);

    return filtered;
  });


  activeReminders = computed(() => this.reminders().filter(r => !r.dismissed));

  totalPaid = computed(() => {
    return this.filteredPayments()
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
  });

  totalPending = computed(() => {
    return this.filteredPayments()
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);
  });

  totalOverdue = computed(() => {
    return this.filteredPayments()
      .filter(p => p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0);
  });

  totalDebit = computed(() => {
    return this.filteredJournalEntries().reduce((sum, e) => sum + e.debit, 0);
  });

  totalCredit = computed(() => {
    return this.filteredJournalEntries().reduce((sum, e) => sum + e.credit, 0);
  });

  overdueClients = computed(() => {
    const overduePayments = this.payments().filter(p => p.status === 'overdue');
    const clientIds = [...new Set(overduePayments.map(p => p.clientId))];
    return this.state.clients().filter(c => clientIds.includes(c.id));
  });

  getClient(clientId: string) {
    return this.state.clients().find(c => c.id === clientId);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'paid': 'Pagato',
      'pending': 'In Attesa',
      'overdue': 'Scaduto'
    };
    return labels[status] || status;
  }

  getFrequencyLabel(frequency: string): string {
    const labels: Record<string, string> = {
      'monthly': 'Mensile',
      'quarterly': 'Trimestrale',
      'yearly': 'Annuale',
      'one-time': 'Una Tantum'
    };
    return labels[frequency] || frequency;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      'payment': 'Incasso',
      'expense': 'Spesa',
      'refund': 'Rimborso',
      'other': 'Altro'
    };
    return labels[category] || category;
  }

  getReminderTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'payment': 'Pagamento',
      'deadline': 'Scadenza',
      'memo': 'Promemoria'
    };
    return labels[type] || type;
  }

  openPaymentModal() {
    this.paymentForm.reset({ frequency: 'monthly', amount: 0 });
    this.showPaymentModal.set(true);
  }

  openJournalModal() {
    this.showJournalModal.set(true);
  }

  openReminderModal() {
    this.showReminderModal.set(true);
  }

  closeModals() {
    this.showPaymentModal.set(false);
    this.showJournalModal.set(false);
    this.showReminderModal.set(false);
  }

  savePayment() {
    if (this.paymentForm.valid) {
      const formValue = this.paymentForm.value;
      const newPayment: Payment = {
        id: Math.random().toString(36).substr(2, 9),
        ...formValue,
        status: 'pending'
      };
      this.payments.update(p => [...p, newPayment]);
      this.toastService.success('Pagamento Aggiunto', 'Il pagamento è stato registrato con successo.');
      this.closeModals();
    }
  }

  markAsPaid(paymentId: string) {
    this.payments.update(payments =>
      payments.map(p => p.id === paymentId ? { ...p, status: 'paid' as const, paidDate: new Date().toISOString().split('T')[0] } : p)
    );
    this.toastService.success('Pagamento Confermato', 'Il pagamento è stato segnato come ricevuto.');
  }

  sendReminder(clientId: string) {
    const client = this.getClient(clientId);
    this.toastService.info('Sollecito Inviato', `Sollecito di pagamento inviato a ${client?.name}`);
  }

  saveJournal() {
    if (this.journalForm.valid) {
      const formValue = this.journalForm.value;
      const newEntry: JournalEntry = {
        id: Math.random().toString(36).substr(2, 9),
        ...formValue
      };
      this.journalEntries.update(entries => [...entries, newEntry]);
      this.toastService.success('Registrazione Aggiunta', 'La registrazione è stata salvata in prima nota.');
      this.closeModals();
    }
  }

  saveReminder() {
    if (this.reminderForm.valid) {
      const formValue = this.reminderForm.value;
      const newReminder: Reminder = {
        id: Math.random().toString(36).substr(2, 9),
        ...formValue,
        dismissed: false
      };
      this.reminders.update(reminders => [...reminders, newReminder]);
      this.toastService.success('Promemoria Creato', 'Il promemoria è stato aggiunto con successo.');
      this.closeModals();
    }
  }

  dismissReminder(reminderId: string) {
    this.reminders.update(reminders =>
      reminders.map(r => r.id === reminderId ? { ...r, dismissed: true } : r)
    );
    this.toastService.success('Promemoria Archiviato', 'Il promemoria è stato archiviato.');
  }

  // Filter helper methods
  applyDateFilters<T>(items: T[], dateGetter: (item: T) => string): T[] {
    let filtered = items;

    // Filter by month
    if (this.filterMonth) {
      filtered = filtered.filter(item => {
        const date = dateGetter(item);
        const itemDate = new Date(date);
        const itemMonth = (itemDate.getMonth() + 1).toString().padStart(2, '0');

        if (this.filterMonth && itemMonth !== this.filterMonth) return false;
        return true;
      });
    }

    // Filter by date range
    if (this.filterDateFrom) {
      filtered = filtered.filter(item => {
        const date = dateGetter(item);
        return date >= this.filterDateFrom;
      });
    }

    if (this.filterDateTo) {
      filtered = filtered.filter(item => {
        const date = dateGetter(item);
        return date <= this.filterDateTo;
      });
    }

    return filtered;
  }

  applyFilters() {
    // Trigger recomputation by updating a signal or forcing change detection
    // The computed properties will automatically recalculate
  }

  hasActiveFilters(): boolean {
    return !!(this.filterMonth || this.filterClientId || this.filterDateFrom || this.filterDateTo);
  }

  resetFilters() {
    this.filterMonth = '';
    this.filterClientId = '';
    this.filterDateFrom = '';
    this.filterDateTo = '';
    this.applyFilters();
  }
}

