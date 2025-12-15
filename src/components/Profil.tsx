import React, { useState, useEffect } from 'react';
import { X, BookOpen, User as UserIcon } from 'lucide-react';
import { db } from '../db/database';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Save, Trash2, Edit3, Calendar } from 'lucide-react';
import type { JournalNote } from '../types';
import { apiService } from '../services/api';

interface Profil {
  id: string;
  pseudo: string;
  objectifGlobal: number;
  createdAt: string;
  updatedAt?: string;
}

interface Props {
  onClose?: () => void;
}

export function Profil({ onClose }: Props) {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [pseudo, setPseudo] = useState('');
  const [objectifGlobal, setObjectifGlobal] = useState(12);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  
  // États pour le Journal
  const [activeTab, setActiveTab] = useState<'profil' | 'journal'>('profil');
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [contenu, setContenu] = useState('');
  const [editingNote, setEditingNote] = useState<JournalNote | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    chargerProfil();
    chargerNotes();
  }, []);

  useEffect(() => {
    const noteForDate = notes.find((n) => n.date === selectedDate);
    if (noteForDate) {
      setEditingNote(noteForDate);
      setContenu(noteForDate.contenu);
    } else {
      setEditingNote(null);
      setContenu('');
    }
  }, [selectedDate, notes]);

  const chargerProfil = async () => {
    setLoading(true);
    try {
      const profilData = await apiService.getProfil();
      const profilFromApi: Profil = {
        id: 'current',
        pseudo: profilData.pseudo,
        objectifGlobal: profilData.objectifGlobal || 12,
        createdAt: new Date().toISOString()
      };
      setProfil(profilFromApi);
      setPseudo(profilData.pseudo);
      setObjectifGlobal(profilData.objectifGlobal || 12);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess('');

    if (!pseudo.trim()) {
      return;
    }

    try {
      await apiService.updateProfil({
        pseudo: pseudo.trim(),
        objectifGlobal: objectifGlobal
      });
      
      const updatedProfil: Profil = {
        id: profil?.id || 'current',
        pseudo: pseudo.trim(),
        objectifGlobal: objectifGlobal,
        createdAt: profil?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setProfil(updatedProfil);
      setIsEditing(false);
      setSuccess('Profil sauvegardé ! 💚');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde profil:', error);
      setSuccess('❌ Erreur lors de la sauvegarde');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleCancel = () => {
    if (profil) {
      setPseudo(profil.pseudo);
      setIsEditing(false);
    }
  };

  // Fonctions pour le Journal
  async function chargerNotes() {
    try {
      const allNotes = await db.journalNotes.toArray();
      setNotes(allNotes.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (error) {
      console.error('Erreur chargement notes:', error);
    }
  }

  function afficherMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleSaveNote() {
    if (!contenu.trim()) {
      afficherMessage('❌ Le contenu ne peut pas être vide.');
      return;
    }

    try {
      setSaving(true);
      if (editingNote) {
        await db.journalNotes.update(editingNote.id!, {
          contenu,
          updatedAt: new Date().toISOString()
        });
        afficherMessage('✅ Note mise à jour.');
      } else {
        await db.journalNotes.add({
          date: selectedDate,
          contenu,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        afficherMessage('✅ Note créée.');
      }
      await chargerNotes();
    } catch (error) {
      console.error('Erreur sauvegarde note:', error);
      afficherMessage('❌ Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteNote() {
    if (!editingNote) return;
    if (!window.confirm('Supprimer cette note ?')) return;

    try {
      setSaving(true);
      await db.journalNotes.delete(editingNote.id!);
      afficherMessage('✅ Note supprimée.');
      setContenu('');
      setEditingNote(null);
      await chargerNotes();
    } catch (error) {
      console.error('Erreur suppression note:', error);
      afficherMessage('❌ Erreur lors de la suppression.');
    } finally {
      setSaving(false);
    }
  }

  function handleNoteClick(note: JournalNote) {
    setSelectedDate(note.date);
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">👤 Mon Profil</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="bg-gray-100 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 p-2 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-6 bg-white dark:bg-gray-800 rounded-xl p-1 shadow-sm border border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('profil')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'profil'
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <UserIcon size={20} />
          Profil
        </button>
        <button
          onClick={() => setActiveTab('journal')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-semibold transition-all ${
            activeTab === 'journal'
              ? 'bg-primary-600 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <BookOpen size={20} />
          Journal
        </button>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg">
          {success}
        </div>
      )}

      {/* Contenu Profil */}
      {activeTab === 'profil' && (
        <>
          {!isEditing && profil ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {profil.pseudo.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{profil.pseudo}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  🗓️ Membre depuis le {new Date(profil.createdAt).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">
                  🎯 Objectif: {profil.objectifGlobal} cigarettes/jour
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-all shadow-md"
            >
              ✏️ Modifier
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
          <div className="mb-6">
            <label htmlFor="pseudo" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              👤 Ton pseudo
            </label>
            <input
              type="text"
              id="pseudo"
              value={pseudo}
              onChange={(e) => setPseudo(e.target.value)}
              maxLength={30}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Entre ton pseudo"
              required
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Maximum 30 caractères
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="objectif" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              🎯 Objectif quotidien (nombre maximum de cigarettes)
            </label>
            <input
              type="number"
              id="objectif"
              value={objectifGlobal}
              onChange={(e) => setObjectifGlobal(Number(e.target.value))}
              min={1}
              max={50}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Cet objectif s'appliquera à toutes tes nouvelles journées
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-md"
            >
              ✅ Enregistrer
            </button>
            {profil && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      )}
        </>
      )}

      {/* Contenu Journal */}
      {activeTab === 'journal' && (
        <div className="space-y-6 animate-fade-in">
          {/* Sélecteur de date */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-2xl p-4 shadow-md">
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
              <Calendar className="text-blue-600 dark:text-blue-400" size={20} />
              Date de la note
            </label>
            <input
              type="date"
              value={selectedDate}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-semibold bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {editingNote && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Dernière modification : {format(new Date(editingNote.updatedAt || editingNote.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
              </p>
            )}
          </div>

          {/* Éditeur */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <label className="text-base font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <Edit3 className="text-primary-600 dark:text-primary-400" size={20} />
                {editingNote ? 'Modifier la note' : 'Nouvelle note'}
              </label>
              {editingNote && (
                <button
                  onClick={handleDeleteNote}
                  disabled={saving}
                  className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                  title="Supprimer cette note"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>
            <textarea
              value={contenu}
              onChange={(e) => setContenu(e.target.value)}
              placeholder="Écris tes pensées, ta motivation, ce qui s'est passé aujourd'hui, pourquoi tu as fumé..."
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[200px] text-base leading-relaxed bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              rows={10}
            />
            <button
              onClick={handleSaveNote}
              disabled={saving || !contenu.trim()}
              className="w-full mt-4 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={22} />
                  {editingNote ? 'Mettre à jour' : 'Enregistrer'}
                </>
              )}
            </button>
            {message && (
              <div className={`mt-3 p-3 rounded-xl text-sm font-medium ${
                message.startsWith('❌') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* Liste des notes */}
          {notes.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="text-indigo-600 dark:text-indigo-400" size={22} />
                <h3 className="text-xl font-bold text-gradient dark:text-white">Mes notes ({notes.length})</h3>
              </div>
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => handleNoteClick(note)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                      selectedDate === note.date
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-200 dark:hover:border-primary-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {format(new Date(note.date), 'EEEE d MMMM yyyy', { locale: fr })}
                      </p>
                      <Edit3 size={16} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">{note.contenu}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      Modifiée le {format(new Date(note.updatedAt || note.createdAt), 'dd/MM à HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notes.length === 0 && (
            <div className="bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-800 dark:to-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl p-6 text-center py-12 shadow-md">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">Aucune note pour le moment</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Commence à écrire ton premier journal !</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
