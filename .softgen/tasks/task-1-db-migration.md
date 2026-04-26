---
title: Database V2 Migration
status: done
priority: urgent
type: chore
tags: [database, migration]
created_by: agent
created_at: 2026-04-26T21:18:16.567370
position: 1
---

## Notes
Modification du schéma actuel pour implémenter la séparation stricte Master / Inventaire demandée par la V2, tout en conservant les noms de tables actuels (`coins_reference` et `user_coins`) pour sécuriser la transition.

## Checklist
- [x] Créer une migration SQL pour `coins_reference` (ajout de `numista_id` unique, `year_issued`, calcul automatique de `weight_net` basé sur weight * purity).
- [x] Créer un script de backfill SQL pour s'assurer que toutes les pièces existantes de l'utilisateur sont correctement synchronisées avec le nouveau format (63 références créées, 706 pièces liées).
- [x] Créer une migration SQL pour `user_coins` (renforcer le lien vers `coins_reference` via reference_coin_id NOT NULL, supprimer les colonnes redondantes metal/purity/weight/km_number).
- [x] Ajouter les colonnes `shipping_cost`, `platform_fees` et `net_profit` (calculé automatiquement) à la table `user_sales`.
- [x] Mettre à jour les types TypeScript générés par Supabase dans le frontend (généré automatiquement).
- [x] Adapter les services `userCoinService.ts` et `listingService.ts` pour utiliser les jointures vers `coins_reference` pour les données immuables.

## Acceptance
- La base de données reflète l'architecture Master/Inventaire du PRD.
- Les données de l'utilisateur (pièces, ventes) sont intactes et visibles.