# Critères d’acceptation

- [ ] Le fichier Dart se compile avec Flutter stable sans package externe.
- [ ] Chaque variante respecte les couleurs du tableau de spécification.
- [ ] Le CTA large mesure `52 dp` de haut et utilise un rayon de `14 dp`.
- [ ] La zone tactile effective ne descend jamais sous `48 dp`.
- [ ] Le bouton est utilisable sur une largeur d’écran de `320 dp` à `430 dp`.
- [ ] Sur une largeur inférieure à `375 dp`, le texte reste lisible et ne déborde
      pas ; le libellé peut être tronqué proprement si le produit l’autorise.
- [ ] L’état loading bloque les doubles soumissions.
- [ ] L’état disabled n’est pas cliquable et reste suffisamment contrasté.
- [ ] L’animation pressée ne dépasse pas `100 ms`.
- [ ] Les icônes proviennent du système SVG Sutura et restent centrées.
- [ ] Le composant est accessible au lecteur d’écran.
- [ ] Aucun gradient, aucune ombre décorative et aucun rayon arbitraire ne sont
      ajoutés dans les écrans consommateurs.
