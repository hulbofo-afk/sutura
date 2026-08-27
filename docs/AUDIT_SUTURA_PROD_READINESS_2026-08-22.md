# Audit Sutura — Prod Readiness

**Date :** 22 août 2026  
**App :** Sutura — Atelier de décisions créateur (`apps/web` Next 15 + `@astryxdesign/core@0.4.5` + `apps/api` NestJS 11 / Prisma 7 / Postgres 55432)  
**Environnements :** `http://localhost:3000` (web) + `http://localhost:4000/api` (API) — PG embarqué `embedded-pg.cjs`  
**Compte seed :** `creator@sutura.app / password123` (`creator_demo`)  
**Méthodologie :** inspection Playwright exhaustive **15 écrans mobile 390×844** + **5 vues desktop 1440×900** (captures dans `/home/hopeman/labs/audit/` : `m-*.png` mobile, `d-*.png` desktop), recoupement avec `sutura_handoff_final(3)/sutura_handoff_final` (22 écrans, `tokens.json`, `SCREEN_SPECS_BASE.md`), et lecture du code `apps/web` / `apps/api`.  
**Objectif de ce doc :** cahier de charge prêt à soumettre tel quel à un agent de codage pour mise en prod.

---

## 1) Résumé exécutif

Produit fonctionnel de bout en bout, mais **non shippable** en l'état :  
- 3 P0 bloquants (lien public 404, nav qui masque le contenu, hero 404),  
- ~17 P1 de copy/logiciels debug visibles en prod,  
- double/triple navigation desktop et incohérence de groupe de routes,  
- dette de standardisation design (badges, radius, langue, boutons).

Le plan §7 est priorisé P0 → P1 → Standardisation et découpé en tâches atomiques avec fichiers, critères d'acceptation et vérifications.

---

## 2) Cahier des charges produit (ce que fait Sutura)

### 2.1 Vision & cible
Atelier de décisions pour **créateurs de mode Afrique de l'Ouest** (réf. Cotonou/Bénin). Réduire le risque d'invendu en transformant les retours audience en décisions de production : *quoi produire, à quel prix, en quelle quantité*.

### 2.2 Personas
- **Créateur** (compte JWT) : gère collections → modèles → tests → analyse → décision.  
- **Répondant** (anonyme, sans compte) : ouvre `/s/:slug` partagé sur WhatsApp/Instagram, répond en ~2 min.

### 2.3 Périmètre fonctionnel livré (22 écrans handoff — tous implémentés)
| Module | Écrans | Routes web | Contrats API |
|---|---|---|---|
| Onboarding | 5 étapes valeur/marque | `app/onboarding/page.tsx` | local |
| Auth | login / register / forgot / reset / changement email / changement mdp | `app/(auth)/*`, `components/forms/auth-form.tsx` | `POST /auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `POST /auth/refresh` (JWT 15 min + refresh rotatif) |
| Collections | liste paginée + filtres (Tous/draft/published/archived) + recherche + tri + pagination, création, détail (hero, stats, modifier/archiver/partager) | `collections-client.tsx`, `collection-detail-mobile-client.tsx` | `GET /collections?page&limit&sort&status&search`, `POST /collections`, `GET/PATCH /collections/:id`, `POST /collections/:id/archive` |
| Modèles | ajout avec upload photo (sign→PUT→confirm), édition, suppression, réordonnancement, grille | `model-form-client.tsx`, `collection-detail-mobile-client.tsx` | `POST /uploads/sign` → `PUT signedUrl` → `POST /uploads/confirm`, `POST /collections/:id/models`, `PATCH/DELETE`, `POST /reorder` |
| Fashion tests | liste globale filtrée, éditeur (verrouillé hors draft), questions 6 types (single_choice / multiple_choice / yes_no / number / textarea / ranking), réordonnancement ↑↓, suppression, checklist publication, preview, publication (QR + 5 canaux trackShareEvent), fermeture | `fashion-tests/page.tsx`, `test-editor-client.tsx`, `question-editor-client.tsx`, `publish-client.tsx` | `GET /fashion-tests`, `POST /collections/:cId/fashion-tests`, `GET/PATCH /fashion-tests/:id`, `POST /fashion-tests/:id/publish`, `POST /fashion-tests/:id/close`, `POST /fashion-tests/:id/questions`, `PATCH/DELETE /fashion-tests/:id/questions/:qId`, `POST /fashion-tests/:id/questions/reorder`, `GET /public-tests/:slug` |
| Questionnaire public | intro → questions typées + profil répondant optionnel → envoi idempotent (idempotencyKey `^[A-Za-z0-9_-]+$`) → merci | `app/s/[slug]/page.tsx`, `public-test-flow-client.tsx` | `GET /public-tests/:slug`, `POST /public-tests/:slug/responses` (sans auth) |
| Analytics | scores désirabilité/risque invendu /100, réponses, conversion, entonnoir par question, détail par question, pagination répondants | `analytics-client.tsx` | `GET /fashion-tests/:id/analytics`, `GET /fashion-tests/:id/responses?page&limit` |
| Recommandations | heuristiques locales par catégorie production/pricing/contenu avec niveau de confiance | `recommendations-client.tsx` | `GET /recommendations/:testId` |
| Rapport | export PDF authentifié (blob) | `reports/[testId]/page.tsx` | `GET /reports/:testId/pdf` |
| Profil | compte + préférences (notifications, langue), demande de changement d'email, changement de mot de passe, déconnexion confirmée Astryx | `profile-client.tsx` | `GET /auth/me`, `POST /auth/logout`, `POST /auth/change-email`, `POST /auth/change-password` |

### 2.4 Contraintes non fonctionnelles
- Mobile-first 390×844, breakpoints 360/390/430/768/1024/1440, touch 48dp, boutons 52dp.  
- Identité handoff : framboise `#E90046`, jaune `#F5D500`, prune `#4A2630`, canvas `#FFFDFC`, line `#E9DDE0`, muted `#75666A`, success `#2F8067`, Cormorant Garamond + Plus Jakarta Sans (via `next/font`).  
- Routes publiques sans auth, routes créateur sous JWT + vérification ownership à chaque requête (cf. `AGENTS.md`).  
- Offlines `OfflineBanner`, idempotence soumissions publiques.

---

## 3) Schémas d'utilisation (user flows)

### 3.1 Boucle cœur créateur
```
Onboarding 01→05 (valeur → marque → 1ère collection → 1er test)
  → Register/Login
  → Home « Bonjour Samsiath » + prochaine étape guidée
  → Créer collection → Ajouter modèles (photos sign/confirm)
  → Créer test → Ajouter questions (6 types) → Checklist ✓ → Preview
  → Publier → QR + lien + WhatsApp / Facebook / Instagram / TikTok (+ trackShareEvent)
  → [collecte] → Analytics (entonnoir) → Recommandations → Rapport PDF
  → Décision production → nouvelle collection (boucle)
```

### 3.2 Répondant sans friction
```
Lien WhatsApp / QR → /s/:slug intro (marque, 4 questions, ~2 min)
  → Profil optionnel (firstName/sex/age/city…)
  → Questions requises/optionnelles + barre progression
  → Envoi idempotent → Message de remerciement créateur
```

### 3.3 Cycle de vie d'un test
```
draft (éditable, checklist) → published (verrouillé, collecte) → closed (analyse seule)
```
✅ Correctement appliqué dans `test-editor-client.tsx` : bandeau « Lecture seule — published », inputs désactivés.

---

## 4) Plus-value apportable par fonctionnalité (leviers priorisés)

| Fonctionnalité | État actuel | Plus-value Prio 1 | Effort |
|---|---|---|---|
| **Partage / Viralité** | QR + lien + 5 chips | Message WhatsApp **pré-rédigé** avec nom de marque + visuel du 1er modèle (`wa.me/?text=` encodé), copie du lien en 1 tap + toast | S |
| **Questionnaire public** | Questions texte seul | **Afficher la photo du modèle** dans les questions de type choix (« Quel modèle porterais-tu ? ») + layout **1 question / écran** (handoff 21) | M |
| **Analytics** | Scores /100 + entonnoir | **Jauge de fiabilité** « 2/30 réponses » + **comparatif modèles côte à côte** (photo A vs B) → décision directe | M |
| **Recommandations** | Globales par catégorie | Recos **par modèle** (« Produire Veste Sika en priorité, 8 pièces ») + estimation quantité depuis prix moyen souhaité | M |
| **Question prix** | Input libre min-max | **Slider FCFA** avec paliers (10k/25k/50k) → moins d'erreurs, plus de réponses | S |
| **Rapport PDF** | Export brut | Rapport **« pitch fournisseur/banque »** : cover marque + photos + verbatims + recos | M |
| **Collections** | CRUD | **Dupliquer un test** d'une collection à l'autre (saison N+1) | S |
| **Onboarding** | 5 écrans informatifs | Fusionner avec la **création réelle de la 1ère collection** (handoff 04–05) → time-to-value < 5 min | M |

---

## 5) Bugs visuels & incohérences — à corriger

### 5.1 P0 — Bloquants prod (ne pas shipper)
| # | Sév. | Description | Fichier(s) | Preuve |
|---|---|---|---|---|
| B01 | P0 | **Lien public mort** : Publish affiche `http://localhost:3000/t/rose-cotonou` et le QR encode `/t/…` → **404**. La route réelle est `/s/:slug`. Host en dur `localhost` → QR inutilisable en prod. | `components/dashboard/publish-client.tsx` (construit `window.location.origin + "/t/" + slug`, QR via `api.qrserver.com?data=/t/…`) | `audit/m-10-publish.png` + `curl /t/rose-cotonou 404` vs `/s/rose-cotonou 200` |
| B02 | P0 | **Bottom nav mobile masque le contenu** sur tous les écrans profonds : éditeur (cache stats "Structure du test"), dashboard (cache cartes activité), publish (cache le lien), analytics (cache l'entonnoir), profil (cache champ email), collection détail (cache modèles). Nav non `fixed` + pas de `padding-bottom` compensatoire. | `components/ui/mobile-screen.tsx` (MobileBottomNav), tous les clients l'utilisant | `audit/m-05` à `m-13` |
| B03 | P0 | **Hero image 404** : `GET /assets/hero-visual.png 404`. Le code référence `/brand/assets/hero-visual.jpg` mais la page charge `/assets/hero-visual.png` → icône image cassée + alt visible sur le hero collection. | `components/dashboard/collection-detail-mobile-client.tsx:18` `const heroImage = … ?? "/brand/assets/hero-visual.jpg"` vs source réelle `/public/brand/assets/hero-visual.jpg` + `console [ERROR] 404` | `audit/m-07-collection-detail.png`, `playwright console` |
| B04 | P0 | **Register 100 % anglais** dans une app FR : "Open a premium creator space", "Full name", "Brand name", "Create account". | `components/forms/auth-form.tsx:156+` | `audit/m-03-register.png` |

### 5.2 P1 — Copy de debug / specs internes visibles en prod
| # | Description | Fichier | À remplacer par |
|---|---|---|---|
| B05 | Login : « Astryx Button exemple : import {Button} from '@astryxdesign/core/Button' » | `components/forms/auth-form.tsx:70` | Supprimer |
| B06 | Register : « Uses POST /auth/register and mirrors the backend DTO constraints with zod. » | `components/forms/auth-form.tsx:156` (prop `description`) | « Crée ton espace créateur en moins de 2 minutes. » |
| B07 | Collections : « Liste paginée · recherche et pagination branchées sur GET /collections. » + badge « Private listing » | `components/dashboard/collections-client.tsx:62,66` | « Gère tes collections et partage-les en tests. » ; badge « Privé » ou retirer |
| B08 | Tests : « Filtre Tous / Brouillons / Actifs / Fermés — branché sur GET /fashion-tests. » | `app/(dashboard)/fashion-tests/page.tsx:29` | « Filtre par statut pour retrouver tes tests. » |
| B09 | Login desktop : « Framboise #E90046 guide l'œil, jaune #F5D500 accent ponctuel, prune #4A2630 contraste. » | `components/forms/auth-form.tsx` (variante desktop) | « Tissu, coupe, décision. » (copy handoff) |
| B10 | Profil : « Déconnexion avec confirmation Astryx — action irréversible côté session. » | `components/dashboard/profile-client.tsx` | « Déconnexion sécurisée. » |
| B11 | Eyebrows numérotés handoff exposés : « 08 HOME », « 11 TESTS », « 12 EDITEUR », « 16 DETAIL », « 17 ANALYTICS », « 20 INTRO — SANS COMPTE », « 21 QUESTIONS » | `MobileScreen eyebrow` sur chaque client | Libellé produit (« Accueil », « Éditeur », etc.) ou retirer |
| B12 | Reco : carte « PROVIDER local » + texte anglais « Recommendations are generated only from collected fashion test data (heuristic local rules). » | `components/dashboard/recommendations-client.tsx` | « Analyse basée uniquement sur tes réponses » |
| B13 | Login/Register : « S'inscrire en moins de 2 minutes » présent partout hors contexte | `auth-form.tsx` | Garder uniquement sur login |
| B14 | Fautes / accents : « Ton activite » → « Ton activité », « reponses » → « réponses », « Collecti.. » tronqué | `dashboard-client.tsx:128`, `creator-home-client.tsx:71`, tests list | Corriger + éviter troncatures (voir B17) |

### 5.3 P1 — Layout & cohérence
| # | Description | Fichier(s) |
|---|---|---|
| B15 | **Triple navigation desktop** : topbar + sidebar "NAVIGATION" (4 liens) + mini-header Sutura dans le contenu. Sidebar vide sous les liens, énorme perte d'espace. | `app/(dashboard)/layout.tsx` (TopNav), `components/ui/mobile-screen.tsx` (aside), pages elles-mêmes |
| B16 | **Routes analytics/recommendations/reports sans topbar** : hors groupe `(dashboard)` → nav incohérente avec le reste de l'app privée. | `app/analytics/[testId]/page.tsx`, `app/recommendations/[testId]/page.tsx`, `app/reports/[testId]/page.tsx` |
| B17 | Bouton « + Nouvelle collection » **coupé/superposé** sous la pagination (mobile + desktop). | `collections-client.tsx` (bouton en dehors du conteneur pagination) |
| B18 | Collection détail : carrousel modèles **coupé à droite** sans indicateur de scroll. | `collection-detail-mobile-client.tsx` |
| B19 | Collection détail : boutons « Éditer / Supprimer » tailles/alignements incohérents. | idem |
| B20 | Éditeur mobile : titres de questions **tronqués** sans tooltip (« Quel modele… », « Que… »). | `test-editor-client.tsx:94` |
| B21 | Tests mobile : chip "close" coupée (overflow horizontal sans scroll-indicator). | `fashion-tests` list |
| B22 | État « Non modifiable » rendu comme **bouton primaire rose plein** → semble cliquable alors que `disabled`. | `test-editor-client.tsx:52` |
| B23 | Éditeur : carte « Structure du test » rose pâle avec 3 stats blanches quasi invisibles sous la nav (lié B02), contrastes faibles. | `test-editor-client.tsx` |
| B24 | Analytics desktop : 4 KPI sur une ligne 1440 ok mais mobile 390 : grille 2×2 ok, mais sections suivantes sans respiration (lié B02). | `analytics-client.tsx` |

---

## 6) Standardisation design — prêt prod

### 6.1 Navigation
- **Mobile (≤ 640px)** : `MobileBottomNav` en `position: fixed; bottom: 0; safe-area-inset-bottom` + `padding-bottom: 88px` sur le conteneur de page. Supprimer le double header interne.
- **Desktop (≥ 1024px)** : **topbar seule**. Supprimer la sidebar "NAVIGATION" et le mini-header `S / Sutura atelier de decisions` dupliqué dans le contenu. Déplacer `analytics`, `recommendations`, `reports` dans `app/(dashboard)/` pour hériter du layout.

### 6.2 Badges & statuts (unifier)
| Statut | Style |
|---|---|
| `draft` | neutre : `bg-white border text-[var(--color-panel-strong)]` |
| `published` | success : `bg-[var(--color-success)] text-white` (ou `bg-[#2F8067]`) |
| `closed` | `bg-[#101418] text-white` |
| `archived` | `bg-[var(--color-muted)] text-white` |
Actuellement : vert sur collections, rose framboise dans l'éditeur, bleu sur d'autres → harmoniser partout.

### 6.3 Radius, ombres, espacements
- Échelle handoff **10 / 14 / 20** strictement (actuellement 24/20/18/14/10 mélangés).  
- Ombres : une seule `shadow-soft` pour les cards, `shadow-none` pour les chips.  
- Gaps : 12px mobile, 16px desktop.

### 6.4 Typo & langue
- Tout en **français, tutoiement constant**. Accents obligatoires.  
- Eyebrows : retirer les numéros handoff ou les mapper vers des libellés produit.  
- Hiérarchie : `h1` Cormorant 34→42→48 (desktop), `eyebrow` 12px uppercase 0.2em, `body` 14–16px.

### 6.5 Boutons
- **Primaire** : framboise `#E90046` / `text-white` / 52dp / radius 14.  
- **Secondaire** : `bg-white border border-[var(--color-border)] text-[var(--color-panel-strong)]`.  
- **Disabled** : `bg-zinc-100 text-zinc-400 border-zinc-200 pointer-events-none` (jamais rose plein disabled).  
- Supprimer le bouton « Rechercher » framboise plein-largeur (la recherche doit être **instantanée** `onChange` debounced, sans CTA).

### 6.6 Autres
- QR **généré localement** (lib `qrcode` / `qrcode.react`) plutôt que `api.qrserver.com` (dépendance externe + fuite d'URLs).  
- Images : corriger le chemin `hero-visual`, ajouter `next/image` + `alt` corrects, placeholder tissu.  
- Skeletons uniformes : `LoadingCards` partout (certaines pages n'en ont pas).  
- Toasts (Sonner / Astryx) pour copie lien / sauvegarde / suppression au lieu de silence ou `confirm()` natif.  
- 404 / error boundaries brandés, favicon + OG image pour la preview WhatsApp du lien `/s/:slug`.

---

## 7) Plan d'exécution pour agent de codage

> Ordre imposé : P0 → P1 copy → P1 layout → Standardisation. Chaque tâche = 1 commit atomique. Vérifier `npm run typecheck && npm run build` après chaque lot.

### Lot A — P0 (bloquant)
- [ ] **A1 — Lien public & QR (B01)**  
  Fichier : `apps/web/components/dashboard/publish-client.tsx`  
  Faire : introduire `NEXT_PUBLIC_APP_URL` (fallback `window.location.origin`), remplacer tous les `/t/` par `/s/`, remplacer `api.qrserver.com` par `qrcode.react` ou `qrcode` (génération locale). Message WhatsApp encodé `https://wa.me/?text=…`. Ajouter `GET /t/:slug` → redirect vers `/s/:slug` côté `next.config`.  
  Critère : `curl /s/rose-cotonou 200`, `/t/rose-cotonou 308→/s/…`, QR scanné ouvre bien le test.

- [ ] **A2 — Bottom nav qui masque (B02)**  
  Fichier : `apps/web/components/ui/mobile-screen.tsx`  
  Faire : `MobileBottomNav` en `fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t safe-area`, wrapper de page `pb-[88px] lg:pb-0`. Tester 390, 768, 1440.  
  Critère : plus aucun contenu masqué sur les 8 écrans listés B02 (vérif. Playwright 390).

- [ ] **A3 — Hero 404 (B03)**  
  Fichier : `apps/web/components/dashboard/collection-detail-mobile-client.tsx:18` + `apps/web/public/brand/assets/`  
  Faire : corriger le chemin vers `/brand/assets/hero-visual.jpg` (ou `/brand/tissu.jpg` existant), passer à `next/image` avec `priority`.  
  Critère : plus de 404 dans la console.

- [ ] **A4 — Register FR (B04)**  
  Fichier : `apps/web/components/forms/auth-form.tsx` (variante register)  
  Faire : traduire tout le formulaire : « Nom complet », « Nom de marque », « Adresse email », « Mot de passe », « Ville », « Pays », « Créer mon atelier », eyebrow « Créer un compte », description FR.  
  Critère : `audit/m-03` sans aucun mot anglais.

### Lot B — P1 copy (pollution prod)
- [ ] **B5–B14 — Purge des textes debug** — Fichiers listés §5.2, remplacer un à un. Supprimer ou réécrire chaque occurrence `branché sur GET`, `Private listing`, `08 HOME` etc. Vérifier `rg "branché sur|Private listing|Astryx Button|08 home" apps/web` → 0 résultat.

### Lot C — P1 layout
- [ ] **C1 — Dédupliquer la nav desktop (B15)** : garder topbar, supprimer sidebar + mini-header interne. Fichiers : `app/(dashboard)/layout.tsx`, `components/ui/mobile-screen.tsx`.  
- [ ] **C2 — Rattacher analytics/reco/reports au groupe (dashboard) (B16)** : déplacer `app/analytics`, `app/recommendations`, `app/reports` dans `app/(dashboard)/`.  
- [ ] **C3 — Pagination + bouton Nouvelle collection (B17)** : bouton dans le footer de la card pagination, `flex justify-between`.  
- [ ] **C4 — Carrousel modèles (B18–B19)** : scroll snap + indicateur, aligner les boutons Éditer/Supprimer.  
- [ ] **C5 — Troncatures (B20–B21)** : `title` attr + `line-clamp` cohérent, chips scroll avec `mask-image` ou `overflow-auto`.  
- [ ] **C6 — Bouton Non modifiable (B22)** : passer en `disabled` gris, label « Modifications verrouillées ».  

### Lot D — Standardisation
- [ ] D1 Badges statuts unifiés (§6.2).  
- [ ] D2 Radius/ombres/gaps (§6.3).  
- [ ] D3 Typo/langue (§6.4).  
- [ ] D4 Hiérarchie boutons (§6.5) + recherche instantanée (supprimer CTA Rechercher).  
- [ ] D5 États vides illustrés + skeletons uniformes + toasts + 404/OG.

---

## 8) Checklist de sortie (definition of done)

- [ ] `npm run typecheck` + `npm run build` + `npx prisma validate` verts (api + web).  
- [ ] Aucun `GET ... 401/404` en console sur `/dashboard`, `/collections`, `/collections/:id`, `/analytics/:id`, `/s/:slug`.  
- [ ] Playwright 390×844 : aucune superposition de la bottom nav (captures `audit/m-*` re-générées).  
- [ ] Playwright 1440×900 : une seule nav (topbar), pas de sidebar, analytics/reco avec topbar.  
- [ ] `rg -n "branché sur|Private listing|Astryx Button|08 home|16 DETAIL|PROVIDER local"` → 0.  
- [ ] `curl /s/rose-cotonou 200` et QR scanné → même URL.  
- [ ] `rg "@astryxdesign"` cohérent : `import {X} from "@astryxdesign/core/X"` + `Theme` + `LinkProvider` présents.  
- [ ] Lighthouse mobile ≥ 90 perf / 100 accessibilité sur `/s/:slug`.

---

## 9) Références pour l'agent

- Tokens : `apps/web/lib/theme/tokens.json`, `apps/web/public/brand/tokens.json`, `apps/web/app/globals.css` (layers Astryx + `--breakpoint-xs: 22.5rem`).  
- Thème : `apps/web/components/providers.tsx` (`suturaTheme` = `neutralTheme` + tokens).  
- API client : `apps/web/lib/api.ts` (ky, `refreshPromise` singleton).  
- Specs handoff : `sutura_handoff_final(3)/sutura_handoff_final/brand/tokens.json`, `.../screens/screen_refs/01..22`, `.../SCREEN_SPECS_BASE.md`.  
- Règles : `AGENTS.md` (ownership, routes publiques sans auth, ne pas supprimer `sutura-backend/frontend`), `HANDOFF.md`.  
- Captures d'audit : `/home/hopeman/labs/audit/m-*.png` (mobile) + `d-*.png` (desktop).

---

*Généré le 2026-08-22 à partir de l'inspection Playwright réelle. Prêt à être soumis tel quel à un agent de codage — exécuter Lot A en premier.*
