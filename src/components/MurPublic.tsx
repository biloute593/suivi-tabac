import { useState, useEffect } from 'react';
import {
  Trophy,
  MessageCircle,
  Camera,
  Calendar,
  Send,
  UserPlus
} from 'lucide-react';
import { apiService, type Post, type PostComment } from '../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Mégot personnalisé pour le Like
const MegotIcon = ({ filled }: { filled: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-5 h-5 transition-all ${filled ? 'fill-orange-600 stroke-orange-700 scale-125' : 'fill-none stroke-gray-500 hover:stroke-orange-500'}`}
    strokeWidth="2"
  >
    <path d="M6 18c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V8H6v10z" />
    <path d="M19 8H5c-1.1 0-2-.9-2-2s.9-2 2-2h14c1.1 0 2 .9 2 2s-.9 2-2 2z" />
    <path d="M12 20v-5M8 20v-3M16 20v-3" />
    {filled && <path d="M11 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" className="animate-ping" />}
  </svg>
);

export default function MurPublic() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postCaption, setPostCaption] = useState('');
  const [postType, setPostType] = useState<'performance' | 'analyse'>('performance');
  const [postDateTime, setPostDateTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [activeComments, setActiveComments] = useState<Record<string, PostComment[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPosts();
      setPosts(data);
    } catch (error) {
      console.error('Erreur posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const isLiked = await apiService.toggleLike(postId);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            isLikedByMe: isLiked,
            likesCount: isLiked ? p.likesCount + 1 : p.likesCount - 1
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const toggleComments = async (postId: string) => {
    if (activeComments[postId]) {
      const newComments = { ...activeComments };
      delete newComments[postId];
      setActiveComments(newComments);
    } else {
      try {
        const comments = await apiService.getComments(postId);
        setActiveComments({ ...activeComments, [postId]: comments });
      } catch (error) {
        console.error('Comments error:', error);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = commentInputs[postId];
    if (!text?.trim()) return;

    try {
      const newComment = await apiService.addComment(postId, text);
      setActiveComments({
        ...activeComments,
        [postId]: [...(activeComments[postId] || []), newComment]
      });
      setCommentInputs({ ...commentInputs, [postId]: '' });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
    } catch (error) {
      console.error('Add comment error:', error);
    }
  };

  const handleCreatePost = async () => {
    try {
      await apiService.createPost({
        type: postType,
        caption: postCaption,
        publishedAt: new Date(postDateTime).toISOString(),
        statsData: {} // Dans une version ultérieure, extraire les stats de la db à cette date
      });
      setShowCreatePost(false);
      setPostCaption('');
      loadPosts();
    } catch (error) {
      alert('Erreur lors de la publication');
    }
  };

  if (loading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-gray-500">Chargement du mur public...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-20">
      {/* Header Mural */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
        <SparklesBackground />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter">LE MUR</h2>
            <p className="text-orange-100 font-medium tracking-tight">Partagez votre combat 🚭</p>
          </div>
          <button
            onClick={() => setShowCreatePost(true)}
            className="bg-white text-orange-600 px-6 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Camera size={20} />
            Publier
          </button>
        </div>
      </div>

      {/* Liste des Posts */}
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-slide-up">
            {/* Post Header */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-bold text-xl uppercase shadow-inner">
                  {post.userPseudo?.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{post.userPseudo}</h4>
                    <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      {post.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">
                    {format(new Date(post.publishedAt), "d MMM 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => alert('Invitation envoyée !')}
                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                title="Inviter à discuter"
              >
                <UserPlus size={20} />
              </button>
            </div>

            {/* Post Content */}
            <div className="px-4 pb-4">
              {post.caption && (
                <p className="text-gray-800 dark:text-gray-200 mb-4 whitespace-pre-wrap leading-relaxed">
                  {post.caption}
                </p>
              )}

              {post.type === 'performance' && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 grid grid-cols-3 gap-2">
                  <StatBox label="Jours" value={post.statsData?.jours || '?'} color="text-blue-500" />
                  <StatBox label="Cigs" value={post.statsData?.cigs || '?'} color="text-red-500" />
                  <StatBox label="Santé" value={(post.statsData?.sante || 0) + '%'} color="text-green-500" />
                </div>
              )}
            </div>

            {/* Post Actions (Likes & Comm) */}
            <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-700 flex items-center gap-6">
              <button
                onClick={() => handleLike(post.id)}
                className="flex items-center gap-2 group"
              >
                <MegotIcon filled={!!post.isLikedByMe} />
                <span className={`text-sm font-bold ${post.isLikedByMe ? 'text-orange-600' : 'text-gray-500'}`}>
                  {post.likesCount}
                </span>
              </button>

              <button
                onClick={() => toggleComments(post.id)}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-500 group transition-colors"
              >
                <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold">{post.commentsCount}</span>
              </button>
            </div>

            {/* Section Commentaires */}
            {activeComments[post.id] && (
              <div className="bg-gray-50 dark:bg-gray-900/30 p-4 space-y-4 border-t border-gray-100 dark:border-gray-700 animate-expand-vertical">
                <div className="space-y-3">
                  {activeComments[post.id].map(comment => (
                    <div key={comment.id} className="flex gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                        {comment.userPseudo?.charAt(0)}
                      </div>
                      <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-100 border-gray-700 flex-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-white mb-1">{comment.userPseudo}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                    placeholder="Écrire un commentaire..."
                    className="flex-1 bg-white dark:bg-gray-800 border-none rounded-2xl px-4 py-2 text-sm shadow-inner focus:ring-2 focus:ring-orange-500"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                  />
                  <button
                    onClick={() => handleAddComment(post.id)}
                    className="p-2 bg-orange-500 text-white rounded-xl shadow-lg hover:bg-orange-600 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modale Création de Post */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-pop-in">
            <div className="p-6 bg-gradient-to-br from-orange-500 to-red-600 text-white">
              <h3 className="text-2xl font-black italic tracking-tighter">NOUVEAU POST</h3>
              <p className="opacity-80 text-sm">Quoi de neuf aujourd'hui ?</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Type de post */}
              <div className="flex gap-2">
                <PostTypeBtn
                  active={postType === 'performance'}
                  onClick={() => setPostType('performance')}
                  label="Performance"
                  icon={<Trophy size={16} />}
                />
                <PostTypeBtn
                  active={postType === 'analyse'}
                  onClick={() => setPostType('analyse')}
                  label="Analyse"
                  icon={<Calendar size={16} />}
                />
              </div>

              {/* Date / Heure précise */}
              <div className="grid grid-cols-1 gap-3">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Date & Heure de publication</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                  <input
                    type="datetime-local"
                    value={postDateTime}
                    onChange={(e) => setPostDateTime(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-gray-700 dark:text-gray-200"
                  />
                </div>
              </div>

              {/* Légende */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Légende</label>
                <textarea
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  placeholder="Écrivez votre message ici..."
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-3xl p-4 min-h-[120px] text-sm focus:ring-2 focus:ring-orange-500 transition-all shadow-inner"
                />
              </div>

              {/* Photo Optionnelle (UI Placeholder) */}
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-6 text-center hover:border-orange-300 transition-colors cursor-pointer group">
                <Camera size={32} className="mx-auto text-gray-400 group-hover:text-orange-400 mb-2" />
                <p className="text-xs font-bold text-gray-400 group-hover:text-orange-500">AJOUTER UNE PHOTO</p>
                <p className="text-[10px] text-gray-300">Optionnels</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreatePost}
                  disabled={!postCaption.trim() && postType !== 'performance'}
                  className="flex-2 py-4 bg-orange-500 text-white rounded-2xl font-black italic tracking-widest shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-all disabled:opacity-50"
                >
                  PUBLIER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Composants Internes Utilitaires
function StatBox({ label, value, color }: { label: string, value: string | number, color: string }) {
  return (
    <div className="text-center p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-50 dark:border-gray-700">
      <div className={`text-lg font-black ${color}`}>{value}</div>
      <div className="text-[10px] font-bold text-gray-400 uppercase">{label}</div>
    </div>
  );
}

function PostTypeBtn({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${active
        ? 'bg-orange-500 text-white shadow-md'
        : 'bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SparklesBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-20">
      <div className="absolute top-0 left-0 w-32 h-32 bg-white blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-400 blur-3xl translate-x-1/2 translate-y-1/2"></div>
    </div>
  );
}
