import { Component, inject, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';
import { DDT_AI_PROMPT, DDT_AI_SCHEMA, DdtFormItem, findMatchingSupplier, normalizeParsedDdt, NormalizedDdtParse, SupplierRecord } from '../utils/supplier-match';

export interface IncomingIngredient {
  id: string;
  clientId: string;
  supplierId?: string;
  supplierName: string;
  ingredientName: string;
  lotto: string;
  quantity: string;
  entryDate: string;
  expiryDate: string;
  ddtImageUrl?: string;
  createdAt: string;
}

@Component({
  selector: 'app-ddt-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 pb-16 animate-fade-in">

      <!-- Header -->
      <div class="bg-gradient-to-r from-amber-600 to-orange-600 p-6 rounded-2xl shadow-lg text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image:radial-gradient(circle at 2px 2px,white 1px,transparent 0);background-size:20px 20px;"></div>
        <div class="relative z-10">
          <h2 class="text-2xl font-black tracking-tight flex items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><i class="fa-solid fa-truck-ramp-box"></i></span>
            Carico Merci / DDT
          </h2>
          <p class="text-amber-100 text-sm mt-1">Registra arrivi merce e crea la Dispensa Digitale con OCR AI</p>
        </div>
        <button (click)="showForm.set(true)"
                class="relative z-10 px-6 py-3 bg-white text-amber-700 font-black text-sm uppercase tracking-wider rounded-xl hover:bg-amber-50 transition-all shadow-lg flex items-center gap-2 shrink-0">
          <i class="fa-solid fa-plus"></i> Nuovo Carico
        </button>
      </div>

      <!-- AI OCR Upload Card -->
      @if (showForm()) {
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 class="font-black text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-robot text-violet-600"></i> Inserimento Carico
            </h3>
            <button (click)="cancelForm()" class="text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="p-6 space-y-6">

            <!-- DDT Photo Upload + OCR -->
            <div class="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl border border-violet-100 p-5">
              <h4 class="text-sm font-black text-violet-800 mb-3 flex items-center gap-2">
                <i class="fa-solid fa-camera-retro text-violet-600"></i> Carica Foto DDT — Analisi AI Automatica
              </h4>
              <div class="flex flex-col md:flex-row gap-4 items-start">
                <div class="w-full md:w-48 h-36 rounded-xl border-2 border-dashed border-violet-300 bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-violet-50 transition-all relative overflow-hidden"
                     (click)="ddtFileInput.click()">
                  @if (ddtPreview()) {
                    @if (isPdfPreview()) {
                      <div class="w-full h-full bg-rose-50 flex flex-col items-center justify-center rounded-xl p-2 border border-rose-100">
                        <i class="fa-solid fa-file-pdf text-4xl text-rose-500 mb-1"></i>
                        <span class="text-[9px] font-black text-rose-700 truncate w-full text-center">Documento PDF</span>
                      </div>
                    } @else {
                      <img [src]="ddtPreview()" class="w-full h-full object-cover rounded-xl">
                    }
                    <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all rounded-xl">
                      <span class="text-white text-xs font-bold">Cambia file</span>
                    </div>
                  } @else {
                    <i class="fa-solid fa-file-image text-3xl text-violet-300 mb-2"></i>
                    <span class="text-[11px] font-bold text-violet-400 uppercase tracking-wider text-center px-2">Foto o PDF DDT</span>
                  }
                </div>
                <input #ddtFileInput type="file" accept="image/*,application/pdf" class="hidden" (change)="handleDdtPhoto($event)">
                <div class="flex-1">
                  <p class="text-[11px] text-violet-700 font-bold mb-3">Scatta o carica la foto del DDT: l'AI estrarrà automaticamente i dati del carico.</p>
                  <button (click)="analyzeWithAI()" [disabled]="!ddtPreview() || isAnalyzing()"
                          class="px-5 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2">
                    @if (isAnalyzing()) {
                      <i class="fa-solid fa-spinner fa-spin"></i> Analisi in corso...
                    } @else {
                      <i class="fa-solid fa-wand-magic-sparkles"></i> Analizza con AI
                    }
                  </button>
                  @if (!state.aiConfig()?.apiKey) {
                    <div class="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-800 text-[11px] font-medium flex items-center gap-2">
                      <i class="fa-solid fa-triangle-exclamation text-amber-600 shrink-0"></i>
                      <span>
                        @if (state.isAdmin()) {
                          Chiave API Gemini non configurata. <a (click)="state.setModule('settings')" class="underline font-bold cursor-pointer hover:text-amber-900">Vai in Impostazioni → AI</a>.
                        } @else {
                          Modulo AI non ancora configurato dall'amministratore. Puoi comunque inserire i dati del carico manualmente nel modulo qui sotto.
                        }
                      </span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Manual / AI-filled Form for Multiple Items -->
            <div class="space-y-6">
              <!-- DDT Header Data -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Fornitore *</label>
                  <input type="text" [(ngModel)]="form().supplierName" (ngModelChange)="onSupplierNameChange()"
                         placeholder="Nome fornitore"
                         class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Data Documento *</label>
                  <input type="date" [(ngModel)]="form().entryDate" (ngModelChange)="bumpFormRevision()"
                         class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-base font-bold text-slate-800 focus:outline-none focus:border-amber-500 transition-all">
                </div>
              </div>

              <!-- Supplier Register Checkbox (Step 2) -->
              @if (form().supplierName && !linkedSupplier()) {
                <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h4 class="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                      <i class="fa-solid fa-circle-info text-indigo-600"></i> Nuovo Fornitore Rilevato
                    </h4>
                    <p class="text-[11px] text-indigo-700/80 font-bold mt-0.5">
                      "{{ form().supplierName }}" non esiste in anagrafica. Vuoi registrarlo all'importazione?
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <button type="button" (click)="registerNewSupplier.set(false)" 
                            class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border"
                            [class]="!registerNewSupplier() ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'">
                      No, solo DDT
                    </button>
                    <button type="button" (click)="registerNewSupplier.set(true)" 
                            class="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border"
                            [class]="registerNewSupplier() ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'">
                      Sì, Registra
                    </button>
                  </div>
                </div>
              }

              <!-- Products List -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-black uppercase tracking-widest text-slate-500">Prodotti nel Carico (Anteprima)</h4>
                  <button (click)="addEmptyItem()" class="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-all">
                    + Aggiungi Riga
                  </button>
                </div>
                
                @for (item of form().items; track $index) {
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white border border-slate-200 p-3 rounded-xl relative group">
                    <div class="md:col-span-4 space-y-1">
                      <label class="text-[9px] font-bold uppercase text-slate-400">Prodotto</label>
                      <input type="text" [(ngModel)]="item.ingredientName" (ngModelChange)="bumpFormRevision()"
                         placeholder="es. Patate" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base font-bold focus:border-amber-400 outline-none">
                    </div>
                    <div class="md:col-span-3 space-y-1">
                      <label class="text-[9px] font-bold uppercase text-slate-400">Lotto</label>
                      <input type="text" [(ngModel)]="item.lotto" (ngModelChange)="bumpFormRevision()"
                         placeholder="Lotto" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base font-mono font-bold focus:border-amber-400 outline-none">
                    </div>
                    <div class="md:col-span-2 space-y-1">
                      <label class="text-[9px] font-bold uppercase text-slate-400">Quantità</label>
                      <input type="text" [(ngModel)]="item.quantity" (ngModelChange)="bumpFormRevision()"
                         placeholder="es. 10 kg" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base font-bold focus:border-amber-400 outline-none">
                    </div>
                    <div class="md:col-span-3 space-y-1">
                      <div class="flex items-center justify-between">
                        <label class="text-[9px] font-bold uppercase text-slate-400">Scadenza</label>
                        @if (!item.expiryDate) {
                          <span class="text-[8px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase">
                            Manca (A mano)
                          </span>
                        }
                      </div>
                      <input type="date" [(ngModel)]="item.expiryDate" (ngModelChange)="bumpFormRevision()" 
                             class="w-full px-3 py-2 bg-slate-50 border rounded-lg text-base font-bold focus:border-amber-400 outline-none text-slate-800"
                             [class]="!item.expiryDate ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 text-slate-700'">
                    </div>
                    
                    <button (click)="removeItem($index)" class="absolute -right-2 -top-2 w-6 h-6 bg-white border border-slate-200 rounded-full text-rose-500 shadow-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-rose-50 hover:border-rose-200">
                      <i class="fa-solid fa-times text-[10px]"></i>
                    </button>
                  </div>
                }
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button (click)="cancelForm()" class="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-100 transition-all">Annulla</button>
              <button (click)="saveMultipleEntries()" [disabled]="!canImportForm()"
                      class="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2">
                <i class="fa-solid fa-circle-check"></i> Importa Tutto ({{ validItemCount() }})
              </button>
            </div>
          </div>
        </div>
      }
      
      <!-- Removed old blocking new supplier confirmation modal -->
      
      @if (aiRawResponse()) {
        <div class="bg-rose-50 border border-rose-100 rounded-2xl p-6 mb-6 animate-fade-in mx-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="h-8 w-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <i class="fa-solid fa-bug text-sm"></i>
              </div>
              <h4 class="text-xs font-black text-rose-800 uppercase tracking-widest">Diagnostica AI (Risposta Grezza)</h4>
            </div>
            <button (click)="aiRawResponse.set(null)" class="h-8 w-8 rounded-lg hover:bg-rose-100 text-rose-400 hover:text-rose-600 transition-all">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="bg-white/80 rounded-xl p-4 border border-rose-100">
            <pre class="text-[11px] text-rose-600 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">{{ aiRawResponse() }}</pre>
          </div>
          <p class="mt-4 text-[10px] text-rose-400 font-medium italic">* Queste informazioni aiutano lo sviluppatore a capire perché l'AI non ha risposto correttamente.</p>
        </div>
      }

      <!-- Pantry List -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-amber-600">
                <i class="fa-solid" [class]="viewMode() === 'daily' ? 'fa-calendar-day' : (viewMode() === 'activePantry' ? 'fa-circle-check' : 'fa-boxes-stacked')"></i>
              </div>
              <div>
                <h3 class="font-bold text-slate-800">
                  {{ viewMode() === 'daily' ? 'Carichi del Giorno (' + formatDisplayDate(state.filterDate()) + ')' : (viewMode() === 'activePantry' ? 'Dispensa Attiva (Prodotti Validi)' : 'Tutti i Prodotti in Dispensa') }}
                </h3>
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {{ filteredPantry().length }} prodotti visualizzati
                </p>
              </div>
            </div>
            
            <!-- View Tabs -->
            <div class="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl border border-slate-200 shadow-inner shrink-0">
              <button type="button" (click)="viewMode.set('all')" 
                      class="px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2"
                      [class]="viewMode() === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'">
                <i class="fa-solid fa-boxes-stacked text-[11px]"></i>
                <span>Tutti ({{ totalCount() }})</span>
              </button>
              <button type="button" (click)="viewMode.set('daily')" 
                      class="px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2"
                      [class]="viewMode() === 'daily' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'">
                <i class="fa-solid fa-calendar-day text-[11px]"></i>
                <span>Carichi Giorno ({{ dailyCount() }})</span>
              </button>
              <button type="button" (click)="viewMode.set('activePantry')" 
                      class="px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2"
                      [class]="viewMode() === 'activePantry' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'">
                <i class="fa-solid fa-circle-check text-[11px]"></i>
                <span>Solo Attivi ({{ activeCount() }})</span>
              </button>
            </div>
          </div>
          
          <!-- Row 2: Search (Full width on mobile) -->
          <div class="relative w-full">
            <i class="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
            <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Cerca per prodotto o fornitore..."
                   class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-base font-bold text-slate-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50 transition-all shadow-sm">
          </div>

          <!-- Stale Products Alert Banner (>10 days no expiry) -->
          @if (staleCount() > 0) {
            <div class="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 border-2 border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 text-lg shadow-sm">
                  <i class="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                  <h4 class="text-sm font-black text-amber-900">
                    Controllo Giacenze: {{ staleCount() }} {{ staleCount() === 1 ? 'prodotto' : 'prodotti' }} senza scadenza da oltre 10 giorni
                  </h4>
                  <p class="text-xs text-amber-800 font-bold mt-0.5">
                    Nota: i prodotti senza data di scadenza verranno cancellati dalla dispensa definitivamente dopo 10 giorni se non verranno aggiornati con la data di scadenza.
                  </p>
                </div>
              </div>
              <button type="button" (click)="openStaleModalManually()"
                      class="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shrink-0 flex items-center justify-center gap-2 shadow-md hover:shadow-lg">
                <i class="fa-solid fa-list-check"></i>
                <span>Vedi Lista Prodotti ({{ staleCount() }})</span>
              </button>
            </div>
          }
        </div>

        @if (filteredPantry().length === 0) {
          <div class="p-16 text-center">
            <i class="fa-solid fa-boxes-stacked text-4xl text-slate-200 mb-4 block"></i>
            <p class="text-sm font-bold text-slate-500">Dispensa vuota</p>
            <p class="text-xs text-slate-400 mt-1">Aggiungi il primo carico con il pulsante "Nuovo Carico"</p>
          </div>
        } @else {
          <!-- Desktop Table -->
          <div class="hidden md:block overflow-x-auto">
            <table class="w-full text-left">
              <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Ingrediente</th>
                  <th class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Fornitore</th>
                  <th class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Lotto</th>
                  <th class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Entrata</th>
                  <th class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Scadenza</th>
                  <th class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400">Qta</th>
                  <th class="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-slate-400 text-right">Azioni</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (item of filteredPantry(); track item.id) {
                  @let expired = isExpired(item.expiryDate);
                  <tr class="hover:bg-slate-50 transition-colors">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        @let abbItem = findAbbattimentoRecord(item);
                        <div class="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                             [class]="expired ? 'bg-red-50 text-red-400' : abbItem ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-600'">
                          <i [class]="'text-xs fa-solid ' + (abbItem ? 'fa-icicles' : 'fa-carrot')"></i>
                        </div>
                        <div>
                          <p class="text-sm font-black text-slate-800 flex items-center gap-1.5">
                            {{ item.ingredientName }}
                            @if (abbItem) {
                              <i class="fa-solid fa-icicles text-indigo-400 text-[10px]" title="Prodotto Abbattuto"></i>
                            }
                          </p>
                          @if (expired) {
                            <span class="text-[9px] font-black text-red-500 uppercase bg-red-50 px-1.5 py-0.5 rounded">SCADUTO</span>
                          } @else if (abbItem) {
                            <span class="text-[9px] font-black text-indigo-500 uppercase bg-indigo-50 px-1.5 py-0.5 rounded">Abbattuto</span>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm font-bold text-slate-600">{{ item.supplierName }}</td>
                    <td class="px-4 py-3 font-mono text-xs text-slate-500 font-bold">{{ item.lotto || '—' }}</td>
                    <td class="px-4 py-3 text-xs font-bold text-slate-500">{{ formatDisplayDate(item.entryDate) }}</td>
                    <td class="px-4 py-3">
                      @let abbForExpiry = findAbbattimentoRecord(item);
                      @if (abbForExpiry) {
                        <span class="text-xs font-black px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200 shadow-sm flex items-center gap-1 w-fit">
                          <i class="fa-solid fa-icicles text-[9px]"></i>
                          {{ formatDisplayDate(abbForExpiry.postExpiryDate) }}
                        </span>
                      } @else if (item.expiryDate) {
                        <span class="text-xs font-black px-2 py-1 rounded-lg"
                               [class]="expired ? 'bg-red-100 text-red-700 border border-red-200 shadow-sm' : daysToExpiry(item.expiryDate) <= 7 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'">
                          {{ formatDisplayDate(item.expiryDate) }}
                        </span>
                      } @else {
                          <div class="flex flex-col items-start gap-1">
                            @if (editingExpiryId() === item.id) {
                              <div class="flex items-center gap-1 animate-fade-in">
                                <input type="date" #tableExpInput
                                       (change)="saveItemExpiry(item.id, tableExpInput.value)"
                                       class="text-xs font-bold px-2 py-1 bg-white border-2 border-amber-400 rounded-lg text-slate-800 outline-none shadow-sm">
                                <button type="button" (click)="saveItemExpiry(item.id, tableExpInput.value)"
                                        class="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold shadow-sm">
                                  Salva
                                </button>
                                <button type="button" (click)="editingExpiryId.set(null)"
                                        class="text-slate-400 hover:text-slate-600 px-1 text-xs font-bold">
                                  <i class="fa-solid fa-xmark"></i>
                                </button>
                              </div>
                            } @else {
                              <button type="button" (click)="editingExpiryId.set(item.id)"
                                      class="group inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 hover:border-amber-300 rounded-lg text-xs font-bold shadow-sm transition-all"
                                      title="Inserisci data di scadenza a mano">
                                <i class="fa-solid fa-calendar-plus text-amber-500 group-hover:scale-110 transition-transform"></i>
                                <span>+ Inserisci scadenza</span>
                              </button>
                              <span class="text-[8px] font-bold text-amber-600">Max 10gg se senza data</span>
                            }
                          </div>
                        }
                    </td>
                    <td class="px-4 py-3 text-sm font-bold text-slate-600">{{ item.quantity || '—' }}</td>
                    <td class="px-4 py-3 text-right">
                      <button (click)="confirmDelete(item)" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-auto">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="md:hidden divide-y divide-slate-100">
            @for (item of filteredPantry(); track item.id) {
              @let expired = isExpired(item.expiryDate);
              @let abbItem = findAbbattimentoRecord(item);
              <div class="p-4 space-y-3 bg-white">
                <div class="flex justify-between items-start">
                  <div class="flex items-center gap-3">
                    <div class="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100"
                         [class]="expired ? 'bg-red-50 text-red-500' : abbItem ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'">
                      <i [class]="'fa-solid ' + (abbItem ? 'fa-icicles' : 'fa-carrot')"></i>
                    </div>
                    <div>
                      <h4 class="text-sm font-black text-slate-800 leading-tight">{{ item.ingredientName }}</h4>
                      <p class="text-[10px] font-bold text-indigo-500 uppercase tracking-tight">{{ item.supplierName }}</p>
                    </div>
                  </div>
                  <button (click)="confirmDelete(item)" class="w-9 h-9 flex items-center justify-center text-rose-500 bg-rose-50 border border-rose-100 rounded-lg shadow-sm">
                    <i class="fa-solid fa-trash-can text-sm"></i>
                  </button>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div class="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Lotto / Qta</p>
                    <p class="text-[10px] font-bold text-slate-600 truncate">
                      <span class="font-mono">{{ item.lotto || 'N/D' }}</span>
                      @if (item.quantity) { <span class="mx-1 text-slate-300">•</span> {{ item.quantity }} }
                    </p>
                  </div>
                  <div class="p-2 rounded-lg border flex flex-col justify-center"
                       [class]="expired ? 'bg-red-50 border-red-100' : item.expiryDate ? 'bg-slate-50 border-slate-100' : 'bg-amber-50/60 border-amber-200'">
                    <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Scadenza</p>
                    @if (abbItem?.postExpiryDate || item.expiryDate) {
                      <p class="text-[10px] font-black" 
                         [class]="expired ? 'text-red-600' : daysToExpiry(item.expiryDate) <= 7 ? 'text-amber-600' : 'text-emerald-600'">
                        {{ formatDisplayDate(abbItem?.postExpiryDate || item.expiryDate) }}
                        @if (abbItem) { <i class="fa-solid fa-icicles text-[8px] ml-1"></i> }
                      </p>
                    } @else {
                      @if (editingExpiryId() === item.id) {
                        <div class="flex items-center gap-1 mt-1">
                          <input type="date" #mExpInput
                                 (change)="saveItemExpiry(item.id, mExpInput.value)"
                                 class="text-[11px] font-bold px-1.5 py-0.5 bg-white border-2 border-amber-400 rounded-lg text-slate-800 outline-none w-full">
                          <button type="button" (click)="saveItemExpiry(item.id, mExpInput.value)" class="text-[10px] bg-amber-600 text-white px-1.5 py-0.5 rounded font-bold">OK</button>
                          <button type="button" (click)="editingExpiryId.set(null)" class="text-slate-400 text-xs px-1">✕</button>
                        </div>
                      } @else {
                        <button type="button" (click)="editingExpiryId.set(item.id)"
                                class="text-[10px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 mt-0.5">
                          <i class="fa-solid fa-calendar-plus text-amber-500"></i>
                          <span>+ Inserisci a mano</span>
                        </button>
                      }
                    }
                  </div>
                </div>

                <div class="flex justify-between items-center pt-1">
                  <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Caricato il {{ formatDisplayDate(item.entryDate) }}</span>
                  @if (expired) {
                    <span class="px-2 py-0.5 bg-rose-600 text-white rounded text-[8px] font-black uppercase tracking-widest animate-pulse">Prodotto Scaduto</span>
                  } @else if (abbItem) {
                    <span class="px-2 py-0.5 bg-indigo-600 text-white rounded text-[8px] font-black uppercase tracking-widest">Post-Abbattimento</span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Delete Confirmation Modal -->
      @if (itemToDelete()) {
        <div class="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" (click)="itemToDelete.set(null)"></div>
          <div class="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-slide-up border border-slate-200">
            <div class="p-8 text-center">
              <div class="h-20 w-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-3xl mx-auto mb-6 border border-rose-100 shadow-inner">
                <i class="fa-solid fa-trash-can"></i>
              </div>
              <h3 class="text-xl font-black text-slate-800 mb-2">Elimina Prodotto?</h3>
              <p class="text-sm text-slate-500 leading-relaxed mb-8">
                Stai per eliminare <span class="font-bold text-slate-800">{{ itemToDelete()?.ingredientName }}</span> dal carico del {{ formatDisplayDate(itemToDelete()?.entryDate) }}.<br>
                Questa azione non può essere annullata.
              </p>
              
              <div class="flex flex-col gap-3">
                <button (click)="executeDelete()" 
                        class="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200">
                  Sì, Elimina Definitivamente
                </button>
                <button (click)="itemToDelete.set(null)" 
                        class="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Stale No-Expiry Products Modal (> 10 Days) -->
      @if (showStaleModal()) {
        <div class="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" (click)="closeStaleModal()"></div>
          <div class="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-slide-up border border-slate-200 flex flex-col max-h-[90vh]">
            
            <!-- Header Banner -->
            <div class="p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 text-white relative flex-shrink-0 flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner border border-white/30 shrink-0">
                  <i class="fa-solid fa-clock-rotate-left"></i>
                </div>
                <div>
                  <h3 class="text-xl font-black tracking-tight">Prodotti Senza Scadenza (> 10 Giorni)</h3>
                  <p class="text-xs text-amber-100 font-medium mt-0.5">Controllo igiene HACCP: verifica giacenze prolungate</p>
                </div>
              </div>
              <button (click)="closeStaleModal()" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>

            <!-- Description & Controls -->
            <div class="p-6 pb-3 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 flex-shrink-0">
              <div class="space-y-1">
                <p class="text-xs text-slate-600 leading-relaxed font-medium">
                  I seguenti <span class="font-bold text-slate-900">{{ staleItems().length }} prodotti</span> risultano caricati da più di 10 giorni senza data di scadenza.
                </p>
                <p class="text-[11px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                  <i class="fa-solid fa-circle-exclamation text-amber-600 mr-1"></i>
                  Nota: i prodotti senza data di scadenza verranno cancellati dalla dispensa definitivamente dopo 10 giorni se non verranno aggiornati con la data di scadenza.
                </p>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button type="button" (click)="toggleAllStale(selectedStaleIds().length < staleItems().length)" 
                        class="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                  {{ selectedStaleIds().length < staleItems().length ? 'Seleziona Tutti' : 'Deseleziona Tutti' }}
                </button>
              </div>
            </div>

            <!-- Scrollable Items List -->
            <div class="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
              @for (item of staleItems(); track item.id) {
                @let isSelected = isStaleSelected(item.id);
                @let days = getDaysSinceEntry(item);
                <div (click)="toggleStaleItem(item.id)" 
                     class="p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                     [class]="isSelected ? 'border-rose-400 bg-rose-50/60 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'">
                  <div class="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    <input type="checkbox" [checked]="isSelected" (click)="$event.stopPropagation(); toggleStaleItem(item.id)"
                           class="w-5 h-5 text-rose-600 rounded-lg border-slate-300 focus:ring-rose-500 cursor-pointer mt-0.5 sm:mt-0 shrink-0">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <p class="font-bold text-sm text-slate-800 truncate">{{ item.ingredientName }}</p>
                        @if (item.quantity) {
                          <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold shrink-0">
                            {{ item.quantity }}
                          </span>
                        }
                      </div>
                      <div class="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1 font-medium">
                        <span class="text-slate-600 font-semibold">{{ item.supplierName || 'Fornitore n/d' }}</span>
                        <span>•</span>
                        <span>Lotto: <strong class="font-mono text-slate-700">{{ item.lotto || '—' }}</strong></span>
                        <span>•</span>
                        <span>Caricato: <strong class="text-slate-700">{{ formatDisplayDate(item.entryDate) }}</strong></span>
                      </div>

                      <!-- Inserisci scadenza a mano per salvare/mantenere il prodotto -->
                      <div class="mt-2.5 flex items-center gap-2" (click)="$event.stopPropagation()">
                        @if (editingExpiryId() === item.id) {
                          <div class="flex flex-wrap items-center gap-1.5 animate-fade-in">
                            <span class="text-[10px] font-bold text-slate-500">Imposta scadenza:</span>
                            <input type="date" #staleInput
                                   (change)="saveItemExpiry(item.id, staleInput.value)"
                                   class="text-xs font-bold px-2 py-1 bg-white border-2 border-emerald-500 rounded-lg text-slate-800 outline-none shadow-sm">
                            <button type="button" (click)="saveItemExpiry(item.id, staleInput.value)"
                                    class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm">
                              Salva e Mantieni
                            </button>
                            <button type="button" (click)="editingExpiryId.set(null)" class="text-slate-400 hover:text-slate-600 px-1 text-xs">
                              Annulla
                            </button>
                          </div>
                        } @else {
                          <button type="button" (click)="editingExpiryId.set(item.id)"
                                  class="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all shadow-xs">
                            <i class="fa-solid fa-calendar-plus text-emerald-600"></i>
                            <span>Inserisci scadenza a mano (per mantenerlo)</span>
                          </button>
                        }
                      </div>

                    </div>
                  </div>
                  <div class="shrink-0 flex sm:flex-col items-end justify-between sm:justify-center gap-1">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-xs font-black">
                      <i class="fa-solid fa-hourglass-half text-[10px]"></i>
                      {{ days }} giorni fa
                    </span>
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Senza scadenza</span>
                  </div>
                </div>
              } @empty {
                <div class="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                  <i class="fa-solid fa-circle-check text-3xl text-emerald-500 mb-2"></i>
                  <p class="font-bold text-slate-700 text-sm">Nessun prodotto senza scadenza oltre i 10 giorni</p>
                  <p class="text-xs text-slate-400 mt-0.5">Tutti i prodotti hanno una data di scadenza o sono recenti.</p>
                </div>
              }
            </div>

            <!-- Footer Actions -->
            <div class="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3 flex-shrink-0">
              <button type="button" (click)="closeStaleModal()" 
                      class="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                Annulla (Mantieni in Dispensa)
              </button>
              <button type="button" (click)="confirmDeleteStale()" 
                      [disabled]="selectedStaleIds().length === 0"
                      class="w-full sm:w-auto px-6 py-3.5 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <i class="fa-solid fa-trash-can"></i>
                <span>Conferma Eliminazione ({{ selectedStaleIds().length }})</span>
              </button>
            </div>

          </div>
        </div>
      }

    </div>
  `,
  styles: [`.animate-fade-in { animation: fadeIn 0.4s ease-out; } @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`]
})
export class DdtViewComponent {
  state = inject(AppStateService);
  toast = inject(ToastService);

  showForm = signal(false);
  isAnalyzing = signal(false);
  ddtPreview = signal<string | null>(null);
  isPdfPreview = signal(false);
  pantry = signal<IncomingIngredient[]>([]);
  viewMode = signal<'all' | 'daily' | 'activePantry'>('all');
  searchQuery = signal('');
  showNewSupplierModal = signal(false);
  aiRawResponse = signal<string | null>(null);
  itemToDelete = signal<IncomingIngredient | null>(null);
  showStaleModal = signal(false);
  staleItems = signal<IncomingIngredient[]>([]);
  selectedStaleIds = signal<string[]>([]);
  staleModalDismissed = signal(false);
  editingExpiryId = signal<string | null>(null);
  formRevision = signal(0);
  linkedSupplier = signal<SupplierRecord | null>(null);
  importDraft = signal<NormalizedDdtParse | null>(null);
  rawAiPayload = signal<any | null>(null);
  registerNewSupplier = signal(true);

  form = signal<{
    supplierId?: string;
    supplierName: string;
    supplierPiva: string;
    entryDate: string;
    items: DdtFormItem[];
  }>({
    supplierName: '',
    supplierPiva: '',
    entryDate: '',
    items: []
  });

  validItemCount = computed(() => {
    this.formRevision();
    this.importDraft();
    this.rawAiPayload();
    return this.collectImportItems().length;
  });

  clientPantry = computed(() => {
    const clientId = this.state.activeTargetClientId();
    return this.pantry().filter(i => !clientId || !i.clientId || i.clientId === clientId);
  });

  isItemInDailyLoad(item: IncomingIngredient, selectedDate: string): boolean {
    if (!selectedDate) return true;
    const targetIso = this.formatDateToISO(selectedDate) || selectedDate;

    // 1. Direct match on entryDate
    const entryIso = this.formatDateToISO(item.entryDate);
    if (entryIso === targetIso || item.entryDate === targetIso) return true;

    // 2. Creation timestamp: if the item was acquired/imported on this day
    if (item.createdAt) {
      const createdIso = item.createdAt.substring(0, 10);
      if (createdIso === targetIso) return true;
    }

    // 3. Document date if present
    if ((item as any).documentDate) {
      const docIso = this.formatDateToISO((item as any).documentDate);
      if (docIso === targetIso) return true;
    }

    return false;
  }

  dailyCount = computed(() => {
    const selectedDate = this.state.filterDate();
    return this.clientPantry().filter(i => this.isItemInDailyLoad(i, selectedDate)).length;
  });

  activeCount = computed(() => this.clientPantry().filter(i => !this.isExpired(i.expiryDate)).length);
  expiredCount = computed(() => this.clientPantry().filter(i => this.isExpired(i.expiryDate)).length);
  totalCount = computed(() => this.clientPantry().length);

  staleCount = computed(() => {
    return this.clientPantry().filter(i => {
      const exp = (i.expiryDate || '').trim();
      const hasNoExpiry = !exp || exp.toUpperCase() === 'N/A';
      return hasNoExpiry && this.getDaysSinceEntry(i) >= 10;
    }).length;
  });

  filteredPantry = computed(() => {
    const selectedDate = this.state.filterDate();
    let items = this.clientPantry();
    
    if (this.viewMode() === 'daily') {
      items = items.filter(i => this.isItemInDailyLoad(i, selectedDate));
    } else if (this.viewMode() === 'activePantry') {
      items = items.filter(i => !this.isExpired(i.expiryDate));
    }
    
    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
      items = items.filter(i => 
        (i.ingredientName && i.ingredientName.toLowerCase().includes(q)) || 
        (i.supplierName && i.supplierName.toLowerCase().includes(q)) ||
        (i.lotto && i.lotto.toLowerCase().includes(q))
      );
    }
    
    return items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  });

  private lastCheckedClientId: string | null = null;

  constructor() {
    effect(() => {
      // Trigger on client change, date filter change, or when checklist records sync from Supabase
      const currentClientId = this.state.activeTargetClientId();
      this.state.filterDate();
      this.state.checklistRecords();
      
      // Load data without tracking everything else
      untracked(() => {
        if (currentClientId !== this.lastCheckedClientId) {
          this.lastCheckedClientId = currentClientId;
          this.staleModalDismissed.set(false);
        }
        this.loadPantry();
        if (!this.showForm()) {
          this.resetForm();
        }
      });
    }, { allowSignalWrites: true });
  }

  resetForm() {
    this.linkedSupplier.set(null);
    this.importDraft.set(null);
    this.rawAiPayload.set(null);
    this.showNewSupplierModal.set(false);
    this.registerNewSupplier.set(true);
    this.form.set({
      supplierId: undefined,
      supplierName: '',
      supplierPiva: '',
      entryDate: this.state.filterDate() || new Date().toISOString().split('T')[0],
      items: [{ ingredientName: '', lotto: '', quantity: '', expiryDate: '' }]
    });
    this.ddtPreview.set(null);
    this.formRevision.update(v => v + 1);
  }

  onSupplierNameChange() {
    const current = this.form();
    const matched = findMatchingSupplier(this.getSuppliersList(), current.supplierName, current.supplierPiva);
    this.linkedSupplier.set(matched);
    if (matched) {
      current.supplierId = matched.id;
      current.supplierName = matched.ragioneSociale;
      this.registerNewSupplier.set(false);
    } else {
      current.supplierId = undefined;
      this.registerNewSupplier.set(true);
    }
    this.formRevision.update(v => v + 1);
  }

  onSupplierPivaChange() {
    const current = this.form();
    const matched = findMatchingSupplier(this.getSuppliersList(), current.supplierName, current.supplierPiva);
    this.linkedSupplier.set(matched);
    if (matched) {
      current.supplierId = matched.id;
      current.supplierName = matched.ragioneSociale;
      this.registerNewSupplier.set(false);
    } else {
      current.supplierId = undefined;
      this.registerNewSupplier.set(true);
    }
    this.formRevision.update(v => v + 1);
  }

  canImportForm(): boolean {
    this.formRevision();
    this.importDraft();
    this.rawAiPayload();
    this.linkedSupplier();
    const items = this.collectImportItems();
    const entryDate = this.getImportContext().entryDate;
    return items.length > 0 && !!entryDate;
  }

  bumpFormRevision() {
    this.formRevision.update(v => v + 1);
  }

  private ensureIsoDate(dateStr: string): string {
    const formatted = this.formatDateToISO(dateStr);
    if (/^\d{4}-\d{2}-\d{2}$/.test(formatted)) return formatted;
    return '';
  }

  private applyParsedDdtToForm(parsed: any) {
    this.rawAiPayload.set(parsed);
    const normalized = normalizeParsedDdt(parsed);
    this.importDraft.set(normalized);
    const entryDate = this.state.filterDate() || this.ensureIsoDate(normalized.entryDate) || new Date().toISOString().split('T')[0];

    this.form.set({
      supplierId: undefined,
      supplierName: normalized.supplierName,
      supplierPiva: normalized.supplierPiva,
      entryDate,
      items: normalized.items.length > 0
        ? normalized.items.map(item => ({
            ingredientName: item.ingredientName,
            lotto: item.lotto,
            quantity: item.quantity,
            expiryDate: this.ensureIsoDate(item.expiryDate)
          }))
        : [{ ingredientName: '', lotto: '', quantity: '', expiryDate: '' }]
    });
    this.formRevision.update(v => v + 1);

    const matched = findMatchingSupplier(this.getSuppliersList(), normalized.supplierName, normalized.supplierPiva);
    this.syncLinkedSupplier(matched);
    if (matched) {
      this.registerNewSupplier.set(false);
    } else {
      this.registerNewSupplier.set(true);
    }

    return normalized.items.length;
  }

  private async retryExtractProductsOnly(base64: string, mimeType: string, key: string): Promise<any | null> {
    const prompt = `Guarda questo DDT italiano. Estrai la tabella prodotti/merci.
IMPORTANTE: Ti accorgi degli elementi da inserire dal numero dei colli che precede la descrizione (colonna COLLI). Quando non c'è il numero dei colli, NON devi acquisire la descrizione (ignora annotazioni o note come Ns.Confer). Acquisisci solo le righe merce con numero di colli valido.
Rispondi in JSON con formato:
{"items":[{"ingredientName":"nome prodotto","lotto":"","quantity":"","expiryDate":""}]}`;

    const modelsToTry = [
      'gemini-3.6-flash',
      'gemini-3.8-flash',
      'gemini-3-flash-preview'
    ];

    for (const modelName of modelsToTry) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: base64 } }
              ]
            }],
            generationConfig: {
              responseMimeType: 'application/json',
              maxOutputTokens: 8192,
              temperature: 0.1
            }
          })
        });

        if (!res.ok) continue;
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text) continue;
        return JSON.parse(text);
      } catch {
        continue;
      }
    }
    return null;
  }

  private normalizeItemRows(items: DdtFormItem[] | undefined): DdtFormItem[] {
    return (items || []).map(item => ({
      ingredientName: item.ingredientName?.trim() || '',
      lotto: item.lotto?.trim() || '',
      quantity: item.quantity?.trim() || '',
      expiryDate: this.ensureIsoDate(item.expiryDate)
    })).filter(item => item.ingredientName);
  }

  private collectImportItems(): DdtFormItem[] {
    const fromForm = this.normalizeItemRows(this.form().items);
    if (fromForm.length > 0) return fromForm;

    // Fallback to draft or raw only if form is completely empty
    const isFormPopulated = this.form().items.some(item => item.ingredientName?.trim() || item.lotto?.trim() || item.quantity?.trim());
    if (isFormPopulated) {
      return this.form().items.map(item => ({
        ingredientName: item.ingredientName?.trim() || 'Prodotto',
        lotto: item.lotto?.trim() || '',
        quantity: item.quantity?.trim() || '',
        expiryDate: this.ensureIsoDate(item.expiryDate)
      }));
    }

    const fromDraft = this.normalizeItemRows(this.importDraft()?.items);
    if (fromDraft.length > 0) return fromDraft;

    const raw = this.rawAiPayload();
    if (raw) {
      const fromRaw = this.normalizeItemRows(normalizeParsedDdt(raw).items);
      if (fromRaw.length > 0) return fromRaw;
    }

    return [];
  }

  private getImportContext() {
    const current = this.form();
    const draft = this.importDraft();
    const entryDate =
      this.ensureIsoDate(current.entryDate) ||
      this.ensureIsoDate(draft?.entryDate || '') ||
      this.state.filterDate() ||
      new Date().toISOString().split('T')[0];

    return {
      supplierId: current.supplierId,
      supplierName: current.supplierName?.trim() || draft?.supplierName?.trim() || '',
      supplierPiva: current.supplierPiva?.trim() || draft?.supplierPiva?.trim() || '',
      entryDate,
      items: this.collectImportItems()
    };
  }

  private getSuppliersList(): SupplierRecord[] {
    return (this.state.getGlobalRecord('suppliers') || []) as SupplierRecord[];
  }

  private findExistingSupplier(formData: {
    supplierId?: string;
    supplierName: string;
    supplierPiva: string;
  }): SupplierRecord | null {
    const suppliers = this.getSuppliersList();

    if (formData.supplierId) {
      const byId = suppliers.find(s => s.id === formData.supplierId);
      if (byId) return byId;
    }

    return findMatchingSupplier(suppliers, formData.supplierName, formData.supplierPiva);
  }

  private syncLinkedSupplier(supplier: SupplierRecord | null) {
    this.linkedSupplier.set(supplier);
    if (supplier) {
      this.form.update(current => ({
        ...current,
        supplierId: supplier.id,
        supplierName: supplier.ragioneSociale
      }));
      this.formRevision.update(v => v + 1);
    }
  }

  private generateDdtThumbnail(dataUrl: string, maxDim = 120, quality = 0.4): Promise<string> {
    if (!dataUrl || dataUrl.startsWith('data:application/pdf')) return Promise.resolve('');
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
        } else {
          if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = dataUrl;
    });
  }

  private async persistImport(
    clientId: string,
    supplierId: string | undefined,
    supplierName: string,
    entryDate: string,
    validItems: DdtFormItem[]
  ) {
    let currentPantry = this.pantry();
    if (!currentPantry || currentPantry.length === 0) {
      const saved = await this.state.getGlobalRecordData('ddt_pantry');
      currentPantry = (saved && Array.isArray(saved)) ? saved : [];
    }

    const newEntries: IncomingIngredient[] = [];
    const loadGroupId = `load_${Date.now()}`;

    // Generate a lightweight thumbnail (< 8KB) for display in supplier load history.
    // Avoid saving large full-res images or PDFs on every item.
    let thumbnail: string | undefined = undefined;
    const rawPreview = this.ddtPreview();
    if (rawPreview && !rawPreview.startsWith('data:application/pdf')) {
      try {
        thumbnail = await this.generateDdtThumbnail(rawPreview);
      } catch (e) {
        console.warn('Thumbnail generation failed:', e);
      }
    }

    for (let i = 0; i < validItems.length; i++) {
      const item = validItems[i];
      const entry: IncomingIngredient = {
        id: `ddt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        clientId,
        supplierId,
        supplierName,
        ingredientName: item.ingredientName,
        lotto: item.lotto || '',
        quantity: item.quantity || '',
        entryDate,
        expiryDate: item.expiryDate || '',
        // Store thumbnail only on the first item of the load to avoid data duplication
        ddtImageUrl: i === 0 ? thumbnail : undefined,
        createdAt: new Date().toISOString()
      };
      (entry as any).documentDate = this.importDraft()?.entryDate || entryDate;
      (entry as any).loadGroupId = loadGroupId;
      (entry as any).supplierPiva = this.form().supplierPiva || this.importDraft()?.supplierPiva || '';
      newEntries.push(entry);
      this.state.addBaseIngredient(entry.ingredientName);
    }

    const updatedPantry = [...newEntries, ...currentPantry];
    this.state.saveGlobalRecord('ddt_pantry', updatedPantry);
    this.pantry.set(updatedPantry);
    this.viewMode.set('daily');
    this.toast.success('Importazione completata', `${newEntries.length} prodotti aggiunti ai Carichi del Giorno.`);
    this.cancelForm();
  }

  addEmptyItem() {
    this.form.update(current => ({
      ...current,
      items: [...current.items, { ingredientName: '', lotto: '', quantity: '', expiryDate: '' }]
    }));
    this.bumpFormRevision();
  }

  removeItem(index: number) {
    this.form.update(current => ({
      ...current,
      items: current.items.filter((_, i) => i !== index)
    }));
    this.bumpFormRevision();
  }

  cancelForm() {
    this.showForm.set(false);
    this.resetForm();
  }

  handleDdtPhoto(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    // We can accept larger files now because we compress them
    if (file.size > 20 * 1024 * 1024) { 
      this.toast.error('File troppo grande', 'Max 20MB prima della compressione'); 
      return; 
    }

    if (file.type === 'application/pdf') {
      // PDF File: Skip image compression and read directly
      this.isPdfPreview.set(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileUrl = e.target?.result as string;
        this.ddtPreview.set(fileUrl);
      };
      reader.readAsDataURL(file);
      return;
    }

    // Otherwise treat as Image
    this.isPdfPreview.set(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgUrl = e.target?.result as string;
      
      // Compress image to reduce API payload and avoid 429/413 errors
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;
 
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
 
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG with 0.6 quality (reduces size dramatically, keeps text readable)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          this.ddtPreview.set(compressedDataUrl);
          
          // Log size reduction for debugging
          const origSize = Math.round(imgUrl.length / 1024);
          const newSize = Math.round(compressedDataUrl.length / 1024);
          console.log(`[OCR] Image compressed: ${origSize}KB -> ${newSize}KB`);
        } else {
          // Fallback if canvas fails
          this.ddtPreview.set(imgUrl);
        }
      };
      img.src = imgUrl;
    };
    reader.readAsDataURL(file);
  }

  async analyzeWithAI() {
    const config = this.state.aiConfig();
    const key = config?.apiKey || (typeof localStorage !== 'undefined' ? localStorage.getItem('haccp_gemini_api_key') : '') || '';
    const img = this.ddtPreview();
    const initialModel = config?.model || 'gemini-3.6-flash';

    if (!key) {
      if (this.state.isAdmin()) {
        this.toast.error('Manca API Key', 'Inserisci la chiave Gemini nelle impostazioni per usare l\'AI.');
      } else {
        this.toast.warning('AI Non Configurato', 'Il modulo AI non è ancora configurato. Puoi compilare i dati manualmente nel form.');
      }
      return;
    }
    if (!img) {
      this.toast.error('Manca Foto', 'Scatta o seleziona una foto del DDT prima di analizzare.');
      return;
    }

    this.isAnalyzing.set(true);
    this.aiRawResponse.set(null);

    // Increment usage counter
    const current = parseInt(sessionStorage.getItem('haccp_gemini_calls') || '0', 10);
    sessionStorage.setItem('haccp_gemini_calls', String(current + 1));

    const modelsToTry = [
      'gemini-3.6-flash',
      'gemini-3.8-flash',
      'gemini-3-flash-preview'
    ];

    let currentModel = initialModel;
    let text = '';

    try {
      const base64 = img.split(',')[1];
      const mimeType = img.split(';')[0].split(':')[1];
      let parsed: any;

      const host = window.location.hostname;
      const isLocalhost = host === 'localhost' || 
                           host === '127.0.0.1' || 
                           host.startsWith('192.168.') || 
                           host.startsWith('172.') || 
                           host.startsWith('10.');

      if (isLocalhost) {
        const errors: string[] = [];
        let success = false;
        let isRateLimited = false;

        for (const modelName of modelsToTry) {
          try {
            console.log(`[AI OCR] Prova modello: ${modelName}`);
            const directBody = {
              contents: [{
                parts: [
                  { text: DDT_AI_PROMPT },
                  { inlineData: { mimeType, data: base64 } }
                ]
              }],
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: DDT_AI_SCHEMA,
                maxOutputTokens: 8192,
                temperature: 0.1,
                thinkingConfig: { thinkingBudget: 0 }
              }
            };

            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(directBody)
            });

            if (!res.ok) {
              const errorData = await res.json();
              const errMsg = errorData.error?.message || `Status ${res.status}`;
              if (res.status === 429 || errMsg.includes('RESOURCE_EXHAUSTED')) {
                isRateLimited = true;
              }
              throw new Error(errMsg);
            }

            const data = await res.json();
            text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (!text) {
              throw new Error('Testo vuoto restituito dal modello.');
            }
            parsed = JSON.parse(text);
            success = true;
            currentModel = modelName;
            console.log(`[AI OCR] Successo con modello: ${modelName}`);
            break; // Success! Exit loop

          } catch (modelErr: any) {
            console.warn(`[AI OCR] Fallito modello ${modelName}:`, modelErr.message);
            errors.push(`${modelName}: ${modelErr.message}`);
          }
        }

        if (!success) {
          if (isRateLimited) {
            this.toast.error('Limite Superato', 'Troppe richieste a Google Gemini (429). Attendi 30-60 secondi o passa a una chiave a pagamento.');
          } else {
            this.toast.error('Errore AI', `Impossibile completare l'analisi con i modelli disponibili: ${errors.join(' | ')}`);
          }
          this.isAnalyzing.set(false);
          return;
        }

      } else {
        // Production: secure serverless proxy call on Vercel
        const body = {
          base64,
          mimeType,
          apiKey: key
        };

        const res = await fetch(`/api/analyze-ddt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errorData = await res.json();
          const errorMsg = errorData.error || '';
          if (res.status === 429) {
            this.toast.error('Limite superato', 'Troppe richieste a Gemini. Attendi un minuto o passa a una chiave a pagamento.');
          } else {
            this.toast.error('Errore AI', errorMsg || `Errore server (${res.status})`);
          }
          this.isAnalyzing.set(false);
          return;
        }

        const serverRes = await res.json();
        if (!serverRes.success) {
          throw new Error(serverRes.error || 'Errore AI sconosciuto.');
        }
        parsed = serverRes.data;
        text = JSON.stringify(parsed);
      }

      // Data is already parsed by serverRes.data
      try {
        let itemCount = this.applyParsedDdtToForm(parsed);

        if (itemCount === 0) {
          const retryPayload = await this.retryExtractProductsOnly(base64, mimeType, key);
          if (retryPayload) {
            const merged = {
              ...parsed,
              items: retryPayload.items ?? retryPayload.prodotti ?? retryPayload.products ?? retryPayload
            };
            this.rawAiPayload.set(merged);
            itemCount = this.applyParsedDdtToForm(merged);
          }
        }

        if (itemCount === 0) {
          this.aiRawResponse.set(JSON.stringify(parsed, null, 2));
          this.toast.error(
            'Prodotti non rilevati',
            'L\'AI non ha letto le righe della tabella prodotti. Usa una foto nitida del DDT (non PDF sfocato) o inserisci i prodotti manualmente.'
          );
        } else {
          this.aiRawResponse.set(null);
          this.toast.success('AI completato', `Trovati ${itemCount} prodotti! Verifica e conferma l\'importazione.`);
        }
        
        this.state.updateAiUsage(currentModel);

        const ctx = this.getImportContext();
        const existing = this.findExistingSupplier(ctx);
        this.syncLinkedSupplier(existing);

        if (existing) {
          this.toast.info('Fornitore riconosciuto', `"${existing.ragioneSociale}" già in anagrafica. Clicca "Conferma Dati Importazione" per aggiungere i prodotti.`);
        } else if (ctx.supplierName) {
          this.showNewSupplierModal.set(true);
        }
      } catch (parseError: any) {
        console.error('JSON Parse Error:', parseError.message, text);
        this.aiRawResponse.set(text);
        throw new Error('L\'AI ha risposto con un formato non valido.');
      }
    } catch (e: any) {
      console.error('AI OCR error:', e);
      this.toast.error('Errore AI', e.message || 'Impossibile analizzare il DDT. Compila manualmente.');
    }
    
    this.isAnalyzing.set(false);
  }

  repairJson(str: string): string {
    str = str.trim();
    str = str.replace(/,\s*$/, '');
    
    const stack: string[] = [];
    let insideString = false;
    let escape = false;
    
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') {
        insideString = !insideString;
        continue;
      }
      if (insideString) continue;
      
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }
    
    while (stack.length > 0) {
      const last = stack.pop();
      if (last === '{') str += '}';
      if (last === '[') str += ']';
    }
    
    return str;
  }

  formatDateToISO(dateStr: string): string {
    if (!dateStr) return '';
    dateStr = dateStr.trim();
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }
    
    const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2}|\d{4})$/);
    if (dmyMatch) {
      const day = dmyMatch[1].padStart(2, '0');
      const month = dmyMatch[2].padStart(2, '0');
      const year = dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3];
      return `${year}-${month}-${day}`;
    }

    const dmMatch = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})$/);
    if (dmMatch) {
      const day = dmMatch[1].padStart(2, '0');
      const month = dmMatch[2].padStart(2, '0');
      const year = new Date().getFullYear().toString();
      return `${year}-${month}-${day}`;
    }

    const ymdMatch = dateStr.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
    if (ymdMatch) {
      const year = ymdMatch[1];
      const month = ymdMatch[2].padStart(2, '0');
      const day = ymdMatch[3].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    const months: Record<string, string> = {
      'gennaio': '01', 'febbraio': '02', 'marzo': '03', 'aprile': '04', 'maggio': '05', 'giugno': '06',
      'luglio': '07', 'agosto': '08', 'settembre': '09', 'ottobre': '10', 'novembre': '11', 'dicembre': '12',
      'gen': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'mag': '05', 'giu': '06',
      'lug': '07', 'ago': '08', 'set': '09', 'ott': '10', 'nov': '11', 'dic': '12'
    };
    
    const textMatch = dateStr.match(/^(\d{1,2})\s+([a-zA-Z\x7f-\xff]+)\s+(\d{2}|\d{4})$/i);
    if (textMatch) {
      const day = textMatch[1].padStart(2, '0');
      const monthName = textMatch[2].toLowerCase();
      const year = textMatch[3].length === 2 ? `20${textMatch[3]}` : textMatch[3];
      const month = months[monthName];
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }

    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : '';
  }

  formatDisplayDate(dateStr: any): string {
    if (!dateStr) return '—';
    const trimmed = String(dateStr).trim();
    if (!trimmed) return '—';
    const iso = this.formatDateToISO(trimmed);
    if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y}`;
    }
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return trimmed;
  }

  private registerNewSupplierInAnagrafica(supplierName: string, supplierPiva: string): string {
    const suppliers = this.getSuppliersList();
    const existing = findMatchingSupplier(suppliers, supplierName, supplierPiva);
    if (existing) return existing.id;

    const newSupplier: SupplierRecord = {
      id: Date.now().toString(),
      ragioneSociale: supplierName,
      responsabile: '',
      piva: supplierPiva || '',
      telefono: '',
      email: '',
      indirizzo: '',
      status: 'pending',
      note: ''
    };

    this.state.saveGlobalRecord('suppliers', [...suppliers, newSupplier]);
    this.toast.success('Fornitore registrato', `${supplierName} aggiunto all'anagrafica.`);
    return newSupplier.id;
  }

  async saveMultipleEntries() {
    if (!this.showForm()) return;
    const clientId = this.state.activeTargetClientId() || this.state.currentUser()?.clientId || 'demo';
    const items = this.collectImportItems();
    const ctx = this.getImportContext();

    if (items.length === 0) {
      console.warn('[DDT Import] Nessun prodotto trovato', {
        formItems: this.form().items,
        draftItems: this.importDraft()?.items,
        rawPayload: this.rawAiPayload()
      });
      this.toast.error('Dati incompleti', 'Nessun prodotto rilevato nel DDT. Rianalizza il documento o inserisci i prodotti manualmente.');
      return;
    }

    if (!ctx.entryDate) {
      this.toast.error('Dati incompleti', 'Manca la data documento.');
      return;
    }

    const existingSupplier = this.linkedSupplier() || this.findExistingSupplier(ctx);
    let supplierId = existingSupplier?.id;
    let supplierName = existingSupplier?.ragioneSociale || ctx.supplierName;

    if (!existingSupplier && this.registerNewSupplier() && ctx.supplierName) {
      supplierId = this.registerNewSupplierInAnagrafica(ctx.supplierName, ctx.supplierPiva);
    }

    await this.persistImport(
      clientId,
      supplierId,
      supplierName || 'Fornitore DDT',
      ctx.entryDate,
      items
    );
  }

  confirmDelete(item: IncomingIngredient) {
    this.itemToDelete.set(item);
  }

  async executeDelete() {
    const item = this.itemToDelete();
    if (!item) return;

    const currentPantry = ((await this.state.getGlobalRecordData('ddt_pantry')) || []) as IncomingIngredient[];
    const updated = currentPantry.filter(i => i.id !== item.id);
    this.state.saveGlobalRecord('ddt_pantry', updated);
    this.pantry.set(updated);
    
    this.toast.success('Prodotto eliminato', `${item.ingredientName} rimosso dalla dispensa.`);
    this.itemToDelete.set(null);
  }

  async deleteEntry(id: string) {
    // Legacy support or internal use
    const currentPantry = ((await this.state.getGlobalRecordData('ddt_pantry')) || []) as IncomingIngredient[];
    const updated = currentPantry.filter(i => i.id !== id);
    this.state.saveGlobalRecord('ddt_pantry', updated);
    this.pantry.set(updated);
  }

  async loadPantry() {
    // OPTIMIZATION: getGlobalRecordData() fetches the payload on-demand if not yet in cache.
    const savedData = await this.state.getGlobalRecordData('ddt_pantry');
    if (savedData && Array.isArray(savedData)) {
      // 1. Elimina definitivamente dal database i prodotti scaduti E quelli senza data > 10 giorni
      const validData = savedData.filter(i => {
        if (this.isExpired(i.expiryDate)) return false;
        const exp = (i.expiryDate || '').trim();
        const hasNoExpiry = !exp || exp.toUpperCase() === 'N/A';
        if (hasNoExpiry && this.getDaysSinceEntry(i) > 10) return false;
        return true;
      });
      if (validData.length < savedData.length) {
        const purgedCount = savedData.length - validData.length;
        this.state.saveGlobalRecord('ddt_pantry', validData);
        this.toast.info('Dispensa Aggiornata', `${purgedCount} prodotti (scaduti o senza data >10gg) eliminati definitivamente.`);
      }
      this.pantry.set(validData);

      // 2. Controllo prodotti senza scadenza dopo 10 giorni
      this.checkStaleNoExpiryProducts(validData);
    } else {
      this.pantry.set([]);
    }
  }

  getDaysSinceEntry(item: IncomingIngredient): number {
    const dateStr = item.entryDate || item.createdAt;
    if (!dateStr) return 0;
    const iso = this.formatDateToISO(dateStr);
    if (iso) {
      const [y, m, d] = iso.split('-').map(Number);
      const entryDate = new Date(y, m - 1, d);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return Math.max(0, Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24)));
    }
    const entryTime = new Date(dateStr).getTime();
    if (isNaN(entryTime)) return 0;
    return Math.max(0, Math.floor((Date.now() - entryTime) / (1000 * 60 * 60 * 24)));
  }

  checkStaleNoExpiryProducts(items: IncomingIngredient[]) {
    if (this.staleModalDismissed()) return;
    const clientId = this.state.activeTargetClientId();
    const clientItems = items.filter(i => !clientId || !i.clientId || i.clientId === clientId);
    const stale = clientItems.filter(i => {
      const exp = (i.expiryDate || '').trim();
      const hasNoExpiry = !exp || exp.toUpperCase() === 'N/A';
      return hasNoExpiry && this.getDaysSinceEntry(i) >= 10;
    });
    if (stale.length > 0) {
      this.staleItems.set(stale);
      this.selectedStaleIds.set(stale.map(s => s.id));
      this.showStaleModal.set(true);
    }
  }

  toggleStaleItem(id: string) {
    this.selectedStaleIds.update(ids => {
      if (ids.includes(id)) {
        return ids.filter(i => i !== id);
      } else {
        return [...ids, id];
      }
    });
  }

  toggleAllStale(select: boolean) {
    if (select) {
      this.selectedStaleIds.set(this.staleItems().map(s => s.id));
    } else {
      this.selectedStaleIds.set([]);
    }
  }

  isStaleSelected(id: string): boolean {
    return this.selectedStaleIds().includes(id);
  }

  confirmDeleteStale() {
    const toDeleteIds = new Set(this.selectedStaleIds());
    if (toDeleteIds.size === 0) {
      this.closeStaleModal();
      return;
    }
    const current = this.pantry();
    const updated = current.filter(i => !toDeleteIds.has(i.id));
    this.state.saveGlobalRecord('ddt_pantry', updated);
    this.pantry.set(updated);
    this.toast.success('Eliminazione completata', `${toDeleteIds.size} prodotti senza scadenza rimossi dalla dispensa.`);
    this.closeStaleModal();
  }

  closeStaleModal() {
    this.showStaleModal.set(false);
    this.staleModalDismissed.set(true);
    this.editingExpiryId.set(null);
  }

  openStaleModalManually() {
    const clientId = this.state.activeTargetClientId();
    const clientItems = this.pantry().filter(i => !clientId || !i.clientId || i.clientId === clientId);
    const stale = clientItems.filter(i => {
      const exp = (i.expiryDate || '').trim();
      const hasNoExpiry = !exp || exp.toUpperCase() === 'N/A';
      return hasNoExpiry && this.getDaysSinceEntry(i) >= 10;
    });
    this.staleItems.set(stale);
    this.selectedStaleIds.set(stale.map(s => s.id));
    this.staleModalDismissed.set(false);
    this.showStaleModal.set(true);
  }

  async saveItemExpiry(id: string, newExpiryDate: string) {
    if (!newExpiryDate) {
      this.editingExpiryId.set(null);
      return;
    }
    const isoDate = this.formatDateToISO(newExpiryDate);
    if (!isoDate) {
      this.toast.error('Data non valida', 'Inserisci una data di scadenza valida.');
      return;
    }

    const currentPantry = this.pantry();
    const updated = currentPantry.map(i => {
      if (i.id === id) {
        return { ...i, expiryDate: isoDate };
      }
      return i;
    });

    this.pantry.set(updated);
    await this.state.saveGlobalRecord('ddt_pantry', updated);
    this.editingExpiryId.set(null);

    // If item was in stale list, remove it because it now has an expiry date
    this.staleItems.update(items => items.filter(i => i.id !== id));
    this.selectedStaleIds.update(ids => ids.filter(i => i !== id));
    if (this.staleItems().length === 0) {
      this.showStaleModal.set(false);
    }

    const updatedItem = updated.find(i => i.id === id);
    this.toast.success(
      'Scadenza Salvata',
      `${updatedItem?.ingredientName || 'Prodotto'}: scadenza impostata al ${this.formatDisplayDate(isoDate)}.`
    );
  }

  isExpired(expiryDate: string): boolean {
    if (!expiryDate) return false;
    const trimmed = expiryDate.trim();
    if (!trimmed || trimmed.toUpperCase() === 'N/A') return false;
    const iso = this.formatDateToISO(trimmed);
    if (iso) {
      const d = new Date();
      const todayIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return iso < todayIso;
    }
    const exp = new Date(trimmed);
    if (isNaN(exp.getTime())) return false;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return exp < now;
  }

  daysToExpiry(expiryDate: string): number {
    if (!expiryDate) return 999;
    const trimmed = expiryDate.trim();
    if (!trimmed || trimmed.toUpperCase() === 'N/A') return 999;
    const iso = this.formatDateToISO(trimmed);
    if (iso) {
      const [y, m, d] = iso.split('-').map(Number);
      const expDate = new Date(y, m - 1, d);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    }
    const diff = new Date(trimmed).getTime() - new Date().getTime();
    if (isNaN(diff)) return 999;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  findAbbattimentoRecord(item: IncomingIngredient): any | null {
    const raw = this.state.getGlobalRecord('abbattimento_log') as any[] || [];
    return raw.find(r =>
      r.productName?.toLowerCase() === item.ingredientName?.toLowerCase() &&
      (
        (item.lotto && r.originalLotto === item.lotto) ||
        (item.supplierName && r.supplierName === item.supplierName)
      ) &&
      !!r.postExpiryDate
    ) || null;
  }
}
