
import { Component, inject, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppStateService, MenuItem } from '../services/app-state.service';

@Component({
  selector: 'app-generic-module',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <!-- Header Module -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
           <div class="flex items-center gap-2 mb-1">
             <span class="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{{ moduleInfo()?.category }}</span>
           </div>
           <h2 class="text-2xl font-bold text-slate-800 flex items-center">
             <i [class]="'fa-solid ' + (moduleInfo()?.icon || 'fa-folder') + ' mr-3 text-blue-600'"></i>
             {{ moduleInfo()?.label }}
           </h2>
           <p class="text-slate-500 text-sm mt-1">Gestione operativa e archivio digitale.</p>
        </div>
        <div class="flex gap-3">
          <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <i class="fa-solid fa-download mr-2"></i> Export PDF
          </button>
          <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
            <i class="fa-solid fa-plus mr-2"></i> Nuovo Record
          </button>
        </div>
      </div>

      <!-- Active Filter Badge -->
      @if (state.filterCollaboratorId()) {
         <div class="bg-blue-50 border border-blue-100 text-blue-800 px-4 py-3 rounded-xl flex items-center justify-between animate-fade-in">
           <div class="flex items-center gap-2">
             <i class="fa-solid fa-filter"></i>
             <span class="text-sm font-medium">Filtrato per: <strong>{{ getFilterName() }}</strong></span>
           </div>
           <button (click)="state.setCollaboratorFilter('')" class="text-xs hover:underline">Rimuovi Filtro</button>
         </div>
      }

      <!-- Data Table Placeholder -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm text-slate-600">
            <thead class="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
              <tr>
                <th class="px-6 py-4">Data & Ora</th>
                <th class="px-6 py-4">Operatore</th>
                <th class="px-6 py-4">Dettagli / Oggetto</th>
                <th class="px-6 py-4">Stato</th>
                <th class="px-6 py-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (item of filteredData(); track item.id) {
                <tr class="hover:bg-slate-50 transition-colors">
                  <td class="px-6 py-4 whitespace-nowrap">{{ item.date }}</td>
                  <td class="px-6 py-4 font-medium text-slate-800">
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                        {{ getInitials(item.operator) }}
                      </div>
                      {{ item.operator }}
                    </div>
                  </td>
                  <td class="px-6 py-4">{{ item.detail }}</td>
                  <td class="px-6 py-4">
                    <span [class]="getStatusClass(item.status)">
                      {{ item.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button class="text-slate-400 hover:text-blue-600 mx-1"><i class="fa-solid fa-eye"></i></button>
                    <button class="text-slate-400 hover:text-slate-600 mx-1"><i class="fa-solid fa-pen"></i></button>
                  </td>
                </tr>
              } @empty {
                <tr>
                   <td colspan="5" class="px-6 py-12 text-center text-slate-400">
                      <i class="fa-solid fa-folder-open text-3xl mb-3 opacity-50"></i>
                      <p>Nessun record trovato per questo filtro.</p>
                   </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        
        <!-- Pagination Mock -->
        <div class="px-6 py-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
          <span>Visualizzazione {{ filteredData().length }} di {{ rawData().length }} record</span>
          <div class="flex gap-2">
            <button class="p-1 px-2 rounded hover:bg-slate-100 disabled:opacity-50"><i class="fa-solid fa-chevron-left"></i></button>
             <button class="p-1 px-2 rounded hover:bg-slate-100"><i class="fa-solid fa-chevron-right"></i></button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class GenericModuleComponent {
  state = inject(AppStateService);
  moduleId = input.required<string>();

  moduleInfo = computed(() => 
    this.state.menuItems.find(m => m.id === this.moduleId())
  );

  // Raw Data (Unfiltered)
  rawData = computed(() => {
    const id = this.moduleId();
    const isTemp = id.includes('temp');
    const isSuppliers = id.includes('suppliers');
    
    // Static data with varying operators
    return [
      { id: 1, date: '2024-05-20 08:30', operator: 'Mario Rossi', detail: isTemp ? 'Cella Frigo 1: +3.5°C' : (isSuppliers ? 'Forniture Globali Srl' : 'Controllo Ordinario'), status: 'Conforme' },
      { id: 2, date: '2024-05-19 18:45', operator: 'Luigi Verdi', detail: isTemp ? 'Abbattitore: -18.2°C' : (isSuppliers ? 'Bio Alimenti SpA' : 'Pulizia Fine Turno'), status: 'Conforme' },
      { id: 3, date: '2024-05-19 12:00', operator: 'Mario Rossi', detail: isTemp ? 'Vetrina Bibite: +5.0°C' : (isSuppliers ? 'TecnoClean Italia' : 'Verifica scadenze'), status: 'Conforme' },
      { id: 4, date: '2024-05-18 09:15', operator: 'Giulia Bianchi', detail: isTemp ? 'Cella Carni: +2.1°C' : (isSuppliers ? 'Dolci & Co.' : 'Ricezione Merce'), status: 'Attenzione' },
      { id: 5, date: '2024-05-18 08:00', operator: 'Mario Rossi', detail: isTemp ? 'Frizer 2: -20°C' : (isSuppliers ? 'Panificio Locale' : 'Sanificazione Superfici'), status: 'Conforme' },
      { id: 6, date: '2024-05-17 14:30', operator: 'Luigi Verdi', detail: isTemp ? 'Cella Frigo 2: +4.0°C' : (isSuppliers ? 'Ortofrutta Express' : 'Manutenzione Ordinaria'), status: 'Conforme' },
    ];
  });

  // Filtered Data
  filteredData = computed(() => {
    const allData = this.rawData();
    const filterId = this.state.filterCollaboratorId();

    if (!filterId) return allData;

    // Find the user name associated with the ID in the systemUsers list
    const filterUser = this.state.systemUsers().find(u => u.id === filterId);
    if (!filterUser) return allData; // Should not happen

    return allData.filter(item => item.operator === filterUser.name);
  });

  getFilterName() {
    const id = this.state.filterCollaboratorId();
    return this.state.systemUsers().find(u => u.id === id)?.name || 'Sconosciuto';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getStatusClass(status: string): string {
    if (status === 'Conforme') return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800';
    if (status === 'Attenzione') return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800';
    return 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800';
  }
}
