import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://azzltzrzmukvyaiyamkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Données complètes extraites des captures Excel (1-12 décembre 2025)
const completeData = [
  // Ligne par ligne depuis les captures - ATTENTION aux dates mélangées
  {date:'2025-12-10',typeJournee:'travail',numero:1,heure:'00:00',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-07',typeJournee:'weekend',numero:1,heure:'00:01',lieu:'maison',type:'plaisir',besoin:6,satisfaction:5,quantite:'entiere',situation:'apres_repas',commentaire:'',kudzu:false},
  {date:'2025-12-06',typeJournee:'weekend',numero:1,heure:'00:03',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'film',commentaire:'',kudzu:false},
  {date:'2025-12-08',typeJournee:'teletravail',numero:1,heure:'00:03',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'film',commentaire:'',kudzu:false},
  {date:'2025-12-02',typeJournee:'travail',numero:1,heure:'00:45',lieu:'maison',type:'plaisir',besoin:6,satisfaction:6,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-07',typeJournee:'weekend',numero:2,heure:'00:49',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-06',typeJournee:'weekend',numero:2,heure:'00:51',lieu:'maison',type:'automatique',besoin:4,satisfaction:3,quantite:'entiere',situation:'pause',commentaire:'Laye fume, je ne sais pas résister. Je n\'en avais pas besoin.',kudzu:false},
  {date:'2025-12-02',typeJournee:'travail',numero:2,heure:'07:38',lieu:'maison',type:'besoin',besoin:6,satisfaction:5,quantite:'entiere',situation:'reveil',commentaire:'',kudzu:false},
  {date:'2025-12-03',typeJournee:'travail',numero:1,heure:'07:41',lieu:'maison',type:'besoin',besoin:7,satisfaction:6,quantite:'entiere',situation:'reveil',commentaire:'',kudzu:true},
  {date:'2025-12-09',typeJournee:'travail',numero:1,heure:'07:51',lieu:'maison',type:'besoin',besoin:6,satisfaction:6,quantite:'entiere',situation:'reveil',commentaire:'Déjà envie de fumer à nouveau',kudzu:false},
  {date:'2025-12-10',typeJournee:'travail',numero:2,heure:'07:55',lieu:'maison',type:'besoin',besoin:5,satisfaction:5,quantite:'entiere',situation:'reveil',commentaire:'J\'étais dans mes pensée, je ne me suis pas rendue compte l\'avoir fumé',kudzu:false},
  {date:'2025-12-04',typeJournee:'travail',numero:1,heure:'08:20',lieu:'maison',type:'besoin',besoin:6,satisfaction:6,quantite:'entiere',situation:'trajet',commentaire:'Je me suis réveillée en retard. Fumée sur le trajet vers la gare. J\'aurais dû essayer de l\'enlever mais pas le courage.',kudzu:false},
  {date:'2025-12-09',typeJournee:'travail',numero:2,heure:'08:20',lieu:'maison',type:'besoin',besoin:6,satisfaction:5,quantite:'entiere',situation:'attente',commentaire:'J\'avais encore envie de fumer après la première et train en retard',kudzu:true},
  {date:'2025-12-10',typeJournee:'travail',numero:3,heure:'08:25',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'trajet',commentaire:'J\'en ai refumé une',kudzu:false},
  {date:'2025-12-02',typeJournee:'travail',numero:3,heure:'08:50',lieu:'travail',type:'automatique',besoin:6,satisfaction:5,quantite:'entiere',situation:'trajet',commentaire:'Je n\'ai pas lutté contre cette cigarette',kudzu:false},
  {date:'2025-12-08',typeJournee:'teletravail',numero:2,heure:'08:50',lieu:'maison',type:'besoin',besoin:6,satisfaction:5,quantite:'entiere',situation:'reveil',commentaire:'',kudzu:true},
  {date:'2025-12-05',typeJournee:'teletravail',numero:1,heure:'09:00',lieu:'maison',type:'besoin',besoin:6,satisfaction:5,quantite:'entiere',situation:'reveil',commentaire:'',kudzu:false},
  {date:'2025-12-01',typeJournee:'teletravail',numero:1,heure:'09:20',lieu:'maison',type:'besoin',besoin:7,satisfaction:5,quantite:'entiere',situation:'reveil',commentaire:'Pas bonne, nauséeuse',kudzu:true},
  {date:'2025-12-07',typeJournee:'weekend',numero:3,heure:'09:27',lieu:'maison',type:'besoin',besoin:7,satisfaction:5,quantite:'entiere',situation:'reveil',commentaire:'',kudzu:false},
  {date:'2025-12-05',typeJournee:'teletravail',numero:2,heure:'09:55',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-08',typeJournee:'teletravail',numero:4,heure:'10:00',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-06',typeJournee:'weekend',numero:3,heure:'10:05',lieu:'maison',type:'besoin',besoin:6,satisfaction:5,quantite:'entiere',situation:'reveil',commentaire:'',kudzu:false},
  {date:'2025-12-10',typeJournee:'travail',numero:4,heure:'10:15',lieu:'travail',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-01',typeJournee:'teletravail',numero:2,heure:'10:20',lieu:'maison',type:'automatique',besoin:6,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'Heure habituelle de pause. Envie de fumer à 11h mais j\'ai continué une tâche pour le travail jusque 11h30 et l\'envie est passée. Je vais manger avant de fumer pour supprimer celle que je prends habituellement avant repas.',kudzu:false},
  {date:'2025-12-04',typeJournee:'travail',numero:2,heure:'10:22',lieu:'travail',type:'besoin',besoin:6,satisfaction:6,quantite:'entiere',situation:'pause',commentaire:'',kudzu:true},
  {date:'2025-12-03',typeJournee:'travail',numero:2,heure:'10:30',lieu:'travail',type:'besoin',besoin:6,satisfaction:6,quantite:'entiere',situation:'trajet',commentaire:'Suite rdv tabac pour retour travail',kudzu:false},
  {date:'2025-12-09',typeJournee:'travail',numero:3,heure:'10:30',lieu:'travail',type:'automatique',besoin:6,satisfaction:7,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-02',typeJournee:'travail',numero:4,heure:'10:41',lieu:'travail',type:'automatique',besoin:5,satisfaction:6,quantite:'entiere',situation:'pause',commentaire:'Pas un gros besoin, j\'aurais pu m\'en passer mais trop habituée à cette pause',kudzu:true},
  {date:'2025-12-06',typeJournee:'weekend',numero:4,heure:'10:50',lieu:'maison',type:'automatique',besoin:6,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-07',typeJournee:'weekend',numero:4,heure:'10:56',lieu:'maison',type:'besoin',besoin:6,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-05',typeJournee:'teletravail',numero:3,heure:'11:00',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-09',typeJournee:'travail',numero:4,heure:'11:45',lieu:'travail',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'avant_repas',commentaire:'',kudzu:false},
  {date:'2025-12-07',typeJournee:'weekend',numero:5,heure:'11:46',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'Avec Laye',kudzu:false},
  {date:'2025-12-01',typeJournee:'teletravail',numero:3,heure:'11:50',lieu:'maison',type:'plaisir',besoin:7,satisfaction:6,quantite:'entiere',situation:'apres_repas',commentaire:'',kudzu:false},
  {date:'2025-12-04',typeJournee:'travail',numero:3,heure:'11:52',lieu:'travail',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'J\'aurais pu la supprimer mais envie de fumer toute la matinée sans que ce soit trop fort. Sûrement fatigue',kudzu:false},
  {date:'2025-12-08',typeJournee:'teletravail',numero:5,heure:'12:00',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'avant_repas',commentaire:'J\'étais bien occupée avec commande azade, pas vu le temps passer et pas pensé à fumer',kudzu:false},
  {date:'2025-12-03',typeJournee:'travail',numero:3,heure:'12:04',lieu:'travail',type:'besoin',besoin:6,satisfaction:6,quantite:'entiere',situation:'avant_repas',commentaire:'J\'aurais pu l\'éviter si j\'avais eu plus de motivation.',kudzu:false},
  {date:'2025-12-06',typeJournee:'weekend',numero:5,heure:'12:08',lieu:'maison',type:'automatique',besoin:6,satisfaction:6,quantite:'entiere',situation:'pause',commentaire:'Avec laye',kudzu:true},
  {date:'2025-12-02',typeJournee:'travail',numero:7,heure:'12:15',lieu:'travail',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'trajet',commentaire:'Je devais faire une course avant repas, difficile de ne pas fumer en sortant. Je n\'ai pas cherché à la supprimer pour l\'instant même si j\'aurais pu',kudzu:false},
  {date:'2025-12-04',typeJournee:'travail',numero:4,heure:'13:05',lieu:'travail',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'apres_repas',commentaire:'J\'aurais pu attendre un peu aussi',kudzu:false},
  {date:'2025-12-07',typeJournee:'weekend',numero:6,heure:'13:09',lieu:'maison',type:'plaisir',besoin:7,satisfaction:6,quantite:'entiere',situation:'apres_repas',commentaire:'',kudzu:false},
  {date:'2025-12-02',typeJournee:'travail',numero:5,heure:'13:10',lieu:'travail',type:'automatique',besoin:5,satisfaction:6,quantite:'entiere',situation:'apres_repas',commentaire:'J\'aurais pu attendre mais trop habituée à fumer juste après repas et je n\'ai pas eu le courage de passer outre cette habitude',kudzu:false},
  {date:'2025-12-06',typeJournee:'weekend',numero:6,heure:'13:22',lieu:'maison',type:'automatique',besoin:6,satisfaction:6,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-01',typeJournee:'teletravail',numero:4,heure:'13:25',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'Après sieste, transition. 14h30 j\'ai envie de fumer après réunion. Je m\'occupe pour patienter ...',kudzu:false},
  {date:'2025-12-08',typeJournee:'teletravail',numero:3,heure:'13:30',lieu:'maison',type:'plaisir',besoin:6,satisfaction:5,quantite:'entiere',situation:'apres_repas',commentaire:'1/2h après j\'ai déjà envie de fumer. Prise de tête avec Laye sur le sujet de fumer à l\'intérieur ou non.',kudzu:false},
  {date:'2025-12-09',typeJournee:'travail',numero:5,heure:'13:45',lieu:'travail',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'apres_repas',commentaire:'',kudzu:false},
  {date:'2025-12-05',typeJournee:'teletravail',numero:4,heure:'13:50',lieu:'maison',type:'plaisir',besoin:6,satisfaction:6,quantite:'entiere',situation:'apres_repas',commentaire:'',kudzu:false},
  {date:'2025-12-03',typeJournee:'travail',numero:4,heure:'13:52',lieu:'travail',type:'automatique',besoin:6,satisfaction:4,quantite:'entiere',situation:'apres_repas',commentaire:'J\'ai fini de manger à 13h donc quasi attente 1h avant de fumer. Globalement pas bonne',kudzu:true},
  {date:'2025-12-06',typeJournee:'weekend',numero:7,heure:'14:10',lieu:'maison',type:'plaisir',besoin:6,satisfaction:5,quantite:'entiere',situation:'apres_repas',commentaire:'',kudzu:false},
  {date:'2025-12-07',typeJournee:'weekend',numero:7,heure:'14:20',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'social',commentaire:'',kudzu:false},
  {date:'2025-12-05',typeJournee:'teletravail',numero:5,heure:'15:10',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-09',typeJournee:'travail',numero:6,heure:'15:10',lieu:'travail',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-04',typeJournee:'travail',numero:5,heure:'15:15',lieu:'travail',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'Avec Farid',kudzu:false},
  {date:'2025-12-01',typeJournee:'teletravail',numero:5,heure:'15:25',lieu:'maison',type:'besoin',besoin:6,satisfaction:6,quantite:'entiere',situation:'pause',commentaire:'Après m\'être occupée',kudzu:false},
  {date:'2025-12-02',typeJournee:'travail',numero:6,heure:'15:26',lieu:'travail',type:'automatique',besoin:5,satisfaction:2,quantite:'entiere',situation:'pause',commentaire:'Pas bonne du tout, effet du kudzu ? Je ne comprends pas bien',kudzu:false},
  {date:'2025-12-03',typeJournee:'travail',numero:5,heure:'15:46',lieu:'travail',type:'automatique',besoin:5,satisfaction:3,quantite:'entiere',situation:'pause',commentaire:'Juste par habitude et pas le courage de la supprimer pour l\'instant. Pas bonne du tout.',kudzu:false},
  {date:'2025-12-06',typeJournee:'weekend',numero:8,heure:'16:01',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'avant_sortie',commentaire:'',kudzu:false},
  {date:'2025-12-05',typeJournee:'teletravail',numero:6,heure:'16:02',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-01',typeJournee:'teletravail',numero:6,heure:'16:18',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'Avec Laye après son repas et avant mon rdv médecin',kudzu:false},
  {date:'2025-12-07',typeJournee:'weekend',numero:8,heure:'16:20',lieu:'chez_quelquun',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'social',commentaire:'',kudzu:false},
  {date:'2025-12-08',typeJournee:'teletravail',numero:6,heure:'16:40',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'J\'ai dormi 2h30, crevée',kudzu:false},
  {date:'2025-12-02',typeJournee:'travail',numero:8,heure:'17:00',lieu:'travail',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'trajet',commentaire:'Pas su la supprimer',kudzu:false},
  {date:'2025-12-03',typeJournee:'travail',numero:6,heure:'17:00',lieu:'travail',type:'automatique',besoin:6,satisfaction:3,quantite:'entiere',situation:'trajet',commentaire:'Je ne me sentais pas capable de la supprimer bien que le besoin n\'était pas si important. Ici je pense que ce n\'est pas l\'appel à la nicotine mais une habitude bien installée. Cigarette pas bonne.',kudzu:false},
  {date:'2025-12-04',typeJournee:'travail',numero:6,heure:'17:00',lieu:'travail',type:'automatique',besoin:6,satisfaction:3,quantite:'entiere',situation:'trajet',commentaire:'Pas bonne',kudzu:false},
  {date:'2025-12-07',typeJournee:'weekend',numero:9,heure:'17:10',lieu:'chez_quelquun',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'social',commentaire:'',kudzu:false},
  {date:'2025-12-05',typeJournee:'teletravail',numero:7,heure:'17:26',lieu:'chez_quelquun',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'social',commentaire:'',kudzu:false},
  {date:'2025-12-06',typeJournee:'weekend',numero:9,heure:'17:28',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'Après qi gong',kudzu:true},
  {date:'2025-12-09',typeJournee:'travail',numero:7,heure:'17:30',lieu:'maison',type:'automatique',besoin:6,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-08',typeJournee:'teletravail',numero:7,heure:'17:49',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'attente',commentaire:'Attente séance sophrodanse',kudzu:false},
  {date:'2025-12-02',typeJournee:'travail',numero:9,heure:'17:55',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'avant_sortie',commentaire:'Retour maison et avant départ pour séance sophro',kudzu:false},
  {date:'2025-12-04',typeJournee:'travail',numero:7,heure:'18:05',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'Avec tisane',kudzu:true},
  {date:'2025-12-07',typeJournee:'weekend',numero:10,heure:'18:12',lieu:'chez_quelquun',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'social',commentaire:'',kudzu:false},
  {date:'2025-12-05',typeJournee:'teletravail',numero:8,heure:'18:30',lieu:'chez_quelquun',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'social',commentaire:'',kudzu:false},
  {date:'2025-12-03',typeJournee:'travail',numero:7,heure:'18:35',lieu:'maison',type:'automatique',besoin:6,satisfaction:4,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-09',typeJournee:'travail',numero:8,heure:'18:53',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-01',typeJournee:'teletravail',numero:7,heure:'19:00',lieu:'maison',type:'besoin',besoin:6,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'Après rdv médecin',kudzu:false},
  {date:'2025-12-05',typeJournee:'teletravail',numero:9,heure:'19:11',lieu:'chez_quelquun',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'social',commentaire:'',kudzu:false},
  {date:'2025-12-04',typeJournee:'travail',numero:8,heure:'19:14',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'telephone',commentaire:'',kudzu:false},
  {date:'2025-12-07',typeJournee:'weekend',numero:11,heure:'19:24',lieu:'chez_quelquun',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'social',commentaire:'',kudzu:false},
  {date:'2025-12-06',typeJournee:'weekend',numero:10,heure:'19:40',lieu:'maison',type:'automatique',besoin:7,satisfaction:5,quantite:'entiere',situation:'attente',commentaire:'',kudzu:true},
  {date:'2025-12-02',typeJournee:'travail',numero:10,heure:'19:50',lieu:'maison',type:'automatique',besoin:6,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'Après séance sophrologie',kudzu:false},
  {date:'2025-12-08',typeJournee:'teletravail',numero:8,heure:'19:54',lieu:'maison',type:'besoin',besoin:6,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'Après séance sophrodanse. Pas pensé du tout à fumer pendant la séance donc je dois trouver des activités qui ne me font pas penser à la cigarette. Hors de la maison, ça semble plus facile.',kudzu:false},
  {date:'2025-12-07',typeJournee:'weekend',numero:12,heure:'19:59',lieu:'exterieur',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'apres_repas',commentaire:'',kudzu:false},
  {date:'2025-12-09',typeJournee:'travail',numero:9,heure:'20:05',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'Crevée',kudzu:false},
  {date:'2025-12-01',typeJournee:'teletravail',numero:8,heure:'20:10',lieu:'maison',type:'automatique',besoin:8,satisfaction:5,quantite:'entiere',situation:'avant_repas',commentaire:'J\'aurais pu m\'en passer, attente laye qui prend sa douche',kudzu:false},
  {date:'2025-12-05',typeJournee:'teletravail',numero:10,heure:'20:22',lieu:'chez_quelquun',type:'automatique',besoin:6,satisfaction:6,quantite:'entiere',situation:'apres_repas',commentaire:'',kudzu:false},
  {date:'2025-12-03',typeJournee:'travail',numero:8,heure:'20:31',lieu:'maison',type:'besoin',besoin:6,satisfaction:6,quantite:'entiere',situation:'avant_repas',commentaire:'',kudzu:false},
  {date:'2025-12-01',typeJournee:'teletravail',numero:9,heure:'21:02',lieu:'maison',type:'plaisir',besoin:7,satisfaction:6,quantite:'entiere',situation:'apres_repas',commentaire:'Je l\'ai trouvé forte',kudzu:false},
  {date:'2025-12-04',typeJournee:'travail',numero:9,heure:'21:10',lieu:'maison',type:'plaisir',besoin:7,satisfaction:6,quantite:'entiere',situation:'apres_repas',commentaire:'',kudzu:false},
  {date:'2025-12-06',typeJournee:'weekend',numero:11,heure:'21:10',lieu:'maison',type:'automatique',besoin:6,satisfaction:4,quantite:'entiere',situation:'attente',commentaire:'',kudzu:false},
  {date:'2025-12-08',typeJournee:'teletravail',numero:11,heure:'21:15',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-03',typeJournee:'travail',numero:9,heure:'21:25',lieu:'maison',type:'plaisir',besoin:7,satisfaction:6,quantite:'entiere',situation:'apres_repas',commentaire:'',kudzu:false},
  {date:'2025-12-05',typeJournee:'teletravail',numero:11,heure:'21:30',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-09',typeJournee:'travail',numero:10,heure:'21:30',lieu:'maison',type:'plaisir',besoin:5,satisfaction:4,quantite:'entiere',situation:'apres_repas',commentaire:'',kudzu:false},
  {date:'2025-12-07',typeJournee:'weekend',numero:13,heure:'21:32',lieu:'chez_quelquun',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'social',commentaire:'',kudzu:false},
  {date:'2025-12-02',typeJournee:'travail',numero:11,heure:'21:37',lieu:'maison',type:'plaisir',besoin:7,satisfaction:6,quantite:'entiere',situation:'apres_repas',commentaire:'',kudzu:false},
  {date:'2025-12-04',typeJournee:'travail',numero:10,heure:'22:00',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'film',commentaire:'',kudzu:false},
  {date:'2025-12-05',typeJournee:'teletravail',numero:12,heure:'22:00',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'film',commentaire:'',kudzu:false},
  {date:'2025-12-01',typeJournee:'teletravail',numero:10,heure:'22:05',lieu:'maison',type:'automatique',besoin:6,satisfaction:5,quantite:'entiere',situation:'film',commentaire:'',kudzu:false},
  {date:'2025-12-02',typeJournee:'travail',numero:12,heure:'22:13',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'attente',commentaire:'Attente film, difficile le soir',kudzu:false},
  {date:'2025-12-03',typeJournee:'travail',numero:10,heure:'22:23',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'film',commentaire:'Trop forte, je n\'arrive presque pas à la fumer',kudzu:false},
  {date:'2025-12-08',typeJournee:'teletravail',numero:9,heure:'22:30',lieu:'maison',type:'plaisir',besoin:6,satisfaction:5,quantite:'entiere',situation:'apres_repas',commentaire:'',kudzu:false},
  {date:'2025-12-06',typeJournee:'weekend',numero:12,heure:'22:40',lieu:'maison',type:'plaisir',besoin:7,satisfaction:6,quantite:'entiere',situation:'avant_repas',commentaire:'',kudzu:false},
  {date:'2025-12-09',typeJournee:'travail',numero:11,heure:'22:40',lieu:'maison',type:'plaisir',besoin:6,satisfaction:5,quantite:'entiere',situation:'apres_repas',commentaire:'',kudzu:false},
  {date:'2025-12-07',typeJournee:'weekend',numero:14,heure:'22:45',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'pause',commentaire:'',kudzu:false},
  {date:'2025-12-04',typeJournee:'travail',numero:11,heure:'22:58',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'film',commentaire:'',kudzu:false},
  {date:'2025-12-02',typeJournee:'travail',numero:13,heure:'23:14',lieu:'maison',type:'automatique',besoin:5,satisfaction:3,quantite:'entiere',situation:'film',commentaire:'Pas bonne',kudzu:false},
  {date:'2025-12-03',typeJournee:'travail',numero:11,heure:'23:24',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'film',commentaire:'',kudzu:false},
  {date:'2025-12-08',typeJournee:'teletravail',numero:10,heure:'23:30',lieu:'maison',type:'automatique',besoin:5,satisfaction:5,quantite:'entiere',situation:'film',commentaire:'J\'ai fumé le reste de demi cigarette de Laye vers 23h50 quand je l\'ai vu fumer',kudzu:false},
];

function calculerScore({besoin,satisfaction,type,quantite}) {
  let score = (Number(besoin||0)*2) + Number(satisfaction||0);
  const bonus = {besoin:5,plaisir:3,automatique:0}[type]??0;
  score += bonus;
  const facteur = {entiere:1.0,'3/4':0.75,'1/2':0.5,'1/4':0.25,taffes:0.1}[quantite]??1.0;
  score *= facteur;
  return Math.round(score);
}

async function importCompleteData() {
  const { data: users, error: uerr } = await supabase.from('users').select('*').ilike('pseudo','lydie');
  if (uerr) throw uerr;
  if (!users||users.length===0) throw new Error('LYDIE not found');
  const userId = users[0].user_id;
  console.log(`👤 Utilisateur: ${userId}`);

  // DELETE all
  await supabase.from('cigarettes').delete().eq('user_id',userId);
  await supabase.from('journees').delete().eq('user_id',userId);
  console.log('🗑️  Base nettoyée');

  // Create journees
  const dateSet = new Set(completeData.map(r => r.date));
  const journeeMap = new Map();
  for (const date of dateSet) {
    const sample = completeData.find(r => r.date === date);
    const { data: journee, error: jerr } = await supabase
      .from('journees')
      .insert({ user_id: userId, date, type_journee: sample.typeJournee, objectif_nombre_max: 12 })
      .select()
      .single();
    if (jerr) throw jerr;
    journeeMap.set(date, journee.id);
  }
  console.log(`📅 ${journeeMap.size} journées créées`);

  // Insert cigarettes
  let inserted = 0;
  for (const row of completeData) {
    const journeeId = journeeMap.get(row.date);
    const score = calculerScore(row);
    const { error: ierr } = await supabase
      .from('cigarettes')
      .insert({
        user_id: userId,
        journee_id: journeeId,
        numero: row.numero,
        heure: row.heure,
        lieu: row.lieu,
        type: row.type,
        besoin: row.besoin,
        satisfaction: row.satisfaction,
        quantite: row.quantite,
        situation: row.situation,
        commentaire: row.commentaire||'',
        kudzu_pris: row.kudzu,
        score_calcule: score
      });
    if (ierr) {
      console.error(`❌ ${row.date} #${row.numero}:`, ierr.message);
    } else {
      inserted++;
    }
  }
  console.log(`✅ ${inserted} cigarettes insérées`);

  const { data: final } = await supabase.from('cigarettes').select('id').eq('user_id',userId);
  console.log(`📊 Total: ${final?.length||0} cigarettes`);
}

importCompleteData().catch(err => { console.error('Erreur:',err); process.exit(1); });
