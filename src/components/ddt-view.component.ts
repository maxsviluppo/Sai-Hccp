import { Component, inject, signal, computed, effect, untracked, ViewChild, ElementRef, AfterViewChecked, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';
import { DDT_AI_PROMPT, DDT_AI_SCHEMA, DdtFormItem, findMatchingSupplier, normalizeParsedDdt, NormalizedDdtParse, SupplierRecord } from '../utils/supplier-match';
import {
  ddtDocumentStorageKey,
  deleteDdtDocumentBlob,
  getDdtDocumentBlob,
  getDdtDocumentObjectUrl,
  saveDdtDocumentBlob
} from '../utils/ddt-document-store';

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
  loadGroupId?: string;
}

/** DDT/fattura acquisita (foto o PDF) collegata a uno o più prodotti in dispensa */
export interface AcquiredDdtDocument {
  id: string;
  clientId: string;
  supplierId?: string;
  supplierName: string;
  entryDate: string;
  imageUrl: string;
  isPdf: boolean;
  productIds: string[];
  acquiredAt: string;
  /** Chiave IndexedDB per il file a risoluzione piena (non inviato compresso al cloud) */
  localBlobKey?: string;
}

const ACQUIRED_DOCS_RECORD = 'ddt_acquired_docs';
const ACQUIRED_DOC_RETENTION_DAYS = 90;

@Component({
  selector: 'app-ddt-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4 pb-16 animate-fade-in max-md:px-0.5">

      @if (!showForm()) {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 space-y-5">
          <div class="flex items-start gap-3">
            <button type="button"
                    (click)="goQuickHome()"
                    class="ddt-touch md:hidden h-14 w-14 shrink-0 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md border-2 border-indigo-700 active:scale-95"
                    style="touch-action: manipulation"
                    aria-label="Torna al menu">
              <i class="fa-solid fa-house-chimney text-2xl"></i>
            </button>
            <div class="flex-1 min-w-0 pt-0.5">
              <h2 class="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Carico Merci
              </h2>
              <p class="text-xs text-slate-500 font-medium mt-1">
                Data operativa <span class="font-bold text-slate-700">{{ formatDisplayDate(state.filterDate()) }}</span>
              </p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <button type="button" (click)="startNewLoad()"
                    class="ddt-touch aspect-square w-full rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-lg border-2 border-amber-700 active:scale-95 flex flex-col items-center justify-center gap-2 p-3"
                    style="touch-action: manipulation">
              <i class="fa-solid fa-plus text-4xl leading-none"></i>
              <span class="text-[11px] font-black uppercase tracking-wide text-center leading-tight px-1">Nuovo carico</span>
            </button>
            <button type="button" (click)="toggleDocumentsSection()"
                    class="ddt-touch aspect-square w-full rounded-2xl shadow-lg border-2 active:scale-95 flex flex-col items-center justify-center gap-2 p-3 transition-all"
                    [class]="mainSectionTab() === 'documents'
                      ? 'bg-violet-600 border-violet-700 text-white ring-2 ring-violet-300 ring-offset-2'
                      : 'bg-violet-50 border-violet-300 text-violet-800 hover:bg-violet-100'"
                    style="touch-action: manipulation">
              <i class="fa-solid fa-file-invoice text-4xl leading-none"
                 [class.text-white]="mainSectionTab() === 'documents'"
                 [class.text-violet-600]="mainSectionTab() !== 'documents'"></i>
              <span class="text-[11px] font-black uppercase tracking-wide text-center leading-tight px-1">Documenti</span>
              <span class="text-xs font-bold opacity-90">({{ clientAcquiredDocs().length }})</span>
            </button>
          </div>
          @if (mainSectionTab() === 'pantry') {
            <p class="text-xs text-slate-500 font-medium text-center leading-snug px-2">
              Nuovo carico: scatta o carica il DDT. Filtri ed elenco sotto.
            </p>
          } @else {
            <button type="button" (click)="mainSectionTab.set('pantry')"
                    class="ddt-touch w-full py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2">
              <i class="fa-solid fa-boxes-stacked"></i>
              Torna all'elenco prodotti
            </button>
          }

          <div class="rounded-xl border border-slate-200 bg-slate-50/90 p-3 space-y-3"
               [class.hidden]="mainSectionTab() === 'documents'">
            <div class="grid grid-cols-3 gap-2">
              <button type="button" (click)="viewMode.set('daily')"
                      class="ddt-touch py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all border"
                      [class]="viewMode() === 'daily' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200'">
                Oggi
                <span class="block text-[10px] font-bold opacity-80 normal-case tracking-normal">({{ dailyCount() }})</span>
              </button>
              <button type="button" (click)="viewMode.set('activePantry')"
                      class="ddt-touch py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all border"
                      [class]="viewMode() === 'activePantry' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200'">
                Attivi
                <span class="block text-[10px] font-bold opacity-80 normal-case tracking-normal">({{ activeCount() }})</span>
              </button>
              <button type="button" (click)="viewMode.set('all')"
                      class="ddt-touch py-2.5 px-2 rounded-xl text-[11px] font-black uppercase tracking-wide transition-all border"
                      [class]="viewMode() === 'all' ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-600 border-slate-200'">
                Tutti
                <span class="block text-[10px] font-bold opacity-80 normal-case tracking-normal">({{ totalCount() }})</span>
              </button>
            </div>
            <div class="relative">
              <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
              <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"
                     placeholder="Cerca prodotto, fornitore, lotto…"
                     class="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50">
            </div>
          </div>
        </div>
      }

      @if (showForm()) {
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-4 md:px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <button type="button" (click)="cancelForm()"
                    class="ddt-touch shrink-0 h-14 w-14 rounded-xl border-2 border-slate-200 bg-white text-slate-700 active:scale-95 flex items-center justify-center shadow-sm hover:bg-slate-50"
                    aria-label="Annulla">
              <i class="fa-solid fa-arrow-left text-2xl"></i>
            </button>
            <h3 class="flex-1 min-w-0 font-black text-slate-800 text-base md:text-lg leading-tight">
              Acquisizione documento carico
            </h3>
          </div>

          <div class="p-4 md:p-6 space-y-6">

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

              @if (form().supplierName?.trim()) {
                @if (linkedSupplier()) {
                  <div class="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-start gap-2">
                    <i class="fa-solid fa-circle-check text-emerald-600 mt-0.5"></i>
                    <p class="text-[11px] text-emerald-900 font-bold leading-snug">
                      Fornitore già in anagrafica: <span class="font-black">{{ linkedSupplier()!.ragioneSociale }}</span>
                      — collegamento automatico all'importazione.
                    </p>
                  </div>
                } @else {
                  <div class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-start gap-2">
                    <i class="fa-solid fa-user-plus text-slate-500 mt-0.5"></i>
                    <p class="text-[11px] text-slate-700 font-bold leading-snug">
                      «{{ form().supplierName }}» verrà registrato in anagrafica automaticamente con l'importazione.
                    </p>
                  </div>
                }
              }

              <!-- Products List -->
              <div class="space-y-4">
                <h4 class="text-xs font-black uppercase tracking-widest text-amber-800 flex items-center gap-2">
                  <i class="fa-solid fa-boxes-stacked text-amber-600"></i>
                  Prodotti acquisiti
                </h4>
                @if (formItemsMissingLottoCount() > 0) {
                  <div class="p-3 rounded-xl bg-rose-50 border-2 border-rose-200 flex items-start gap-3">
                    <i class="fa-solid fa-barcode text-rose-600 mt-0.5"></i>
                    <p class="text-xs font-bold text-rose-800 leading-snug">
                      <span class="font-black">{{ formItemsMissingLottoCount() }}</span>
                      {{ formItemsMissingLottoCount() === 1 ? 'prodotto senza lotto' : 'prodotti senza lotto' }} —
                      completa il <span class="uppercase">numero lotto</span> (campi evidenziati in rosso) prima dell'importazione.
                    </p>
                  </div>
                }
                @if (formDuplicatePantryCount() > 0) {
                  <div class="p-3 rounded-xl bg-red-100 border-2 border-red-400 flex items-start gap-3">
                    <i class="fa-solid fa-clone text-red-700 mt-0.5"></i>
                    <p class="text-xs font-bold text-red-900 leading-snug">
                      <span class="font-black">{{ formDuplicatePantryCount() }}</span>
                      {{ formDuplicatePantryCount() === 1 ? 'prodotto risulta già presente' : 'prodotti risultano già presenti' }}
                      in dispensa (nome, lotto e scadenza uguali). Le schede sono evidenziate in rosso.
                    </p>
                  </div>
                }
                
                @for (item of form().items; track $index) {
                  @let pantryDup = findPantryDuplicateForFormItem(item);
                  <div class="rounded-2xl border-2 p-4 shadow-md ring-1 space-y-3 transition-all"
                       [class]="pantryDup
                         ? 'border-red-500 bg-gradient-to-br from-red-100 via-red-50 to-white ring-red-200/90'
                         : 'border-amber-300 bg-gradient-to-br from-amber-50/90 via-white to-white ring-amber-100/80'"
                       [class.ring-2]="isItemSelected($index) && !pantryDup"
                       [class.ring-violet-400]="isItemSelected($index) && !pantryDup"
                       [class.border-violet-300]="isItemSelected($index) && !pantryDup"
                       [class.ring-red-400]="!!pantryDup">
                    @if (pantryDup) {
                      <div class="flex items-start gap-2 rounded-xl bg-red-600 text-white px-3 py-2.5 shadow-sm">
                        <i class="fa-solid fa-circle-exclamation mt-0.5 shrink-0"></i>
                        <p class="text-[11px] font-bold leading-snug">
                          <span class="font-black uppercase tracking-wide">Già presente in dispensa</span>
                          — acquisito il <span class="font-black underline decoration-white/50">{{ formatPantryAcquisitionDate(pantryDup) }}</span>
                          (stesso nome, lotto e scadenza).
                        </p>
                      </div>
                    }
                    <div class="flex items-center justify-between gap-3 pb-2 border-b"
                         [class.border-red-200]="pantryDup"
                         [class.border-amber-200/80]="!pantryDup">
                      <span class="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"
                            [class.text-red-900]="pantryDup"
                            [class.text-amber-900]="!pantryDup">
                        <span class="h-7 w-7 rounded-lg text-white flex items-center justify-center text-xs"
                              [class.bg-red-600]="pantryDup"
                              [class.bg-amber-600]="!pantryDup">{{ $index + 1 }}</span>
                        Prodotto
                      </span>
                      <div class="flex items-center gap-2 shrink-0">
                        <label class="ddt-touch h-11 w-11 rounded-xl border-2 flex items-center justify-center cursor-pointer transition-all shadow-sm"
                               [class.border-violet-500]="isItemSelected($index)"
                               [class.bg-violet-50]="isItemSelected($index)"
                               [class.border-slate-200]="!isItemSelected($index)"
                               [class.bg-white]="!isItemSelected($index)"
                               title="Seleziona per import/eliminazione">
                          <input type="checkbox" class="sr-only"
                                 [checked]="isItemSelected($index)"
                                 (change)="toggleItemSelection($index)">
                          <i class="fa-solid fa-check text-lg text-violet-600 transition-opacity"
                             [class.opacity-100]="isItemSelected($index)"
                             [class.opacity-20]="!isItemSelected($index)"></i>
                        </label>
                        <button type="button" (click)="requestRemoveFormItem($index)"
                                class="ddt-touch h-11 w-11 shrink-0 rounded-xl bg-rose-50 border-2 border-rose-400 text-rose-600 flex items-center justify-center active:scale-95 shadow-sm hover:bg-rose-100"
                                title="Elimina prodotto">
                          <i class="fa-solid fa-trash-can text-lg"></i>
                        </button>
                      </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div class="md:col-span-4 space-y-1">
                      <label class="text-[9px] font-black uppercase text-slate-500">Nome</label>
                      <input type="text" [(ngModel)]="item.ingredientName" (ngModelChange)="bumpFormRevision()"
                         placeholder="es. Patate" class="w-full px-3 py-3 bg-white border-2 border-slate-200 rounded-xl text-base font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none">
                    </div>
                    <div class="md:col-span-3 space-y-1">
                      <div class="flex items-center justify-between gap-2">
                        <label class="text-[9px] font-black uppercase text-slate-500">Lotto</label>
                        @if (!item.lotto?.trim() && item.ingredientName?.trim()) {
                          <span class="text-[8px] font-black text-rose-700 bg-rose-50 border border-rose-300 px-1.5 py-0.5 rounded uppercase animate-pulse">
                            Da completare
                          </span>
                        }
                      </div>
                      <input type="text" [(ngModel)]="item.lotto" (ngModelChange)="bumpFormRevision()"
                         placeholder="Numero lotto"
                         class="w-full px-3 py-3 bg-white border-2 rounded-xl text-base font-mono font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none"
                         [class.border-rose-400]="!item.lotto?.trim() && item.ingredientName?.trim()"
                         [class.bg-rose-50/40]="!item.lotto?.trim() && item.ingredientName?.trim()"
                         [class.border-slate-200]="item.lotto?.trim() || !item.ingredientName?.trim()">
                    </div>
                    <div class="md:col-span-2 space-y-1">
                      <label class="text-[9px] font-black uppercase text-slate-500">Quantità</label>
                      <input type="text" [(ngModel)]="item.quantity" (ngModelChange)="bumpFormRevision()"
                         placeholder="es. 10 kg" class="w-full px-3 py-3 bg-white border-2 border-slate-200 rounded-xl text-base font-bold focus:border-amber-500 outline-none">
                    </div>
                    <div class="md:col-span-3 space-y-1">
                      <div class="flex items-center justify-between">
                        <label class="text-[9px] font-black uppercase text-slate-500">Scadenza</label>
                        @if (!item.expiryDate) {
                          <span class="text-[8px] font-black text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded uppercase">
                            Da completare
                          </span>
                        }
                      </div>
                      <input type="date" [(ngModel)]="item.expiryDate" (ngModelChange)="bumpFormRevision()" 
                             class="w-full px-3 py-3 bg-white border-2 rounded-xl text-base font-bold focus:border-amber-500 outline-none text-slate-800"
                             [class]="!item.expiryDate ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200'">
                    </div>
                    </div>
                  </div>
                }

                <button type="button" (click)="addEmptyItem()"
                        class="ddt-touch w-full rounded-2xl border-2 border-dashed border-amber-400 bg-amber-50/80 hover:bg-amber-100/90 active:scale-[0.99] transition-all p-5 min-h-[5rem] flex flex-col items-center justify-center gap-2 text-center shadow-sm">
                  <span class="h-12 w-12 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-md">
                    <i class="fa-solid fa-plus text-2xl"></i>
                  </span>
                  <span class="text-sm font-black uppercase tracking-wide text-amber-900">Aggiungi prodotto manuale</span>
                  <span class="text-xs font-medium text-amber-800/80">Aggiungi altri prodotti al carico</span>
                </button>
              </div>
            </div>

            <div class="pt-4 border-t-2 border-slate-100 space-y-3 pb-2">
              <p class="text-[10px] font-bold text-slate-500 text-center leading-snug px-2">
                @if (selectedFormItemIndices().size === 0) {
                  Nessuna spunta: <span class="text-slate-700">Importa</span> ed <span class="text-slate-700">Elimina</span> agiscono su tutti i prodotti del carico.
                } @else {
                  <span class="text-violet-700 font-black">{{ selectedFormItemIndices().size }} selezionati</span> su {{ form().items.length }} — import ed elimina solo quelli spuntati.
                }
              </p>
              <div class="grid grid-cols-2 gap-3 max-md:gap-4 md:flex md:justify-end md:gap-3">
                <button type="button" (click)="requestBulkDeleteFormItems()" [disabled]="deleteActionCount() === 0"
                        class="ddt-touch ddt-form-action aspect-square max-md:aspect-square md:aspect-auto md:min-h-0 md:h-12 md:px-6 rounded-2xl border-2 border-rose-400 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40 font-black uppercase tracking-wide text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 active:scale-95 shadow-sm">
                  <i class="fa-solid fa-trash-can text-2xl md:text-base leading-none"></i>
                  <span class="text-xs md:text-sm leading-tight text-center">Elimina ({{ deleteActionCount() }})</span>
                </button>
                <button type="button" (click)="saveMultipleEntries()" [disabled]="!canImportForm()"
                        class="ddt-touch ddt-form-action aspect-square max-md:aspect-square md:aspect-auto md:min-h-0 md:h-12 md:px-6 rounded-2xl border-2 border-amber-700 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white font-black uppercase tracking-wide text-sm flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 active:scale-95 shadow-md">
                  <i class="fa-solid fa-circle-check text-2xl md:text-base leading-none"></i>
                  <span class="text-xs md:text-sm leading-tight text-center">Importa ({{ importActionCount() }})</span>
                </button>
              </div>
              <button type="button" (click)="cancelForm()"
                      class="ddt-touch w-full rounded-2xl border-2 border-slate-300 bg-white text-slate-700 font-black uppercase tracking-wide text-sm py-4 min-h-[3.25rem] flex items-center justify-center gap-2 active:scale-[0.99] shadow-sm hover:bg-slate-50">
                <i class="fa-solid fa-arrow-left text-lg"></i>
                Annulla acquisizione
              </button>
            </div>
          </div>
        </div>
      }

      @if (formDeleteConfirm()) {
        <div class="haccp-modal-overlay z-[140]">
          <div class="haccp-modal-backdrop bg-slate-900/60 backdrop-blur-sm" (click)="closeFormDeleteConfirm()"></div>
          <div class="haccp-modal-center">
            <div class="haccp-modal-panel bg-white rounded-3xl shadow-2xl overflow-hidden border border-rose-100">
              <div class="px-6 py-5 bg-gradient-to-r from-rose-600 to-red-600 text-white">
                <div class="flex items-center gap-3">
                  <div class="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <i class="fa-solid fa-trash-can text-xl"></i>
                  </div>
                  <div>
                    <h3 class="text-lg font-black leading-tight">Conferma eliminazione</h3>
                    <p class="text-rose-100 text-[10px] font-bold uppercase tracking-widest mt-0.5">Anteprima carico</p>
                  </div>
                </div>
              </div>
              <div class="p-6 space-y-4">
                <p class="text-sm font-bold text-slate-700 leading-relaxed">
                  @if (formDeleteConfirm()!.indices.length === 1) {
                    Rimuovere questo prodotto dall'anteprima del carico?
                  } @else {
                    Rimuovere <strong>{{ formDeleteConfirm()!.indices.length }}</strong> prodotti dall'anteprima del carico?
                  }
                </p>
                <p class="text-[11px] text-slate-500 font-medium">L'operazione non importa in dispensa: elimina solo le righe dal modulo corrente.</p>
                <div class="flex flex-col gap-2 pt-1">
                  <button type="button" (click)="executeFormItemDelete()"
                          class="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-md">
                    Sì, elimina
                  </button>
                  <button type="button" (click)="closeFormDeleteConfirm()"
                          class="w-full py-3.5 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">
                    No, torna indietro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      
      <!-- Removed old blocking new supplier confirmation modal -->
      
      @if (showForm() && aiRawResponse()) {
        <div class="bg-rose-50 border border-rose-100 rounded-2xl p-6 mb-2 animate-fade-in">
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

      @if (!showForm() && mainSectionTab() === 'documents') {
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50/80">
            <h3 class="font-black text-slate-800 flex items-center gap-2">
              <i class="fa-solid fa-folder-open text-violet-600"></i>
              Archivio foto DDT / fatture
            </h3>
            <p class="text-[11px] text-slate-500 font-medium mt-1">
              Ogni documento raggruppa i prodotti importati dallo stesso carico. Conservazione automatica {{ docRetentionDays }} giorni.
            </p>
          </div>

          @if (clientAcquiredDocs().length === 0) {
            <div class="p-14 text-center">
              <i class="fa-solid fa-camera text-4xl text-slate-200 mb-3 block"></i>
              <p class="text-sm font-bold text-slate-500">Nessun documento acquisito</p>
              <p class="text-xs text-slate-400 mt-1">Carica una foto o PDF durante « Nuovo Carico » per archiviarlo qui.</p>
            </div>
          } @else {
            <div class="divide-y divide-slate-100">
              @for (doc of clientAcquiredDocs(); track doc.id) {
                @let expanded = expandedDocId() === doc.id;
                @let products = getProductsForDocument(doc);
                @let daysLeft = daysUntilDocExpiry(doc);
                <div [id]="'acq-doc-' + doc.id"
                     class="transition-all"
                     [class]="highlightDocId() === doc.id ? 'bg-violet-50/80 ring-2 ring-inset ring-violet-300' : ''">
                  <div class="w-full px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div class="flex items-center gap-4 flex-1 min-w-0 cursor-pointer hover:opacity-90"
                         (click)="toggleDocumentExpand(doc.id)">
                      <div class="w-16 h-16 rounded-xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                        @if (doc.isPdf) {
                          <i class="fa-solid fa-file-pdf text-3xl text-rose-500"></i>
                        } @else {
                          <img [src]="doc.imageUrl" alt="" class="w-full h-full object-cover">
                        }
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-black text-slate-800 truncate">{{ doc.supplierName || 'Fornitore n/d' }}</p>
                        <p class="text-[11px] font-bold text-slate-500 mt-0.5">
                          Doc. {{ formatDisplayDate(doc.entryDate) }} · {{ products.length }} prodotti
                        </p>
                        @if (doc.localBlobKey) {
                          <span class="inline-flex items-center gap-1 text-emerald-600 font-black uppercase text-[9px] tracking-wider mt-1">
                            <i class="fa-solid fa-circle-check"></i> HD locale
                          </span>
                        }
                        <p class="text-[10px] font-bold mt-1"
                           [class]="daysLeft <= 14 ? 'text-amber-600' : 'text-slate-400'">
                          @if (daysLeft > 0) {
                            Archivio: eliminazione tra {{ daysLeft }} giorni
                          } @else {
                            In scadenza eliminazione archivio
                          }
                        </p>
                      </div>
                      <i class="fa-solid fa-chevron-down text-slate-400 transition-transform shrink-0 hidden sm:block" [class.rotate-180]="expanded"></i>
                    </div>

                    <div class="flex flex-wrap items-center gap-2 shrink-0 w-full sm:w-auto">
                      <button type="button" (click)="openDocumentPreview(doc)"
                              class="flex-1 sm:flex-none px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-violet-600 hover:bg-violet-700 text-white shadow-md flex items-center justify-center gap-2">
                        <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
                        Anteprima
                      </button>
                      <button type="button" (click)="downloadAcquiredDocument(doc)"
                              class="flex-1 sm:flex-none px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-2">
                        <i class="fa-solid fa-download"></i>
                        Scarica
                      </button>
                      <button type="button" (click)="confirmDeleteDocument(doc)"
                              class="px-3 py-3 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center"
                              title="Elimina documento">
                        <i class="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>

                  @if (expanded) {
                    <div class="px-4 sm:px-6 pb-4 animate-fade-in">
                      <div class="rounded-xl border border-slate-200 bg-slate-50/80 overflow-hidden">
                        <div class="px-4 py-2 border-b border-slate-200 bg-white flex justify-between items-center">
                          <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Prodotti del carico</span>
                          <div class="flex items-center gap-3">
                            <button type="button" (click)="openDocumentPreview(doc)"
                                    class="text-[10px] font-black uppercase tracking-wider text-violet-600 hover:text-violet-800">
                              Anteprima
                            </button>
                            <button type="button" (click)="downloadAcquiredDocument(doc)"
                                    class="text-[10px] font-black uppercase tracking-wider text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                              <i class="fa-solid fa-download text-[9px]"></i> Scarica
                            </button>
                          </div>
                        </div>
                        <ul class="divide-y divide-slate-100">
                          @for (p of products; track p.id) {
                            <li class="px-4 py-3 flex items-center justify-between gap-3 bg-white">
                              <div class="min-w-0">
                                <p class="text-sm font-bold text-slate-800 truncate">{{ p.ingredientName }}</p>
                                <p class="text-[10px] text-slate-500 font-medium">
                                  Lotto <span class="font-mono">{{ p.lotto || '—' }}</span>
                                  @if (p.quantity) { · {{ p.quantity }} }
                                </p>
                              </div>
                              @if (p.expiryDate) {
                                <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">
                                  Scad. {{ formatDisplayDate(p.expiryDate) }}
                                </span>
                              }
                            </li>
                          } @empty {
                            <li class="px-4 py-6 text-center text-xs text-slate-400 font-medium">
                              Nessun prodotto collegato (potrebbero essere stati rimossi dalla dispensa).
                            </li>
                          }
                        </ul>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }

      @if (!showForm() && mainSectionTab() === 'pantry') {
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="px-4 md:px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-3">
          <p class="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {{ filteredPantry().length }} prodotti
            @if (viewMode() === 'daily') { · carichi di oggi }
            @if (viewMode() === 'activePantry') { · solo validi }
          </p>

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
                    <td class="px-4 py-3">
                      @if (editingLottoId() === item.id) {
                        <div class="flex items-center gap-1 animate-fade-in min-w-[10rem]">
                          <input type="text" #tableLottoInput [value]="item.lotto || ''"
                                 placeholder="N. lotto"
                                 class="flex-1 text-xs font-mono font-bold px-2 py-1.5 bg-white border-2 border-indigo-400 rounded-lg text-slate-800 outline-none shadow-sm">
                          <button type="button" (click)="saveItemLotto(item.id, tableLottoInput.value)"
                                  class="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm shrink-0">
                            Salva
                          </button>
                          <button type="button" (click)="editingLottoId.set(null)"
                                  class="text-slate-400 hover:text-slate-600 px-1 text-xs font-bold">
                            <i class="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      } @else {
                        <div class="flex flex-col items-start gap-1">
                          @if (item.lotto?.trim()) {
                            <span class="font-mono text-xs text-slate-600 font-bold">{{ item.lotto }}</span>
                          } @else {
                            <span class="text-[9px] font-black text-rose-600 uppercase bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">Lotto mancante</span>
                            <button type="button" (click)="startEditLotto(item.id)"
                                    class="group inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold transition-all">
                              <i class="fa-solid fa-pen text-[9px]"></i>
                              + Inserisci lotto
                            </button>
                          }
                        </div>
                      }
                    </td>
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
                              <button type="button" (click)="editingExpiryId.set(item.id); editingLottoId.set(null)"
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
                      <div class="flex items-center justify-end gap-1">
                        @if (hasLinkedDocument(item)) {
                          <button type="button" (click)="navigateToDocumentFromProduct(item)"
                                  class="w-8 h-8 flex items-center justify-center text-violet-500 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-all"
                                  title="Vai al documento acquisito">
                            <i class="fa-solid fa-file-invoice text-xs"></i>
                          </button>
                        }
                        <button (click)="confirmDelete(item)" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Mobile Cards -->
          <div class="md:hidden p-3 space-y-4 bg-slate-50/80">
            @for (item of filteredPantry(); track item.id) {
              @let expired = isExpired(item.expiryDate);
              @let abbItem = findAbbattimentoRecord(item);
              <div class="rounded-2xl border-2 border-slate-200 bg-white p-4 space-y-4 shadow-sm">
                <div class="flex justify-between items-start gap-3">
                  <div class="flex items-start gap-3 min-w-0 flex-1">
                    <div class="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-slate-100 text-lg"
                         [class]="expired ? 'bg-red-50 text-red-500' : abbItem ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'">
                      <i [class]="'fa-solid ' + (abbItem ? 'fa-icicles' : 'fa-carrot')"></i>
                    </div>
                    <div class="min-w-0">
                      <h4 class="text-base font-black text-slate-900 leading-tight">{{ item.ingredientName }}</h4>
                      <p class="text-xs font-bold text-indigo-600 mt-0.5 truncate">{{ item.supplierName }}</p>
                      @if (item.quantity) {
                        <p class="text-xs font-semibold text-slate-500 mt-1">Quantità: {{ item.quantity }}</p>
                      }
                    </div>
                  </div>
                  <div class="flex gap-2 shrink-0">
                    @if (hasLinkedDocument(item)) {
                      <button type="button" (click)="navigateToDocumentFromProduct(item)"
                              class="ddt-touch h-12 w-12 flex items-center justify-center text-violet-600 bg-violet-50 border-2 border-violet-200 rounded-xl shadow-sm"
                              title="Documento carico">
                        <i class="fa-solid fa-file-invoice text-lg"></i>
                      </button>
                    }
                    <button type="button" (click)="confirmDelete(item)"
                            class="ddt-touch h-12 w-12 flex items-center justify-center text-rose-600 bg-rose-50 border-2 border-rose-200 rounded-xl shadow-sm">
                      <i class="fa-solid fa-trash-can text-lg"></i>
                    </button>
                  </div>
                </div>

                <!-- Lotto — blocco touch -->
                <div class="rounded-xl border-2 p-3 space-y-2"
                     [class]="item.lotto?.trim() ? 'bg-slate-50 border-slate-200' : 'bg-rose-50 border-rose-300'">
                  <p class="text-xs font-black uppercase tracking-wide"
                     [class]="item.lotto?.trim() ? 'text-slate-600' : 'text-rose-700'">
                    <i class="fa-solid fa-barcode mr-1"></i> Numero lotto
                  </p>
                  @if (editingLottoId() === item.id) {
                    <input type="text" #mLottoInput [value]="item.lotto || ''"
                           placeholder="Inserisci lotto"
                           inputmode="text"
                           class="ddt-touch w-full h-12 px-3 text-base font-mono font-bold bg-white border-2 border-indigo-400 rounded-xl text-slate-900 outline-none">
                    <div class="grid grid-cols-2 gap-2 pt-1">
                      <button type="button" (click)="saveItemLotto(item.id, mLottoInput.value)"
                              class="ddt-touch h-12 rounded-xl bg-indigo-600 text-white font-black text-sm uppercase tracking-wide shadow-md active:scale-95">
                        Salva lotto
                      </button>
                      <button type="button" (click)="editingLottoId.set(null)"
                              class="ddt-touch h-12 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-black text-sm uppercase tracking-wide active:scale-95">
                        Annulla
                      </button>
                    </div>
                  } @else {
                    <p class="text-lg font-mono font-black leading-tight break-all"
                       [class]="item.lotto?.trim() ? 'text-slate-800' : 'text-rose-600'">
                      {{ item.lotto?.trim() || 'Mancante — da completare' }}
                    </p>
                    @if (lottoNeedsManualEntry(item)) {
                      <button type="button" (click)="startEditLotto(item.id)"
                              class="ddt-touch w-full h-12 rounded-xl border-2 font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 active:scale-[0.99] shadow-sm bg-indigo-600 border-indigo-700 text-white">
                        <i class="fa-solid fa-pen text-base"></i>
                        Inserisci lotto
                      </button>
                    }
                  }
                </div>

                <!-- Scadenza — blocco touch -->
                <div class="rounded-xl border-2 p-3 space-y-2"
                     [class]="expired ? 'bg-red-50 border-red-200' : (item.expiryDate || abbItem) ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-300'">
                  <p class="text-xs font-black uppercase tracking-wide text-slate-600">
                    <i class="fa-solid fa-calendar-day mr-1"></i> Scadenza
                  </p>
                  @if (abbItem?.postExpiryDate || item.expiryDate) {
                    @if (editingExpiryId() === item.id && !abbItem) {
                      <input type="date" #mExpInput [value]="item.expiryDate || ''"
                             class="ddt-touch w-full h-12 px-3 text-base font-bold bg-white border-2 border-amber-400 rounded-xl text-slate-900 outline-none">
                      <div class="grid grid-cols-2 gap-2 pt-1">
                        <button type="button" (click)="saveItemExpiry(item.id, mExpInput.value)"
                                class="ddt-touch h-12 rounded-xl bg-amber-600 text-white font-black text-sm uppercase tracking-wide shadow-md active:scale-95">
                          Salva data
                        </button>
                        <button type="button" (click)="editingExpiryId.set(null)"
                                class="ddt-touch h-12 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-black text-sm uppercase tracking-wide active:scale-95">
                          Annulla
                        </button>
                      </div>
                    } @else {
                      <p class="text-lg font-black"
                         [class]="expired ? 'text-red-600' : daysToExpiry(item.expiryDate) <= 7 ? 'text-amber-700' : 'text-emerald-700'">
                        {{ formatDisplayDate(abbItem?.postExpiryDate || item.expiryDate) }}
                        @if (abbItem) { <i class="fa-solid fa-icicles text-sm ml-1"></i> }
                      </p>
                      @if (!abbItem) {
                        <button type="button" (click)="startEditExpiry(item.id)"
                                class="ddt-touch w-full h-12 rounded-xl bg-white border-2 border-amber-300 text-amber-800 font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 active:scale-[0.99]">
                          <i class="fa-solid fa-pen-to-square text-base"></i>
                          Modifica scadenza
                        </button>
                      }
                    }
                  } @else {
                    @if (editingExpiryId() === item.id) {
                      <input type="date" #mExpInputEmpty
                             class="ddt-touch w-full h-12 px-3 text-base font-bold bg-white border-2 border-amber-400 rounded-xl text-slate-900 outline-none">
                      <div class="grid grid-cols-2 gap-2 pt-1">
                        <button type="button" (click)="saveItemExpiry(item.id, mExpInputEmpty.value)"
                                class="ddt-touch h-12 rounded-xl bg-amber-600 text-white font-black text-sm uppercase tracking-wide shadow-md active:scale-95">
                          Salva data
                        </button>
                        <button type="button" (click)="editingExpiryId.set(null)"
                                class="ddt-touch h-12 rounded-xl bg-white border-2 border-slate-200 text-slate-600 font-black text-sm uppercase tracking-wide active:scale-95">
                          Annulla
                        </button>
                      </div>
                    } @else {
                      <p class="text-sm font-bold text-amber-800">Data scadenza non impostata</p>
                      <button type="button" (click)="startEditExpiry(item.id)"
                              class="ddt-touch w-full h-12 rounded-xl bg-amber-600 border-2 border-amber-700 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-md active:scale-[0.99]">
                        <i class="fa-solid fa-calendar-plus text-lg"></i>
                        Inserisci scadenza
                      </button>
                    }
                  }
                </div>

                <div class="flex flex-wrap justify-between items-center gap-2 pt-1 border-t border-slate-100">
                  <span class="text-xs font-bold text-slate-500">Caricato {{ formatDisplayDate(item.entryDate) }}</span>
                  @if (expired) {
                    <span class="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wide">Scaduto</span>
                  } @else if (abbItem) {
                    <span class="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-wide">Abbattuto</span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
      }

      <!-- Anteprima documento acquisito (fullscreen, ancorata al viewport) -->
      @if (viewingDoc()) {
        <div #docPreviewOverlay class="doc-preview-overlay fixed inset-0 z-[99999] flex flex-col bg-slate-950/95">
          <div class="shrink-0 px-4 py-3 sm:px-6 sm:py-4 bg-slate-900 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white shadow-lg">
            <div class="min-w-0">
              <h3 class="font-black text-base sm:text-lg truncate">{{ viewingDoc()?.supplierName }}</h3>
              <p class="text-xs text-slate-300 font-medium mt-0.5">
                Documento del {{ formatDisplayDate(viewingDoc()!.entryDate) }}
                @if (viewingDocDimensions(); as dim) {
                  · {{ dim.w }}×{{ dim.h }} px
                }
                · {{ viewingDoc()?.localBlobKey ? 'File originale (HD locale)' : 'Solo anteprima cloud (ricarica il DDT per HD)' }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              @if (!viewingDoc()!.isPdf) {
                <button type="button" (click)="toggleDocPreviewOriginalSize()"
                        class="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border border-white/20 hover:bg-white/10 transition-all">
                  {{ docPreviewOriginalSize() ? 'Adatta schermo' : 'Dimensione originale' }}
                </button>
              }
              <button type="button" (click)="downloadAcquiredDocument(viewingDoc()!)"
                      class="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-900 flex items-center gap-2 shadow-lg">
                <i class="fa-solid fa-download text-sm"></i>
                Scarica file
              </button>
              <button type="button" (click)="closeDocumentPreview()"
                      class="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 border border-white/20">
                Chiudi
              </button>
            </div>
          </div>
          <div class="flex-1 min-h-0 overflow-auto overscroll-contain p-2 sm:p-6 touch-pan-x touch-pan-y"
               (click)="closeDocumentPreview()">
            <div class="min-h-full min-w-full flex items-center justify-center p-1 sm:p-0" (click)="$event.stopPropagation()">
              @if (viewingDoc()!.isPdf) {
                <iframe [src]="viewingDocUrl() || viewingDoc()!.imageUrl"
                        class="w-full max-w-[1400px] h-[calc(100dvh-5.5rem)] min-h-[70dvh] sm:min-h-[80vh] rounded-lg border border-white/20 bg-white shadow-2xl"
                        title="Anteprima PDF"></iframe>
              } @else {
                <img [src]="viewingDocUrl() || viewingDoc()!.imageUrl"
                     [alt]="'DDT ' + viewingDoc()!.supplierName"
                     (load)="onPreviewImageLoad($event)"
                     [class]="docPreviewOriginalSize()
                       ? 'doc-preview-img block w-auto h-auto max-w-none max-h-none rounded-lg shadow-2xl ring-1 ring-white/20 select-none mx-auto'
                       : 'doc-preview-img doc-preview-img--fit block w-auto h-auto max-w-full object-contain rounded-lg shadow-2xl ring-1 ring-white/20 select-none mx-auto'"
                     style="image-rendering: -webkit-optimize-contrast;">
              }
            </div>
          </div>
        </div>
      }

      <!-- Delete document modal -->
      @if (docToDelete()) {
        <div class="fixed inset-0 z-[126] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="docToDelete.set(null)"></div>
          <div class="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 p-8 text-center">
            <div class="h-16 w-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-2xl mx-auto mb-4 border border-rose-100">
              <i class="fa-solid fa-file-circle-xmark"></i>
            </div>
            <h3 class="text-lg font-black text-slate-800 mb-2">Elimina documento acquisito?</h3>
            <p class="text-sm text-slate-500 leading-relaxed mb-6">
              Verrà rimossa la foto/PDF del carico del <strong>{{ formatDisplayDate(docToDelete()!.entryDate) }}</strong>
              ({{ docToDelete()!.supplierName }}). I prodotti in dispensa <strong>non</strong> verranno eliminati.
            </p>
            <div class="flex flex-col gap-2">
              <button (click)="executeDeleteDocument()" class="py-3 bg-rose-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-700">Elimina documento</button>
              <button (click)="docToDelete.set(null)" class="py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs uppercase tracking-widest">Annulla</button>
            </div>
          </div>
        </div>
      }

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
                      <div class="mt-3 w-full" (click)="$event.stopPropagation()">
                        @if (editingExpiryId() === item.id) {
                          <div class="space-y-2 animate-fade-in max-md:space-y-3">
                            <input type="date" #staleInput
                                   class="ddt-touch w-full h-12 px-3 text-base font-bold bg-white border-2 border-emerald-500 rounded-xl text-slate-800 outline-none shadow-sm">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button type="button" (click)="saveItemExpiry(item.id, staleInput.value)"
                                      class="ddt-touch h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-black uppercase tracking-wide shadow-md">
                                Salva e mantieni
                              </button>
                              <button type="button" (click)="editingExpiryId.set(null)"
                                      class="ddt-touch h-12 bg-white border-2 border-slate-200 text-slate-600 rounded-xl text-sm font-black uppercase tracking-wide">
                                Annulla
                              </button>
                            </div>
                          </div>
                        } @else {
                          <button type="button" (click)="startEditExpiry(item.id)"
                                  class="ddt-touch w-full h-12 font-black text-sm uppercase tracking-wide text-emerald-800 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]">
                            <i class="fa-solid fa-calendar-plus text-lg text-emerald-600"></i>
                            Inserisci scadenza
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
  styles: [`
    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    :host ::ng-deep .doc-preview-overlay,
    .doc-preview-overlay {
      position: fixed !important;
      inset: 0 !important;
      z-index: 99999 !important;
    }
    .ddt-touch { touch-action: manipulation; }
    .doc-preview-img--fit {
      max-height: min(100%, calc(100dvh - 5.5rem));
    }
    @media (max-width: 767px) {
      .doc-preview-img--fit {
        max-height: calc(100dvh - 6.5rem);
        max-width: 100%;
      }
      .ddt-form-action {
        min-height: 5.25rem;
      }
    }
  `]
})
export class DdtViewComponent implements OnInit, AfterViewChecked {
  state = inject(AppStateService);
  toast = inject(ToastService);

  ngOnInit() {
    this.state.scrollMainContentToTop();
  }

  goQuickHome() {
    this.state.setModule(this.state.isAdmin() ? 'dashboard' : 'operator-dashboard');
  }

  startNewLoad() {
    this.mainSectionTab.set('pantry');
    this.resetForm();
    this.showForm.set(true);
    this.state.scrollMainContentToTop();
  }

  toggleDocumentsSection() {
    if (this.mainSectionTab() === 'documents') {
      this.mainSectionTab.set('pantry');
    } else {
      this.mainSectionTab.set('documents');
    }
    this.state.scrollMainContentToTop();
  }

  @ViewChild('docPreviewOverlay') docPreviewOverlay?: ElementRef<HTMLElement>;

  readonly docRetentionDays = ACQUIRED_DOC_RETENTION_DAYS;

  showForm = signal(false);
  mainSectionTab = signal<'pantry' | 'documents'>('pantry');
  acquiredDocs = signal<AcquiredDdtDocument[]>([]);
  expandedDocId = signal<string | null>(null);
  highlightDocId = signal<string | null>(null);
  docToDelete = signal<AcquiredDdtDocument | null>(null);
  viewingDoc = signal<AcquiredDdtDocument | null>(null);
  /** URL effettivo in anteprima (blob locale full-res o fallback) */
  viewingDocUrl = signal<string | null>(null);
  viewingDocDimensions = signal<{ w: number; h: number } | null>(null);
  private viewingDocObjectUrl: string | null = null;
  /** false = adatta allo schermo (default); true = pixel originali */
  docPreviewOriginalSize = signal(false);
  isAnalyzing = signal(false);
  ddtPreview = signal<string | null>(null);
  /** Copia ad alta fedeltà del file caricato (archivio documenti / download) */
  ddtOriginalArchive = signal<string | null>(null);
  isPdfPreview = signal(false);
  pantry = signal<IncomingIngredient[]>([]);
  viewMode = signal<'all' | 'daily' | 'activePantry'>('daily');
  searchQuery = signal('');
  showNewSupplierModal = signal(false);
  aiRawResponse = signal<string | null>(null);
  itemToDelete = signal<IncomingIngredient | null>(null);
  showStaleModal = signal(false);
  staleItems = signal<IncomingIngredient[]>([]);
  selectedStaleIds = signal<string[]>([]);
  staleModalDismissed = signal(false);
  editingExpiryId = signal<string | null>(null);
  editingLottoId = signal<string | null>(null);
  formRevision = signal(0);
  linkedSupplier = signal<SupplierRecord | null>(null);
  importDraft = signal<NormalizedDdtParse | null>(null);
  rawAiPayload = signal<any | null>(null);
  registerNewSupplier = signal(true);
  selectedFormItemIndices = signal<Set<number>>(new Set());
  formDeleteConfirm = signal<{ indices: number[] } | null>(null);

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
    this.selectedFormItemIndices();
    return this.collectImportItems().length;
  });

  importActionCount = computed(() => this.validItemCount());

  deleteActionCount = computed(() => {
    this.formRevision();
    const sel = this.selectedFormItemIndices();
    if (sel.size > 0) return sel.size;
    return this.form().items.length;
  });

  formItemsMissingLottoCount = computed(() => {
    this.formRevision();
    return this.form().items.filter(i => i.ingredientName?.trim() && !i.lotto?.trim()).length;
  });

  clientPantry = computed(() => {
    const clientId = this.resolvePantryClientId();
    return this.pantry().filter(i => !clientId || !i.clientId || String(i.clientId) === String(clientId));
  });

  clientAcquiredDocs = computed(() => {
    const clientId = this.resolvePantryClientId();
    return this.acquiredDocs()
      .filter(d => !clientId || !d.clientId || String(d.clientId) === String(clientId))
      .sort((a, b) => (b.acquiredAt || '').localeCompare(a.acquiredAt || ''));
  });

  isItemInDailyLoad(item: IncomingIngredient, selectedDate: string): boolean {
    if (!selectedDate) return true;
    const targetIso = this.formatDateToISO(selectedDate) || selectedDate;

    // 1. Giorno operativo scelto in app al momento del carico (multi-carico stesso giorno)
    const operationalIso = this.formatDateToISO((item as any).operationalDate || '');
    if (operationalIso && operationalIso === targetIso) return true;

    // 2. Giorno reale di importazione (locale, non UTC)
    if (item.createdAt) {
      const createdLocalIso = this.localDateIsoFromInstant(item.createdAt);
      if (createdLocalIso === targetIso) return true;
    }

    // 3. Fallback: data documento DDT (solo se mancano i campi sopra)
    if (!(item as any).operationalDate && !item.createdAt) {
      const entryIso = this.formatDateToISO(item.entryDate);
      if (entryIso === targetIso || item.entryDate === targetIso) return true;
      if ((item as any).documentDate) {
        const docIso = this.formatDateToISO((item as any).documentDate);
        if (docIso === targetIso) return true;
      }
    }

    return false;
  }

  /** Data calendario locale (YYYY-MM-DD) da timestamp ISO — evita shift UTC su «Oggi». */
  localDateIsoFromInstant(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  resolvePantryClientId(): string | null {
    return (
      this.state.globalRecordClientId() ||
      this.state.tenantClientId() ||
      this.state.activeTargetClientId() ||
      this.state.currentUser()?.clientId ||
      null
    );
  }

  lottoNeedsManualEntry(item: IncomingIngredient): boolean {
    return !(item.lotto || '').trim();
  }

  private normalizeFormProductName(name: string): string {
    return (name || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');
  }

  private normalizeFormProductLotto(lotto: string): string {
    return (lotto || '').trim().toLowerCase();
  }

  private pantryDuplicateMatch(item: DdtFormItem): IncomingIngredient | null {
    const name = this.normalizeFormProductName(item.ingredientName);
    const lotto = this.normalizeFormProductLotto(item.lotto);
    const expiry = this.ensureIsoDate(item.expiryDate);
    if (!name || !lotto || !expiry) return null;

    for (const p of this.clientPantry()) {
      if (this.normalizeFormProductName(p.ingredientName) !== name) continue;
      if (this.normalizeFormProductLotto(p.lotto || '') !== lotto) continue;
      if (this.ensureIsoDate(p.expiryDate) !== expiry) continue;
      return p;
    }
    return null;
  }

  findPantryDuplicateForFormItem(item: DdtFormItem): IncomingIngredient | null {
    this.formRevision();
    this.pantry();
    return this.pantryDuplicateMatch(item);
  }

  formatPantryAcquisitionDate(existing: IncomingIngredient): string {
    if (existing.createdAt) {
      return this.formatDisplayDate(this.localDateIsoFromInstant(existing.createdAt));
    }
    const op = this.ensureIsoDate((existing as any).operationalDate || '');
    if (op) return this.formatDisplayDate(op);
    return this.formatDisplayDate(existing.entryDate);
  }

  formDuplicatePantryCount = computed(() => {
    this.formRevision();
    this.pantry();
    return this.form().items.filter(i => this.pantryDuplicateMatch(i)).length;
  });

  private mergePantryById(...lists: IncomingIngredient[][]): IncomingIngredient[] {
    const byId = new Map<string, IncomingIngredient>();
    for (const list of lists) {
      for (const item of list) {
        if (!item?.id) continue;
        const prev = byId.get(item.id);
        if (!prev || (item.createdAt || '') >= (prev.createdAt || '')) {
          byId.set(item.id, item);
        }
      }
    }
    return Array.from(byId.values());
  }

  private async readPantryBaseline(): Promise<IncomingIngredient[]> {
    const fromServer = ((await this.state.getGlobalRecordData('ddt_pantry')) || []) as IncomingIngredient[];
    const fromSync = (this.state.getGlobalRecord('ddt_pantry') as IncomingIngredient[] | null) || [];
    return this.mergePantryById(fromServer, fromSync, this.pantry());
  }

  private filterPantryForClient(items: IncomingIngredient[]): IncomingIngredient[] {
    const clientId = this.resolvePantryClientId();
    return items.filter(i => !clientId || !i.clientId || String(i.clientId) === String(clientId));
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

  ngAfterViewChecked() {
    this.mountPreviewOverlayOnBody();
  }

  private mountPreviewOverlayOnBody() {
    if (!this.viewingDoc() || !this.docPreviewOverlay?.nativeElement) return;
    const el = this.docPreviewOverlay.nativeElement;
    if (el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
  }

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
        void this.loadAcquiredDocuments();
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
    this.ddtOriginalArchive.set(null);
    this.selectedFormItemIndices.set(new Set());
    this.formDeleteConfirm.set(null);
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
    this.selectedFormItemIndices();
    const items = this.collectImportItems();
    const entryDate = this.getImportContext().entryDate;
    return items.length > 0 && !!entryDate;
  }

  isItemSelected(index: number): boolean {
    return this.selectedFormItemIndices().has(index);
  }

  toggleItemSelection(index: number) {
    this.selectedFormItemIndices.update(set => {
      const next = new Set(set);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  requestRemoveFormItem(index: number) {
    this.formDeleteConfirm.set({ indices: [index] });
  }

  requestBulkDeleteFormItems() {
    const sel = this.selectedFormItemIndices();
    const indices = sel.size > 0 ? [...sel] : this.form().items.map((_, i) => i);
    if (indices.length === 0) return;
    this.formDeleteConfirm.set({ indices });
  }

  closeFormDeleteConfirm() {
    this.formDeleteConfirm.set(null);
  }

  executeFormItemDelete() {
    const confirm = this.formDeleteConfirm();
    if (!confirm?.indices.length) return;
    this.removeItemsAtIndices(confirm.indices);
    this.formDeleteConfirm.set(null);
    this.toast.info('Righe rimosse', 'I prodotti sono stati eliminati dall\'anteprima del carico.');
  }

  private removeItemsAtIndices(indices: number[]) {
    const toRemove = new Set(indices);
    this.form.update(current => {
      let items = current.items.filter((_, i) => !toRemove.has(i));
      if (items.length === 0) {
        items = [{ ingredientName: '', lotto: '', quantity: '', expiryDate: '' }];
      }
      return { ...current, items };
    });
    this.selectedFormItemIndices.set(new Set());
    this.bumpFormRevision();
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
      'gemini-2.5-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.6-flash',
      'gemini-3.8-flash'
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
    const selection = this.selectedFormItemIndices();
    if (selection.size > 0) {
      const rows = [...selection].sort((a, b) => a - b).map(i => this.form().items[i]).filter(Boolean);
      return this.normalizeItemRows(rows);
    }

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
    const operationalDate =
      this.ensureIsoDate(this.state.filterDate()) ||
      this.ensureIsoDate(entryDate) ||
      this.localDateIsoFromInstant(new Date().toISOString());

    const currentPantry = await this.readPantryBaseline();

    const newEntries: IncomingIngredient[] = [];
    const loadGroupId = `load_${Date.now()}`;

    // Generate a lightweight thumbnail (< 8KB) for display in supplier load history.
    // Avoid saving large full-res images or PDFs on every item.
    let thumbnail: string | undefined = undefined;
    const rawPreview = this.ddtPreview();
    const thumbSource = this.ddtOriginalArchive() || rawPreview;
    if (thumbSource && !thumbSource.startsWith('data:application/pdf')) {
      try {
        thumbnail = await this.generateDdtThumbnail(thumbSource);
      } catch (e) {
        console.warn('Thumbnail generation failed:', e);
      }
    }

    const productIds: string[] = [];

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
        ddtImageUrl: i === 0 ? thumbnail : undefined,
        createdAt: new Date().toISOString(),
        loadGroupId
      };
      (entry as any).operationalDate = operationalDate;
      (entry as any).documentDate = this.ensureIsoDate(entryDate) || this.importDraft()?.entryDate || entryDate;
      (entry as any).supplierPiva = this.form().supplierPiva || this.importDraft()?.supplierPiva || '';
      productIds.push(entry.id);
      newEntries.push(entry);
      this.state.addBaseIngredient(entry.ingredientName);
    }

    if (rawPreview) {
      const archiveSource = this.ddtOriginalArchive() || rawPreview;
      const blobKey = ddtDocumentStorageKey(clientId, loadGroupId);
      try {
        await saveDdtDocumentBlob(blobKey, archiveSource);
      } catch (e) {
        console.error('[DDT-DOC] IndexedDB save failed:', e);
        this.toast.warning('Archivio locale', 'Impossibile salvare HD locale; verrà usata solo anteprima ridotta.');
      }
      const listThumb = archiveSource.startsWith('data:application/pdf')
        ? undefined
        : await this.generateDdtThumbnail(thumbSource, 220, 0.72);
      await this.registerAcquiredDocument({
        id: loadGroupId,
        clientId,
        supplierId,
        supplierName,
        entryDate,
        imageUrl: listThumb,
        localBlobKey: blobKey,
        isPdf: archiveSource.startsWith('data:application/pdf'),
        productIds,
        acquiredAt: new Date().toISOString()
      });
    }

    const updatedPantry = this.mergePantryById(newEntries, currentPantry);
    this.state.saveGlobalRecord('ddt_pantry', updatedPantry);
    this.pantry.set(this.filterPantryForClient(updatedPantry));
    this.mainSectionTab.set('pantry');
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

  cancelForm() {
    this.showForm.set(false);
    this.resetForm();
    this.state.scrollMainContentToTop();
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
        this.ddtOriginalArchive.set(fileUrl);
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
      this.ddtOriginalArchive.set(imgUrl);

      // Anteprima form / OCR: versione più leggera (l'archivio usa ddtOriginalArchive)
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
    const initialModel = config?.model || 'gemini-2.5-flash';

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
      'gemini-2.5-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.6-flash',
      'gemini-3.8-flash'
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
          this.registerNewSupplier.set(false);
        } else if (ctx.supplierName) {
          this.registerNewSupplier.set(true);
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
    const clientId = this.resolvePantryClientId();
    if (!clientId) {
      this.toast.error('Azienda non selezionata', 'Seleziona l\'azienda prima di importare il carico.');
      return;
    }
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

    if (!existingSupplier && ctx.supplierName) {
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
      const merged = this.mergePantryById(validData, this.pantry());
      const tenantPantry = this.filterPantryForClient(merged);
      this.pantry.set(tenantPantry);

      // 2. Controllo prodotti senza scadenza dopo 10 giorni
      this.checkStaleNoExpiryProducts(tenantPantry);
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
    this.editingLottoId.set(null);
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

  startEditLotto(id: string) {
    this.editingExpiryId.set(null);
    this.editingLottoId.set(id);
  }

  startEditExpiry(id: string) {
    this.editingLottoId.set(null);
    this.editingExpiryId.set(id);
  }

  async saveItemLotto(id: string, lotto: string) {
    const trimmed = lotto.trim();
    if (!trimmed) {
      this.toast.warning('Lotto mancante', 'Inserisci un numero di lotto valido.');
      return;
    }

    const currentPantry = this.pantry();
    const updated = currentPantry.map(i => (i.id === id ? { ...i, lotto: trimmed } : i));
    this.pantry.set(updated);
    await this.state.saveGlobalRecord('ddt_pantry', updated);
    this.editingLottoId.set(null);

    const updatedItem = updated.find(i => i.id === id);
    this.toast.success('Lotto salvato', `${updatedItem?.ingredientName || 'Prodotto'}: lotto ${trimmed}.`);
  }

  async saveItemExpiry(id: string, newExpiryDate: string) {
    this.editingLottoId.set(null);
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

  getDocumentIdForItem(item: IncomingIngredient): string | null {
    return item.loadGroupId || (item as any).loadGroupId || null;
  }

  hasLinkedDocument(item: IncomingIngredient): boolean {
    const docId = this.getDocumentIdForItem(item);
    if (!docId) return false;
    return this.acquiredDocs().some(d => d.id === docId);
  }

  getProductsForDocument(doc: AcquiredDdtDocument): IncomingIngredient[] {
    const ids = new Set(doc.productIds || []);
    const byGroup = this.clientPantry().filter(p => p.loadGroupId === doc.id || (p as any).loadGroupId === doc.id);
    const merged = new Map<string, IncomingIngredient>();
    for (const p of byGroup) merged.set(p.id, p);
    for (const id of ids) {
      const found = this.clientPantry().find(p => p.id === id);
      if (found) merged.set(found.id, found);
    }
    return Array.from(merged.values());
  }

  daysUntilDocExpiry(doc: AcquiredDdtDocument): number {
    const acquired = doc.acquiredAt ? new Date(doc.acquiredAt).getTime() : Date.now();
    if (isNaN(acquired)) return ACQUIRED_DOC_RETENTION_DAYS;
    const elapsed = Math.floor((Date.now() - acquired) / (1000 * 60 * 60 * 24));
    return Math.max(0, ACQUIRED_DOC_RETENTION_DAYS - elapsed);
  }

  toggleDocumentExpand(docId: string) {
    this.expandedDocId.update(cur => (cur === docId ? null : docId));
  }

  toggleDocPreviewOriginalSize() {
    this.docPreviewOriginalSize.update(v => !v);
  }

  onPreviewImageLoad(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if (img?.naturalWidth) {
      this.viewingDocDimensions.set({ w: img.naturalWidth, h: img.naturalHeight });
    }
  }

  private revokeViewingDocObjectUrl() {
    if (this.viewingDocObjectUrl) {
      URL.revokeObjectURL(this.viewingDocObjectUrl);
      this.viewingDocObjectUrl = null;
    }
  }

  async openDocumentPreview(doc: AcquiredDdtDocument) {
    this.revokeViewingDocObjectUrl();
    this.docPreviewOriginalSize.set(false);
    this.viewingDocDimensions.set(null);

    let url = doc.imageUrl || '';
    if (doc.localBlobKey) {
      const blobUrl = await getDdtDocumentObjectUrl(doc.localBlobKey);
      if (blobUrl) {
        this.viewingDocObjectUrl = blobUrl;
        url = blobUrl;
      }
    }

    if (!url) {
      this.toast.error('Documento mancante', 'Nessun file trovato. Importa di nuovo il carico con foto/PDF.');
      return;
    }

    this.viewingDocUrl.set(url);
    this.viewingDoc.set(doc);
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.mountPreviewOverlayOnBody(), 0);
  }

  closeDocumentPreview() {
    this.revokeViewingDocObjectUrl();
    this.viewingDoc.set(null);
    this.viewingDocUrl.set(null);
    this.viewingDocDimensions.set(null);
    this.docPreviewOriginalSize.set(false);
    document.body.style.overflow = '';
  }

  downloadAcquiredDocument(doc: AcquiredDdtDocument) {
    const ext = doc.isPdf ? 'pdf' : 'jpg';
    const safeSupplier = (doc.supplierName || 'fornitore')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 48) || 'fornitore';
    const datePart = (doc.entryDate || doc.acquiredAt?.substring(0, 10) || 'data').replace(/\//g, '-');
    const filename = `DDT_${safeSupplier}_${datePart}.${ext}`;

    void this.downloadDocumentFile(doc, filename);
  }

  private async downloadDocumentFile(doc: AcquiredDdtDocument, filename: string) {
    try {
      if (doc.localBlobKey) {
        const blob = await getDdtDocumentBlob(doc.localBlobKey);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 5000);
          this.toast.success('Download avviato', filename);
          return;
        }
      }
      const fallback = doc.imageUrl;
      if (!fallback) {
        this.toast.error('Download non disponibile', 'File HD non trovato. Reimporta il carico con la foto del DDT.');
        return;
      }
      await this.triggerDocumentDownload(fallback, filename, doc.isPdf);
    } catch {
      this.toast.error('Errore download', 'Impossibile scaricare il documento.');
    }
  }

  private async triggerDocumentDownload(dataUrl: string, filename: string, isPdf: boolean) {
    try {
      const blob = await this.dataUrlToBlob(dataUrl);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      this.toast.success('Download avviato', filename);
    } catch {
      try {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        this.toast.success('Download avviato', filename);
      } catch {
        window.open(dataUrl, '_blank', 'noopener,noreferrer');
        this.toast.info('Salva dal browser', isPdf ? 'Apri il PDF e usa Stampa → Salva come PDF.' : 'Tasto destro sull\'immagine → Salva immagine con nome.');
      }
    }
  }

  private async dataUrlToBlob(dataUrl: string): Promise<Blob> {
    if (dataUrl.startsWith('data:')) {
      const res = await fetch(dataUrl);
      return res.blob();
    }
    const res = await fetch(dataUrl);
    return res.blob();
  }

  navigateToDocumentFromProduct(item: IncomingIngredient) {
    const docId = this.getDocumentIdForItem(item);
    if (!docId || !this.acquiredDocs().some(d => d.id === docId)) {
      this.toast.warning('Documento non disponibile', 'Il file del carico non è più in archivio o non è stato acquisito.');
      return;
    }
    this.mainSectionTab.set('documents');
    this.expandedDocId.set(docId);
    this.highlightDocId.set(docId);
    setTimeout(() => {
      const el = document.getElementById(`acq-doc-${docId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    setTimeout(() => this.highlightDocId.set(null), 3500);
  }

  confirmDeleteDocument(doc: AcquiredDdtDocument) {
    this.docToDelete.set(doc);
  }

  async executeDeleteDocument() {
    const doc = this.docToDelete();
    if (!doc) return;
    if (doc.localBlobKey) {
      try {
        await deleteDdtDocumentBlob(doc.localBlobKey);
      } catch (e) {
        console.warn('[DDT-DOC] delete blob failed', e);
      }
    }
    const remaining = this.acquiredDocs().filter(d => d.id !== doc.id);
    await this.persistAcquiredDocuments(remaining);
    await this.clearPantryDocumentRefs(doc.id);
    this.docToDelete.set(null);
    if (this.expandedDocId() === doc.id) this.expandedDocId.set(null);
    this.toast.success('Documento eliminato', 'La foto/PDF è stata rimossa dall\'archivio. I prodotti in dispensa restano.');
  }

  private async clearPantryDocumentRefs(docId: string) {
    const all = ((await this.state.getGlobalRecordData('ddt_pantry')) || []) as IncomingIngredient[];
    let changed = false;
    const updated = all.map(i => {
      const gid = i.loadGroupId || (i as any).loadGroupId;
      if (gid !== docId) return i;
      changed = true;
      return { ...i, ddtImageUrl: undefined };
    });
    if (changed) {
      await this.state.saveGlobalRecord('ddt_pantry', updated);
      const clientId = this.state.tenantClientId() || this.state.activeTargetClientId();
      this.pantry.set(updated.filter(i => !clientId || !i.clientId || i.clientId === clientId));
    }
  }

  /**
   * Archivio documenti: mantiene risoluzione originale quando possibile.
   * Riduce solo file enormi (> ~3.5 MB base64) per limiti storage, con JPEG ad alta qualità.
   */
  private async prepareArchiveForStorage(dataUrl: string): Promise<string> {
    if (!dataUrl || dataUrl.startsWith('data:application/pdf')) {
      return dataUrl;
    }
    const approxKb = Math.round(dataUrl.length / 1024);
    if (approxKb <= 3500) {
      return dataUrl;
    }
    let encoded = await this.encodeArchiveImage(dataUrl, 4096, 0.94);
    if (encoded.length / 1024 > 4500) {
      encoded = await this.encodeArchiveImage(dataUrl, 3200, 0.92);
    }
    if (encoded.length / 1024 > 4500) {
      encoded = await this.encodeArchiveImage(dataUrl, 2800, 0.9);
    }
    return encoded || dataUrl;
  }

  private encodeArchiveImage(dataUrl: string, maxDim: number, quality: number): Promise<string> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        const longest = Math.max(w, h);
        if (longest > maxDim) {
          const scale = maxDim / longest;
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  private async registerAcquiredDocument(doc: AcquiredDdtDocument) {
    const clientId = doc.clientId || this.resolvePantryClientId() || undefined;
    const normalized: AcquiredDdtDocument = { ...doc, clientId };

    const fromServer = ((await this.state.getGlobalRecordData(ACQUIRED_DOCS_RECORD)) || []) as AcquiredDdtDocument[];
    const mergedById = new Map<string, AcquiredDdtDocument>();
    for (const d of fromServer) mergedById.set(d.id, d);
    for (const d of this.acquiredDocs()) {
      const prev = mergedById.get(d.id);
      if (!prev || (d.acquiredAt || '') >= (prev.acquiredAt || '')) {
        mergedById.set(d.id, d);
      }
    }
    mergedById.set(normalized.id, normalized);
    await this.persistAcquiredDocuments(Array.from(mergedById.values()));
  }

  private async persistAcquiredDocuments(docs: AcquiredDdtDocument[]) {
    this.acquiredDocs.set(docs);
    await this.state.saveGlobalRecord(ACQUIRED_DOCS_RECORD, docs);
  }

  private mergeAcquiredDocLists(...lists: AcquiredDdtDocument[][]): AcquiredDdtDocument[] {
    const byId = new Map<string, AcquiredDdtDocument>();
    for (const list of lists) {
      for (const d of list) {
        const prev = byId.get(d.id);
        if (!prev || (d.acquiredAt || '') >= (prev.acquiredAt || '')) {
          byId.set(d.id, d);
        }
      }
    }
    return Array.from(byId.values());
  }

  private async loadAcquiredDocuments() {
    const saved = await this.state.getGlobalRecordData(ACQUIRED_DOCS_RECORD);
    let docs: AcquiredDdtDocument[] = Array.isArray(saved) ? saved : [];
    docs = await this.migrateLegacyAcquiredDocuments(docs);
    const { kept, purged } = this.purgeExpiredAcquiredDocuments(docs);
    const merged = this.mergeAcquiredDocLists(kept, this.acquiredDocs());
    if (purged > 0) {
      const removed = docs.filter(d => !kept.some(k => k.id === d.id));
      for (const d of removed) {
        if (d.localBlobKey) {
          try { await deleteDdtDocumentBlob(d.localBlobKey); } catch { /* ignore */ }
        }
      }
      await this.persistAcquiredDocuments(merged.filter(d => kept.some(k => k.id === d.id)));
      await this.purgePantryRefsForRemovedDocs(docs, kept);
      this.toast.info('Archivio documenti', `${purged} documento/i oltre ${ACQUIRED_DOC_RETENTION_DAYS} giorni eliminati automaticamente.`);
    } else {
      this.acquiredDocs.set(merged);
    }
  }

  private purgeExpiredAcquiredDocuments(docs: AcquiredDdtDocument[]): { kept: AcquiredDdtDocument[]; purged: number } {
    const kept: AcquiredDdtDocument[] = [];
    let purged = 0;
    for (const d of docs) {
      const t = d.acquiredAt ? new Date(d.acquiredAt).getTime() : 0;
      if (!t || isNaN(t)) {
        kept.push(d);
        continue;
      }
      const ageDays = Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
      if (ageDays >= ACQUIRED_DOC_RETENTION_DAYS) purged++;
      else kept.push(d);
    }
    return { kept, purged };
  }

  private async purgePantryRefsForRemovedDocs(before: AcquiredDdtDocument[], after: AcquiredDdtDocument[]) {
    const afterIds = new Set(after.map(d => d.id));
    const removedIds = before.filter(d => !afterIds.has(d.id)).map(d => d.id);
    for (const id of removedIds) {
      await this.clearPantryDocumentRefs(id);
    }
  }

  private async migrateLegacyAcquiredDocuments(existing: AcquiredDdtDocument[]): Promise<AcquiredDdtDocument[]> {
    const byId = new Map(existing.map(d => [d.id, d]));
    const pantry = ((await this.state.getGlobalRecordData('ddt_pantry')) || []) as IncomingIngredient[];
    const groups = new Map<string, IncomingIngredient[]>();
    for (const item of pantry) {
      const gid = item.loadGroupId || (item as any).loadGroupId;
      if (!gid) continue;
      if (!groups.has(gid)) groups.set(gid, []);
      groups.get(gid)!.push(item);
    }
    let changed = false;
    for (const [gid, items] of groups) {
      if (byId.has(gid)) continue;
      const withImg = items.find(i => i.ddtImageUrl);
      if (!withImg?.ddtImageUrl) continue;
      byId.set(gid, {
        id: gid,
        clientId: withImg.clientId,
        supplierId: withImg.supplierId,
        supplierName: withImg.supplierName,
        entryDate: withImg.entryDate,
        imageUrl: withImg.ddtImageUrl,
        isPdf: withImg.ddtImageUrl.startsWith('data:application/pdf'),
        productIds: items.map(i => i.id),
        acquiredAt: withImg.createdAt || new Date().toISOString()
      });
      changed = true;
    }
    if (changed) {
      const merged = Array.from(byId.values());
      await this.persistAcquiredDocuments(merged);
      return merged;
    }
    return existing;
  }
}
