import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService } from '../services/app-state.service';
import { ToastService } from '../services/toast.service';
import { supabase } from '../supabase';

export interface IncomingIngredient {
  id: string;
  clientId: string;
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
                    <img [src]="ddtPreview()" class="w-full h-full object-cover rounded-xl">
                    <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all rounded-xl">
                      <span class="text-white text-xs font-bold">Cambia foto</span>
                    </div>
                  } @else {
                    <i class="fa-solid fa-file-image text-3xl text-violet-300 mb-2"></i>
                    <span class="text-[11px] font-bold text-violet-400 uppercase tracking-wider text-center px-2">Foto DDT</span>
                  }
                </div>
                <input #ddtFileInput type="file" accept="image/*" class="hidden" (change)="handleDdtPhoto($event)">
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
                    <p class="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1">
                      <i class="fa-solid fa-triangle-exclamation"></i>
                      Chiave API Gemini non configurata nel Cloud. Vai in Impostazioni → AI.
                    </p>
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
                  <input type="text" [(ngModel)]="form.supplierName" placeholder="Nome fornitore"
                         class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 transition-all">
                </div>
                <div class="space-y-1.5">
                  <label class="text-[10px] font-black uppercase tracking-widest text-slate-400">Data Documento *</label>
                  <input type="date" [(ngModel)]="form.entryDate"
                         class="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 transition-all">
                </div>
              </div>

              <!-- Products List -->
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-black uppercase tracking-widest text-slate-500">Prodotti nel Carico</h4>
                  <button (click)="addEmptyItem()" class="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-all">
                    + Aggiungi Riga
                  </button>
                </div>
                
                @for (item of form.items; track $index) {
                  <div class="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white border border-slate-200 p-3 rounded-xl relative group">
                    <div class="md:col-span-4 space-y-1">
                      <label class="text-[9px] font-bold uppercase text-slate-400">Prodotto</label>
                      <input type="text" [(ngModel)]="item.ingredientName" placeholder="es. Patate" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-amber-400 outline-none">
                    </div>
                    <div class="md:col-span-3 space-y-1">
                      <label class="text-[9px] font-bold uppercase text-slate-400">Lotto</label>
                      <input type="text" [(ngModel)]="item.lotto" placeholder="Lotto" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:border-amber-400 outline-none">
                    </div>
                    <div class="md:col-span-2 space-y-1">
                      <label class="text-[9px] font-bold uppercase text-slate-400">Quantità</label>
                      <input type="text" [(ngModel)]="item.quantity" placeholder="es. 10 kg" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:border-amber-400 outline-none">
                    </div>
                    <div class="md:col-span-3 space-y-1">
                      <label class="text-[9px] font-bold uppercase text-slate-400">Scadenza</label>
                      <input type="date" [(ngModel)]="item.expiryDate" class="w-full px-3 py-2 bg-slate-50 border border-rose-200 rounded-lg text-xs font-bold focus:border-rose-400 outline-none text-rose-700">
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
              <button (click)="saveMultipleEntries()" [disabled]="!form.supplierName || !form.entryDate || form.items.length === 0 || !form.items[0].ingredientName"
                      class="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-black text-sm uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2">
                <i class="fa-solid fa-boxes-stacked"></i> Registra {{ form.items.length }} Prodotti
              </button>
            </div>
          </div>
        </div>
      }
      
      <!-- New Supplier Confirmation Modal -->
      @if (showNewSupplierModal()) {
        <div class="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" (click)="showNewSupplierModal.set(false)"></div>
          <div class="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-slide-up border border-slate-200">
            <div class="p-6 text-center">
              <div class="h-16 w-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-2xl mx-auto mb-4 border border-amber-100 shadow-sm">
                <i class="fa-solid fa-truck-field"></i>
              </div>
              <h3 class="text-lg font-bold text-slate-800 mb-2">Nuovo Fornitore?</h3>
              <p class="text-sm text-slate-500 leading-relaxed mb-6">
                L'AI ha rilevato <span class="font-bold text-indigo-600">{{ form.supplierName }}</span>.<br>
                Vuoi aggiungerlo all'anagrafica fornitori?
              </p>
              
              <div class="flex gap-3">
                <button (click)="showNewSupplierModal.set(false)" 
                        class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">
                  No, Solo DDT
                </button>
                <button (click)="confirmNewSupplier()" 
                        class="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md">
                  Sì, Registra
                </button>
              </div>
            </div>
          </div>
        </div>
      }
      
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
        <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-amber-600">
              <i class="fa-solid" [class]="viewMode() === 'activePantry' ? 'fa-boxes-stacked' : 'fa-truck-ramp-box'"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-800">{{ viewMode() === 'daily' ? 'Carichi del Giorno' : 'Dispensa Attiva' }}</h3>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {{ viewMode() === 'daily' ? (filteredPantry().length + ' prodotti registrati il ' + (state.filterDate() | date:'dd/MM')) : (filteredPantry().length + ' prodotti in corso di validità') }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button (click)="viewMode.set(viewMode() === 'daily' ? 'activePantry' : 'daily')" 
                    class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-xl transition-all border"
                    [class]="viewMode() === 'daily' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'">
              <i class="fa-solid" [class]="viewMode() === 'daily' ? 'fa-boxes-stacked' : 'fa-calendar-day'"></i>
              {{ viewMode() === 'daily' ? 'Vedi Dispensa Attiva' : 'Vedi Carichi Giorno' }}
            </button>
            <div class="relative">
              <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Cerca prodotto..."
                     class="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-amber-400 transition-all">
            </div>
          </div>
        </div>

        @if (filteredPantry().length === 0) {
          <div class="p-16 text-center">
            <i class="fa-solid fa-boxes-stacked text-4xl text-slate-200 mb-4 block"></i>
            <p class="text-sm font-bold text-slate-500">Dispensa vuota</p>
            <p class="text-xs text-slate-400 mt-1">Aggiungi il primo carico con il pulsante "Nuovo Carico"</p>
          </div>
        } @else {
          <div class="overflow-x-auto">
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
                        <div class="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
                             [class]="expired ? 'bg-red-50 text-red-400' : 'bg-emerald-50 text-emerald-600'">
                          <i class="fa-solid fa-carrot text-xs"></i>
                        </div>
                        <div>
                          <p class="text-sm font-black text-slate-800">{{ item.ingredientName }}</p>
                          @if (expired) {
                            <span class="text-[9px] font-black text-red-500 uppercase bg-red-50 px-1.5 py-0.5 rounded">SCADUTO</span>
                          }
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3 text-sm font-bold text-slate-600">{{ item.supplierName }}</td>
                    <td class="px-4 py-3 font-mono text-xs text-slate-500 font-bold">{{ item.lotto || '—' }}</td>
                    <td class="px-4 py-3 text-xs font-bold text-slate-500">{{ item.entryDate | date:'dd/MM/yy' }}</td>
                    <td class="px-4 py-3">
                      <span class="text-xs font-black px-2 py-1 rounded-lg"
                            [class]="expired ? 'bg-red-100 text-red-700 border border-red-200 shadow-sm' : daysToExpiry(item.expiryDate) <= 7 ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'">
                        {{ item.expiryDate | date:'dd/MM/yy' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm font-bold text-slate-600">{{ item.quantity || '—' }}</td>
                    <td class="px-4 py-3 text-right">
                      <button (click)="deleteEntry(item.id)" class="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-auto">
                        <i class="fa-solid fa-trash-can text-xs"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

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
  pantry = signal<IncomingIngredient[]>([]);
  viewMode = signal<'daily' | 'activePantry'>('daily');
  searchQuery = signal('');
  showNewSupplierModal = signal(false);
  aiRawResponse = signal<string | null>(null);

  form: {
    supplierName: string;
    entryDate: string;
    items: { ingredientName: string; lotto: string; quantity: string; expiryDate: string }[];
  } = {
    supplierName: '',
    entryDate: '',
    items: []
  };

  activeCount = computed(() => this.pantry().filter(i => !this.isExpired(i.expiryDate)).length);
  expiredCount = computed(() => this.pantry().filter(i => this.isExpired(i.expiryDate)).length);

  filteredPantry = computed(() => {
    const clientId = this.state.activeTargetClientId();
    const selectedDate = this.state.filterDate();
    
    let items = this.pantry().filter(i => !clientId || i.clientId === clientId);
    
    if (this.viewMode() === 'daily') {
      items = items.filter(i => i.entryDate === selectedDate);
    } else {
      items = items.filter(i => !this.isExpired(i.expiryDate));
    }
    
    if (this.searchQuery()) {
      const q = this.searchQuery().toLowerCase();
      items = items.filter(i => i.ingredientName.toLowerCase().includes(q) || i.supplierName.toLowerCase().includes(q));
    }
    
    return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  constructor() {
    this.loadPantry();
    this.resetForm();
  }

  resetForm() {
    this.form = {
      supplierName: '',
      entryDate: this.state.filterDate() || new Date().toISOString().split('T')[0],
      items: [{ ingredientName: '', lotto: '', quantity: '', expiryDate: '' }]
    };
    this.ddtPreview.set(null);
  }

  addEmptyItem() {
    this.form.items.push({ ingredientName: '', lotto: '', quantity: '', expiryDate: '' });
  }

  removeItem(index: number) {
    this.form.items.splice(index, 1);
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
      this.toast.error('Foto troppo grande', 'Max 20MB prima della compressione'); 
      return; 
    }

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
    const key = config?.apiKey;
    const img = this.ddtPreview();
    const initialModel = config?.model || 'gemini-1.5-flash';

    if (!key) {
      this.toast.error('Manca API Key', 'Inserisci la chiave Gemini nelle impostazioni per usare l\'AI.');
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

    let attempts = 0;
    const maxAttempts = 3;
    let currentModel = initialModel;
    const fallbackModel = 'gemini-3.1-flash-lite-preview';

    while (attempts < maxAttempts) {
      try {
        const base64 = img.split(',')[1];
        const mimeType = img.split(';')[0].split(':')[1];

        const body = {
          contents: [{
            parts: [
              { text: `Analyze this DDT (shipping document) and extract ALL products. Return ONLY a JSON object exactly like this: {"supplierName":"","entryDate":"YYYY-MM-DD","items":[{"ingredientName":"","lotto":"","quantity":"","expiryDate":"YYYY-MM-DD"}]}. Do not include markdown formatting. Extract every product row found.` },
              { inlineData: { mimeType, data: base64 } }
            ]
          }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.1 }
        };

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!res.ok) {
          const errorData = await res.json();
          const errorMsg = errorData.error?.message || '';

          // 503 or High Demand or Timeout -> Retry with backoff
          if (res.status === 503 || res.status === 504 || errorMsg.toLowerCase().includes('high demand') || errorMsg.toLowerCase().includes('timeout')) {
            attempts++;
            if (attempts < maxAttempts) {
              const waitTime = attempts * 2500; // 2.5s, 5s...
              this.toast.info('Server Occupato', `Google sta elaborando troppe immagini. Riprovo tra ${waitTime/1000}s...`);
              
              await new Promise(r => setTimeout(r, waitTime));
              continue; // Retry loop
            }
          }

          // Other errors
          if (res.status === 400 && errorMsg.includes('model')) {
            this.toast.error('Modello non trovato', 'Il modello selezionato non è disponibile per la tua chiave.');
          } else if (res.status === 429) {
            this.toast.error('Limite superato', 'Troppe richieste. Attendi un minuto.');
          } else {
            this.toast.error('Errore API', errorMsg || `Errore server (${res.status})`);
          }
          return;
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
          throw new Error('L\'AI non ha restituito testo. Prova con una foto più chiara.');
        }

        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            this.aiRawResponse.set(text);
            throw new Error('L\'AI non ha restituito un formato dati valido.');
          }
          
          const cleanedText = jsonMatch[0];
          const parsed = JSON.parse(cleanedText);
          
          // Ensure valid structure
          this.form.supplierName = parsed.supplierName || '';
          this.form.entryDate = parsed.entryDate || new Date().toISOString().split('T')[0];
          
          if (parsed.items && Array.isArray(parsed.items) && parsed.items.length > 0) {
            this.form.items = parsed.items.map((i: any) => ({
              ingredientName: i.ingredientName || '',
              lotto: i.lotto || '',
              quantity: i.quantity || '',
              expiryDate: i.expiryDate || ''
            }));
          } else if (parsed.ingredientName) { // Fallback if AI still returns single item flat
            this.form.items = [{
              ingredientName: parsed.ingredientName || '',
              lotto: parsed.lotto || '',
              quantity: parsed.quantity || '',
              expiryDate: parsed.expiryDate || ''
            }];
          }

          this.aiRawResponse.set(null);
          this.toast.success('AI completato', `Trovati ${this.form.items.length} prodotti! Verifica i dati.`);
          
          // Update usage stats
          this.state.updateAiUsage(currentModel);
          
          // Check if supplier is new
          if (this.form.supplierName) {
            const suppliers = (this.state.getGlobalRecord('suppliers') || []) as any[];
            const exists = suppliers.some(s => s.ragioneSociale?.toLowerCase() === this.form.supplierName?.toLowerCase());
            if (!exists) {
              // We'll still show the modal to let them know/fill info, but saveMultipleEntries will auto-save too
              this.showNewSupplierModal.set(true);
            }
          }
          break; // Success! Exit loop
        } catch (parseError) {
          console.error('JSON Parse Error:', text);
          this.aiRawResponse.set(text);
          throw new Error('L\'AI ha risposto con un formato non valido.');
        }
      } catch (e: any) {
        if (attempts >= maxAttempts - 1) {
          console.error('AI OCR error after retries:', e);
          this.toast.error('Errore AI', e.message || 'Impossibile analizzare il DDT. Compila manualmente.');
          break;
        }
        attempts++;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    this.isAnalyzing.set(false);
  }

  confirmNewSupplier() {
    if (!this.form.supplierName) return;
    
    const suppliers = (this.state.getGlobalRecord('suppliers') || []) as any[];
    const newSupplier = {
      id: Date.now().toString(),
      ragioneSociale: this.form.supplierName,
      responsabile: '',
      piva: '',
      telefono: '',
      email: '',
      indirizzo: '',
      status: 'pending',
      note: ''
    };
    
    this.state.saveGlobalRecord('suppliers', [...suppliers, newSupplier]);
    this.showNewSupplierModal.set(false);
    this.toast.success('Fornitore Registrato', `${this.form.supplierName} è stato aggiunto all'anagrafica.`);
  }

  async saveMultipleEntries() {
    const clientId = this.state.activeTargetClientId() || this.state.currentUser()?.clientId || 'demo';
    
    // 1. Auto-save supplier if new
    if (this.form.supplierName) {
      const suppliers = (this.state.getGlobalRecord('suppliers') || []) as any[];
      const exists = suppliers.some(s => s.ragioneSociale?.toLowerCase() === this.form.supplierName?.toLowerCase());
      if (!exists) {
        const newSupplier = {
          id: `sup_${Date.now()}`,
          ragioneSociale: this.form.supplierName,
          responsabile: '',
          piva: '',
          telefono: '',
          email: '',
          indirizzo: '',
          status: 'pending',
          note: '',
          createdAt: new Date().toISOString()
        };
        this.state.saveGlobalRecord('suppliers', [...suppliers, newSupplier]);
        console.log(`[DDT] Auto-registered new supplier: ${this.form.supplierName}`);
      }
    }

    const currentPantry = (this.state.getGlobalRecord('ddt_pantry') || []) as IncomingIngredient[];
    
    const newEntries: IncomingIngredient[] = [];
    
    for (const item of this.form.items) {
      if (!item.ingredientName) continue; // Skip empty rows
      
      const entry: IncomingIngredient = {
        id: `ddt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        clientId: clientId,
        supplierName: this.form.supplierName || '',
        ingredientName: item.ingredientName || '',
        lotto: item.lotto || '',
        quantity: item.quantity || '',
        entryDate: this.form.entryDate || new Date().toISOString().split('T')[0],
        expiryDate: item.expiryDate || '',
        ddtImageUrl: this.ddtPreview() || undefined,
        createdAt: new Date().toISOString()
      };
      
      newEntries.push(entry);
      this.state.addBaseIngredient(entry.ingredientName);
    }

    if (newEntries.length === 0) {
      this.toast.error('Nessun prodotto', 'Aggiungi almeno un ingrediente valido.');
      return;
    }

    const updatedPantry = [...newEntries, ...currentPantry];
    this.state.saveGlobalRecord('ddt_pantry', updatedPantry);
    
    // Update local signal for immediate UI reflection
    this.pantry.set(updatedPantry);

    this.toast.success('Carico registrato', `${newEntries.length} prodotti aggiunti alla Dispensa.`);
    this.cancelForm();
  }

  async deleteEntry(id: string) {
    const currentPantry = (this.state.getGlobalRecord('ddt_pantry') || []) as IncomingIngredient[];
    const updated = currentPantry.filter(i => i.id !== id);
    this.state.saveGlobalRecord('ddt_pantry', updated);
    this.pantry.set(updated);
  }

  async loadPantry() {
    const savedData = this.state.getGlobalRecord('ddt_pantry');
    if (savedData && Array.isArray(savedData)) {
      this.pantry.set(savedData);
    } else {
      this.pantry.set([]);
    }
  }

  isExpired(expiryDate: string): boolean {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date(new Date().toDateString());
  }

  daysToExpiry(expiryDate: string): number {
    if (!expiryDate) return 999;
    const diff = new Date(expiryDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}
