/* Bas-Gué — toutes les options de création, tirées du Manuel des joueureuses. */
window.BG = (function () {
  'use strict';

  var STATS = [
    { id: 'poigne', nom: 'Poigne', domaine: 'Force, endurance, encaisser, contraindre, ramer, tenir bon.' },
    { id: 'patte', nom: 'Patte', domaine: 'Adresse, précision, discrétion, crocheter, viser, esquiver.' },
    { id: 'nez', nom: 'Nez', domaine: 'Remarquer, pister, déduire, se souvenir, sentir le faux.' },
    { id: 'seve', nom: 'Sève', domaine: 'Le vivant : greffer, soigner, cultiver, lire ce qui pousse.' },
    { id: 'verbe', nom: 'Verbe', domaine: 'Parler, négocier, mentir, plaider, commander, tenir une salle.' }
  ];

  var MORPHOLOGIES = [
    { id: 'griffes', nom: 'Griffes et crocs',
      face: 'Armes naturelles (d4), et tu n’es jamais désarmé. +2 pour escalader et pour agripper.',
      ombre: 'On te fouille systématiquement, et −2 à toute tentative de passer pour inoffensif.',
      pv: 0, def: 0 },
    { id: 'grimpeur', nom: 'Grimpeur',
      face: '+3 pour grimper et garder l’équilibre.',
      ombre: '−2 pour résister à ce qui pousse, tire ou emporte. La sève poisseuse t’annule complètement.',
      pv: 0, def: 0 },
    { id: 'fouisseur', nom: 'Fouisseur',
      face: '+3 pour t’orienter sous terre. Tu ouvres un passage souterrain en une scène. La boue ne te ralentit pas.',
      ombre: 'Tu ne peux jamais te précipiter : jamais deux zones dans un tour.',
      pv: 0, def: 0 },
    { id: 'nageur', nom: 'Nageur',
      face: 'Tu respires dix minutes sous l’eau, et l’eau ne te ralentit jamais. +3 à tout ce qui se fait dans le fleuve.',
      ombre: '−2 à tout ce qui demande de la vitesse au sol. −2 à la discrétion tant que ta fourrure n’a pas séché.',
      pv: 0, def: 0 },
    { id: 'cuirasse', nom: 'Cuirasse',
      face: '+1 Défense. Qui te frappe au Contact subit 1 dégât.',
      ombre: '−2 pour esquiver, te contorsionner ou passer dans un espace étroit.',
      pv: 0, def: 1 },
    { id: 'membrane', nom: 'Membrane',
      face: 'Tu planes sur cent pas depuis un point haut. Aucune chute ne te blesse.',
      ombre: '−2 points de vie, et les dégâts d’écrasement te font le double.',
      pv: -2, def: 0 },
    { id: 'haleine', nom: 'Longue haleine',
      face: 'Trois jours de marche sans fatigue. +3 aux poursuites qui durent, +2 pour encaisser la faim, le froid et le manque de sommeil.',
      ombre: '−2 sur une course courte, un sprint, un départ, une esquive dans l’instant.',
      pv: 0, def: 0 }
  ];

  var GABARITS = [
    { id: 'petit', nom: 'Petit gabarit',
      face: '+3 pour te cacher et te faufiler.',
      ombre: '−2 à tout ce qui demande de la masse : bousculer, forcer, retenir une porte.',
      pv: 0 },
    { id: 'commun', nom: 'Gabarit commun',
      face: 'Ni face, ni ombre. Tu es à l’échelle des portes, des barques et des comptoirs.',
      ombre: '', pv: 0 },
    { id: 'grand', nom: 'Grand gabarit',
      face: '+2 points de vie, +2 pour intimider ou bousculer.',
      ombre: '−3 à la discrétion.', pv: 2 }
  ];

  var SENS = [
    { id: 'limier', nom: 'Nez de limier',
      face: '+3 à flairer, pister, reconnaître à l’odeur. Tu sens la peur, le sang, la maladie.',
      ombre: '−2 dans toute puanteur : fumée, épices, le fleuve en été. −3 dans les spores.' },
    { id: 'oreilles', nom: 'Oreilles fines',
      face: 'Tu entends à trente pas à travers une cloison. +3 pour repérer ce qui approche.',
      ombre: 'Un bruit soudain te laisse désorienté un tour : −2 à tout, sans jet possible pour l’éviter.' },
    { id: 'yeuxnuit', nom: 'Yeux de nuit',
      face: 'Tu vois dans l’obscurité totale comme en plein jour.',
      ombre: '−2 en plein soleil découvert, sous le lichen et dans les spores. Du noir à la pleine lumière : ébloui un tour.' },
    { id: 'rapace', nom: 'Vue de rapace',
      face: 'Tu vois à deux cents pas ce que les autres voient à vingt. +3 à distance en terrain dégagé.',
      ombre: '−2 au travail fin, à la lecture et aux serrures : de près, tout est flou.' },
    { id: 'vibrisses', nom: 'Vibrisses',
      face: 'Tu sens le mouvement, le vide, un courant d’air : plancher creux, trappe, présence derrière une cloison. Ni le noir ni la vapeur ne te gênent.',
      ombre: 'Tu sursautes : −2 pour dissimuler que tu as remarqué quelque chose. Qui t’approche par-derrière te fait trahir ta position.' },
    { id: 'langue', nom: 'Langue chimique',
      face: 'Tu goûtes la matière : poison, teinture, greffe récente, sang vieux de trois jours. +3 pour identifier une substance ; sur un franc, tu sais qui l’a posée.',
      ombre: 'Aucune portée : il faut toucher, et ça se voit. Tu encaisses ce que tu goûtes.' },
    { id: 'cri', nom: 'Cri qui revient',
      face: 'Dans le noir absolu, tu perçois volumes, couloirs et corps. On ne te surprend jamais en lieu clos.',
      ombre: 'Impossible d’être discret le tour où tu l’utilises. La mousse et les spores l’absorbent.' },
    { id: 'courant', nom: 'Sens du courant',
      face: 'Dans l’eau ou le vent, tu sais d’où ça vient et ce que ça porte. Tu ne te perds jamais sur un fleuve.',
      ombre: '−2 pour t’orienter en ville et en lieu clos.' }
  ];

  var POSITIONS = [
    { id: 'fluviale', nom: 'Lignée fluviale', especes: 'loutres, ragondins, castors, martins-pêcheurs',
      acces: 'Tout passage sur le fleuve. Un batelier ne te refuse ni embarquement, ni renseignement, ni abri pour la nuit.',
      amont: 'Identique. Moulins, passeurs et bacs te doivent le même accueil qu’à quai.',
      fermeture: '−2 face à la milice, quoi que tu dises.',
      obligation: 'Fouille systématique aux entrepôts. Tu ne transportes rien sans qu’on le sache.' },
    { id: 'terriers', nom: 'Gens de terriers', especes: 'rats, taupes, blaireaux, lapins',
      acces: 'On t’embauche partout, et tu connais le dessous de la ville mieux que quiconque.',
      amont: 'On t’embauche aux récoltes et aux terrassements. Tu connais les galeries et les réserves de chaque ferme, y compris celles qu’on ne montre pas.',
      fermeture: '−2 pour te faire écouter par quelqu’un qui a des moyens.',
      obligation: 'Pas de hauts quartiers sans laissez-passer. On te le demande à chaque fois.' },
    { id: 'parole', nom: 'Parole reconnue', especes: 'chouettes, corbeaux, hérons, pies',
      acces: 'Ton témoignage fait foi sans qu’on t’interroge, et tes contrats sont présumés valides.',
      amont: 'Ta parole vaut devant les assemblées de village. On te fait arbitrer les litiges, et tu ne peux pas refuser.',
      fermeture: '−2 pour agir sans qu’on sache que c’était toi.',
      obligation: 'Une faute reste inscrite à vie, et elle est publique.' },
    { id: 'bras', nom: 'Les Bras', especes: 'sangliers, ours, taureaux, chiens de garde',
      acces: 'La paie, le respect de la rue, et les portes qu’on ouvre à qui vaut mieux dedans que dehors.',
      amont: 'La moisson, le halage, l’abattage. Il y a toujours du travail, et on t’écoute quand tu dis qu’un chemin est mauvais.',
      fermeture: '−2 quand tu prétends à un travail de tête : ni comptes, ni négociation, ni secret confié.',
      obligation: 'On t’appelle quand ça tourne mal, et refuser se paie.' },
    { id: 'nocturnes', nom: 'Nocturnes', especes: 'chauves-souris, genettes, chats, hiboux',
      acces: 'La nuit entière. Tu travailles quand la ville dort, et tu vois qui sort à ces heures-là.',
      amont: 'La nuit sans lampes est à toi. Dans un village où chacun surveille chacun, tu es le seul à savoir qui rentre tard.',
      fermeture: '−2 pour te disculper de toute affaire nocturne. La présomption te tombe dessus d’office.',
      obligation: 'Laissez-passer obligatoire de jour, contrôlé souvent.' },
    { id: 'hautes', nom: 'Hautes Maisons', especes: 'renards, lynx, hermines, et tout ce qui a fait fortune',
      acces: 'Les hauts quartiers, le crédit, les salons, les guildes qui reçoivent.',
      amont: 'Ta maison a des terres là-haut, ou des créances sur ceux qui en ont. Les métayers t’ouvrent, les greniers aussi.',
      fermeture: '−2 pour obtenir la franchise de quelqu’un qui n’est pas de ton monde. On te dit ce que tu veux entendre.',
      obligation: 'Tu portes les dettes d’honneur de ta maison, et elle réclame quand elle veut, une fois par aventure.' },
    { id: 'etranger', nom: 'L’Étranger', especes: 'tout ce que Bas-Gué n’a jamais vu',
      acces: 'Aucun préjugé ne te précède : +2 la première fois que tu demandes quelque chose à quelqu’un. Une fois par personne, une seule fois par scène.',
      amont: 'Identique, et davantage : là-haut, on n’a jamais vu personne.',
      fermeture: '−2 pour disparaître dans une foule, et −2 à toute démarche qui suppose une guilde, un quartier ou un répondant.',
      obligation: 'On ne t’oublie jamais. Personne, nulle part.' }
  ];

  var FAMILLES = [
    { id: 'prise', nom: 'Prise', stats: ['poigne', 'patte'], devise: 'Le corps entier : lutte, voltige, contact.',
      greffes: [
        { nom: 'Saisir-verser',
          fer: 'Tu attrapes une cible au Contact. Elle est entravée tant que tu la tiens. Tu peux la jeter dans une zone adjacente pour 1d6 + Rang.',
          calme: 'Tu retiens ce qui tombe, glisse ou s’enfuit. Sans jet.',
          variantes: [
            { nom: 'Au sol', texte: 'La cible est aussi à terre : −2 à ses jets jusqu’à ce qu’elle se relève.' },
            { nom: 'Au bord', texte: 'Tu la verses dans une surface.' }] },
        { nom: 'Rebond',
          fer: 'Tu te déplaces d’une zone supplémentaire, et ton attaque de ce tour ignore tout bonus de Défense. Tu frappes le 10 + Patte.',
          calme: 'Tu franchis un obstacle vertical sans jet.',
          variantes: [
            { nom: 'Ricochet', texte: 'Tu traverses une zone tenue par des ennemis sans être arrêté.' },
            { nom: 'Portée', texte: 'Tu emmènes un allié consentant.' }] }
      ] },
    { id: 'traque', nom: 'Traque', stats: ['poigne', 'nez'], devise: 'Chasser, user, achever.',
      greffes: [
        { nom: 'Sur la piste',
          fer: 'Désigne une cible. Contre elle, tes attaques infligent +Rang dégâts, et tu la retrouves si elle se cache. Jusqu’à la fin de la scène.',
          calme: 'Tu suis une piste vieille de Rang jours, même brouillée, même en ville.',
          variantes: [
            { nom: 'À l’usure', texte: '+1 dégât cumulatif par tour au lieu de +Rang fixe.' },
            { nom: 'Au sang', texte: 'Tu sais toujours à peu près ce qu’il reste à ta cible.' }] },
        { nom: 'Acculer',
          fer: 'La cible ne peut pas quitter sa zone tant que tu es au Contact. Si elle essaie, elle perd son déplacement et tu la frappes gratuitement.',
          calme: 'Tu bloques une sortie, un couloir, un pont.',
          variantes: [
            { nom: 'Meute', texte: 'Un allié au Contact profite de l’effet.' },
            { nom: 'Cri de chasse', texte: 'La cible acculée subit −2 à tout ce qui n’est pas une attaque contre toi.' }] }
      ] },
    { id: 'souche', nom: 'Souche', stats: ['poigne', 'seve'], devise: 'La force du végétal.',
      greffes: [
        { nom: 'Faire pousser',
          fer: 'Une racine jaillit dans une zone Proche. La zone devient encombrée — la quitter coûte tout le déplacement — pendant Rang tours.',
          calme: 'Tu fais pousser en une scène une passerelle, une échelle, une cloison, un abri.',
          variantes: [
            { nom: 'Ronces', texte: 'La zone inflige 1d4 à qui la traverse.' },
            { nom: 'Étai', texte: 'Au lieu d’encombrer : +2 Défense à qui s’y tient.' }] },
        { nom: 'Arracher',
          fer: 'Tu déracines un morceau du décor et tu le lances : 1d8 + Rang à Proche. La zone d’arrivée devient jonchée.',
          calme: 'Tu ouvres de force une porte vivante, une coque, un plancher. Sans outil, mais pas sans bruit.',
          variantes: [
            { nom: 'Bélier', texte: 'Tu charges avec au lieu de lancer, et tu traverses une zone en renversant tout.' },
            { nom: 'Récolte', texte: 'La matière arrachée reste utilisable.' }] }
      ] },
    { id: 'ascendant', nom: 'Ascendant', stats: ['poigne', 'verbe'], devise: 'La présence qui contraint.',
      greffes: [
        { nom: 'Tenir la salle',
          fer: 'Ce tour, tout ennemi de ta zone qui attaque quelqu’un d’autre que toi subit −2 à son jet.',
          calme: 'Tu obtiens le silence et la parole dans une pièce, quel que soit le monde présent.',
          variantes: [
            { nom: 'Sur le pas', texte: 'L’effet couvre aussi une zone adjacente.' },
            { nom: 'Sans un mot', texte: 'Fonctionne sans parler, ou sans qu’on sache que c’est toi.' }] },
        { nom: 'Ordre',
          fer: 'Un allié agit immédiatement, hors de son tour, avec +Rang à son jet.',
          calme: 'Tu fais faire à quelqu’un ce qu’il savait déjà faire mais n’osait pas.',
          variantes: [
            { nom: 'Relève', texte: 'Au lieu d’agir, l’allié se relève et récupère Rang points de vie.' },
            { nom: 'En chœur', texte: 'Deux alliés au lieu d’un, sans bonus.' }] }
      ] },
    { id: 'escamote', nom: 'Escamote', stats: ['patte', 'nez'], devise: 'La main qui sait où aller.',
      greffes: [
        { nom: 'Prendre',
          fer: 'Tu désarmes une cible au Contact, ou tu lui voles un objet porté. Sur un franc, elle ne s’en aperçoit pas.',
          calme: 'Tu prends ce que tu avais repéré : sur un étal, dans une poche, dans un registre.',
          variantes: [
            { nom: 'Substituer', texte: 'Tu laisses autre chose à la place.' },
            { nom: 'Ouvrir', texte: 'Fonctionne aussi sur une serrure, un nœud, un sceau.' }] },
        { nom: 'Point faible',
          fer: 'Une attaque contre une cible que tu as observée ce tour inflige +1d6 + Rang.',
          calme: 'Tu observes un lieu, un objet ou quelqu’un, et tu nommes la faille : le gond fatigué, la dette, l’heure creuse.',
          variantes: [
            { nom: 'Partagé', texte: 'Tu le dis à voix haute : un allié en profite à ta place.' },
            { nom: 'Répété', texte: 'Le bonus vaut pour toutes tes attaques du tour, mais réduit de moitié.' }] }
      ] },
    { id: 'officine', nom: 'Officine', stats: ['patte', 'seve'], devise: 'Greffer fin, distiller, recoudre.',
      greffes: [
        { nom: 'Recoudre',
          fer: 'Un allié au Contact récupère 1d6 + Rang points de vie, ou se relève de zéro avec 1 point de vie — et ça lui épargne une marque si c’est fait à temps.',
          calme: 'Tu soignes une blessure, une coque, un mur. En une scène, tu peux enrayer une marque fraîche.',
          variantes: [
            { nom: 'Sutures', texte: '1d4 seulement, mais sur deux alliés.' },
            { nom: 'Greffe de fortune', texte: 'L’allié soigné gagne +2 Défense jusqu’à la fin de la scène.' }] },
        { nom: 'Fiole',
          fer: 'Tu lances une préparation dans une zone Proche : elle y crée une surface vivante de ton choix.',
          calme: 'Tu prépares Rang doses : poison, antidote, teinture, colle ou lumière.',
          variantes: [
            { nom: 'Verre fin', texte: 'La fiole inflige aussi 1d4 dans la zone.' },
            { nom: 'À retardement', texte: 'La surface n’apparaît qu’au tour suivant, ou quand tu le décides.' }] }
      ] },
    { id: 'faux', nom: 'Faux-semblant', stats: ['patte', 'verbe'], devise: 'Mentir avec les mains.',
      greffes: [
        { nom: 'Passe-passe',
          fer: 'Tu feins un geste. La cible réagit à côté : +Rang à ta Défense jusqu’à ton prochain tour.',
          calme: 'Tu fais croire à un geste, un objet, une signature, le temps qu’il faut pour passer.',
          variantes: [
            { nom: 'Leurre', texte: 'Tu diriges l’attaque vers un autre ennemi au lieu de te protéger.' },
            { nom: 'Doublure', texte: 'L’effet protège un allié de ta zone.' }] },
        { nom: 'Papiers',
          fer: 'Tu montres quelque chose. Un ennemi capable de lire hésite un tour : il ne t’attaque pas tant que tu ne le touches pas.',
          calme: 'Tu produis un document, un sceau ou un jeton crédible. Il tient tant qu’on ne le confronte pas à son registre.',
          variantes: [
            { nom: 'Cachet', texte: 'Le faux résiste à une vérification, une fois.' },
            { nom: 'Deux noms', texte: 'Tu endosses une Position qui n’est pas la tienne pour une scène, avec sa face et son ombre.' }] }
      ] },
    { id: 'racine', nom: 'Racine', stats: ['nez', 'seve'], devise: 'Lire ce qui est vivant.',
      greffes: [
        { nom: 'Écouter le lieu',
          fer: 'Tu sais où sont tous les êtres vivants à Proche, même cachés, même dans le noir, pendant Rang tours.',
          calme: 'Tu poses une question au vivant d’un lieu : qui est passé, quand, dans quel état. Une réponse par scène, et jamais un nom.',
          variantes: [
            { nom: 'Racines profondes', texte: 'Portée doublée, mais tu dois rester immobile.' },
            { nom: 'En sourdine', texte: 'Tu partages la perception avec tes alliés.' }] },
        { nom: 'Diagnostic',
          fer: 'Tu nommes une faiblesse vivante de la cible : poison, maladie, greffe récente, vieille blessure. Elle subit −2 contre l’effet que tu désignes, jusqu’à la fin de la scène.',
          calme: 'Tu lis un corps ou une plante : ce qu’on lui a fait, quand, avec quoi.',
          variantes: [
            { nom: 'Contagion', texte: 'L’effet touche aussi ceux qui partagent la même greffe ou le même mal.' },
            { nom: 'Antidote', texte: 'Tu protèges un allié au lieu d’affaiblir : +2 contre ce que tu as nommé.' }] }
      ] },
    { id: 'instruction', nom: 'Instruction', stats: ['nez', 'verbe'], devise: 'La vérité arrachée.',
      greffes: [
        { nom: 'Interroger',
          fer: 'Tu poses une question à voix haute à un ennemi. Il subit −Rang à son prochain jet, et tu apprends une chose vraie sur lui.',
          calme: 'Quelqu’un te répond honnêtement à une question, ou te ment d’une façon que tu détectes.',
          variantes: [
            { nom: 'À charge', texte: 'Au lieu d’une information, la cible perd sa réaction pour toute la scène.' },
            { nom: 'Devant témoins', texte: 'L’aveu est public : conséquences sociales immédiates, et un allié gagne +2 contre la cible.' }] },
        { nom: 'Recoupement',
          fer: 'Tu déclares que tu avais prévu. Tu agis en premier, et un allié aussi.',
          calme: 'En croisant deux indices, tu obtiens du meneur un fait qu’il n’avait pas prévu de donner, et qui ne peut pas être faux. Jamais la solution de l’enquête.',
          variantes: [
            { nom: 'Dossier', texte: 'Tu gardes le fait en réserve pour plus tard dans l’aventure.' },
            { nom: 'Mise en demeure', texte: 'Tu convertis le fait en levier : un personnage non joueur te doit une faveur, une seule.' }] }
      ] },
    { id: 'ecorce', nom: 'Écorce', stats: ['seve', 'verbe'], devise: 'Les serments qui poussent.',
      greffes: [
        { nom: 'Pacte',
          fer: 'Tu lies deux êtres, toi compris si tu veux. Tout dégât subi par l’un est partagé moitié-moitié, pendant Rang tours.',
          calme: 'Tu graves un accord dans une écorce vivante. Il fait foi devant le tribunal, et il fait mal à qui le rompt.',
          variantes: [
            { nom: 'Serment de garde', texte: 'Tu prends tous les dégâts d’un allié à sa place au lieu de partager.' },
            { nom: 'Contre-lettre', texte: 'Une clause reste cachée, visible seulement de qui la connaît.' }] },
        { nom: 'Éveiller',
          fer: 'Tu réveilles une chose : une porte, une barque, une lampe-lichen, un pan de mur. Elle agit une fois pour toi — attaque à 1d8 + Rang, blocage, transport ou lumière.',
          calme: 'Tu fais tenir une conversation courte à un objet vivant, ou tu ranimes un lieu endormi.',
          variantes: [
            { nom: 'Domestique', texte: 'La chose reste éveillée Rang tours et agit sans coûter ton action, mais n’attaque qu’une fois. 6 PV, Défense 11.' },
            { nom: 'Rumeur', texte: 'Elle a vu ce qui s’est passé ici, et le dit — mal, mais elle le dit.' }] }
      ] }
  ];

  var ARMES = [
    { id: 'naturelle', nom: 'Naturelle', detail: 'griffes, crocs, bec', dgts: 'd4',
      permet: 'Tu n’es jamais désarmé, on ne peut pas te la confisquer.',
      prend: 'Rien de plus que ta morphologie.' },
    { id: 'fine', nom: 'Fine', detail: 'lame courte, alêne, faucille', dgts: 'd4',
      permet: 'Se dissimule. Se lance à Proche. Frappe avec Patte au Contact.', prend: '—' },
    { id: 'courante', nom: 'Courante', detail: 'gourdin, hachette, croc de docker', dgts: 'd6',
      permet: 'La norme.', prend: 'On voit que tu es armé : −2 pour passer pour inoffensif.' },
    { id: 'lourde', nom: 'Lourde', detail: 'masse, faux, épieu, rame ferrée', dgts: 'd8',
      permet: 'Tu frappes au Contact et à Proche sans bouger.',
      prend: 'Deux pattes prises : ni grimper, ni porter, ni ouvrir. −2 à la discrétion.' },
    { id: 'jet', nom: 'De jet', detail: 'fronde, harpon, dard', dgts: 'd6',
      permet: 'Frappe à Loin.', prend: 'Il faut récupérer le projectile. Après trois tirs, tu n’en as plus.' }
  ];

  var OUTILS = [
    { id: 'lampe', nom: 'Lampe-lichen', permet: 'Tu poses ou retires du Lichen sur une zone, d’une action.',
      prend: 'On te voit de loin. Il faut la nourrir chaque matin ; oubliée deux jours, elle meurt.' },
    { id: 'fil', nom: 'Fil de sève', permet: 'Une corde qui s’accroche seule : tu montes, tu amarres, tu entraves sans jet.',
      prend: 'Elle retient l’odeur de tout ce qu’elle a tenu.' },
    { id: 'ecorce', nom: 'Écorce à encre', permet: 'Une planche qui garde l’encre pour toujours. Un accord écrit dessus fait foi au tribunal.',
      prend: 'Elle peut être saisie et lue.' },
    { id: 'bouture', nom: 'Bouture de serrure', permet: 'Glissée dans une serrure, elle pousse dedans en une scène et l’ouvre. Aucun jet, aucun bruit.',
      prend: 'Elle ressort avec la forme exacte de la serrure gravée dedans. C’est une preuve, et tu la portes.' },
    { id: 'panier', nom: 'Panier creux', permet: 'Il contient trois fois ce qu’il devrait.',
      prend: 'Il digère lentement : ce qu’on y laisse une nuit en ressort abîmé.' },
    { id: 'mouche', nom: 'Mouche à sang', permet: 'Lâchée, elle vole droit vers le sang frais le plus proche.',
      prend: 'Le plus proche. Pas le bon.' },
    { id: 'cataplasme', nom: 'Cataplasme', permet: 'Une fois, il rend 1d4 points de vie sans action et sans jet.',
      prend: 'Il laisse sous la peau une trace lisible pendant une semaine.' }
  ];

  /* Amorces pour la dernière étape — jamais imposées, seulement proposées. */
  var AMORCES = [
    'Je suis à bord parce que je dois de l’argent à quelqu’un qui y dort aussi.',
    'J’ai promis à ___ de la ramener en amont avant l’hiver, et je tiens mes promesses trop longtemps.',
    'Le tribunal m’a confié à ___ pour un an. Personne ne m’a demandé mon avis.',
    'J’ai sorti ___ du fleuve, et depuis, je ne sais plus comment partir.',
    '___ sait ce que j’ai fait à Vasque. Tant que je rame, elle se tait.',
    'On m’a greffé quelque chose que je n’avais pas demandé, et ___ connaît le nom du greffeur.'
  ];

  return { STATS: STATS, MORPHOLOGIES: MORPHOLOGIES, GABARITS: GABARITS, SENS: SENS,
           POSITIONS: POSITIONS, FAMILLES: FAMILLES, ARMES: ARMES, OUTILS: OUTILS,
           AMORCES: AMORCES };
})();
