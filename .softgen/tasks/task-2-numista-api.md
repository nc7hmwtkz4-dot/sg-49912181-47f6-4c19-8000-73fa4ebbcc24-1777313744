---
title: Numista API Integration & Search
status: todo
priority: high
type: feature
tags: [api, search, backend]
---

## Notes
Implémentation du moteur de recherche avec "Lazy Loading" pour peupler le catalogue global de manière autonome, en respectant la limite de 2000 requêtes/mois de Numista.
Clé API : f6SfCMjxvgXzgim62WqWUpVH63G4ME3kre1kPjB

## Checklist
- [ ] Créer une route API Next.js `/api/search` avec debounce et validation (min 3 caractères).
- [ ] Implémenter la logique "Database-First" : chercher d'abord dans la table master locale (par titre ou code pays).
- [ ] Implémenter le fallback Numista : si rien en local, appeler l'API Numista `/api/v3/coins`.
- [ ] Mapper les données Numista vers le modèle de la DB locale (gérer les correspondances d'enum pour les métaux).
- [ ] Sauvegarder automatiquement les nouveaux résultats Numista dans la table master locale avant de les renvoyer au client.
- [ ] Créer le composant UI de recherche globale pour ajouter une pièce en 1-clic depuis les résultats.

## Acceptance
- L'utilisateur peut chercher une pièce (ex: "20 francs vreneli").
- Si la pièce n'est pas dans la DB, l'API Numista est appelée, la pièce est importée en base locale, puis affichée.
- Les recherches subséquentes de la même pièce ne déclenchent plus l'API Numista.