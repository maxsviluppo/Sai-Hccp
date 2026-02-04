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
    <div class="space-y-6 pb-10">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <i class="fa-solid fa-euro-sign text-9xl text-white"></i>
        </div>

        <div class="relative z-10">
          <h2 class="text-3xl font-black text-white flex items-center tracking-tight">
            <span class="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mr-4 shadow-lg border border-white/20">
                <i class="fa-solid fa-calculator"></i>
            </span>
            Contabilità e Gestione Pagamenti
          </h2>
          <p class="text-indigo-200 text-sm mt-2 font-medium ml-1">
            @if (selectedClient()) {
              Gestione per: {{ selectedClient()?.name }}
            } @else {
              Panoramica Generale - Tutte le Aziende
            }
          </p>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-5 border border-emerald-200 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-emerald-600 font-bold uppercase">Incassato</p>
              <p class="text-3xl font-black text-emerald-600 mt-1">€{{ totalPaid() }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <i class="fa-solid fa-circle-check text-emerald-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 border border-orange-200 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-orange-600 font-bold uppercase">In Attesa</p>
              <p class="text-3xl font-black text-orange-600 mt-1">€{{ totalPending() }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <i class="fa-solid fa-clock text-orange-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 border border-red-200 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-red-600 font-bold uppercase">Scaduti</p>
              <p class="text-3xl font-black text-red-600 mt-1">€{{ totalOverdue() }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <i class="fa-solid fa-triangle-exclamation text-red-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 border border-blue-200 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-blue-600 font-bold uppercase">Solleciti</p>
              <p class="text-3xl font-black text-blue-600 mt-1">{{ overdueClients().length }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <i class="fa-solid fa-bell text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="border-b border-slate-200 flex">
          <button (click)="activeTab.set('payments')" 
                  class="flex-1 px-6 py-4 font-bold transition-all"
                  [class.bg-blue-50]="activeTab() === 'payments'"
                  [class.text-blue-600]="activeTab() === 'payments'"
                  [class.border-b-2]="activeTab() === 'payments'"
                  [class.border-blue-600]="activeTab() === 'payments'"
                  [class.text-slate-500]="activeTab() !== 'payments'">
            <i class="fa-solid fa-money-bill-wave mr-2"></i> Pagamenti
          </button>
          <button (click)="activeTab.set('journal')" 
                  class="flex-1 px-6 py-4 font-bold transition-all"
                  [class.bg-purple-50]="activeTab() === 'journal'"
                  [class.text-purple-600]="activeTab() === 'journal'"
                  [class.border-b-2]="activeTab() === 'journal'"
                  [class.border-purple-600]="activeTab() === 'journal'"
                  [class.text-slate-500]="activeTab() !== 'journal'">
            <i class="fa-solid fa-book mr-2"></i> Prima Nota
          </button>
          <button (click)="activeTab.set('reminders')" 
                  class="flex-1 px-6 py-4 font-bold transition-all"
                  [class.bg-orange-50]="activeTab() === 'reminders'"
                  [class.text-orange-600]="activeTab() === 'reminders'"
                  [class.border-b-2]="activeTab() === 'reminders'"
                  [class.border-orange-600]="activeTab() === 'reminders'"
                  [class.text-slate-500]="activeTab() !== 'reminders'">
            <i class="fa-solid fa-bell mr-2"></i> Promemoria
            @if (activeReminders().length > 0) {
              <span class="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">{{ activeReminders().length }}</span>
            }
          </button>
        </div>

        <!-- Payments Tab -->
        @if (activeTab() === 'payments') {
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg font-bold text-slate-800">Gestione Pagamenti</h3>
              <button (click)="openPaymentModal()" 
                      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all flex items-center gap-2">
                <i class="fa-solid fa-plus"></i> Nuovo Pagamento
              </button>
            </div>

            @if (filteredPayments().length === 0) {
              <div class="text-center py-12">
                <i class="fa-solid fa-receipt text-slate-200 text-6xl mb-4"></i>
                <p class="text-slate-400 font-medium">Nessun pagamento registrato</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (payment of filteredPayments(); track payment.id) {
                  @let client = getClient(payment.clientId);
                  <div class="border-2 rounded-xl p-4 transition-all hover:shadow-md"
                       [class.border-emerald-200]="payment.status === 'paid'"
                       [class.bg-emerald-50/30]="payment.status === 'paid'"
                       [class.border-orange-200]="payment.status === 'pending'"
                       [class.bg-orange-50/30]="payment.status === 'pending'"
                       [class.border-red-200]="payment.status === 'overdue'"
                       [class.bg-red-50/30]="payment.status === 'overdue'">
                    
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <h4 class="font-bold text-slate-800">{{ client?.name || 'Cliente Sconosciuto' }}</h4>
                          <span class="text-xs font-bold px-2 py-1 rounded"
                                [class.bg-emerald-100]="payment.status === 'paid'"
                                [class.text-emerald-700]="payment.status === 'paid'"
                                [class.bg-orange-100]="payment.status === 'pending'"
                                [class.text-orange-700]="payment.status === 'pending'"
                                [class.bg-red-100]="payment.status === 'overdue'"
                                [class.text-red-700]="payment.status === 'overdue'">
                            {{ getStatusLabel(payment.status) }}
                          </span>
                          <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {{ getFrequencyLabel(payment.frequency) }}
                          </span>
                        </div>
                        
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span class="text-slate-500">Importo:</span>
                            <span class="font-bold text-slate-800 ml-2">€{{ payment.amount }}</span>
                          </div>
                          <div>
                            <span class="text-slate-500">Scadenza:</span>
                            <span class="font-bold text-slate-800 ml-2">{{ payment.dueDate | date:'dd/MM/yyyy' }}</span>
                          </div>
                          @if (payment.paidDate) {
                            <div>
                              <span class="text-slate-500">Pagato il:</span>
                              <span class="font-bold text-emerald-600 ml-2">{{ payment.paidDate | date:'dd/MM/yyyy' }}</span>
                            </div>
                          }
                          @if (payment.notes) {
                            <div class="col-span-2 md:col-span-1">
                              <span class="text-slate-500">Note:</span>
                              <span class="text-slate-700 ml-2">{{ payment.notes }}</span>
                            </div>
                          }
                        </div>
                      </div>

                      <div class="flex gap-2">
                        @if (payment.status !== 'paid') {
                          <button (click)="markAsPaid(payment.id)" 
                                  class="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all">
                            <i class="fa-solid fa-check"></i> Segna Pagato
                          </button>
                        }
                        @if (payment.status === 'overdue') {
                          <button (click)="sendReminder(payment.clientId)" 
                                  class="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-bold transition-all">
                            <i class="fa-solid fa-paper-plane"></i> Sollecito
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
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg font-bold text-slate-800">Prima Nota</h3>
              <button (click)="openJournalModal()" 
                      class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all flex items-center gap-2">
                <i class="fa-solid fa-plus"></i> Nuova Registrazione
              </button>
            </div>

            @if (filteredJournalEntries().length === 0) {
              <div class="text-center py-12">
                <i class="fa-solid fa-book-open text-slate-200 text-6xl mb-4"></i>
                <p class="text-slate-400 font-medium">Nessuna registrazione in prima nota</p>
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-slate-50 border-b-2 border-slate-200">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Data</th>
                      @if (!selectedClient()) {
                        <th class="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Azienda</th>
                      }
                      <th class="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Descrizione</th>
                      <th class="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Categoria</th>
                      <th class="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">Dare</th>
                      <th class="px-4 py-3 text-right text-xs font-bold text-slate-600 uppercase">Avere</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (entry of filteredJournalEntries(); track entry.id) {
                      @let client = getClient(entry.clientId);
                      <tr class="border-b border-slate-100 hover:bg-slate-50">
                        <td class="px-4 py-3 text-sm text-slate-600">{{ entry.date | date:'dd/MM/yyyy' }}</td>
                        @if (!selectedClient()) {
                          <td class="px-4 py-3 text-sm font-medium text-slate-800">{{ client?.name }}</td>
                        }
                        <td class="px-4 py-3 text-sm text-slate-700">{{ entry.description }}</td>
                        <td class="px-4 py-3">
                          <span class="text-xs px-2 py-1 rounded font-bold"
                                [class.bg-blue-100]="entry.category === 'payment'"
                                [class.text-blue-700]="entry.category === 'payment'"
                                [class.bg-red-100]="entry.category === 'expense'"
                                [class.text-red-700]="entry.category === 'expense'"
                                [class.bg-green-100]="entry.category === 'refund'"
                                [class.text-green-700]="entry.category === 'refund'"
                                [class.bg-slate-100]="entry.category === 'other'"
                                [class.text-slate-700]="entry.category === 'other'">
                            {{ getCategoryLabel(entry.category) }}
                          </span>
                        </td>
                        <td class="px-4 py-3 text-right font-bold text-slate-800">
                          {{ entry.debit > 0 ? '€' + entry.debit : '-' }}
                        </td>
                        <td class="px-4 py-3 text-right font-bold text-emerald-600">
                          {{ entry.credit > 0 ? '€' + entry.credit : '-' }}
                        </td>
                      </tr>
                    }
                    <tr class="bg-slate-100 font-bold">
                      <td [attr.colspan]="selectedClient() ? 3 : 4" class="px-4 py-3 text-right text-slate-700">TOTALI:</td>
                      <td class="px-4 py-3 text-right text-slate-800">€{{ totalDebit() }}</td>
                      <td class="px-4 py-3 text-right text-emerald-600">€{{ totalCredit() }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- Reminders Tab -->
        @if (activeTab() === 'reminders') {
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg font-bold text-slate-800">Promemoria e Scadenze</h3>
              <button (click)="openReminderModal()" 
                      class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition-all flex items-center gap-2">
                <i class="fa-solid fa-plus"></i> Nuovo Promemoria
              </button>
            </div>

            @if (filteredReminders().length === 0) {
              <div class="text-center py-12">
                <i class="fa-solid fa-calendar-check text-slate-200 text-6xl mb-4"></i>
                <p class="text-slate-400 font-medium">Nessun promemoria attivo</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (reminder of filteredReminders(); track reminder.id) {
                  @let client = getClient(reminder.clientId);
                  <div class="border-2 rounded-xl p-4 transition-all"
                       [class.border-red-200]="reminder.priority === 'high' && !reminder.dismissed"
                       [class.bg-red-50/30]="reminder.priority === 'high' && !reminder.dismissed"
                       [class.border-orange-200]="reminder.priority === 'medium' && !reminder.dismissed"
                       [class.bg-orange-50/30]="reminder.priority === 'medium' && !reminder.dismissed"
                       [class.border-blue-200]="reminder.priority === 'low' && !reminder.dismissed"
                       [class.bg-blue-50/30]="reminder.priority === 'low' && !reminder.dismissed"
                       [class.border-slate-200]="reminder.dismissed"
                       [class.bg-slate-50]="reminder.dismissed"
                       [class.opacity-50]="reminder.dismissed">
                    
                    <div class="flex items-start justify-between gap-4">
                      <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                          <i class="fa-solid"
                             [class.fa-exclamation-triangle]="reminder.priority === 'high'"
                             [class.text-red-600]="reminder.priority === 'high'"
                             [class.fa-info-circle]="reminder.priority === 'medium'"
                             [class.text-orange-600]="reminder.priority === 'medium'"
                             [class.fa-bell]="reminder.priority === 'low'"
                             [class.text-blue-600]="reminder.priority === 'low'"></i>
                          <h4 class="font-bold text-slate-800">{{ client?.name || 'Generale' }}</h4>
                          <span class="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                            {{ getReminderTypeLabel(reminder.type) }}
                          </span>
                          @if (reminder.dismissed) {
                            <span class="text-xs bg-slate-200 text-slate-500 px-2 py-1 rounded">Archiviato</span>
                          }
                        </div>
                        
                        <p class="text-sm text-slate-700 mb-2">{{ reminder.message }}</p>
                        <p class="text-xs text-slate-500">
                          Scadenza: <span class="font-bold">{{ reminder.dueDate | date:'dd/MM/yyyy' }}</span>
                        </p>
                      </div>

                      @if (!reminder.dismissed) {
                        <button (click)="dismissReminder(reminder.id)" 
                                class="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-all">
                          <i class="fa-solid fa-check"></i> Archivia
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Payment Modal -->
      @if (showPaymentModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="closeModals()">
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <h3 class="text-xl font-bold text-white">Nuovo Pagamento</h3>
              <button (click)="closeModals()" class="text-white hover:bg-white/20 w-8 h-8 rounded-full transition-colors">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form [formGroup]="paymentForm" (ngSubmit)="savePayment()" class="p-6 space-y-4">
              <div>
                <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Azienda</label>
                <select formControlName="clientId" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Seleziona Azienda</option>
                  @for (client of state.clients(); track client.id) {
                    <option [value]="client.id">{{ client.name }}</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Importo (€)</label>
                  <input type="number" formControlName="amount" placeholder="0.00" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
                <div>
                  <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Cadenza</label>
                  <select formControlName="frequency" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="monthly">Mensile</option>
                    <option value="quarterly">Trimestrale</option>
                    <option value="yearly">Annuale</option>
                    <option value="one-time">Una Tantum</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Data Scadenza</label>
                <input type="date" formControlName="dueDate" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none">
              </div>

              <div>
                <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Note</label>
                <textarea formControlName="notes" rows="3" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
              </div>

              <div class="flex gap-3 pt-4">
                <button type="button" (click)="closeModals()" class="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-all">
                  Annulla
                </button>
                <button type="submit" [disabled]="!paymentForm.valid" class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  Salva Pagamento
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Journal Modal -->
      @if (showJournalModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="closeModals()">
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center">
              <h3 class="text-xl font-bold text-white">Nuova Registrazione Prima Nota</h3>
              <button (click)="closeModals()" class="text-white hover:bg-white/20 w-8 h-8 rounded-full transition-colors">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form [formGroup]="journalForm" (ngSubmit)="saveJournal()" class="p-6 space-y-4">
              <div>
                <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Azienda</label>
                <select formControlName="clientId" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none">
                  <option value="">Seleziona Azienda</option>
                  @for (client of state.clients(); track client.id) {
                    <option [value]="client.id">{{ client.name }}</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Data</label>
                  <input type="date" formControlName="date" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none">
                </div>
                <div>
                  <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Categoria</label>
                  <select formControlName="category" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none">
                    <option value="payment">Incasso</option>
                    <option value="expense">Spesa</option>
                    <option value="refund">Rimborso</option>
                    <option value="other">Altro</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Descrizione</label>
                <textarea formControlName="description" rows="2" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Dare (€)</label>
                  <input type="number" formControlName="debit" placeholder="0.00" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none">
                </div>
                <div>
                  <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Avere (€)</label>
                  <input type="number" formControlName="credit" placeholder="0.00" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none">
                </div>
              </div>

              <div class="flex gap-3 pt-4">
                <button type="button" (click)="closeModals()" class="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-all">
                  Annulla
                </button>
                <button type="submit" [disabled]="!journalForm.valid" class="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  Salva Registrazione
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Reminder Modal -->
      @if (showReminderModal()) {
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" (click)="closeModals()">
          <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 flex justify-between items-center">
              <h3 class="text-xl font-bold text-white">Nuovo Promemoria</h3>
              <button (click)="closeModals()" class="text-white hover:bg-white/20 w-8 h-8 rounded-full transition-colors">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
            
            <form [formGroup]="reminderForm" (ngSubmit)="saveReminder()" class="p-6 space-y-4">
              <div>
                <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Azienda</label>
                <select formControlName="clientId" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none">
                  <option value="">Seleziona Azienda</option>
                  @for (client of state.clients(); track client.id) {
                    <option [value]="client.id">{{ client.name }}</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Tipo</label>
                  <select formControlName="type" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none">
                    <option value="payment">Pagamento</option>
                    <option value="deadline">Scadenza</option>
                    <option value="memo">Promemoria</option>
                  </select>
                </div>
                <div>
                  <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Priorità</label>
                  <select formControlName="priority" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none">
                    <option value="low">Bassa</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Messaggio</label>
                <textarea formControlName="message" rows="3" placeholder="Descrivi il promemoria..." class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"></textarea>
              </div>

              <div>
                <label class="text-xs font-bold text-slate-500 uppercase block mb-2">Data Scadenza</label>
                <input type="date" formControlName="dueDate" class="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none">
              </div>

              <div class="flex gap-3 pt-4">
                <button type="button" (click)="closeModals()" class="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-all">
                  Annulla
                </button>
                <button type="submit" [disabled]="!reminderForm.valid" class="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  Salva Promemoria
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
    const client = this.selectedClient();
    if (!client) return this.payments();
    return this.payments().filter(p => p.clientId === client.id);
  });

  filteredJournalEntries = computed(() => {
    const client = this.selectedClient();
    if (!client) return this.journalEntries();
    return this.journalEntries().filter(e => e.clientId === client.id);
  });

  filteredReminders = computed(() => {
    const client = this.selectedClient();
    if (!client) return this.reminders();
    return this.reminders().filter(r => r.clientId === client.id);
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
}
