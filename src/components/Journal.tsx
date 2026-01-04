import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BookOpen, Save, Trash2, Edit3, Calendar } from 'lucide-react';
import type { JournalNote } from '../types';

export default function Journal() {
  const [notes, setNotes] = useState<JournalNote[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [contenu, setContenu] = useState('');
  const [editingNote, setEditingNote] = useState<JournalNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
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

  async function chargerNotes() {
    try {
      setLoading(true);
      const allNotes = await db.journalNotes.toArray();
      setNotes(allNotes.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (error) {
      console.error('Erreur chargement notes:', error);
    } finally {
      setLoading(false);
    }
  }

  function afficherMessage(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }

  async function handleSave() {
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

  async function handleDelete() {
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
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-primary-600 absolute top-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card-gradient">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl shadow-lg">
            <BookOpen className="text-white" size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-gradient">Mon Journal</h2>
            <p className="text-sm text-gray-600">Notes quotidiennes, motivations, événements</p>
          </div>
        </div>
      </div>

      {/* Sélecteur de date */}
      <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
          <Calendar className="text-blue-600" size={20} />
          Date de la note
        </label>
        <input
          type="date"
          value={selectedDate}
          max={format(new Date(), 'yyyy-MM-dd')}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input-field text-lg font-semibold"
        />
        {editingNote && (
          <p className="text-xs text-gray-500 mt-2">
            Dernière modification : {format(new Date(editingNote.updatedAt || editingNote.createdAt), 'dd/MM/yyyy à HH:mm', { locale: fr })}
          </p>
        )}
      </div>

      {/* Éditeur */}
      <div className="card-gradient">
        <div className="flex items-center justify-between mb-3">
          <label className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Edit3 className="text-primary-600" size={20} />
            {editingNote ? 'Modifier la note' : 'Nouvelle note'}
          </label>
          {editingNote && (
            <button
              onClick={handleDelete}
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
          className="input-field min-h-[200px] text-base leading-relaxed"
          rows={10}
        />
        <button
          onClick={handleSave}
          disabled={saving || !contenu.trim()}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2 text-lg"
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
          <div className={`mt-3 p-3 rounded-xl text-sm font-medium ${message.startsWith('❌') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message}
          </div>
        )}
      </div>

      {/* Liste des notes */}
      {notes.length > 0 && (
        <div className="card-gradient">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="text-indigo-600" size={22} />
            <h3 className="text-xl font-bold text-gradient">Mes notes ({notes.length})</h3>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {notes
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((note) => (
              <div
                key={note.id}
                onClick={() => handleNoteClick(note)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                  selectedDate === note.date
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white hover:border-primary-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-gray-900">
                    {format(new Date(note.date), 'EEEE d MMMM yyyy', { locale: fr })}
                  </p>
                  <Edit3 size={16} className="text-gray-400" />
                </div>
                <p className="text-sm text-gray-700 line-clamp-3">{note.contenu}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Modifiée le {format(new Date(note.updatedAt || note.createdAt), 'dd/MM à HH:mm')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {notes.length === 0 && (
        <div className="card bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200 text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-600 font-medium">Aucune note pour le moment</p>
          <p className="text-sm text-gray-500 mt-2">Commence à écrire ton premier journal !</p>
        </div>
      )}
    </div>
  );
}
