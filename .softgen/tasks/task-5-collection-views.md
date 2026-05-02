---
title: Collection UI - Gallery & List Modes
status: done
priority: low
type: feature
tags: [ui, frontend, collection]
created_by: agent
created_at: 2026-04-26T21:18:17.371428
position: 5
---

## Notes
Refonte visuelle de la page Collection avec deux modes de vue distincts, comme spécifié dans le PRD (Phase 3). À implémenter après le moteur de base.

IMPORTANT: Vue Galerie refaite avec groupement intelligent par modèle de pièce pour éviter d'afficher 648 cartes individuelles.

## Checklist
- [x] Créer le composant "Mode Galerie" avec groupement par modèle de pièce (carte Master + expansion)
- [x] Créer le composant "Mode Liste" (Tableau dense) orienté data pure (Poids net, Spot, P/L latent) pour les profils investisseurs.
- [x] Ajouter un toggle global (Switch/Tabs) en haut de la page Collection pour passer instantanément d'une vue à l'autre.
- [x] Sauvegarder la préférence de vue de l'utilisateur (localStorage ou base de données).

## Acceptance
- L'utilisateur peut basculer entre une vue visuelle (Galerie groupée par modèle) et une vue analytique (Liste).
- La vue Galerie affiche des cartes Master par modèle avec statistiques agrégées et expansion pour voir les exemplaires individuels.