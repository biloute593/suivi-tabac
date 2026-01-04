
import { useState, useEffect } from 'react';
import MurPublic from './MurPublic';
import ChatInterface from './ChatInterface';
import { apiService, type Friend } from '../services/api';
import { MessageSquare, Search, UserPlus, X, Check } from 'lucide-react';

export default function SocialPage() {
    const [activeTab, setActiveTab] = useState<'mur' | 'amis' | 'messages'>('mur');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [friendQuery, setFriendQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ id: string, pseudo: string }[]>([]);
    const [selectedFriendForChat, setSelectedFriendForChat] = useState<{ id: string, pseudo: string } | null>(null);

    useEffect(() => {
        if (activeTab === 'amis' || activeTab === 'messages') {
            loadFriends();
        }
    }, [activeTab]);

    const loadFriends = async () => {
        try {
            const data = await apiService.getFriends();
            setFriends(data);
        } catch (error) {
            console.error('Erreur chargement amis:', error);
        }
    };

    const handleSearchUsers = async (query: string) => {
        setFriendQuery(query);
        if (query.length < 3) {
            setSearchResults([]);
            return;
        }
        try {
            const results = await apiService.searchUsers(query);
            // Filtrer les résultats pour exclure les amis actuels
            const friendIds = friends.map(f => f.friendId);
            setSearchResults(results.filter(r => !friendIds.includes(r.id)));
        } catch (error) {
            console.error('Erreur recherche:', error);
        }
    };

    const sendFriendRequest = async (userId: string) => {
        try {
            await apiService.sendFriendRequest(userId);
            alert('Demande envoyée !');
            setSearchResults(prev => prev.filter(p => p.id !== userId));
            loadFriends(); // Refresh list to maybe see pending
        } catch (error) {
            alert('Erreur lors de la demande : ' + (error as any).message);
        }
    };

    const acceptRequest = async (friendshipId: string) => {
        try {
            await apiService.acceptFriendRequest(friendshipId);
            loadFriends();
        } catch (error) {
            console.error('Erreur acceptation:', error);
        }
    };

    const deleteFriend = async (friendshipId: string) => {
        if (!confirm('Voulez-vous vraiment supprimer cet ami ?')) return;
        try {
            await apiService.deleteFriendship(friendshipId);
            loadFriends();
        } catch (error) {
            console.error('Erreur suppression:', error);
        }
    };

    const startChat = (friend: Friend) => {
        if (friend.status !== 'accepted') {
            alert("Vous devez être amis pour discuter !");
            return;
        }
        setSelectedFriendForChat({ id: friend.friendId, pseudo: friend.pseudo });
        setActiveTab('messages');
    };

    return (
        <div className="pb-20">
            {/* Tab Navigation */}
            <div className="flex bg-white shadow-sm mb-4 sticky top-0 z-10">
                <button
                    onClick={() => setActiveTab('mur')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'mur' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'}`}
                >
                    Le Mur
                </button>
                <button
                    onClick={() => setActiveTab('amis')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'amis' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'}`}
                >
                    Mes Amis
                </button>
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'messages' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'}`}
                >
                    Messages
                </button>
            </div>

            <div className="px-4">
                {/* TAB: MUR */}
                {activeTab === 'mur' && <MurPublic />}

                {/* TAB: AMIS */}
                {activeTab === 'amis' && (
                    <div className="space-y-6 max-w-2xl mx-auto">
                        {/* Recherche */}
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                                <UserPlus size={18} /> Ajouter un ami
                            </h3>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Rechercher par pseudo..."
                                    value={friendQuery}
                                    onChange={(e) => handleSearchUsers(e.target.value)}
                                    className="w-full bg-gray-50 pl-10 pr-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-orange-500"
                                />
                            </div>
                            {searchResults.length > 0 && (
                                <div className="mt-3 space-y-2">
                                    {searchResults.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                            <span className="font-medium">{user.pseudo}</span>
                                            <button
                                                onClick={() => sendFriendRequest(user.id)}
                                                className="bg-orange-500 text-white px-3 py-1 rounded-lg text-xs font-bold"
                                            >
                                                Ajouter
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Liste des amis */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-gray-700">Mes Amis ({friends.filter(f => f.status === 'accepted').length})</h3>
                            {friends.length === 0 && <p className="text-gray-400 text-sm italic">Aucun ami pour le moment.</p>}

                            {friends.map(friend => (
                                <div key={friend.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-600 font-bold">
                                            {friend.pseudo.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{friend.pseudo}</p>
                                            <p className="text-xs text-gray-500">
                                                {friend.status === 'pending'
                                                    ? (friend.initiatedByMe ? 'En attente...' : 'Demande reçue')
                                                    : 'Ami(e)'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {friend.status === 'accepted' && (
                                            <button onClick={() => startChat(friend)} className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                <MessageSquare size={18} />
                                            </button>
                                        )}

                                        {friend.status === 'pending' && !friend.initiatedByMe && (
                                            <button onClick={() => acceptRequest(friend.id)} className="p-2 bg-green-100 text-green-600 rounded-lg">
                                                <Check size={18} />
                                            </button>
                                        )}

                                        <button onClick={() => deleteFriend(friend.id)} className="p-2 bg-red-50 text-red-500 rounded-lg">
                                            <X size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB: MESSAGES */}
                {activeTab === 'messages' && (
                    <div className="max-w-2xl mx-auto h-[600px]">
                        {selectedFriendForChat ? (
                            <div className="h-full flex flex-col">
                                <button
                                    onClick={() => setSelectedFriendForChat(null)}
                                    className="mb-2 text-sm text-gray-500 flex items-center gap-1 hover:text-gray-700"
                                >
                                    ← Retour aux discussions
                                </button>
                                <ChatInterface
                                    friendId={selectedFriendForChat.id}
                                    friendPseudo={selectedFriendForChat.pseudo}
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <h3 className="font-bold text-gray-700 mb-4">Discussions</h3>
                                {friends.filter(f => f.status === 'accepted').length === 0 ? (
                                    <div className="text-center py-10 text-gray-400">
                                        <p>Ajoutez des amis pour commencer à discuter !</p>
                                        <button onClick={() => setActiveTab('amis')} className="mt-2 text-orange-500 font-bold text-sm">Aller aux amis</button>
                                    </div>
                                ) : (
                                    friends.filter(f => f.status === 'accepted').map(friend => (
                                        <div
                                            key={friend.id}
                                            onClick={() => startChat(friend)}
                                            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                                                {friend.pseudo.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800">{friend.pseudo}</p>
                                                <p className="text-xs text-green-500 font-medium">Cliquez pour discuter</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
