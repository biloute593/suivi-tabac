// Service API pour communiquer avec Supabase (100% GRATUIT)
import { supabase } from './supabaseClient';
import CryptoJS from 'crypto-js';

export interface Journee {
  id: string;
  userId: string;
  date: string;
  typeJournee: 'travail' | 'teletravail' | 'weekend' | 'repos';
  objectifNombreMax?: number;
  createdAt: string;
}

export interface Cigarette {
  id: string;
  userId: string;
  journeeId: string;
  numero: number;
  heure: string;
  lieu: string;
  type: string;
  besoin: number;
  satisfaction: number;
  quantite: string;
  situation: string;
  commentaire?: string;
  kudzuPris: boolean;
  scoreCalcule: number;
  createdAt: string;
}

export interface Objectif {
  id: string;
  userId: string;
  dateDebut: string;
  nombreMax: number;
  actif: boolean;
  createdAt: string;
}

export interface JournalNote {
  id: string;
  userId: string;
  date: string;
  contenu: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Post {
  id: string;
  userId: string;
  userPseudo?: string;
  type: 'performance' | 'analyse' | 'image';
  caption?: string;
  imageUrl?: string;
  statsData?: any;
  publishedAt: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByMe?: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  userPseudo?: string;
  content: string;
  createdAt: string;
}

export interface ChatInvitation {
  id: string;
  senderId: string;
  senderPseudo?: string;
  receiverId: string;
  receiverPseudo?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}


export interface Friend {
  id: string;
  friendId: string;
  pseudo: string;
  status: 'pending' | 'accepted' | 'blocked';
  initiatedByMe: boolean;
  createdAt: string;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
  isMyMessage: boolean;
}

class ApiService {
  private getCurrentUserId(): string {
    const user = localStorage.getItem('suivi-tabac-current-user');
    if (!user) throw new Error('Non authentifié');
    return JSON.parse(user).userId;
  }

  // Authentification
  async register(pseudo: string, password: string, objectifGlobal: number = 12): Promise<any> {
    // Hash du mot de passe
    const passwordHash = CryptoJS.SHA256(password).toString();

    const { data, error } = await supabase
      .from('users')
      .insert({
        pseudo,
        password_hash: passwordHash,
        objectif_global: objectifGlobal,
        share_public: false
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('Ce pseudo est déjà utilisé');
      throw new Error('Erreur lors de l\'inscription');
    }

    return {
      userId: data.user_id,
      pseudo: data.pseudo,
      objectifGlobal: data.objectif_global,
      sharePublic: data.share_public
    };
  }

  async login(pseudo: string, password: string): Promise<any> {
    const passwordHash = CryptoJS.SHA256(password).toString();

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('pseudo', pseudo)
      .eq('password_hash', passwordHash)
      .single();

    if (error || !data) {
      throw new Error('Pseudo ou mot de passe incorrect');
    }

    return {
      userId: data.user_id,
      pseudo: data.pseudo,
      objectifGlobal: data.objectif_global,
      sharePublic: data.share_public
    };
  }

  // Journées
  async getJournees(): Promise<Journee[]> {
    const userId = this.getCurrentUserId();
    const { data, error } = await supabase
      .from('journees')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw new Error('Erreur chargement journées');
    return data.map(j => ({
      id: j.id,
      userId: j.user_id,
      date: j.date,
      typeJournee: j.type_journee,
      objectifNombreMax: j.objectif_nombre_max,
      createdAt: j.created_at
    }));
  }

  async createJournee(journee: Omit<Journee, 'id' | 'createdAt'>): Promise<Journee> {
    const userId = this.getCurrentUserId();
    const { data, error } = await supabase
      .from('journees')
      .insert({
        user_id: userId,
        date: journee.date,
        type_journee: journee.typeJournee,
        objectif_nombre_max: journee.objectifNombreMax
      })
      .select()
      .single();

    if (error) throw new Error('Erreur création journée');
    return {
      id: data.id,
      userId: data.user_id,
      date: data.date,
      typeJournee: data.type_journee,
      objectifNombreMax: data.objectif_nombre_max,
      createdAt: data.created_at
    };
  }

  async updateJournee(id: string, journee: Partial<Journee>): Promise<Journee> {
    const userId = this.getCurrentUserId();
    const updateData: any = {};
    if (journee.typeJournee) updateData.type_journee = journee.typeJournee;
    if (journee.objectifNombreMax !== undefined) updateData.objectif_nombre_max = journee.objectifNombreMax;

    const { data, error } = await supabase
      .from('journees')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error('Erreur mise à jour journée');
    return {
      id: data.id,
      userId: data.user_id,
      date: data.date,
      typeJournee: data.type_journee,
      objectifNombreMax: data.objectif_nombre_max,
      createdAt: data.created_at
    };
  }

  async deleteJournee(id: string): Promise<void> {
    const userId = this.getCurrentUserId();
    const { error } = await supabase
      .from('journees')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error('Erreur suppression journée');
  }

  // Cigarettes
  async getCigarettes(journeeId?: string): Promise<Cigarette[]> {
    const userId = this.getCurrentUserId();
    let query = supabase
      .from('cigarettes')
      .select('*')
      .eq('user_id', userId);

    if (journeeId) {
      query = query.eq('journee_id', journeeId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw new Error('Erreur chargement cigarettes');
    return data.map(c => ({
      id: c.id,
      userId: c.user_id,
      journeeId: c.journee_id,
      numero: c.numero,
      heure: c.heure,
      lieu: c.lieu,
      type: c.type,
      besoin: c.besoin,
      satisfaction: c.satisfaction,
      quantite: c.quantite,
      situation: c.situation,
      commentaire: c.commentaire,
      kudzuPris: c.kudzu_pris,
      scoreCalcule: c.score_calcule,
      createdAt: c.created_at
    }));
  }

  async createCigarette(cigarette: Omit<Cigarette, 'id' | 'createdAt'>): Promise<Cigarette> {
    const userId = this.getCurrentUserId();
    const { data, error } = await supabase
      .from('cigarettes')
      .insert({
        user_id: userId,
        journee_id: cigarette.journeeId,
        numero: cigarette.numero,
        heure: cigarette.heure,
        lieu: cigarette.lieu,
        type: cigarette.type,
        besoin: cigarette.besoin,
        satisfaction: cigarette.satisfaction,
        quantite: cigarette.quantite,
        situation: cigarette.situation,
        commentaire: cigarette.commentaire,
        kudzu_pris: cigarette.kudzuPris,
        score_calcule: cigarette.scoreCalcule
      })
      .select()
      .single();

    if (error) throw new Error('Erreur création cigarette');
    return {
      id: data.id,
      userId: data.user_id,
      journeeId: data.journee_id,
      numero: data.numero,
      heure: data.heure,
      lieu: data.lieu,
      type: data.type,
      besoin: data.besoin,
      satisfaction: data.satisfaction,
      quantite: data.quantite,
      situation: data.situation,
      commentaire: data.commentaire,
      kudzuPris: data.kudzu_pris,
      scoreCalcule: data.score_calcule,
      createdAt: data.created_at
    };
  }

  async updateCigarette(id: string, cigarette: Partial<Cigarette>): Promise<Cigarette> {
    const userId = this.getCurrentUserId();
    const updateData: any = {};
    if (cigarette.numero !== undefined) updateData.numero = cigarette.numero;
    if (cigarette.heure) updateData.heure = cigarette.heure;
    if (cigarette.lieu) updateData.lieu = cigarette.lieu;
    if (cigarette.type) updateData.type = cigarette.type;
    if (cigarette.besoin !== undefined) updateData.besoin = cigarette.besoin;
    if (cigarette.satisfaction !== undefined) updateData.satisfaction = cigarette.satisfaction;
    if (cigarette.quantite) updateData.quantite = cigarette.quantite;
    if (cigarette.situation) updateData.situation = cigarette.situation;
    if (cigarette.commentaire !== undefined) updateData.commentaire = cigarette.commentaire;
    if (cigarette.kudzuPris !== undefined) updateData.kudzu_pris = cigarette.kudzuPris;
    if (cigarette.scoreCalcule !== undefined) updateData.score_calcule = cigarette.scoreCalcule;

    const { data, error } = await supabase
      .from('cigarettes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error('Erreur mise à jour cigarette');
    return {
      id: data.id,
      userId: data.user_id,
      journeeId: data.journee_id,
      numero: data.numero,
      heure: data.heure,
      lieu: data.lieu,
      type: data.type,
      besoin: data.besoin,
      satisfaction: data.satisfaction,
      quantite: data.quantite,
      situation: data.situation,
      commentaire: data.commentaire,
      kudzuPris: data.kudzu_pris,
      scoreCalcule: data.score_calcule,
      createdAt: data.created_at
    };
  }

  async deleteCigarette(id: string): Promise<void> {
    const userId = this.getCurrentUserId();
    const { error } = await supabase
      .from('cigarettes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error('Erreur suppression cigarette');
  }

  // Objectifs
  async getObjectifs(): Promise<Objectif[]> {
    const userId = this.getCurrentUserId();
    const { data, error } = await supabase
      .from('objectifs')
      .select('*')
      .eq('user_id', userId)
      .order('date_debut', { ascending: false });

    if (error) throw new Error('Erreur chargement objectifs');
    return data.map(o => ({
      id: o.id,
      userId: o.user_id,
      dateDebut: o.date_debut,
      nombreMax: o.nombre_max,
      actif: o.actif,
      createdAt: o.created_at
    }));
  }

  async createObjectif(objectif: Omit<Objectif, 'id' | 'createdAt'>): Promise<Objectif> {
    const userId = this.getCurrentUserId();
    const { data, error } = await supabase
      .from('objectifs')
      .insert({
        user_id: userId,
        date_debut: objectif.dateDebut,
        nombre_max: objectif.nombreMax,
        actif: objectif.actif
      })
      .select()
      .single();

    if (error) throw new Error('Erreur création objectif');
    return {
      id: data.id,
      userId: data.user_id,
      dateDebut: data.date_debut,
      nombreMax: data.nombre_max,
      actif: data.actif,
      createdAt: data.created_at
    };
  }

  async updateObjectif(id: string, objectif: Partial<Objectif>): Promise<Objectif> {
    const userId = this.getCurrentUserId();
    const updateData: any = {};
    if (objectif.nombreMax !== undefined) updateData.nombre_max = objectif.nombreMax;
    if (objectif.actif !== undefined) updateData.actif = objectif.actif;

    const { data, error } = await supabase
      .from('objectifs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error('Erreur mise à jour objectif');
    return {
      id: data.id,
      userId: data.user_id,
      dateDebut: data.date_debut,
      nombreMax: data.nombre_max,
      actif: data.actif,
      createdAt: data.created_at
    };
  }

  // Journal notes
  async getJournalNotes(): Promise<JournalNote[]> {
    const userId = this.getCurrentUserId();
    const { data, error } = await supabase
      .from('journal_notes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw new Error('Erreur chargement notes journal');
    return data.map(n => ({
      id: n.id,
      userId: n.user_id,
      date: n.date,
      contenu: n.contenu,
      createdAt: n.created_at,
      updatedAt: n.updated_at
    }));
  }

  async createJournalNote(note: Omit<JournalNote, 'id' | 'createdAt'>): Promise<JournalNote> {
    const userId = this.getCurrentUserId();
    const { data, error } = await supabase
      .from('journal_notes')
      .insert({
        user_id: userId,
        date: note.date,
        contenu: note.contenu
      })
      .select()
      .single();

    if (error) throw new Error('Erreur création note journal');
    return {
      id: data.id,
      userId: data.user_id,
      date: data.date,
      contenu: data.contenu,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async updateJournalNote(id: string, note: Partial<JournalNote>): Promise<JournalNote> {
    const userId = this.getCurrentUserId();
    const updateData: any = { updated_at: new Date().toISOString() };
    if (note.contenu) updateData.contenu = note.contenu;

    const { data, error } = await supabase
      .from('journal_notes')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error('Erreur mise à jour note journal');
    return {
      id: data.id,
      userId: data.user_id,
      date: data.date,
      contenu: data.contenu,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async deleteJournalNote(id: string): Promise<void> {
    const userId = this.getCurrentUserId();
    const { error } = await supabase
      .from('journal_notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw new Error('Erreur suppression note journal');
  }

  // Profil
  async getProfil(): Promise<any> {
    const userId = this.getCurrentUserId();
    const { data, error } = await supabase
      .from('users')
      .select('pseudo, objectif_global, share_public')
      .eq('user_id', userId)
      .single();

    if (error) throw new Error('Erreur chargement profil');
    return {
      pseudo: data.pseudo,
      objectifGlobal: data.objectif_global,
      sharePublic: data.share_public
    };
  }

  async createProfil(_data: { pseudo: string }): Promise<any> {
    throw new Error('Utiliser register() pour créer un profil');
  }

  async updateProfil(data: { pseudo?: string; objectifGlobal?: number }): Promise<any> {
    const userId = this.getCurrentUserId();
    const updateData: any = {};
    if (data.pseudo !== undefined) updateData.pseudo = data.pseudo;
    if (data.objectifGlobal !== undefined) updateData.objectif_global = data.objectifGlobal;

    const { data: updated, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new Error('Ce pseudo est déjà utilisé');
      throw new Error('Erreur mise à jour profil');
    }

    return {
      pseudo: updated.pseudo,
      objectifGlobal: updated.objectif_global,
      sharePublic: updated.share_public
    };
  }

  async getUserMetadata(): Promise<{
    dateNaissance?: string;
    debutTabagisme?: string;
    cigarettesParJourMax?: number;
  }> {
    const userId = this.getCurrentUserId();
    const { data, error } = await supabase
      .from('user_metadata')
      .select('date_naissance, debut_tabagisme, cigarettes_par_jour_max')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Si la table n'existe pas encore ou pas d'entrée, retourner des valeurs par défaut
      if (error.code === 'PGRST116' || error.code === 'PGRST205') {
        return { cigarettesParJourMax: 20 };
      }
      throw new Error('Erreur chargement métadonnées utilisateur');
    }

    return {
      dateNaissance: data?.date_naissance || undefined,
      debutTabagisme: data?.debut_tabagisme || undefined,
      cigarettesParJourMax: data?.cigarettes_par_jour_max || 20
    };
  }

  async updateUserMetadata(metadata: {
    dateNaissance?: string;
    debutTabagisme?: string;
    cigarettesParJourMax?: number;
  }): Promise<void> {
    const userId = this.getCurrentUserId();
    const { error } = await supabase
      .from('user_metadata')
      .upsert({
        user_id: userId,
        date_naissance: metadata.dateNaissance || null,
        debut_tabagisme: metadata.debutTabagisme || null,
        cigarettes_par_jour_max: metadata.cigarettesParJourMax || 20,
        updated_at: new Date().toISOString()
      });

    if (error) {
      throw new Error('Erreur mise à jour métadonnées utilisateur');
    }
  }

  // --- SOCIAL & MUR PUBLIC ---

  async getPosts(limit: number = 20): Promise<Post[]> {
    const currentUserId = this.getCurrentUserId();
    const { data, error } = await supabase
      .from('posts')
      .select('*, users(pseudo), post_likes(user_id), post_comments(count)')
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error('Erreur chargement des posts');

    return (data as any[]).map(p => {
      const post: Post = {
        id: p.id,
        userId: p.user_id,
        userPseudo: p.users?.pseudo || 'Utilisateur',
        type: p.type,
        caption: p.caption,
        imageUrl: p.image_url,
        statsData: p.stats_data,
        publishedAt: p.published_at,
        createdAt: p.created_at,
        likesCount: p.post_likes?.length || 0,
        commentsCount: p.post_comments?.[0]?.count || 0,
        isLikedByMe: p.post_likes?.some((l: any) => l.user_id === currentUserId)
      };
      return post;
    });
  }

  async createPost(post: any): Promise<Post> {
    const userId = this.getCurrentUserId();
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        type: post.type,
        caption: post.caption,
        image_url: post.imageUrl,
        stats_data: post.statsData,
        published_at: post.publishedAt
      })
      .select()
      .single();

    if (error) throw new Error('Erreur création du post');
    const d = data as any;
    return {
      id: d.id,
      userId: d.user_id,
      type: d.type,
      caption: d.caption,
      imageUrl: d.image_url,
      statsData: d.stats_data,
      publishedAt: d.published_at,
      createdAt: d.created_at,
      likesCount: 0,
      commentsCount: 0
    };
  }

  async toggleLike(postId: string): Promise<boolean> {
    const userId = this.getCurrentUserId();

    // Vérifier si déjà liké
    const { data: existing } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase.from('post_likes').delete().eq('id', existing.id);
      return false; // Unlike
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: userId });
      return true; // Like
    }
  }

  async getComments(postId: string): Promise<PostComment[]> {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*, users(pseudo)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw new Error('Erreur chargement des commentaires');
    return data.map(c => ({
      id: c.id,
      postId: c.post_id,
      userId: c.user_id,
      userPseudo: c.users?.pseudo || 'Anonyme',
      content: c.content,
      createdAt: c.created_at
    }));
  }

  async addComment(postId: string, content: string): Promise<PostComment> {
    const userId = this.getCurrentUserId();
    const { data, error } = await supabase
      .from('post_comments')
      .insert({ post_id: postId, user_id: userId, content })
      .select('*, users(pseudo)')
      .single();

    if (error) throw new Error('Erreur ajout commentaire');
    return {
      id: data.id,
      postId: data.post_id,
      userId: data.user_id,
      userPseudo: data.users?.pseudo || 'Moi',
      content: data.content,
      createdAt: data.created_at
    };
  }

  // --- INVITATIONS & CHAT ---

  async sendChatInvitation(receiverId: string): Promise<void> {
    const senderId = this.getCurrentUserId();
    const { error } = await supabase
      .from('chat_invitations')
      .insert({ sender_id: senderId, receiver_id: receiverId, status: 'pending' });

    if (error) throw new Error('Erreur envoi invitation');
  }

  async getChatInvitations(): Promise<ChatInvitation[]> {
    const userId = this.getCurrentUserId();
    const { data, error } = await supabase
      .from('chat_invitations')
      .select('*, sender:users!sender_id(pseudo), receiver:users!receiver_id(pseudo)')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

    if (error) throw new Error('Erreur chargement invitations');
    return data.map(i => ({
      id: i.id,
      senderId: i.sender_id,
      senderPseudo: i.sender?.pseudo,
      receiverId: i.receiver_id,
      receiverPseudo: i.receiver?.pseudo,
      status: i.status,
      createdAt: i.created_at
    }));
  }

  // --- AMIS & MESSAGERIE PRIVÉE ---

  // --- AMIS & MESSAGERIE PRIVÉE ---

  // Rechercher des utilisateurs par pseudo
  async searchUsers(query: string): Promise<{ id: string, pseudo: string }[]> {
    if (!query || query.length < 3) return [];

    const { data, error } = await supabase
      .from('users')
      .select('user_id, pseudo')
      .ilike('pseudo', `%${query}%`)
      .limit(10);

    if (error) return [];
    return (data as any[]).map(u => ({ id: u.user_id, pseudo: u.pseudo }));
  }

  // Liste des amis
  async getFriends(): Promise<Friend[]> {
    const userId = this.getCurrentUserId();

    // Récupérer les amitiés acceptées ou en attente où on est impliqué
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id, 
        user_id, 
        friend_id, 
        status, 
        created_at,
        friend:users!friend_id(pseudo),
        user:users!user_id(pseudo)
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) throw new Error('Erreur chargement amis');

    return data.map(f => {
      // Déterminer qui est l'autre personne
      const isMeInitiator = f.user_id === userId;
      const otherId = isMeInitiator ? f.friend_id : f.user_id;
      const otherPseudo = isMeInitiator ? (f.friend as any)?.pseudo || (f.friend as any)?.[0]?.pseudo : (f.user as any)?.pseudo || (f.user as any)?.[0]?.pseudo;

      return {
        id: f.id,
        friendId: otherId,
        pseudo: otherPseudo || 'Utilisateur',
        status: f.status as 'pending' | 'accepted' | 'blocked',
        initiatedByMe: isMeInitiator,
        createdAt: f.created_at
      };
    });
  }

  // Envoyer une demande d'ami
  async sendFriendRequest(friendId: string): Promise<void> {
    const userId = this.getCurrentUserId();

    // Vérifier si une amitié existe déjà dans un sens ou l'autre
    const { data: existing } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .single();

    if (existing) throw new Error('Une relation existe déjà avec cet utilisateur');

    const { error } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending'
      });

    if (error) throw new Error('Erreur envoi demande d\'ami');
  }

  // Accepter une demande
  async acceptFriendRequest(friendshipId: string): Promise<void> {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (error) throw new Error('Erreur acceptation demande');
  }

  // Refuser / Supprimer un ami
  async deleteFriendship(friendshipId: string): Promise<void> {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) throw new Error('Erreur suppression ami');
  }

  // Récupérer les messages avec un ami
  async getMessages(friendId: string): Promise<PrivateMessage[]> {
    const userId = this.getCurrentUserId();

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (error) throw new Error('Erreur chargement messages');

    return data.map(m => ({
      id: m.id,
      senderId: m.sender_id,
      receiverId: m.receiver_id,
      content: m.content,
      read: m.read,
      createdAt: m.created_at,
      isMyMessage: m.sender_id === userId
    }));
  }

  // Envoyer un message privé
  async sendMessage(friendId: string, content: string): Promise<PrivateMessage> {
    const userId = this.getCurrentUserId();

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: userId,
        receiver_id: friendId,
        content
      })
      .select()
      .single();

    if (error) throw new Error('Erreur envoi message');

    return {
      id: data.id,
      senderId: data.sender_id,
      receiverId: data.receiver_id,
      content: data.content,
      read: data.read,
      createdAt: data.created_at,
      isMyMessage: true
    };
  }
}

export const apiService = new ApiService();
