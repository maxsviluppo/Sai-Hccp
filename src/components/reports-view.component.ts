import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService, ClientEntity } from '../services/app-state.service';

interface CompanyReport {
  client: ClientEntity;
  users: {
    id: string;
    name: string;
    department: string;
    checksCompleted: number;
    checksTotal: number;
    lastActivity: string;
  }[];
  totalChecks: number;
  completedChecks: number;
}

@Component({
  selector: 'app-reports-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6 pb-10">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <i class="fa-solid fa-file-contract text-9xl text-white"></i>
        </div>

        <div class="relative z-10">
          <h2 class="text-3xl font-black text-white flex items-center tracking-tight">
            <span class="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-4 shadow-lg border border-white/20">
                <i class="fa-solid fa-clipboard-list"></i>
            </span>
            Report Controlli Giornalieri
          </h2>
          <p class="text-indigo-200 text-sm mt-2 font-medium ml-1">
            @if (selectedClient()) {
              Report per: {{ selectedClient()?.name }} - Data: {{ state.filterDate() | date:'dd/MM/yyyy' }}
            } @else {
              Panoramica Generale - Tutte le Aziende - Data: {{ state.filterDate() | date:'dd/MM/yyyy' }}
            }
          </p>
        </div>
      </div>

      <!-- Companies Accordion -->
      <div class="space-y-4">
        @for (report of companyReports(); track report.client.id) {
          @let isOpen = isCompanyExpanded(report.client.id);
          @let completionRate = (report.completedChecks / report.totalChecks * 100) || 0;

          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md"
               [class.ring-2]="isOpen" [class.ring-blue-100]="isOpen">
            
            <!-- Company Header -->
            <div class="relative bg-white px-6 py-5 cursor-pointer select-none transition-colors hover:bg-slate-50 border-l-4"
                 [class.border-l-blue-500]="isOpen" [class.border-l-transparent]="!isOpen"
                 [class.bg-red-50]="report.client.suspended"
                 (click)="toggleCompany(report.client.id)">
               
               @if (report.client.suspended) {
                   <div class="absolute top-0 left-0 right-0 bg-red-500 text-white px-4 py-1 text-xs font-bold text-center">
                       SERVIZIO SOSPESO
                   </div>
               }

               <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" [class.mt-6]="report.client.suspended">
                   <div class="flex items-center gap-4 flex-1">
                       <div class="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-sm">
                          <i class="fa-solid fa-building text-2xl"></i>
                       </div>
                       
                       <div class="flex-1 min-w-0">
                          <h3 class="font-bold text-xl text-slate-800 flex items-center gap-3">
                              {{ report.client.name }}
                              <span class="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono">
                                  {{ report.users.length }} Operatori
                              </span>
                          </h3>
                          <div class="flex items-center gap-4 mt-2">
                              <!-- Progress Bar -->
                              <div class="flex-1 max-w-xs">
                                  <div class="flex justify-between text-xs mb-1">
                                      <span class="text-slate-500 font-medium">Completamento</span>
                                      <span class="font-bold" [class.text-emerald-600]="completionRate === 100" [class.text-orange-500]="completionRate < 100">
                                          {{ completionRate | number:'1.0-0' }}%
                                      </span>
                                  </div>
                                  <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div class="h-full transition-all duration-500 rounded-full"
                                           [class.bg-emerald-500]="completionRate === 100"
                                           [class.bg-orange-500]="completionRate < 100"
                                           [style.width.%]="completionRate"></div>
                                  </div>
                              </div>
                              <span class="text-sm text-slate-600">
                                  <span class="font-bold text-emerald-600">{{ report.completedChecks }}</span> / {{ report.totalChecks }}
                              </span>
                          </div>
                       </div>

                       <div class="w-8 h-8 flex items-center justify-center text-slate-400 transition-transform duration-300"
                            [class.rotate-180]="isOpen">
                           <i class="fa-solid fa-chevron-down"></i>
                       </div>
                   </div>

                   <!-- Print Button -->
                   <div (click)="$event.stopPropagation()">
                       <button (click)="printReport(report)" 
                               class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-200">
                          <i class="fa-solid fa-print"></i> Stampa Report
                       </button>
                   </div>
               </div>
            </div>

            <!-- Users Detail (Accordion Body) -->
            @if (isOpen) {
                <div class="border-t border-slate-100 bg-slate-50/50 p-6 animate-slide-down">
                   @if (report.users.length === 0) {
                     <div class="text-center py-8 text-slate-400">
                        <i class="fa-solid fa-users-slash text-4xl mb-2"></i>
                        <p class="font-medium">Nessun operatore configurato</p>
                     </div>
                   } @else {
                     <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        @for (user of report.users; track user.id) {
                            <div class="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all">
                                <div class="flex items-center justify-between mb-3">
                                    <div>
                                        <h4 class="font-bold text-slate-800">{{ user.name }}</h4>
                                        <p class="text-xs text-slate-500">{{ user.department }}</p>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-2xl font-black" 
                                             [class.text-emerald-600]="user.checksCompleted === user.checksTotal"
                                             [class.text-orange-500]="user.checksCompleted < user.checksTotal">
                                            {{ user.checksCompleted }}/{{ user.checksTotal }}
                                        </div>
                                        <div class="text-[10px] text-slate-400 font-bold uppercase">Controlli</div>
                                    </div>
                                </div>
                                
                                <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div class="h-full transition-all"
                                         [class.bg-emerald-500]="user.checksCompleted === user.checksTotal"
                                         [class.bg-orange-500]="user.checksCompleted < user.checksTotal"
                                         [style.width.%]="(user.checksCompleted / user.checksTotal * 100)"></div>
                                </div>

                                <div class="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                                    <span class="text-slate-400">Ultimo accesso</span>
                                    <span class="font-medium text-slate-600">{{ user.lastActivity }}</span>
                                </div>
                            </div>
                        }
                     </div>
                   }
                </div>
            }
          </div>
        }

        @if (companyReports().length === 0) {
            <div class="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
                <i class="fa-solid fa-folder-open text-6xl text-slate-200 mb-4"></i>
                <p class="text-slate-400 font-medium">Nessuna azienda configurata nel sistema</p>
            </div>
        }
      </div>

      <!-- Print Template (Hidden) -->
      <div id="print-template" class="hidden">
        <!-- Will be populated dynamically -->
      </div>

    </div>
  `,
  styles: [`
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-slide-down {
      animation: slideDown 0.2s ease-out forwards;
    }

    @media print {
      body * {
        visibility: hidden;
      }
      #print-template, #print-template * {
        visibility: visible;
      }
      #print-template {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
    }
  `]
})
export class ReportsViewComponent {
  state = inject(AppStateService);

  expandedCompanyIds = signal<Set<string>>(new Set());

  // Filter by global company selection
  selectedClient = computed(() => {
    const filterId = this.state.filterCollaboratorId();
    if (!filterId) return null;
    const user = this.state.systemUsers().find(u => u.id === filterId);
    return user ? this.state.clients().find(c => c.id === user.clientId) : null;
  });

  companyReports = computed((): CompanyReport[] => {
    const selectedClient = this.selectedClient();
    const clientsToShow = selectedClient ? [selectedClient] : this.state.clients();

    return clientsToShow.map(client => {
      const users = this.state.systemUsers()
        .filter(u => u.clientId === client.id && u.role !== 'ADMIN')
        .map(u => ({
          id: u.id,
          name: u.name,
          department: u.department || 'Generale',
          checksCompleted: Math.floor(Math.random() * 15), // Mock data
          checksTotal: 14,
          lastActivity: this.getRandomTime()
        }));

      const totalChecks = users.reduce((acc, u) => acc + u.checksTotal, 0);
      const completedChecks = users.reduce((acc, u) => acc + u.checksCompleted, 0);

      return { client, users, totalChecks, completedChecks };
    });
  });

  isCompanyExpanded(id: string): boolean {
    return this.expandedCompanyIds().has(id);
  }

  toggleCompany(id: string) {
    this.expandedCompanyIds.update(set => {
      const newSet = new Set(set);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  getRandomTime(): string {
    const hours = Math.floor(Math.random() * 12) + 1;
    return `${hours}h fa`;
  }

  printReport(report: CompanyReport) {
    const printContent = this.generatePrintHTML(report);
    const printWindow = window.open('', '_blank');

    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }

  generatePrintHTML(report: CompanyReport): string {
    const date = new Date(this.state.filterDate()).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Report Controlli - ${report.client.name}</title>
        <style>
          @page { size: A4; margin: 2cm; }
          body { font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; }
          .header { border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 32px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; }
          .company-name { font-size: 24px; font-weight: bold; margin: 20px 0 10px; }
          .meta { color: #64748b; font-size: 14px; margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #f1f5f9; padding: 12px; text-align: left; font-weight: bold; border-bottom: 2px solid #cbd5e1; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
          .progress { display: inline-block; width: 100px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; vertical-align: middle; }
          .progress-bar { height: 100%; background: #10b981; }
          .progress-bar.incomplete { background: #f59e0b; }
          .signature-area { margin-top: 60px; border-top: 2px solid #e2e8f0; padding-top: 30px; }
          .signature-line { border-top: 1px solid #000; width: 300px; margin-top: 40px; padding-top: 5px; }
          .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🛡️ HACCP Pro</div>
          <div style="color: #64748b; font-size: 14px;">Sistema di Gestione Controlli Igienico-Sanitari</div>
        </div>

        <h1 class="company-name">${report.client.name}</h1>
        <div class="meta">P.IVA: ${report.client.piva}</div>
        <div class="meta">Indirizzo: ${report.client.address}</div>
        <div class="meta">Data Report: ${date}</div>

        <h2 style="margin-top: 30px; color: #3b82f6;">Riepilogo Controlli Giornalieri</h2>
        
        <table>
          <thead>
            <tr>
              <th>Operatore</th>
              <th>Reparto</th>
              <th>Controlli</th>
              <th>Completamento</th>
            </tr>
          </thead>
          <tbody>
            ${report.users.map(user => {
      const percentage = (user.checksCompleted / user.checksTotal * 100);
      const isComplete = percentage === 100;
      return `
                <tr>
                  <td><strong>${user.name}</strong></td>
                  <td>${user.department}</td>
                  <td>${user.checksCompleted} / ${user.checksTotal}</td>
                  <td>
                    <div class="progress">
                      <div class="progress-bar ${isComplete ? '' : 'incomplete'}" style="width: ${percentage}%"></div>
                    </div>
                    ${percentage.toFixed(0)}%
                  </td>
                </tr>
              `;
    }).join('')}
          </tbody>
        </table>

        <div style="margin-top: 30px; padding: 15px; background: #f8fafc; border-left: 4px solid #3b82f6;">
          <strong>Totale Controlli Completati:</strong> ${report.completedChecks} su ${report.totalChecks} 
          (${((report.completedChecks / report.totalChecks * 100) || 0).toFixed(1)}%)
        </div>

        <div class="signature-area">
          <p><strong>Firma del Responsabile HACCP:</strong></p>
          <div class="signature-line">
            <div style="text-align: center; font-size: 12px; color: #64748b;">Firma e Timbro</div>
          </div>
        </div>

        <div class="footer">
          <p>Documento generato automaticamente da HACCP Pro - ${new Date().toLocaleString('it-IT')}</p>
          <p>Questo documento costituisce attestazione dei controlli effettuati secondo il piano HACCP aziendale</p>
        </div>
      </body>
      </html>
    `;
  }
}
