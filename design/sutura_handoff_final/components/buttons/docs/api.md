# Contrat d’API Flutter

## API principale

```dart
SuturaButton(
  label: 'Commencer',
  variant: SuturaButtonVariant.primary,
  size: SuturaButtonSize.large,
  leadingIcon: const Icon(Icons.arrow_forward),
  state: SuturaButtonState.idle,
  onPressed: () {},
)
```

### Propriétés

| Propriété | Type | Requis | Valeur par défaut |
|---|---|---|---|
| `label` | `String` | oui | — |
| `onPressed` | `VoidCallback?` | oui | — |
| `variant` | `SuturaButtonVariant` | non | `primary` |
| `size` | `SuturaButtonSize` | non | `large` |
| `state` | `SuturaButtonState` | non | `idle` |
| `leadingIcon` | `Widget?` | non | `null` |
| `trailingIcon` | `Widget?` | non | `null` |
| `fullWidth` | `bool` | non | `true` |
| `semanticLabel` | `String?` | non | `label` |

## Wrappers

```dart
SPrimaryButton(label: 'Créer un test', onPressed: createTest);
SSecondaryButton(label: 'Plus tard', onPressed: skip);
SOutlineButton(label: 'Annuler', onPressed: cancel);
STextButton(label: 'En savoir plus', onPressed: openDetails);
```

## Règles pour l’agent

1. Ne pas recréer un bouton localement lorsqu’une variante de ce composant
   existe.
2. Ne pas ajouter de couleur hors des tokens Sutura sans décision design.
3. Utiliser `state: loading` pendant une action asynchrone et restaurer l’état
   après réponse.
4. Fournir un `semanticLabel` lorsque le texte visible est ambigu.
