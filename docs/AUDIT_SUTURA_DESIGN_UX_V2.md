# Audit Sutura — Design & UX V2

**Date :** 23 août 2026  
**Application :** Sutura — Atelier de décisions créateur  
**Périmètre :** `apps/web` Next 15, API NestJS/PostgreSQL utilisée par l'interface  
**Environnements inspectés :** web `http://localhost:3000`, API `http://localhost:4000/api`  
**Compte de test :** `creator@sutura.app / password123`  
**Référence :** `sutura_handoff_final(3)/sutura_handoff_final` (tokens, manifeste des écrans et références visuelles)

## 1. Méthodologie

- Inspection Playwright des parcours authentifiés et publics.
- Viewport mobile principal : `390×844`.
- Viewport desktop : `1440×900`.
- Parcours inspectés : login, register, onboarding, dashboard, collections, détail collection, tests, éditeur, publication, analytics, profil, questionnaire public intro/question.
- Vérification des consoles navigateur et des requêtes réseau pendant les parcours.
- Comparaison avec les tokens du handoff : framboise `#E90046`, jaune `#F5D500`, prune `#4A2630`, canvas clair, rayons `10/14/20`, cible tactile `48px`, bouton `52px`.
- Captures disponibles dans `/home/hopeman/labs/audit-v2/`.

## 2. Résumé exécutif

La V2 confirme que le produit est maintenant navigable de bout en bout et que les principaux blocages de l'audit initial ont été corrigés. Les changements vérifiés incluent :

- navigation mobile fixe centralisée avec espace inférieur réservé ;
- URLs publiques normalisées vers `/s/:slug` et QR généré localement ;
- correction de l'image hero et disparition du `404` observé sur le détail collection ;
- questionnaire public débarrassé des textes internes de handoff ;
- indicateur de fiabilité ajouté aux analytics ;
- favicon et metadata de base ajoutés.

Le produit reste toutefois à considérer comme **pré-release**, pas comme validation finale de production. Les risques résiduels portent surtout sur la cohérence de navigation desktop, la persistance définitive des URLs d'images seedées, la couverture de tests de non-régression et quelques détails de finition visuelle.

## 3. Corrections confirmées

| Sujet | État | Vérification |
|---|---|---|
| Bottom navigation mobile | Corrigé | `DashboardBottomNav` est rendu par le layout privé ; le conteneur réserve `pb-[88px]` sur mobile. |
| Contenu masqué par la nav | Corrigé sur les captures finales | Captures `m-dashboard-final.png` et `m-collection-detail-after.png`. |
| Lien public | Corrigé | `publish-client.tsx` normalise `/t/` vers `/s/` et construit une URL absolue. |
| QR code | Corrigé | `QRCodeSVG` remplace le service QR externe. |
| Compatibilité legacy | Présente | `next.config.ts` redirige `/t/:slug` vers `/s/:slug`. |
| Image hero | Corrigé à la lecture | mapper API, seed et client utilisent `/brand/assets/hero-visual.jpg`. |
| Console du détail collection | Corrigé sur le parcours vérifié | Plus de `404` signalé après correction du mapper. |
| Questionnaire public | Corrigé | Libellés visibles en français et débarrassés des références de debug. |
| Analytics | Amélioré | Jauge de fiabilité `responses/30` et indication de réponse anonyme visibles. |
| Favicon | Corrigé | Metadata `icon`, `shortcut` et `apple` déclarées dans `app/layout.tsx`. |
| Build web | Vert | `npm run typecheck` et `npm run build`. |
| Build API | Vert | `npm run typecheck` et `npm run build`. |

## 4. Écarts et risques résiduels

### P1 — à traiter avant validation production

| ID | Constat | Risque | Emplacement concerné | Recommandation |
|---|---|---|---|---|
| R01 | La navigation desktop est désormais portée par le layout privé, mais certaines pages publiques ou pages hors groupe `(dashboard)` doivent encore être vérifiées explicitement avec la même enveloppe visuelle. | Rupture de repères entre analytics, recommandations, rapports et le reste de l'espace privé. | `app/analytics`, `app/recommendations`, `app/reports` et layouts associés | Faire un passage desktop complet et rattacher les pages privées au layout commun si elles n'en héritent pas déjà. |
| R02 | La correction d'URL d'image existe à plusieurs niveaux : seed, mapper et client. | Une nouvelle donnée historique ou une URL mal formée peut réintroduire une image cassée. | `apps/api/prisma/seed-data.ts`, `apps/api/src/services/mappers.ts`, composants collection | Ajouter une validation/canonicalisation unique au point d'écriture et vérifier les données existantes par migration ou reset seed. |
| R03 | La copie est majoritairement française dans les parcours inspectés, mais une recherche globale reste nécessaire pour exclure tous les anciens textes internes. | Exposition de détails techniques ou mélange de langues en production. | `apps/web/components` et `apps/web/app` | Exécuter une recherche ciblée sur `branché sur`, `Private listing`, `Astryx Button`, `PROVIDER local`, anciens numéros d'écran et textes anglais. |
| R04 | Les tests de build sont verts, mais la checklist de sortie demande encore une validation Playwright complète post-corrections. | Une régression de route, auth ou de console peut passer inaperçue. | Parcours web complet | Rejouer les parcours avec une session fraîche et archiver les résultats réseau/console. |

### P2 — finition design et expérience

| ID | Constat | Recommandation |
|---|---|---|
| R05 | Les composants utilisent encore plusieurs rayons et variantes d'espacement en dehors de l'échelle handoff. | Centraliser progressivement les cartes, boutons et chips sur `10/14/20` et les gaps `12/16`. |
| R06 | Certains états désactivés, badges de statut et boutons secondaires doivent être comparés écran par écran. | Utiliser une matrice de composants : draft, publié, fermé, archivé, disabled, loading, error. |
| R07 | Le carrousel de modèles et les chips horizontales nécessitent une vérification sur `360px` et `430px`, pas seulement `390px`. | Ajouter indicateur de défilement et test de débordement aux petits et grands mobiles. |
| R08 | Les états vides, skeletons et toasts ne sont pas encore uniformes sur tous les modules. | Standardiser les composants d'état avant la première release publique. |
| R09 | La preview sociale du lien public et l'OG image n'ont pas été validées. | Ajouter puis tester Open Graph/Twitter metadata pour `/s/:slug`. |

## 5. Comparaison avec le handoff

### Conforme ou proche

- Palette principale et contraste général cohérents avec les tokens.
- Cormorant Garamond pour les titres et Plus Jakarta Sans pour le corps.
- Boutons principaux à hauteur proche de `52px`.
- Canvas clair, cartes arrondies et accents framboise/prune conservés.
- Questionnaire public accessible sans compte.
- Navigation mobile adaptée au modèle d'usage à une main.

### À harmoniser

- Les rayons historiques restent plus variés que l'échelle du handoff.
- Les statuts ne sont pas encore garantis par un composant unique.
- Certaines pages utilisent encore un vocabulaire ou une hiérarchie héritée de l'implémentation plutôt que du produit final.
- La cohérence desktop doit être confirmée pour les routes privées hors dashboard principal.

## 6. Vérifications de sortie recommandées

```bash
cd /home/hopeman/labs/sutura/apps/web
npm run typecheck
npm run build

cd /home/hopeman/labs/sutura/apps/api
npm run typecheck
npm run build
npx prisma validate
```

Recherche de textes internes :

```bash
rg -n "branché sur|Private listing|Astryx Button|PROVIDER local|08 HOME|16 DETAIL|17 ANALYTICS|20 INTRO|21 QUESTIONS" apps/web
```

Checklist Playwright finale :

- session fraîche sur les routes créateur ;
- aucune requête `401` ou `404` inattendue ;
- questionnaire `/s/:slug` utilisable sans token ;
- bottom nav ne recouvre aucun contenu à `390×844` ;
- une seule navigation desktop à `1440×900` ;
- QR et bouton de partage pointent vers `/s/:slug` ;
- favicon chargé ;
- consoles navigateur sans erreur applicative.

## 7. Verdict

**Statut : pré-release validée fonctionnellement, validation production encore requise.**

Les P0 de l'audit initial ne sont plus reproduits sur les parcours corrigés. La prochaine étape utile est une passe de non-régression automatisée et la fermeture des risques R01 à R04. Les sujets P2 peuvent ensuite être traités dans un lot de standardisation visuelle sans bloquer la démonstration fonctionnelle.
