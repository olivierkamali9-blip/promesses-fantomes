# PLAYBOOK — Promesses Fantômes (pour Olivier, en français)

## 0. Ce que contient ce pack
- `.kiro/steering/` : 3 fichiers de consignes permanentes pour Kiro (produit, technique, design)
- `.kiro/specs/promesses-fantomes/` : requirements, design, tasks (la spec complète, en anglais pour le jury)
- `README.md` : page d'accueil du dépôt
- Ce PLAYBOOK : comment travailler, quoi coller dans Kiro, quoi soumettre

## 1. Avant de partir lundi (sur téléphone, sans PC)
1. Remplir le formulaire des 4 000 crédits : https://forms.gle/ykuadfNyNdWdbJfH9 (identifiant Kiro + description du projet). Description à coller :
   "Ghost Pledges turns public promises into ghosts that players follow until evidence arrives. Virtual points only. An AI crew drafts, checks and resolves pledges under human-approval safety tiers. Built with Kiro specs, steering, hooks, MCP and property-based tests."
2. Poser sur le Discord #kiroween-hackathon : "Prizes are paid how for winners residing in DR Congo? Bank transfer, which forms?"
3. Rejoindre le Devpost Build Session du 11 nov (10h PT = 20h à Bunia).
4. Copier ce pack sur une clé USB ou un cloud pour le retrouver sur le PC au retour.

## 2. Règle d'or : séances « bougie »
Tu as peu d'électricité. Chaque séance = une tâche de `tasks.md`, 30 à 45 minutes max.
Fin de séance obligatoire : tests verts, commit, et ce prompt :
"Update SESSION_NOTES.md: what is done, what is next, 3 next steps, credits used."
Si le courant coupe, tu reprends avec SESSION_NOTES.md : Kiro retrouve le fil sans gaspiller de crédits.

## 3. Calendrier (retour le 11 nov, date limite 4 déc, minuit à Bunia)
- 11-13 nov : tâches 1 à 5 (le cœur : moteur de points, preuves, états, sécurité)
- 14-17 nov : tâches 6 à 9 (base de données, fantôme, fil, page d'une promesse)
- 18-22 nov : tâches 10 à 13 (agents IA, approbation, résolution, cimetière)
- 23-26 nov : tâches 14 et 15 (source réelle, FR/EN, accessibilité)
- 27 nov-1 déc : tâche 16 (déploiement, test sur vrai téléphone, vidéo)
- 2-3 déc : tâche 17 (texte, blog, post, soumission). Soumets le 3 décembre, pas le dernier soir.

## 4. Quoi coller dans Kiro (dans cet ordre)
Prompt 1 (une seule fois, mode spec) :
"Open the spec in .kiro/specs/promesses-fantomes. Read requirements.md, design.md and tasks.md and the steering files. Confirm you understand the product, then start task 1 only."
Prompt pour chaque tâche suivante :
"Implement task N from tasks.md. Follow the steering files. Write property-based tests for the listed properties. Stop when tests pass and summarise."
Prompt de design (tâche 7) :
"Build GhostFigure exactly per .kiro/steering/design.md: opacity by evidence level, state animations in CSS only, reduced-motion support, text and icon for each state."
Prompt de contrôle qualité (avant la vidéo) :
"Review the whole repo against requirements R1-R12. List every gap. Do not fix yet."

## 5. Fonctions Kiro à utiliser (le jury le note)
- Specs : déjà prêtes. Montre comment elles ont guidé le code.
- Steering : les 3 fichiers. Raconte l'effet (ex. le ton du fantôme, les règles de sécurité).
- Hooks (à créer dans Kiro, vérifie l'interface) : (a) à chaque sauvegarde de `src/engine/**` lancer les tests ; (b) avant un commit, vérifier qu'aucun secret n'est présent ; (c) en fin de séance, mettre à jour SESSION_NOTES.md.
- MCP : un petit serveur « sources » (searchNews, getFixture, fetchOfficial) avec données de test. À décider avec Kiro à la tâche 14.
- Tests par propriétés : P1 à P7 dans design.md. Note chaque bug qu'ils attrapent, c'est de l'or pour le texte du jury.
- Agents personnalisés / Kiro Crew (si disponible sur ton compte) : Architecte, Moteur-PBT, Designer de fantômes, Réviseur sécurité, Capitaine de sortie. Sinon, simples agents personnalisés.
- Écris dans un fichier `KIRO_NOTES.md`, au fil de l'eau, ce qui a bien ou mal marché : tu auras le texte de soumission presque fait.

## 6. Liste de soumission (à cocher)
- [ ] Dépôt GitHub public, licence MIT visible, dossier `.kiro/` NON ignoré
- [ ] Application en ligne qui marche (mode démo, sans clé)
- [ ] Vidéo YouTube publique, moins de 3 minutes, montre l'appli sur l'appareil visé
- [ ] Texte de description et texte « comment Kiro a été utilisé »
- [ ] Catégorie : Costume Contest
- [ ] Bonus : Blog (mentionner « written as part of the Kiroween 2026 hackathon »), post social avec #KiroweenHackathon26 au début, Best Demo (automatique), Kiro Crew App si utilisé
- [ ] Pas de Startup, pas d'Étudiant. « Ghost of Kiroween Past » seulement si tu étais inscrit en 2025

## 7. Script vidéo (2 min 45)
0:00 Problème : « Les promesses publiques disparaissent. »
0:15 Un fantôme apparaît : une promesse (fictive) avec compte à rebours
0:35 L'IA propose, le Gardien classe, la file d'approbation
1:00 Mise sur OUI/NON avec des Âmes
1:20 La preuve arrive : l'échelle de preuve monte, le fantôme devient solide
1:45 Distribution des gains, somme exacte (test par propriétés)
2:05 Le cimetière des erreurs de l'IA : l'IA avoue
2:25 Kiro en 20 secondes : specs, steering, hooks, tests
2:40 Titre final et le mot-clé du projet

## 8. Garde-fous (à relire avant de publier)
- Les Âmes n'ont aucune valeur d'argent, ne s'achètent pas, ne se retirent pas. Dis-le dans l'appli.
- Données de démo : fictives et marquées comme telles. Aucune fausse citation d'une vraie personne.
- Sujets sensibles (guerre, sécurité, santé, justice, élections) : approbation humaine avant publication.
- Je ne suis pas avocat : si tu veux un jour une vraie version avec argent, demande un avis juridique avant.

## 9. Points que je n'ai pas pu vérifier
Format exact des hooks Kiro ; disponibilité de Kiro Crew sur ton compte ; limites gratuites de l'API IA choisie ; une source fiable de résultats sportifs ; mode de paiement des prix vers la RDC.
