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

## Checklist
- [x] Créer le composant "Mode Galerie" avec de grandes cartes visuelles mettant en valeur les photos avers/revers de la pièce.
- [x] Créer le composant "Mode Liste" (Tableau dense) orienté data pure (Poids net, Spot, P/L latent) pour les profils investisseurs.
- [x] Ajouter un toggle global (Switch/Tabs) en haut de la page Collection pour passer instantanément d'une vue à l'autre.
- [x] Sauvegarder la préférence de vue de l'utilisateur (localStorage ou base de données).

## Acceptance
- L'utilisateur peut basculer entre une vue visuelle (Galerie) et une vue analytique (Liste).