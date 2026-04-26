---
title: Drag & Drop Sales Workflow
status: todo
priority: low
type: idea
tags: [ui, sales, ux]
---

## Notes
Implémentation du flux de vente fluide mentionné dans le PRD, basé sur le glisser-déposer (Phase 4).

## Checklist
- [ ] Implémenter une librairie de Drag & Drop (ex: `@dnd-kit/core`).
- [ ] Créer une interface type Kanban avec des colonnes/zones de dépôt (ex: "En Collection", "À Vendre/Listé", "Vendu").
- [ ] Lier le "Drop" d'une carte dans la zone "Vendu" à l'ouverture automatique de la modale de Checkout de vente (Task 4).
- [ ] Mettre à jour visuellement le statut de la pièce instantanément après le drop.

## Acceptance
- L'utilisateur peut glisser une carte de pièce vers le statut "Vendu" pour initier le processus de vente de manière ergonomique.