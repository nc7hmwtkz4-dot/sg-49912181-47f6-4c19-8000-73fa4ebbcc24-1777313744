---
title: Mini-CRM & Sales Checkout
status: todo
priority: medium
type: feature
tags: [crm, sales, frontend]
---

## Notes
Amélioration de la gestion des acheteurs et du flux de vente pour en faire un véritable outil de gestion de rentabilité (Side-business).

## Checklist
- [ ] Créer la vue "Profil Acheteur" affichant l'historique des achats d'un client spécifique et la marge nette globale générée par ce client.
- [ ] Améliorer la vue "Registre des Ventes" (Sales Ledger) avec les nouvelles colonnes : Frais de port, Frais plateforme, Profit Net.
- [ ] Créer le flux "Checkout Modale" : lors du clic sur "Vendre", ouvrir une modale demandant l'acheteur (auto-complétion), prix de vente, frais d'expédition, et frais de plateforme.
- [ ] Ajouter un composant "Platform Analytics" comparant les marges et volumes par canal (Ricardo, Direct, etc.).
- [ ] Ajouter un bouton "Exporter en CSV" sur le registre des ventes.

## Acceptance
- Lors d'une vente, l'utilisateur peut déduire explicitement les frais de plateforme et d'envoi.
- L'utilisateur peut voir quel canal de vente ou quel acheteur est le plus rentable.