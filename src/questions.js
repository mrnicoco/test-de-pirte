window.POP_DATA = {
  "version": 1,
  "categories": [
    {"id":"alcool","label":"Alcool","emoji":"🍷"},
    {"id":"drogue","label":"Drogue","emoji":"🌿"},
    {"id":"sexe","label":"Sexe","emoji":"🔥"},
    {"id":"moralite","label":"Moralité","emoji":"😈"},
    {"id":"hygiene","label":"Hygiène","emoji":"🧼"},
    {"id":"adulte","label":"Vie d'adulte","emoji":"💼"}
  ],
  "questions": [
    {"id":"a1","cat":"alcool","q":"Avez-vous déjà été ivre ?","gate":null,"quip":"On s'en doutait. Bienvenue, c'est open bar."},
    {"id":"a2","cat":"alcool","q":"Avez-vous déjà vomi à cause de l'alcool ?","gate":"a1","quip":"Le rosé pamplemousse n'était pas ton ami."},
    {"id":"a3","cat":"alcool","q":"Avez-vous déjà vomi puis repris un verre dans la foulée ?","gate":"a2","quip":"Reset et on repart. Un vrai sportif."},
    {"id":"a4","cat":"alcool","q":"Avez-vous déjà fait un trou noir complet ?","gate":"a1","quip":"Pas de souvenirs, pas de preuves… enfin presque."},
    {"id":"a5","cat":"alcool","q":"Avez-vous déjà découvert ce que vous aviez fait la veille grâce à une story ?","gate":"a4","quip":"Instagram, ton meilleur biographe."},

    {"id":"v1","cat":"adulte","q":"Avez-vous déjà fait semblant de dormir pendant tout un BlaBlaCar pour ne pas parler ?","gate":null,"quip":"Profil « Bla », mais zéro bla."},
    {"id":"v2","cat":"adulte","q":"Avez-vous déjà fait une visio pro sans pantalon ?","gate":null,"quip":"Business en haut, festival en bas."},
    {"id":"v3","cat":"adulte","q":"Avez-vous déjà fait semblant de trouver beau le bébé pas très beau d'un pote ?","gate":null,"quip":"« Il a tes yeux ! » Menteur de compétition."},
    {"id":"v4","cat":"adulte","q":"Avez-vous déjà fait une sieste pendant une réunion Teams caméra coupée ?","gate":null,"quip":"« Désolé, j'étais en mute. » Classique."},

    {"id":"h1","cat":"hygiene","q":"Avez-vous déjà fait pipi dans la rue ?","gate":null,"quip":"Paris, cette grande pissotière à ciel ouvert."},
    {"id":"h2","cat":"hygiene","q":"Avez-vous déjà retourné un sous-vêtement pour le porter un jour de plus ?","gate":null,"quip":"Le recto-verso, mais pour la lingerie."},
    {"id":"h3","cat":"hygiene","q":"Avez-vous déjà mangé un truc tombé par terre dans la rue ?","gate":null,"quip":"La règle des 5 secondes, version bitume."},

    {"id":"m1","cat":"moralite","q":"Avez-vous déjà fraudé dans le métro ?","gate":null,"quip":"Le saut de portillon, sport national."},
    {"id":"m3","cat":"moralite","q":"Avez-vous déjà inventé un « problème de connexion » pour couper une visio ?","gate":null,"quip":"« Tu m'entends ? Allô ? » Oscar du meilleur rôle."},
    {"id":"m5","cat":"moralite","q":"Avez-vous déjà « oublié » de rembourser un pote sur Lydia ?","gate":null,"quip":"Il attend toujours ses 12,50 €, tu sais."},
    {"id":"m6","cat":"moralite","q":"Avez-vous déjà revendu sur Vinted un cadeau qu'on vous avait offert ?","gate":null,"quip":"Tata Monique a vu l'annonce. Elle sait."},

    {"id":"d1","cat":"drogue","q":"Avez-vous déjà taxé une clope en soirée alors que vous ne fumez pas ?","gate":null,"quip":"« Je fume pas, je fume qu'en soirée. »"},
    {"id":"d2","cat":"drogue","q":"Avez-vous déjà tiré sur une puff ?","gate":null,"quip":"Goût barbe à papa, dignité zéro."},
    {"id":"d3","cat":"drogue","q":"Avez-vous déjà pris du proto ?","gate":null,"quip":"Une voix de Schtroumpf pour trente secondes de rire."},

    {"id":"s1","cat":"sexe","q":"Avez-vous déjà embrassé quelqu'un du même sexe ?","gate":null,"quip":"Curiosité scientifique, évidemment."},
    {"id":"s2","cat":"sexe","q":"Avez-vous déjà utilisé une appli de rencontre ?","gate":null,"quip":"Swipe à droite sur l'aveu."},
    {"id":"s3","cat":"sexe","q":"Avez-vous déjà swipé en étant en couple ?","gate":"s2","quip":"« C'était pour une étude de marché. »"},
    {"id":"s4","cat":"sexe","q":"Avez-vous déjà couché avec un match moins de 3 heures après le premier message ?","gate":"s2","quip":"Plus rapide qu'une livraison Amazon Prime."},

    {"id":"a6","cat":"alcool","q":"Avez-vous déjà commandé un Uber Eats après 4h du matin en rentrant de soirée ?","gate":null,"quip":"Le livreur a vu ton âme ce soir-là."},
    {"id":"a7","cat":"alcool","q":"Avez-vous déjà perdu votre téléphone en soirée ?","gate":null,"quip":"Quelque part, un taxi a ton iPhone et tes secrets."},
    {"id":"a8","cat":"alcool","q":"Avez-vous déjà envoyé un message bourré à un ex ?","gate":null,"quip":"« Tu me manques » à 3h12. Iconique."},

    {"id":"v5","cat":"adulte","q":"Avez-vous déjà été à découvert avant le 10 du mois ?","gate":null,"quip":"Le salaire, cette rumeur lointaine."},
    {"id":"v6","cat":"adulte","q":"Vous êtes-vous déjà inventé un métier en soirée ?","gate":null,"quip":"Astronaute le samedi, chef de projet le lundi."},
    {"id":"v7","cat":"adulte","q":"Avez-vous déjà posé un lapin à un rendez-vous Doctolib ?","gate":null,"quip":"Ton dermato a mis ta photo en salle d'attente."},

    {"id":"m8","cat":"moralite","q":"Avez-vous déjà gardé votre statut Teams au vert grâce à une astuce ?","gate":null,"quip":"Disponible sur Teams, indisponible dans la vie."},
    {"id":"m11","cat":"moralite","q":"Avez-vous déjà utilisé le compte Netflix de votre ex après la rupture ?","gate":null,"quip":"Le cœur est brisé, mais le profil reste."},
    {"id":"m4","cat":"moralite","q":"Avez-vous déjà signé un cadeau commun sans payer votre part ?","gate":null,"quip":"Ton nom sur la carte, zéro euro dans la cagnotte."},
    {"id":"m7","cat":"moralite","q":"Avez-vous déjà piqué la bouffe d'un collègue dans le frigo du bureau ?","gate":null,"quip":"Le mail « À la personne qui a pris mon taboulé… », c'était toi."},

    {"id":"s5","cat":"sexe","q":"Avez-vous déjà couché le premier soir ?","gate":null,"quip":"Efficacité maximale, zéro réunion de suivi."},
    {"id":"s6","cat":"sexe","q":"Avez-vous déjà simulé un orgasme ?","gate":null,"quip":"Un César, au moins une nomination."},
    {"id":"s7","cat":"sexe","q":"Avez-vous déjà envoyé un nude ?","gate":null,"quip":"Bon éclairage, j'espère."},
    {"id":"s8","cat":"sexe","q":"Avez-vous déjà envoyé un nude à la mauvaise personne ?","gate":"s7","quip":"Le groupe WhatsApp « Famille » s'en remet doucement."},

    {"id":"h4","cat":"hygiene","q":"Avez-vous déjà remplacé la douche par un coup de déo avant un date ?","gate":null,"quip":"Axe Effect, la promesse non tenue."},
    {"id":"h5","cat":"hygiene","q":"Avez-vous déjà laissé la vaisselle tremper plus d'une semaine ?","gate":null,"quip":"Ce n'est plus une poêle, c'est un écosystème."},
    {"id":"h6","cat":"hygiene","q":"Avez-vous déjà gardé les mêmes draps plus d'un mois ?","gate":null,"quip":"Tes draps ont leur propre code postal."},

    {"id":"d4","cat":"drogue","q":"Avez-vous déjà fumé du cannabis ?","gate":null,"quip":"Juste pour le folklore, bien sûr."},
    {"id":"d5","cat":"drogue","q":"Avez-vous déjà fait un bad ?","gate":"d4","quip":"Allongé dans la salle de bain à fixer le carrelage."},
    {"id":"d6","cat":"drogue","q":"Avez-vous déjà mangé un space cake ?","gate":"d4","quip":"« Je sens rien »… quarante minutes plus tard : la Lune."},
    {"id":"d7","cat":"drogue","q":"Avez-vous déjà fumé juste avant une réunion Teams ?","gate":"d4","quip":"Ta présentation sur les KPIs n'a jamais été aussi profonde."},
    {"id":"d8","cat":"drogue","q":"Avez-vous déjà fumé en cachette sur le balcon de vos beaux-parents ?","gate":"d4","quip":"« C'est l'odeur des voisins », bien sûr."},

    {"id":"a9","cat":"alcool","q":"Avez-vous déjà fini les fonds de verre des autres en fin de soirée ?","gate":null,"quip":"Zéro gaspillage, zéro dignité."},
    {"id":"a10","cat":"alcool","q":"Avez-vous déjà bu de l'alcool avant midi un jour de semaine ?","gate":null,"quip":"Il est forcément 18h quelque part."},
    {"id":"a11","cat":"alcool","q":"Avez-vous déjà fini une soirée d'entreprise plus bourré que votre manager ?","gate":null,"quip":"L'entretien annuel s'annonce passionnant."},

    {"id":"v8","cat":"adulte","q":"Avez-vous déjà stalké sur LinkedIn la nouvelle conquête de votre ex ?","gate":null,"quip":"« Untel a consulté votre profil. » Oups."},
    {"id":"v9","cat":"adulte","q":"Avez-vous déjà raté un train à cause d'une soirée ?","gate":null,"quip":"La SNCF n'y était pour rien, pour une fois."},
    {"id":"v10","cat":"adulte","q":"Avez-vous déjà rompu par message ?","gate":null,"quip":"Vu à 23h04. Pas de réponse. Bien joué."},
    {"id":"v11","cat":"adulte","q":"Avez-vous déjà perdu de l'argent en crypto ?","gate":null,"quip":"To the moon… et retour au Livret A."},

    {"id":"s9","cat":"sexe","q":"Avez-vous déjà couché avec quelqu'un rencontré à un mariage ?","gate":null,"quip":"Les mariés ont dit oui, toi aussi."},
    {"id":"s10","cat":"sexe","q":"Avez-vous déjà couché avec un collègue ?","gate":null,"quip":"La machine à café a tout vu."},
    {"id":"s11","cat":"sexe","q":"Avez-vous déjà couché avec l'ex d'un pote ?","gate":null,"quip":"Le code d'honneur, ce vieux concept."},
    {"id":"s12","cat":"sexe","q":"Avez-vous déjà couché chez vos parents pendant qu'ils étaient à la maison ?","gate":null,"quip":"Le lit superposé n'a jamais été aussi silencieux."},

    {"id":"m9","cat":"moralite","q":"Avez-vous déjà posé un arrêt maladie sans être malade ?","gate":null,"quip":"Gastro du vendredi, guérison miracle le lundi."},
    {"id":"m10","cat":"moralite","q":"Avez-vous déjà gonflé une note de frais ?","gate":null,"quip":"Ce kebab était « un déjeuner client »."},
    {"id":"m12","cat":"moralite","q":"Avez-vous déjà fouillé le téléphone de votre partenaire ?","gate":null,"quip":"Agent secret amateur, Face ID contourné."},
    {"id":"m13","cat":"moralite","q":"Avez-vous déjà stalké un ex avec un faux compte ?","gate":null,"quip":"@jardinage_passion_75 a vu ta story."},

    {"id":"h7","cat":"hygiene","q":"Avez-vous déjà mangé un reste d'Uber Eats qui avait passé la nuit hors du frigo ?","gate":null,"quip":"Ton estomac a un permis de port d'arme."},
    {"id":"h8","cat":"hygiene","q":"Avez-vous déjà passé un week-end entier sans vous laver ?","gate":null,"quip":"Mode hibernation, odeur incluse."},
    {"id":"h9","cat":"hygiene","q":"Avez-vous déjà utilisé la brosse à dents de quelqu'un d'autre ?","gate":null,"quip":"Le partage, oui. Pas comme ça."},
    {"id":"h10","cat":"hygiene","q":"Avez-vous déjà fait pipi dans une bouteille ?","gate":null,"quip":"Festival, bouchon, périph'… on ne juge pas. Si."},

    {"id":"a12","cat":"alcool","q":"Avez-vous déjà pris le micro au mariage d'un pote sans qu'on vous l'ait proposé ?","gate":null,"quip":"Le discours non prévu, la vidéo éternelle."},
    {"id":"a13","cat":"alcool","q":"Avez-vous déjà bu une bouteille de vin entière à vous tout seul ?","gate":null,"quip":"« C'est qu'un bon verre, en fait. »"},
    {"id":"a14","cat":"alcool","q":"Avez-vous déjà bu un shot dans le nombril de quelqu'un ?","gate":null,"quip":"L'EVG n'a pas d'odeur. Enfin, si."},

    {"id":"v12","cat":"adulte","q":"Avez-vous déjà inventé un couple pour avoir la paix à un repas de famille ?","gate":null,"quip":"« Il s'appelle Julien, il est kiné. » Il n'existe pas."},
    {"id":"v13","cat":"adulte","q":"Avez-vous déjà décliné un mariage pour économiser le prix du cadeau ?","gate":null,"quip":"La liste de mariage à 300 €, très peu pour toi."},
    {"id":"v14","cat":"adulte","q":"Avez-vous déjà eu un crush sur le partenaire d'un pote ?","gate":null,"quip":"On regarde, on ne touche pas. Hein ?"},
    {"id":"v15","cat":"adulte","q":"Avez-vous déjà caché un trou dans le mur avant un état des lieux de sortie ?","gate":null,"quip":"Dentifrice et poster : le kit du locataire."},

    {"id":"s13","cat":"sexe","q":"Avez-vous déjà eu un sex friend régulier ?","gate":null,"quip":"Un abonnement sans engagement."},
    {"id":"s14","cat":"sexe","q":"Avez-vous déjà payé pour du contenu sur OnlyFans ?","gate":null,"quip":"Tes relevés bancaires ont des choses à dire."},
    {"id":"s16","cat":"sexe","q":"Avez-vous déjà couché avec quelqu'un qui avait 15 ans d'écart avec vous ?","gate":null,"quip":"L'expérience, ça ne s'invente pas."},

    {"id":"d9","cat":"drogue","q":"Avez-vous déjà pris une autre drogue que le cannabis ?","gate":null,"quip":"Ah. On change de ligue."},
    {"id":"d10","cat":"drogue","q":"Avez-vous déjà pris de la MDMA ?","gate":"d9","quip":"Tu as dit « je t'aime » à un videur."},
    {"id":"d11","cat":"drogue","q":"Avez-vous déjà pris de la cocaïne ?","gate":"d9","quip":"Les toilettes à deux, c'était pas pour discuter."},
    {"id":"d12","cat":"drogue","q":"Avez-vous déjà pris de la kétamine ?","gate":"d9","quip":"Tu reviens de loin. Littéralement."},
    {"id":"d13","cat":"drogue","q":"Avez-vous déjà pris des champignons hallucinogènes ?","gate":"d9","quip":"Tu as eu une conversation profonde avec un arbre."},

    {"id":"m14","cat":"moralite","q":"Avez-vous déjà balancé un secret qu'on vous avait confié ?","gate":null,"quip":"« Je te le dis, mais tu le répètes pas. »"},
    {"id":"m15","cat":"moralite","q":"Avez-vous déjà télétravaillé depuis l'étranger sans le dire à votre boîte ?","gate":null,"quip":"Fond d'écran flouté, plage de Lisbonne derrière."},
    {"id":"m16","cat":"moralite","q":"Avez-vous déjà volé dans un magasin ?","gate":null,"quip":"Le portique a sonné, ton cœur aussi."},

    {"id":"s15","cat":"sexe","q":"Avez-vous déjà couché avec quelqu'un dont vous ne connaissiez pas le prénom ?","gate":null,"quip":"Enregistré comme « Bar rue Oberkampf »."},
    {"id":"s17","cat":"sexe","q":"Avez-vous déjà eu plus de 10 partenaires ?","gate":null,"quip":"Une équipe de foot et le remplaçant."},
    {"id":"s18","cat":"sexe","q":"Avez-vous déjà eu plus de 30 partenaires ?","gate":"s17","quip":"Il te faut un fichier Excel avec filtres."},

    {"id":"a15","cat":"alcool","q":"Êtes-vous déjà arrivé au travail encore bourré de la veille ?","gate":null,"quip":"Le stand-up de 9h était… vraiment debout ?"},
    {"id":"a16","cat":"alcool","q":"Avez-vous déjà enchaîné soirée et after jusqu'au lendemain midi ?","gate":null,"quip":"Petit-déj' au Picon, déjeuner au lit."},
    {"id":"a17","cat":"alcool","q":"Avez-vous déjà fini aux urgences à cause de l'alcool ?","gate":null,"quip":"Les infirmières t'appellent par ton prénom."},

    {"id":"d14","cat":"drogue","q":"Vous êtes-vous déjà fait livrer de la drogue plus vite qu'un Uber Eats ?","gate":null,"quip":"Note du livreur : 5 étoiles, discret."},
    {"id":"d15","cat":"drogue","q":"Avez-vous déjà caché de la drogue sur vous pour passer la sécu d'un festival ?","gate":null,"quip":"La chaussette, ce coffre-fort universel."},
    {"id":"d16","cat":"drogue","q":"Avez-vous déjà pris de la drogue pendant un événement pro ?","gate":null,"quip":"Le team building a pris un tournant inattendu."},
    {"id":"d17","cat":"drogue","q":"Avez-vous déjà fait la descente d'un week-end en plein open space le lundi ?","gate":null,"quip":"« Ça va ? T'as l'air fatigué. » Tu m'étonnes."},

    {"id":"v16","cat":"adulte","q":"Avez-vous déjà été viré d'un bar pendant un enterrement de vie de célibataire ?","gate":null,"quip":"Le costume de banane n'a pas aidé."},
    {"id":"v17","cat":"adulte","q":"Avez-vous déjà démissionné sur un coup de tête ?","gate":null,"quip":"Le mail envoyé à 2h, la liberté à 2h01."},
    {"id":"v18","cat":"adulte","q":"Avez-vous déjà arrangé vos relevés bancaires pour un dossier de crédit immo ?","gate":null,"quip":"Ton banquier croit encore que tu ne commandes jamais."},

    {"id":"s19","cat":"sexe","q":"Avez-vous déjà couché dans un lieu public ?","gate":null,"quip":"L'exhibitionnisme, une forme d'urbanisme."},
    {"id":"s20","cat":"sexe","q":"Avez-vous déjà couché dans les toilettes d'un bar ?","gate":"s19","quip":"Cinq personnes faisaient la queue. Elles savent."},
    {"id":"s21","cat":"sexe","q":"Avez-vous déjà couché avec deux personnes différentes dans la même journée ?","gate":null,"quip":"Un agenda Google en mode Tetris."},
    {"id":"s22","cat":"sexe","q":"Avez-vous déjà filmé vos ébats ?","gate":null,"quip":"Réalisateur, acteur, monteur. Un artiste complet."},

    {"id":"m17","cat":"moralite","q":"Avez-vous déjà quitté un restaurant sans payer ?","gate":null,"quip":"Le serveur te cherche encore dans le Marais."},
    {"id":"m18","cat":"moralite","q":"Avez-vous déjà fait une fausse déclaration à votre assurance ?","gate":null,"quip":"Ce vélo « volé » dort dans ta cave."},
    {"id":"m19","cat":"moralite","q":"Avez-vous déjà été l'amant de quelqu'un en couple ?","gate":null,"quip":"Le plan B, version premium."},

    {"id":"h11","cat":"hygiene","q":"Avez-vous déjà bouché les toilettes chez quelqu'un ?","gate":null,"quip":"Tu as fui la soirée sans dire au revoir."},
    {"id":"h12","cat":"hygiene","q":"Avez-vous déjà coupé vos ongles au bureau ?","gate":null,"quip":"Clic, clic, clic. Tout l'open space te hait."},
    {"id":"h13","cat":"hygiene","q":"Avez-vous déjà vomi dans un Uber ?","gate":null,"quip":"Ta note passager ne s'en est jamais remise."},
    {"id":"h14","cat":"hygiene","q":"Avez-vous déjà fait pipi dans un lavabo ?","gate":null,"quip":"Il y avait la queue, et toi tu avais un plan."},

    {"id":"s23","cat":"sexe","q":"Avez-vous déjà fait un plan à trois ?","gate":null,"quip":"Les maths, ça peut être fun."},
    {"id":"s24","cat":"sexe","q":"Avez-vous déjà participé à un plan à plus de trois ?","gate":"s23","quip":"À ce stade, il faut un Doodle."},
    {"id":"s25","cat":"sexe","q":"Êtes-vous déjà allé dans un club libertin ?","gate":null,"quip":"Vestiaire, serviette et ouverture d'esprit."},

    {"id":"m20","cat":"moralite","q":"Avez-vous déjà trompé votre partenaire ?","gate":null,"quip":"Aïe. On ne dira rien. Peut-être."},
    {"id":"m21","cat":"moralite","q":"Avez-vous déjà trompé avec quelqu'un de votre bande de potes ?","gate":"m20","quip":"Les brunchs du dimanche ont un sous-texte."},
    {"id":"m22","cat":"moralite","q":"Avez-vous déjà trompé sans jamais vous faire griller ?","gate":"m20","quip":"Ni vu ni connu. Jusqu'à ce soir."},
    {"id":"m23","cat":"moralite","q":"Avez-vous déjà fait une garde à vue ?","gate":null,"quip":"Tu connais le goût du sandwich au commissariat."}
  ],
  "tiers": [
    {"min":90,"title":"Eau de source certifiée","text":"Plus pur qu'une Cristaline sortie du frigo. Tu es la personne qu'on appelle pour garder les clés et les secrets."},
    {"min":75,"title":"Ange en période d'essai","text":"Quelques petits écarts, rien qui ne s'efface avec un bon brunch. Tes parents dorment tranquilles, pour l'instant."},
    {"min":55,"title":"Bon vivant de la rive droite","text":"Tu sais vivre, et ça se voit. Apéro au canal, after raisonnable, quelques casseroles bien rangées."},
    {"min":35,"title":"Ça commence à se voir","text":"Tes potes ont des anecdotes sur toi, et elles ne sont pas toutes racontables aux mariages. Le videur te dit bonjour."},
    {"min":15,"title":"Dépravé assumé","text":"Tu n'as plus de casier, tu as une collection. Ta vie mériterait un podcast en six épisodes."},
    {"min":0,"title":"Légende urbaine du 11e","text":"On raconte ton histoire aux nouveaux arrivants à Paris pour leur faire peur. Il n'y a plus rien à tester, tu as tout fait."}
  ],
  "archetypes": [
    {"id":"saint","name":"Le Saint de Saint-Germain","emoji":"😇","desc":"Ton plus grand vice : un deuxième croissant le dimanche. On t'aime, mais on ne t'invite pas aux afters.","rule":{"type":"pure"}},
    {"id":"boss","name":"Le Boss final de l'after","emoji":"🌪️","desc":"Alcool, drogue, sexe, fraude, hygiène douteuse : tu as coché toutes les cases. Tu n'es pas un invité, tu es l'after.","rule":{"type":"all"}},
    {"id":"pilier","name":"Le Pilier du canal Saint-Martin","emoji":"🍻","desc":"Tes pieds pendent au-dessus du canal depuis 2015. Ton foie a demandé une rupture conventionnelle.","rule":{"type":"dominant","cat":"alcool"}},
    {"id":"chimiste","name":"Le Chimiste de la Petite Ceinture","emoji":"🧪","desc":"Tu connais les teufs avant qu'elles soient sur Instagram. Ton dealer t'envoie des vœux à Noël.","rule":{"type":"dominant","cat":"drogue"}},
    {"id":"casanova","name":"Le Casanova de Pigalle","emoji":"💋","desc":"Hinge, Bumble, Tinder et la vraie vie : tu as épuisé l'algorithme. Ton historique ferait rougir un sex-shop.","rule":{"type":"dominant","cat":"sexe"}},
    {"id":"fraudeur","name":"Le Fraudeur du RER B","emoji":"🦹","desc":"Portillon, notes de frais, Netflix de l'ex : tu optimises tout. Ta morale a une option « mode avion ».","rule":{"type":"dominant","cat":"moralite"}},
    {"id":"remy","name":"Rémy de Ratatouille","emoji":"🐀","desc":"Ta coloc t'a laissé un mot passif-agressif sur le frigo. Ton gel douche a une date de péremption de 2022.","rule":{"type":"dominant","cat":"hygiene"}},
    {"id":"cadre","name":"Le Cadre en PLS de La Défense","emoji":"💼","desc":"Visio sans pantalon, découvert le 8, crypto en chute libre. Tu es adulte sur LinkedIn, beaucoup moins dans la vraie vie.","rule":{"type":"dominant","cat":"adulte"}},
    {"id":"teufeur","name":"Le Teufeur du périph'","emoji":"🎧","desc":"Tu as vu plus de levers de soleil depuis un hangar que depuis ton lit. Le lundi est une légende pour toi.","rule":{"type":"duo","cats":["alcool","drogue"]}},
    {"id":"oberkampf","name":"Le Fantôme d'Oberkampf","emoji":"🌙","desc":"Tu commences au bar, tu finis chez quelqu'un dont tu ne connais pas le prénom. Ton Uber connaît tous les codes d'immeuble du 11e.","rule":{"type":"duo","cats":["alcool","sexe"]}},
    {"id":"redflag","name":"Le Red Flag ambulant","emoji":"🚩","desc":"Swipe en couple, ex de tes potes, téléphone fouillé : un vrai festival de signaux d'alerte. Tes ex ont créé un groupe WhatsApp.","rule":{"type":"duo","cats":["sexe","moralite"]}},
    {"id":"consultant","name":"Le Consultant en optimisation","emoji":"📊","desc":"Notes de frais créatives, arrêts maladie stratégiques, statut Teams truqué. Tu factures même tes excuses.","rule":{"type":"duo","cats":["moralite","adulte"]}}
  ],
  "badges": [
    {"id":"boite-noire","emoji":"🕳️","name":"Boîte noire","desc":"Trou noir total, reconstitué grâce aux stories des autres.","rule":{"type":"yes","ids":["a4","a5"]}},
    {"id":"teams-warrior","emoji":"💻","name":"Teams Warrior","desc":"Sans pantalon, en sieste, mais toujours au vert.","rule":{"type":"yes","ids":["v2","v4","m8"]}},
    {"id":"ex-toxique","emoji":"💔","name":"Pas passé à autre chose","desc":"Message bourré, Netflix de l'ex et stalk LinkedIn : la totale.","rule":{"type":"yes","ids":["a8","m11","v8"]}},
    {"id":"mariage-enfer","emoji":"💒","name":"Le mariage dont on parle encore","desc":"Micro volé et nuit avec un invité. Les mariés t'ont gommé des photos.","rule":{"type":"yes","ids":["a12","s9"]}},
    {"id":"afterwork","emoji":"🏢","name":"Afterwork éternel","desc":"Plus bourré que ton manager, et pas seul dans le taxi du retour.","rule":{"type":"yes","ids":["a11","s10"]}},
    {"id":"mauvais-destinataire","emoji":"📲","name":"Mauvais destinataire","desc":"Un nude parti au mauvais endroit. Courage.","rule":{"type":"yes","ids":["s8"]}},
    {"id":"compta-creative","emoji":"🧾","name":"Comptabilité créative","desc":"Note de frais gonflée et assurance arnaquée. Bercy t'observe.","rule":{"type":"yes","ids":["m10","m18"]}},
    {"id":"lundi-noir","emoji":"🫠","name":"Lundi noir","desc":"Bourré au boulot et descente en open space : ton N+1 se pose des questions.","rule":{"type":"yes","ids":["a15","d17"]}},
    {"id":"labo","emoji":"⚗️","name":"Laboratoire ambulant","desc":"Au moins 60 % d'impureté côté drogue. Breaking Bad du 11e.","rule":{"type":"catMin","cat":"drogue","min":60}},
    {"id":"machine","emoji":"🔥","name":"Machine de guerre","desc":"Au moins 60 % d'impureté côté sexe. L'algorithme te dit merci.","rule":{"type":"catMin","cat":"sexe","min":60}},
    {"id":"casier-vierge","emoji":"📜","name":"Casier vierge","desc":"10 % d'impureté morale ou moins. Tu rends même la monnaie en trop.","rule":{"type":"catMax","cat":"moralite","max":10}},
    {"id":"savonnette","emoji":"🫧","name":"Savonnette humaine","desc":"10 % d'impureté hygiène ou moins. Tu sens le linge propre en permanence.","rule":{"type":"catMax","cat":"hygiene","max":10}},
    {"id":"foie-neuf","emoji":"🫀","name":"Foie de nourrisson","desc":"10 % d'impureté alcool ou moins. Ton foie est en garantie constructeur.","rule":{"type":"catMax","cat":"alcool","max":10}}
  ]
};
