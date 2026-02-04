import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';

interface CheckItem {
    id: string;
    label: string;
    moduleId: string;
    completed: boolean;
}

interface CheckCategory {
    id: string;
    name: string;
    icon: string;
    color: string;
    items: CheckItem[];
}

@Component({
    selector: 'app-general-checks-view',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="space-y-6 pb-10">
      
      <!-- Header -->
      <div class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 rounded-3xl shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <i class="fa-solid fa-clipboard-list text-9xl text-white"></i>
        </div>

        <div class="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 class="text-3xl font-black text-white flex items-center tracking-tight">
              <span class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mr-4 shadow-lg border border-white/20">
                  <i class="fa-solid fa-list-check"></i>
              </span>
              Controlli Generali
            </h2>
            <p class="text-indigo-200 text-sm mt-2 font-medium ml-1">
              Panoramica completa di tutti i controlli HACCP - Data: {{ state.filterDate() | date:'dd/MM/yyyy' }}
            </p>
          </div>

          <!-- Company Filter -->
          <div class="flex items-center gap-3">
            <div class="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
              <label class="text-xs text-white/70 font-bold uppercase block mb-2">Filtra per Azienda</label>
          <select [ngModel]="selectedCompanyId()" (ngModelChange)="selectedCompanyId.set($event)"
                      class="bg-white/20 text-white border border-white/30 rounded-lg px-4 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-white/50 min-w-[250px]">
                <option value="" class="bg-slate-800">Tutte le Aziende</option>
                @for (client of state.clients(); track client.id) {
                  <option [value]="client.id" class="bg-slate-800">{{ client.name }}</option>
                }
              </select>
            </div>

            <!-- Print Button -->
            <button (click)="printCompleteList()" 
                    [disabled]="!selectedCompanyId()"
                    class="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg backdrop-blur-sm">
              <i class="fa-solid fa-print"></i>
              Stampa Lista Completa
            </button>
          </div>
        </div>
      </div>

      <!-- Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-slate-500 font-bold uppercase">Totale Controlli</p>
              <p class="text-3xl font-black text-slate-800 mt-1">{{ totalChecks() }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <i class="fa-solid fa-clipboard-list text-slate-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 border border-emerald-200 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-emerald-600 font-bold uppercase">Completati</p>
              <p class="text-3xl font-black text-emerald-600 mt-1">{{ completedChecks() }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
              <i class="fa-solid fa-circle-check text-emerald-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 border border-orange-200 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-orange-600 font-bold uppercase">Da Completare</p>
              <p class="text-3xl font-black text-orange-600 mt-1">{{ pendingChecks() }}</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <i class="fa-solid fa-clock text-orange-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 border border-blue-200 shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-blue-600 font-bold uppercase">Completamento</p>
              <p class="text-3xl font-black text-blue-600 mt-1">{{ completionRate() }}%</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <i class="fa-solid fa-chart-pie text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories List -->
      <div class="space-y-4">
        @for (category of categories(); track category.id) {
          @let isOpen = isCategoryExpanded(category.id);
          @let categoryCompleted = getCategoryCompletedCount(category);
          @let categoryTotal = category.items.length;
          @let categoryRate = categoryTotal > 0 ? (categoryCompleted / categoryTotal * 100) : 0;

          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md"
               [class.ring-2]="isOpen" [class.ring-offset-2]="isOpen"
               [style.--category-color]="category.color">
            
            <!-- Category Header -->
            <div class="relative px-6 py-5 cursor-pointer select-none transition-colors hover:bg-slate-50 border-l-4"
                 [style.border-left-color]="category.color"
                 (click)="toggleCategory(category.id)">
               
               <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div class="flex items-center gap-4 flex-1">
                       <!-- Icon -->
                       <div class="w-14 h-14 rounded-xl flex items-center justify-center shadow-sm text-white text-2xl"
                            [style.background]="category.color">
                          <i [class]="'fa-solid ' + category.icon"></i>
                       </div>
                       
                       <div class="flex-1">
                          <h3 class="font-bold text-xl text-slate-800 flex items-center gap-3">
                              {{ category.name }}
                              <span class="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono">
                                  {{ categoryTotal }} controlli
                              </span>
                          </h3>
                          
                          <!-- Progress Bar -->
                          <div class="flex items-center gap-4 mt-2">
                              <div class="flex-1 max-w-md">
                                  <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div class="h-full transition-all duration-500 rounded-full"
                                           [style.background]="category.color"
                                           [style.width.%]="categoryRate"></div>
                                  </div>
                              </div>
                              <span class="text-sm font-bold" [style.color]="category.color">
                                  {{ categoryCompleted }}/{{ categoryTotal }}
                              </span>
                          </div>
                       </div>

                       <!-- Expand Arrow -->
                       <div class="w-8 h-8 flex items-center justify-center text-slate-400 transition-transform duration-300"
                            [class.rotate-180]="isOpen">
                           <i class="fa-solid fa-chevron-down"></i>
                       </div>
                   </div>
               </div>
            </div>

            <!-- Category Items (Accordion Body) -->
            @if (isOpen) {
                <div class="border-t border-slate-100 bg-slate-50/50 p-6 animate-slide-down">
                   <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      @for (item of category.items; track item.id) {
                          <div class="bg-white rounded-lg p-4 border transition-all"
                               [class.border-emerald-200]="item.completed"
                               [class.bg-emerald-50/30]="item.completed"
                               [class.border-slate-200]="!item.completed"
                               [class.hover:border-slate-300]="!item.completed">
                              
                              <div class="flex items-start gap-3">
                                  <!-- Status Icon -->
                                  <div class="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 transition-all"
                                       [class.bg-emerald-500]="item.completed"
                                       [class.text-white]="item.completed"
                                       [class.bg-slate-200]="!item.completed"
                                       [class.text-slate-400]="!item.completed">
                                      @if (item.completed) {
                                          <i class="fa-solid fa-check text-xs"></i>
                                      } @else {
                                          <i class="fa-solid fa-minus text-xs"></i>
                                      }
                                  </div>

                                  <!-- Label -->
                                  <div class="flex-1 min-w-0">
                                      <p class="text-sm font-medium leading-snug"
                                         [class.text-slate-800]="!item.completed"
                                         [class.text-emerald-700]="item.completed">
                                          {{ item.label }}
                                      </p>
                                      <p class="text-xs text-slate-400 mt-1">
                                          Modulo: {{ getModuleName(item.moduleId) }}
                                      </p>
                                  </div>

                                  <!-- Status Badge -->
                                  @if (item.completed) {
                                      <span class="flex-shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                                          Fatto
                                      </span>
                                  } @else {
                                      <span class="flex-shrink-0 text-[10px] font-bold uppercase px-2 py-1 rounded bg-orange-100 text-orange-700 border border-orange-200">
                                          Da Fare
                                      </span>
                                  }
                              </div>
                          </div>
                      }
                   </div>
                </div>
            }
          </div>
        }
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
  `]
})
export class GeneralChecksViewComponent {
    state = inject(AppStateService);

    expandedCategoryIds = signal<Set<string>>(new Set());

    // Local filter state
    selectedCompanyId = signal<string>('');

    // Use global filter instead of local selector
    selectedClient = computed(() => {
        // First check if there's a local selection from the dropdown
        const localId = this.selectedCompanyId();
        if (localId) {
            return this.state.clients().find(c => c.id === localId) || null;
        }

        // Otherwise fallback to global filter
        const filterId = this.state.filterCollaboratorId();
        if (!filterId) return null;
        const user = this.state.systemUsers().find(u => u.id === filterId);
        return user ? this.state.clients().find(c => c.id === user.clientId) : null;
    });

    // Mock data - in production this would come from the state/database
    categories = computed((): CheckCategory[] => {
        return [
            {
                id: 'pre-operative',
                name: 'Fase Pre-Operativa',
                icon: 'fa-eye',
                color: '#3b82f6',
                items: [
                    { id: 'pre-1', label: 'Ispezione visiva degli ambienti di lavoro', moduleId: 'operational-checklist', completed: true },
                    { id: 'pre-2', label: 'Verifica integrità delle attrezzature', moduleId: 'operational-checklist', completed: true },
                    { id: 'pre-3', label: 'Verifica pulizia superfici prima dell\'uso', moduleId: 'operational-checklist', completed: false }
                ]
            },
            {
                id: 'operative',
                name: 'Fase Operativa',
                icon: 'fa-fire-burner',
                color: '#f59e0b',
                items: [
                    { id: 'op-1', label: 'Controllo temperature (Valori positivi)', moduleId: 'operational-checklist', completed: true },
                    { id: 'op-2', label: 'Controllo temperature (Valori negativi)', moduleId: 'operational-checklist', completed: false },
                    { id: 'op-3', label: 'Evitare contaminazioni crociate', moduleId: 'operational-checklist', completed: false },
                    { id: 'op-4', label: 'Compilazione schede monitoraggio produzione', moduleId: 'operational-checklist', completed: false }
                ]
            },
            {
                id: 'post-operative',
                name: 'Fase Post-Operativa',
                icon: 'fa-broom',
                color: '#10b981',
                items: [
                    { id: 'post-1', label: 'Pulizia e disinfezione ambienti di lavoro', moduleId: 'operational-checklist', completed: true },
                    { id: 'post-2', label: 'Sanificazione attrezzature utilizzate', moduleId: 'operational-checklist', completed: true },
                    { id: 'post-3', label: 'Adeguata conservazione prodotti finiti', moduleId: 'operational-checklist', completed: true },
                    { id: 'post-4', label: 'Stoccaggio semilavorati e materie prime', moduleId: 'operational-checklist', completed: false }
                ]
            },
            {
                id: 'temperatures',
                name: 'Controllo Temperature',
                icon: 'fa-temperature-half',
                color: '#06b6d4',
                items: [
                    { id: 'temp-1', label: 'Temperature Frigoriferi +4°C - +8°C', moduleId: 'temperatures', completed: true },
                    { id: 'temp-2', label: 'Temperature Congelatori -18°C – -24°C', moduleId: 'temperatures', completed: true }
                ]
            },
            {
                id: 'hygiene',
                name: 'Igiene Personale',
                icon: 'fa-hands-bubbles',
                color: '#8b5cf6',
                items: [
                    { id: 'hyg-1', label: 'Controllo divise e DPI', moduleId: 'staff-hygiene', completed: false },
                    { id: 'hyg-2', label: 'Verifica igiene mani', moduleId: 'staff-hygiene', completed: true },
                    { id: 'hyg-3', label: 'Controllo stato di salute operatori', moduleId: 'staff-hygiene', completed: false }
                ]
            },
            {
                id: 'traceability',
                name: 'Rintracciabilità Alimenti',
                icon: 'fa-barcode',
                color: '#ec4899',
                items: [
                    { id: 'trace-1', label: 'Registrazione lotti in ingresso', moduleId: 'traceability', completed: true },
                    { id: 'trace-2', label: 'Etichettatura prodotti preparati', moduleId: 'traceability', completed: false },
                    { id: 'trace-3', label: 'Verifica scadenze materie prime', moduleId: 'traceability', completed: true }
                ]
            }
        ];
    });

    totalChecks = computed(() => {
        return this.categories().reduce((acc, cat) => acc + cat.items.length, 0);
    });

    completedChecks = computed(() => {
        return this.categories().reduce((acc, cat) =>
            acc + cat.items.filter(item => item.completed).length, 0
        );
    });

    pendingChecks = computed(() => {
        return this.totalChecks() - this.completedChecks();
    });

    completionRate = computed(() => {
        const total = this.totalChecks();
        if (total === 0) return 0;
        return Math.round((this.completedChecks() / total) * 100);
    });

    isCategoryExpanded(id: string): boolean {
        return this.expandedCategoryIds().has(id);
    }

    toggleCategory(id: string) {
        this.expandedCategoryIds.update(set => {
            const newSet = new Set(set);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }

    getCategoryCompletedCount(category: CheckCategory): number {
        return category.items.filter(item => item.completed).length;
    }

    getModuleName(moduleId: string): string {
        const moduleNames: Record<string, string> = {
            'operational-checklist': 'Checklist Operativa',
            'temperatures': 'Temperature',
            'staff-hygiene': 'Igiene Personale',
            'traceability': 'Rintracciabilità',
            'cleaning-maintenance': 'Pulizia/Manutenzione',
            'pest-control': 'Controllo Infestanti'
        };
        return moduleNames[moduleId] || moduleId;
    }

    printCompleteList() {
        const company = this.selectedClient();
        if (!company) return;

        const printContent = this.generatePrintHTML(company);
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

    generatePrintHTML(company: any): string {
        const date = new Date(this.state.filterDate()).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });

        const categories = this.categories();
        const totalChecks = this.totalChecks();
        const completedChecks = this.completedChecks();
        const completionRate = this.completionRate();

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Lista Controlli Completa - ${company.name}</title>
                <style>
                    @page { size: A4; margin: 2cm; }
                    body { font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6; }
                    .header { border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo { font-size: 32px; font-weight: bold; color: #10b981; margin-bottom: 10px; }
                    .company-name { font-size: 24px; font-weight: bold; margin: 20px 0 10px; }
                    .meta { color: #64748b; font-size: 14px; margin-bottom: 5px; }
                    .summary-box { background: #f1f5f9; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
                    .category { margin: 30px 0; page-break-inside: avoid; }
                    .category-header { background: #f8fafc; padding: 12px; border-left: 4px solid; font-weight: bold; font-size: 18px; margin-bottom: 15px; }
                    .check-item { padding: 10px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px; }
                    .check-icon { width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-center; font-size: 12px; }
                    .check-icon.done { background: #10b981; color: white; }
                    .check-icon.pending { background: #f59e0b; color: white; }
                    .check-label { flex: 1; }
                    .check-status { font-size: 11px; font-weight: bold; text-transform: uppercase; padding: 3px 8px; border-radius: 4px; }
                    .check-status.done { background: #d1fae5; color: #065f46; }
                    .check-status.pending { background: #fed7aa; color: #92400e; }
                    .signature-area { margin-top: 60px; border-top: 2px solid #e2e8f0; padding-top: 30px; }
                    .signature-line { border-top: 1px solid #000; width: 300px; margin-top: 40px; padding-top: 5px; }
                    .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; page-break-inside: avoid; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">🛡️ HACCP Pro</div>
                    <div style="color: #64748b; font-size: 14px;">Sistema di Gestione Controlli Igienico-Sanitari</div>
                </div>

                <h1 class="company-name">${company.name}</h1>
                <div class="meta">P.IVA: ${company.piva}</div>
                <div class="meta">Indirizzo: ${company.address}</div>
                <div class="meta">Data Report: ${date}</div>

                <div class="summary-box">
                    <strong>Riepilogo Generale:</strong> ${completedChecks} controlli completati su ${totalChecks} totali 
                    (${completionRate}% di completamento)
                </div>

                <h2 style="margin-top: 30px; color: #10b981;">Lista Completa Controlli HACCP</h2>

                ${categories.map(category => {
            const catCompleted = this.getCategoryCompletedCount(category);
            const catTotal = category.items.length;
            const catRate = catTotal > 0 ? Math.round((catCompleted / catTotal) * 100) : 0;

            return `
                        <div class="category">
                            <div class="category-header" style="border-left-color: ${category.color}; color: ${category.color};">
                                ${category.name} (${catCompleted}/${catTotal} - ${catRate}%)
                            </div>
                            ${category.items.map(item => `
                                <div class="check-item">
                                    <div class="check-icon ${item.completed ? 'done' : 'pending'}">
                                        ${item.completed ? '✓' : '−'}
                                    </div>
                                    <div class="check-label">${item.label}</div>
                                    <div class="check-status ${item.completed ? 'done' : 'pending'}">
                                        ${item.completed ? 'Fatto' : 'Da Fare'}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
        }).join('')}

                <div class="signature-area">
                    <p><strong>Firma del Responsabile HACCP:</strong></p>
                    <div class="signature-line">
                        <div style="text-align: center; font-size: 12px; color: #64748b;">Firma e Timbro</div>
                    </div>
                </div>

                <div class="footer">
                    <p>Documento generato automaticamente da HACCP Pro - ${new Date().toLocaleString('it-IT')}</p>
                    <p>Lista completa dei controlli HACCP per ${company.name}</p>
                </div>
            </body>
            </html>
        `;
    }
}
