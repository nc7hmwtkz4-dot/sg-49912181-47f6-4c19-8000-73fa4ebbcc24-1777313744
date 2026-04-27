---
title: Mini-CRM & Sales Checkout
status: done
priority: medium
type: feature
tags: [crm, sales, ui]
created_by: agent
created_at: 2026-04-26T21:18:17.107359
position: 4
---

## Notes
Système de gestion des acheteurs et des ventes avec checkout fluide et analytics par canal de vente, comme défini dans le PRD (Phase 4).

## Checklist
- [x] Créer le composant "SaleCheckoutModal" : modale fluide pour vendre une pièce depuis la page Collection avec auto-complétion des acheteurs.
- [x] Intégrer le bouton "Vendre" dans le tableau des pièces (GroupedCoinTable) pour les pièces non vendues.
- [x] Ajouter le composant "Platform Analytics" dans la page Sales : cartes comparant Revenue, Fees, Net Profit et Margin par canal (Ricardo, Direct, eBay).
- [x] Ajouter un bouton "Export CSV" dans la page Sales pour exporter le registre complet des ventes.
- [x] Améliorer les formulaires d'acheteurs : ajout des champs Address, Postcode, City, Platform (déjà implémenté).
- [x] Calculer automatiquement le profit net dans le checkout (Prix vente - Prix achat - Frais port - Frais plateforme).

## Acceptance
- L'utilisateur peut vendre une pièce en 1-clic depuis la page Collection via la modale de checkout.
- La modale affiche le calcul du profit net en temps réel lors de la saisie du prix et des frais de port et d'envoi.
- L'utilisateur peut voir quel canal de vente ou quel acheteur est le plus rentable.