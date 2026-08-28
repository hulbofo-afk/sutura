# Instructions pour agent de codage — Sutura

## Architecture active

Sutura utilise désormais **Next.js + Convex** comme chemin d’exécution principal :

- frontend : `apps/web` ;
- backend applicatif : `apps/web/convex` ;
- authentification : Convex Auth ;
- IA : actions Convex vers Imole, avec fallback local.

`apps/api` (NestJS/PostgreSQL) est un backend historique conservé pour référence et transition. Ne pas ajouter de nouvelles fonctionnalités dans `apps/api` sans décision explicite du propriétaire du projet.

## Règles de travail

- Ne jamais committer de secrets, clés Convex, tokens Imole ou fichiers `.env` ;
- ne pas modifier les fichiers de `convex/_generated/` à la main ; les régénérer avec la CLI ;
- conserver les routes publiques du questionnaire sans authentification ;
- protéger chaque query et mutation créateur avec `ctx.auth` et vérifier l’ownership ;
- valider les données côté Convex, pas uniquement dans le navigateur ;
- ne jamais envoyer de données personnelles ou de réponses brutes à l’IA ;
- préférer des changements ciblés, testés et documentés ;
- garder `apps/api` et les documents historiques identifiés comme tels jusqu’à décision de nettoyage.

## Commandes frontend

```bash
cd apps/web
npm install
npm run dev
npm run typecheck
npm run lint
npm run test:validation
npm run build
```

Pour générer ou déployer Convex :

```bash
cd apps/web
npx convex codegen
CONVEX_DEPLOY_KEY='<clé fournie hors dépôt>' npx convex deploy --typecheck disable --codegen enable
```

## Validation obligatoire

Avant une PR frontend/Convex :

- `npm run typecheck` doit réussir ;
- `npm run lint` ne doit produire aucune erreur ;
- `npm run test:validation` doit réussir ;
- `npm run build` doit réussir ;
- les fonctions Convex modifiées doivent être déployées et testées si elles touchent un flux critique ;
- `git status --short` doit être propre après commit.

## Convention de données

Les soumissions publiques doivent respecter `convex/validation.ts` :

- questions connues uniquement ;
- type et options cohérents ;
- bornes numériques respectées ;
- classements complets et sans doublon ;
- clé d’idempotence valide ;
- profil répondant conforme aux réglages du test.

## Fichiers à lire avant de coder

1. `README.md`
2. `HANDOFF.md`
3. `apps/web/convex/schema.ts`
4. `apps/web/convex/lib.ts`
5. `apps/web/convex/validation.ts`
6. le fichier de route ou de fonction concerné.

Les audits et plans de `docs/` sont des références historiques : vérifier leur date et leur périmètre avant d’en déduire l’architecture actuelle.
