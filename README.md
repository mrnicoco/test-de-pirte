# Pur ou Pas 😇😈

Test de pureté pour les 25-45 ans, à jouer en soirée, dans l'esprit du test Griffor : 113 questions oui/non (alcool, drogue, sexe, moralité, hygiène, vie d'adulte), avec des questions-portes et un profil complet à la fin (score de pureté, archétype, radar, badges).

**18+ uniquement.** Tout reste sur l'appareil du joueur : aucun serveur, aucun tracking.

## Fonctionnalités

- **Solo** : une question à la fois, swipe sur mobile, clavier (O / N, ← / →), bouton retour, partie sauvegardée.
- **Questions-portes** : une sous-question n'est posée que si on a répondu OUI à la question parente. Sinon elle compte NON.
- **Score** : pureté = % de NON sur l'ensemble des questions. Le détail par catégorie alimente le radar et l'archétype.
- **Partage sans serveur** : le résultat est encodé dans le lien.
  - `#r=` : profil complet, avec les réponses détaillées.
  - `#p=` : profil discret, avec seulement les scores.
  - Le lien se partage par copie, Web Share ou QR code.
- **Ma bande** : on ajoute les profils des potes à partir de leurs liens. On obtient un classement, des radars superposés et des stats fun (« le seul à avoir… », âme sœur de débauche…).
- **Live en P2P (WebRTC)** :
  - l'hôte crée une room (code à 5 caractères, ou QR) ;
  - tout le monde répond à la même question en même temps ;
  - la révélation « X/Y ont dit oui » s'affiche, de façon anonyme ou nominative ;
  - les joueurs peuvent envoyer des réactions emoji ;
  - un classement final clôt la partie.

## Publier sur GitHub Pages

```bash
# dans ce dossier
git remote add origin https://github.com/<ton-user>/pur-ou-pas.git
git push -u origin main
```

Ensuite, sur GitHub, va dans **Settings → Pages → Build and deployment**. Choisis **Deploy from a branch**, puis la branche `main` et le dossier `/ (root)`. Le site sera en ligne sur `https://<ton-user>.github.io/pur-ou-pas/`.

## Modifier les questions

1. Édite `src/questions.js`. Chaque question est un objet `{id, cat, q, gate, quip}`. Pour une sous-question, `gate` contient l'id de la question parente, qui doit être placée avant.
2. Vérifie le fichier : `node tools/validate.js`.
3. Reconstruis la page : `python3 tools/build.py`.

⚠️ Les codes de partage dépendent de l'ordre et du nombre de questions. Si tu modifies la liste, incrémente `"version"` dans `questions.js`. Les anciens liens afficheront alors un message propre au lieu d'un faux profil.

## Limites du mode live

- La mise en relation passe par le serveur public gratuit de PeerJS (`0.peerjs.com`). Les données de jeu, elles, circulent directement entre les appareils.
- Il n'y a pas de serveur TURN. Certains réseaux (4G avec NAT strict, Wi-Fi d'entreprise) peuvent bloquer la connexion. Dans ce cas, l'app propose de jouer en solo et de comparer avec les liens.
- Si l'hôte recharge sa page, la room est perdue. Un invité qui recharge sa page, lui, reprend la partie.

## Structure

```
index.html          ← la page publiée (autonome : CSS, JS et questions inline)
src/index.src.html  ← coquille HTML + CSS
src/app.js          ← logique (quiz, score, codes, bande, live P2P)
src/questions.js    ← questions, paliers, archétypes, badges
tools/build.py      ← assemble index.html
tools/validate.js   ← vérifie la cohérence des questions
```

Dépendances externes, chargées depuis un CDN : PeerJS (mode live), qrcode-generator (QR codes) et Google Fonts. Si l'une d'elles ne charge pas, la page utilise une solution de secours.
