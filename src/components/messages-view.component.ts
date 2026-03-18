import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService, Message } from '../services/app-state.service';

@Component({
    selector: 'app-messages-view',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="space-y-6 max-w-7xl mx-auto p-4 pb-12">
        <!-- Sleek Professional Header -->
        <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden mb-6">
          <div class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none"></div>
          
          <div class="relative z-10 flex items-center gap-5">
             <div class="h-14 w-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm text-blue-600 shrink-0 relative">
                <i class="fa-solid fa-comments text-2xl"></i>
                @if (state.unreadMessagesCount() > 0) {
                    <div class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                        <div class="w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                    </div>
                }
             </div>
             <div>
                <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Messaggistica</h2>
                <p class="text-xs font-semibold text-slate-500 mt-1">Centro comunicazioni e notifiche</p>
             </div>
          </div>

          <div class="flex gap-4 items-center z-10 w-full md:w-auto justify-between md:justify-end">
             <div class="flex -space-x-2 items-center">
                 @for (user of state.systemUsers().slice(0, 4); track user.id) {
                     <img [src]="user.avatar" class="w-8 h-8 rounded-full border-2 border-white shadow-sm" [title]="user.name">
                 }
                 @if (state.systemUsers().length > 4) {
                     <div class="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-600 z-10">
                         +{{ state.systemUsers().length - 4 }}
                     </div>
                 }
             </div>
             
             <button (click)="openNewMessageForm()" 
                     class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-sm flex items-center gap-2 text-sm shrink-0">
                 <i class="fa-solid fa-pen text-xs"></i>
                 <span class="hidden sm:inline">Nuovo Messaggio</span>
             </button>
          </div>
        </div>

        <!-- New Message Form -->
        @if (showNewMessageForm) {
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 relative overflow-hidden">
                <div class="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-slate-800 flex items-center gap-2">
                        <i class="fa-solid fa-paper-plane text-blue-500"></i>
                        Componi Messaggio
                    </h3>
                    <button (click)="cancelNewMessage()" class="text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                        <i class="fa-solid fa-times text-sm"></i>
                    </button>
                </div>

                <div class="space-y-5">
                    <!-- Recipient Type -->
                    @if (state.isAdmin()) {
                    <div>
                        <label class="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-3 text-slate-500">Destinatario</label>
                        <div class="flex gap-4 bg-slate-50 p-1.5 rounded-lg w-fit border border-slate-200">
                            <label class="flex items-center gap-2 cursor-pointer px-4 py-1.5 rounded-md transition-colors"
                                   [class.bg-white]="newMessage.recipientType === 'ALL'" [class.shadow-sm]="newMessage.recipientType === 'ALL'">
                                <input type="radio" name="recipientType" value="ALL" [(ngModel)]="newMessage.recipientType" class="hidden">
                                <span class="text-sm font-bold" [class.text-blue-600]="newMessage.recipientType === 'ALL'" [class.text-slate-500]="newMessage.recipientType !== 'ALL'">Tutte le Aziende</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer px-4 py-1.5 rounded-md transition-colors"
                                   [class.bg-white]="newMessage.recipientType === 'SINGLE'" [class.shadow-sm]="newMessage.recipientType === 'SINGLE'">
                                <input type="radio" name="recipientType" value="SINGLE" [(ngModel)]="newMessage.recipientType" class="hidden">
                                <span class="text-sm font-bold" [class.text-blue-600]="newMessage.recipientType === 'SINGLE'" [class.text-slate-500]="newMessage.recipientType !== 'SINGLE'">Azienda Specifica</span>
                            </label>
                        </div>
                    </div>

                    <!-- Company Selection -->
                    @if (newMessage.recipientType === 'SINGLE') {
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Azienda</label>
                                <select [(ngModel)]="newMessage.recipientId" 
                                        (change)="newMessage.recipientUserId = ''"
                                        class="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-slate-700 font-medium rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all shadow-sm">
                                    <option value="">-- Seleziona Azienda --</option>
                                    @for (client of state.clients(); track client.id) {
                                        <option [value]="client.id">{{ client.name }}</option>
                                    }
                                </select>
                            </div>
                            
                            @if (newMessage.recipientId && newMessage.recipientId !== 'ADMIN_OFFICE') {
                                <div>
                                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Operatore (Opzionale)</label>
                                    <select [(ngModel)]="newMessage.recipientUserId" 
                                            class="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-slate-700 font-medium rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all shadow-sm">
                                        <option value="">-- Tutta l'Azienda --</option>
                                        @for (user of getUsersForClient(newMessage.recipientId); track user.id) {
                                            <option [value]="user.id">{{ user.name }} ({{ user.department }})</option>
                                        }
                                    </select>
                                </div>
                            }
                        </div>
                    }
                    } @else {
                        <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                <i class="fa-solid fa-shield-halved"></i>
                            </div>
                            <div>
                                <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-0.5">Destinatario</p>
                                <p class="font-bold text-slate-800 text-sm">Amministrazione / Supporto HT</p>
                            </div>
                        </div>
                    }

                    <!-- Subject -->
                    <div>
                        <input type="text" [(ngModel)]="newMessage.subject" placeholder="Oggetto del messaggio" 
                               class="w-full px-4 py-3 border border-slate-200 bg-slate-50 text-slate-800 font-bold rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all placeholder:font-normal">
                    </div>

                    <!-- Content -->
                    <div>
                        <textarea [(ngModel)]="newMessage.content" rows="4" placeholder="Scrivi il tuo messaggio qui..." 
                                  class="w-full px-4 py-3 border border-slate-200 bg-slate-50 text-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent outline-none transition-all resize-none"></textarea>
                    </div>

                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
                        <!-- File Attachment (Simulated) -->
                        <div class="relative w-full sm:w-auto">
                            <input type="file" (change)="onFileSelected($event)" id="file-upload" class="hidden">
                            <label for="file-upload" class="cursor-pointer flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 bg-white rounded-lg hover:bg-slate-50 transition-colors font-bold text-sm shadow-sm">
                                <i class="fa-solid fa-paperclip text-slate-400"></i>
                                <span>Allega file</span>
                            </label>
                            @if (newMessage.attachmentName) {
                                <p class="text-[10px] text-slate-500 font-bold mt-2 truncate max-w-[200px]">
                                    {{ newMessage.attachmentName }}
                                </p>
                            }
                        </div>

                        <!-- Actions -->
                        <div class="flex gap-2 w-full sm:w-auto">
                            <button (click)="cancelNewMessage()" 
                                    class="flex-1 sm:flex-none px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-all text-sm border border-slate-200">
                                Annulla
                            </button>
                            <button (click)="sendNewMessage()" 
                                    [disabled]="!canSendMessage()"
                                    [class.opacity-50]="!canSendMessage()"
                                    [class.cursor-not-allowed]="!canSendMessage()"
                                    class="flex-1 sm:flex-none px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2 text-sm">
                                <i class="fa-solid fa-paper-plane"></i>
                                Invia
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        }

        <!-- Messages List -->
        <div class="space-y-3">
            @if (messages().length === 0) {
                <div class="bg-white border border-slate-200 p-12 rounded-2xl text-center shadow-sm">
                    <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <i class="fa-solid fa-inbox text-3xl text-slate-300"></i>
                    </div>
                    <p class="text-xs text-slate-400 font-bold tracking-widest uppercase">Nessun messaggio presente</p>
                </div>
            }

            @for (message of messages(); track message.id) {
                <div class="bg-white rounded-xl shadow-sm border transition-all duration-300"
                     [class.border-blue-300]="!message.read"
                     [class.border-slate-200]="message.read">
                    
                    <!-- Message Header -->
                    <div class="p-4 md:p-5 flex justify-between items-start gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                         [class.bg-blue-50/30]="!message.read"
                         (click)="toggleMessageExpanded(message.id)">
                        <!-- Sender Avatar (Simulated) & Info -->
                        <div class="flex items-start gap-4 flex-1">
                            <div class="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 text-slate-500 flex items-center justify-center shrink-0">
                                <i class="fa-solid fa-user text-sm"></i>
                            </div>
                            
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center gap-2 mb-1">
                                    <h3 class="text-base font-bold text-slate-800 truncate" [class.text-blue-900]="!message.read">{{ message.subject }}</h3>
                                    @if (!message.read) {
                                        <span class="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-black tracking-widest rounded uppercase shrink-0">NUOVO</span>
                                    }
                                </div>
                                <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                                    <span class="text-slate-700">{{ message.senderName }}</span>
                                    <span class="text-slate-300">•</span>
                                    <span>{{ message.timestamp | date:'dd/MM HH:mm' }}</span>
                                    @if (message.recipientType === 'ALL') {
                                        <span class="ml-auto inline-flex items-center gap-1 bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">
                                            <i class="fa-solid fa-bullhorn shrink-0"></i> BROADCAST
                                        </span>
                                    } @else {
                                        <span class="ml-auto inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[150px]">
                                            <i class="fa-solid fa-building shrink-0"></i> {{ getClientName(message.recipientId) }}
                                        </span>
                                    }
                                </div>
                            </div>
                        </div>
                        
                        <!-- Toggle Icon -->
                        <div class="w-8 h-8 flex items-center justify-center text-slate-400 shrink-0">
                            <i class="fa-solid text-sm transition-transform duration-300" [class.fa-chevron-down]="!isMessageExpanded(message.id)" 
                               [class.fa-chevron-up]="isMessageExpanded(message.id)"></i>
                        </div>
                    </div>

                    <!-- Expanded Content -->
                    @if (isMessageExpanded(message.id)) {
                        <div class="border-t border-slate-100 bg-white rounded-b-xl p-4 md:p-6 pb-6">
                            <div class="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                                {{ message.content }}
                            </div>
                            
                            @if (message.attachmentName) {
                                <div class="flex items-center gap-3 p-3 mt-4 bg-slate-50 border border-slate-200 rounded-lg w-fit transition-colors hover:border-slate-300 cursor-pointer">
                                    <div class="w-8 h-8 bg-white border border-slate-200 rounded flex items-center justify-center text-slate-400">
                                        <i class="fa-solid fa-file-lines"></i>
                                    </div>
                                    <span class="text-xs font-bold text-slate-700">{{ message.attachmentName }}</span>
                                    <button class="ml-4 text-blue-600 hover:text-blue-800 text-[11px] font-black uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">
                                        Scarica
                                    </button>
                                </div>
                            }

                            <!-- Divider -->
                            <div class="h-px bg-slate-100 my-6 w-full"></div>

                            <!-- Form/Replies Area -->
                            <div class="space-y-4">
                                <!-- Replies -->
                                @if (message.replies.length > 0) {
                                    <div class="space-y-3">
                                        <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Cronologia Risposte</h4>
                                        <div class="space-y-2">
                                            @for (reply of message.replies; track reply.id) {
                                                <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 ml-4 md:ml-8 relative">
                                                    <!-- Connector Line -->
                                                    <div class="absolute -left-4 md:-left-8 top-6 w-4 md:w-8 h-px bg-slate-200"></div>
                                                    <div class="absolute -left-4 md:-left-8 -top-8 bottom-auto h-14 w-px bg-slate-200"></div>
                                                    
                                                    <div class="flex items-center gap-2 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                        <span class="text-slate-800">{{ reply.senderName }}</span>
                                                        <span class="text-slate-300">•</span>
                                                        <span>{{ reply.timestamp | date:'dd/MM HH:mm' }}</span>
                                                    </div>
                                                    <p class="text-sm font-medium text-slate-700">{{ reply.content }}</p>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                    <div class="h-4"></div> <!-- Spacer -->
                                }

                                <!-- Reply Form -->
                                @if (showReplyForm() === message.id) {
                                    <div class="bg-white border border-blue-200 shadow-sm p-1 rounded-xl">
                                        <textarea [(ngModel)]="replyContent" rows="3" placeholder="Scrivi la tua risposta..." 
                                                  class="w-full px-4 py-3 bg-transparent text-sm text-slate-700 focus:outline-none resize-none placeholder:text-slate-400"></textarea>
                                        <div class="flex gap-2 justify-end p-2 bg-slate-50 rounded-b-lg border-t border-slate-100">
                                            <button (click)="cancelReply()" class="px-4 py-1.5 text-slate-500 font-bold hover:text-slate-700 transition-all text-xs">
                                                Annulla
                                            </button>
                                            <button (click)="sendReply(message.id)" 
                                                    [disabled]="!replyContent.trim()"
                                                    [class.opacity-50]="!replyContent.trim()"
                                                    class="px-5 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all text-sm shadow-sm">
                                                Invia Risposta
                                            </button>
                                        </div>
                                    </div>
                                } @else {
                                    <button (click)="startReply(message.id)" 
                                            class="w-full md:w-auto px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-all text-sm flex justify-center items-center gap-2 text-slate-700 shadow-sm">
                                        <i class="fa-solid fa-reply text-slate-400"></i> Rispondi a questo messaggio
                                    </button>
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
    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class MessagesViewComponent {
    state = inject(AppStateService);

    showNewMessageForm = false;
    newMessage = {
        recipientType: 'ALL' as 'ALL' | 'SINGLE',
        recipientId: '',
        recipientUserId: '',
        subject: '',
        content: '',
        attachmentUrl: '',
        attachmentName: ''
    };

    expandedMessages = signal<Set<string>>(new Set());
    showReplyForm = signal<string | null>(null);
    replyContent = '';

    messages = signal<Message[]>([]);

    constructor() {
        // Load messages for current user
        this.loadMessages();
    }

    loadMessages() {
        this.messages.set(this.state.getMessagesForCurrentUser());
    }

    openNewMessageForm() {
        this.showNewMessageForm = true;

        // If not admin, automatically address to Admin
        if (!this.state.isAdmin()) {
            // Find admin user (assuming role 'ADMIN')
            // In a real scenario, this might be a specific support user ID or group
            // For now, we look for the first user with 'ADMIN' role
            const admin = this.state.systemUsers().find(u => u.role === 'ADMIN');
            this.newMessage.recipientType = 'SINGLE';
            // We use the ADMIN's Client ID context or User ID depending on how messaging works.
            // Based on 'app-state', recipientId for 'SINGLE' seems to expect a CLIENT ID usually, 
            // but for direct messaging it might be User ID.
            // However, the previous code used Client ID for companies.
            // If we want to msg Admin, Admin usually doesn't have a Client ID like a customer.
            // Let's assume Admin handles 'ALL' company but for direct message we might need a convention.
            // Actually, looking at 'app-state.service.ts', messages are filtered by:
            // (msg.recipientType === 'ALL' || msg.recipientId === user.clientId)
            // So if I send to admin, I should probably NOT set recipientId to a client ID, 
            // OR I should set it to something Admin sees.

            // Re-reading logic: Admin filters: (!msg.read && msg.senderId !== user.id) -> Admin sees ALL messages not from self.
            // So recipientId doesn't matter for Admin visibility as long as it's not broadcast 'ALL' which might confuse UI.
            // Let's set recipientType 'SINGLE' and recipientId to 'ADMIN' or leave empty?
            // If I leave empty, 'canSendMessage' might fail if checking for recipientId.
            // Let's check 'canSendMessage'. It checks !recipientId if SINGLE.
            // So we need a dummy ID.
            this.newMessage.recipientId = 'ADMIN_OFFICE';
        } else {
            this.newMessage.recipientType = 'ALL';
            this.newMessage.recipientId = '';
        }
    }

    canSendMessage(): boolean {
        if (!this.newMessage.subject.trim() || !this.newMessage.content.trim()) return false;
        if (this.newMessage.recipientType === 'SINGLE' && !this.newMessage.recipientId) return false;
        return true;
    }

    sendNewMessage() {
        if (!this.canSendMessage()) return;

        const attachment = this.newMessage.attachmentName ? {
            url: this.newMessage.attachmentUrl,
            name: this.newMessage.attachmentName
        } : undefined;

        this.state.sendMessage(
            this.newMessage.subject,
            this.newMessage.content,
            this.newMessage.recipientType,
            this.newMessage.recipientId || undefined,
            this.newMessage.recipientUserId || undefined,
            attachment
        );

        this.cancelNewMessage();
        this.loadMessages();
    }

    cancelNewMessage() {
        this.showNewMessageForm = false;
        this.newMessage = {
            recipientType: 'ALL',
            recipientId: '',
            recipientUserId: '',
            subject: '',
            content: '',
            attachmentUrl: '',
            attachmentName: ''
        };
    }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.newMessage.attachmentName = file.name;
            // In a real app, upload file and get URL
            this.newMessage.attachmentUrl = 'https://example.com/files/' + file.name;
        }
    }

    toggleMessageExpanded(messageId: string) {
        this.expandedMessages.update(set => {
            const newSet = new Set(set);
            if (newSet.has(messageId)) {
                newSet.delete(messageId);
            } else {
                newSet.add(messageId);
                // Mark as read when expanded
                this.state.markMessageAsRead(messageId);
                this.loadMessages();
            }
            return newSet;
        });
    }

    isMessageExpanded(messageId: string): boolean {
        return this.expandedMessages().has(messageId);
    }

    startReply(messageId: string) {
        this.showReplyForm.set(messageId);
        this.replyContent = '';
    }

    cancelReply() {
        this.showReplyForm.set(null);
        this.replyContent = '';
    }

    sendReply(messageId: string) {
        if (!this.replyContent.trim()) return;

        this.state.replyToMessage(messageId, this.replyContent);
        this.cancelReply();
        this.loadMessages();
    }

    getClientName(clientId?: string): string {
        if (!clientId) return '';
        if (clientId === 'ADMIN_OFFICE') return 'Amministrazione';
        return this.state.clients().find(c => c.id === clientId)?.name || 'Sconosciuto';
    }

    getUserName(userId?: string): string {
        if (!userId) return '';
        return this.state.systemUsers().find(u => u.id === userId)?.name || 'Utente';
    }

    getUsersForClient(clientId: string) {
        return this.state.systemUsers().filter(u => u.clientId === clientId);
    }
}
