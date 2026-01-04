
import React, { useState, useEffect, useRef } from 'react';
import { Send, Check, CheckCircle } from 'lucide-react';
import { apiService, type PrivateMessage } from '../services/api';
import '../chat.css';

interface ChatInterfaceProps {
    friendId: string;
    friendPseudo: string;
}

export default function ChatInterface({ friendId, friendPseudo }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<PrivateMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const POLL_INTERVAL = 5000; // 5 secondes

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [friendId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        try {
            const data = await apiService.getMessages(friendId);
            setMessages(data);
        } catch (error) {
            console.error('Erreur chargement messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage;
        setNewMessage(''); // Clear input immediately for better UX

        try {
            const msg = await apiService.sendMessage(friendId, content);
            setMessages(prev => [...prev, msg]);
        } catch (error) {
            console.error('Erreur envoi message:', error);
            alert('Erreur lors de l\'envoi du message');
            setNewMessage(content); // Restore content if failed
        }
    };

    if (loading && messages.length === 0) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {friendPseudo.charAt(0).toUpperCase()}
                </div>
                <span>{friendPseudo}</span>
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10 text-sm">
                        <p>Dites bonjour à {friendPseudo} ! 👋</p>
                    </div>
                ) : (
                    messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`message ${msg.isMyMessage ? 'sent' : 'received'}`}
                        >
                            {msg.content}
                            <span className="message-time">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {msg.isMyMessage && (
                                    <span className="ml-1 inline-block">
                                        {msg.read ? <CheckCircle size={10} /> : <Check size={10} />}
                                    </span>
                                )}
                            </span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Écrivez votre message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="chat-send-btn"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>
    );
}
