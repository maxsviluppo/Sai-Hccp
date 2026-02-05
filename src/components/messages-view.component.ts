import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStateService, Message } from '../services/app-state.service';

@Component({
    selector: 'app-messages-view',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="space-y-8 pb-10">
        <!-- Premium Header Banner -->
        <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 rounded-3xl shadow-xl border border-blue-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            <div class="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <i class="fa-solid fa-comments text-9xl text-white"></i>
            </div>
            <div class="relative z-10">
                <h2 class="text-3xl font-black text-white flex items-center tracking-tight">
                    <span class="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mr-4 shadow-lg border border-white/30">
                        <i class="fa-solid fa-comments"></i>
                    </span>
                    Messaggistica
                </h2>
                <p class="text-blue-100 text-sm mt-2 font-medium ml-1">Comunicazione diretta con le aziende</p>
            </div>
            <div class="relative z-10">
                <button (click)="openNewMessageForm()" 
                        class="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2">
                    <i class="fa-solid fa-plus"></i>
                    Nuovo Messaggio
                </button>
            </div>
        </div>

        <!-- New Message Form -->
        @if (showNewMessageForm) {
            <div class="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-200">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-slate-800">Nuovo Messaggio</h3>
                    <button (click)="cancelNewMessage()" class="text-slate-400 hover:text-slate-600">
                        <i class="fa-solid fa-times text-xl"></i>
                    </button>
                </div>

                <div class="space-y-4">
                    <!-- Recipient Type -->
                    @if (state.isAdmin()) {
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">Destinatario</label>
                        <div class="flex gap-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="recipientType" value="ALL" [(ngModel)]="newMessage.recipientType" class="w-4 h-4">
                                <span class="text-sm font-medium">Tutte le Aziende</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="recipientType" value="SINGLE" [(ngModel)]="newMessage.recipientType" class="w-4 h-4">
                                <span class="text-sm font-medium">Azienda Specifica</span>
                            </label>
                        </div>
                    </div>

                    <!-- Company Selection -->
                    @if (newMessage.recipientType === 'SINGLE') {
                        <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2">Seleziona Azienda</label>
                            <select [(ngModel)]="newMessage.recipientId" class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="">-- Seleziona --</option>
                                @for (client of state.clients(); track client.id) {
                                    <option [value]="client.id">{{ client.name }}</option>
                                }
                            </select>
                        </div>
                    }
                    } @else {
                        <div class="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <i class="fa-solid fa-shield-halved"></i>
                            </div>
                            <div>
                                <p class="text-xs font-bold text-blue-600 uppercase">Destinatario</p>
                                <p class="font-bold text-slate-800">Amministrazione / Supporto</p>
                            </div>
                        </div>
                    }

                    <!-- Subject -->
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">Oggetto</label>
                        <input type="text" [(ngModel)]="newMessage.subject" placeholder="Oggetto del messaggio" 
                               class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>

                    <!-- Content -->
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">Messaggio</label>
                        <textarea [(ngModel)]="newMessage.content" rows="4" placeholder="Scrivi il tuo messaggio..." 
                                  class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                    </div>

                    <!-- File Attachment (Simulated) -->
                    <div>
                        <label class="block text-sm font-bold text-slate-700 mb-2">Allegato (opzionale)</label>
                        <input type="file" (change)="onFileSelected($event)" 
                               class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        @if (newMessage.attachmentName) {
                            <p class="text-sm text-slate-600 mt-2">
                                <i class="fa-solid fa-paperclip mr-1"></i> {{ newMessage.attachmentName }}
                            </p>
                        }
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-3 justify-end">
                        <button (click)="cancelNewMessage()" 
                                class="px-6 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all">
                            Annulla
                        </button>
                        <button (click)="sendNewMessage()" 
                                [disabled]="!canSendMessage()"
                                [class.opacity-50]="!canSendMessage()"
                                [class.cursor-not-allowed]="!canSendMessage()"
                                class="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2">
                            <i class="fa-solid fa-paper-plane"></i>
                            Invia Messaggio
                        </button>
                    </div>
                </div>
            </div>
        }

        <!-- Messages List -->
        <div class="space-y-4">
            @if (messages().length === 0) {
                <div class="bg-slate-50 p-12 rounded-2xl text-center">
                    <i class="fa-solid fa-inbox text-6xl text-slate-300 mb-4"></i>
                    <p class="text-slate-500 font-medium">Nessun messaggio presente</p>
                </div>
            }

            @for (message of messages(); track message.id) {
                <div class="bg-white p-6 rounded-2xl shadow-sm border-2 transition-all duration-300"
                     [class.border-blue-200]="!message.read"
                     [class.border-slate-200]="message.read"
                     [class.bg-blue-50]="!message.read">
                    
                    <!-- Message Header -->
                    <div class="flex justify-between items-start mb-4">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <h3 class="text-lg font-bold text-slate-800">{{ message.subject }}</h3>
                                @if (!message.read) {
                                    <span class="px-2 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">NUOVO</span>
                                }
                            </div>
                            <div class="flex items-center gap-4 text-sm text-slate-600">
                                <span><i class="fa-solid fa-user mr-1"></i> {{ message.senderName }}</span>
                                <span><i class="fa-regular fa-clock mr-1"></i> {{ message.timestamp | date:'dd/MM/yyyy HH:mm' }}</span>
                                @if (message.recipientType === 'ALL') {
                                    <span class="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                                        <i class="fa-solid fa-broadcast-tower mr-1"></i> BROADCAST
                                    </span>
                                } @else {
                                    <span class="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                        <i class="fa-solid fa-building mr-1"></i> {{ getClientName(message.recipientId) }}
                                    </span>
                                }
                            </div>
                        </div>
                        <button (click)="toggleMessageExpanded(message.id)" 
                                class="text-slate-400 hover:text-slate-600 transition-colors">
                            <i class="fa-solid text-xl" [class.fa-chevron-down]="!isMessageExpanded(message.id)" 
                               [class.fa-chevron-up]="isMessageExpanded(message.id)"></i>
                        </button>
                    </div>

                    <!-- Expanded Content -->
                    @if (isMessageExpanded(message.id)) {
                        <div class="border-t border-slate-200 pt-4 space-y-4">
                            <p class="text-slate-700 whitespace-pre-wrap">{{ message.content }}</p>
                            
                            @if (message.attachmentName) {
                                <div class="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                                    <i class="fa-solid fa-paperclip text-slate-400"></i>
                                    <span class="text-sm font-medium text-slate-700">{{ message.attachmentName }}</span>
                                    <button class="ml-auto text-blue-600 hover:text-blue-700 text-sm font-bold">
                                        <i class="fa-solid fa-download mr-1"></i> Scarica
                                    </button>
                                </div>
                            }

                            <!-- Replies -->
                            @if (message.replies.length > 0) {
                                <div class="space-y-3 pl-6 border-l-2 border-slate-200">
                                    <h4 class="text-sm font-bold text-slate-600 uppercase tracking-wide">Risposte ({{ message.replies.length }})</h4>
                                    @for (reply of message.replies; track reply.id) {
                                        <div class="bg-slate-50 p-4 rounded-xl">
                                            <div class="flex items-center gap-2 mb-2 text-sm text-slate-600">
                                                <i class="fa-solid fa-user"></i>
                                                <span class="font-bold">{{ reply.senderName }}</span>
                                                <span class="text-slate-400">•</span>
                                                <span>{{ reply.timestamp | date:'dd/MM/yyyy HH:mm' }}</span>
                                            </div>
                                            <p class="text-slate-700">{{ reply.content }}</p>
                                            @if (reply.attachmentName) {
                                                <div class="flex items-center gap-2 mt-2 text-sm">
                                                    <i class="fa-solid fa-paperclip text-slate-400"></i>
                                                    <span class="text-slate-600">{{ reply.attachmentName }}</span>
                                                </div>
                                            }
                                        </div>
                                    }
                                </div>
                            }

                            <!-- Reply Form -->
                            @if (showReplyForm() === message.id) {
                                <div class="bg-slate-50 p-4 rounded-xl space-y-3">
                                    <textarea [(ngModel)]="replyContent" rows="3" placeholder="Scrivi una risposta..." 
                                              class="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
                                    <div class="flex gap-2 justify-end">
                                        <button (click)="cancelReply()" 
                                                class="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all text-sm">
                                            Annulla
                                        </button>
                                        <button (click)="sendReply(message.id)" 
                                                [disabled]="!replyContent.trim()"
                                                [class.opacity-50]="!replyContent.trim()"
                                                class="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm">
                                            <i class="fa-solid fa-reply mr-1"></i> Rispondi
                                        </button>
                                    </div>
                                </div>
                            } @else {
                                <button (click)="startReply(message.id)" 
                                        class="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all text-sm">
                                    <i class="fa-solid fa-reply mr-1"></i> Rispondi
                                </button>
                            }
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
}
