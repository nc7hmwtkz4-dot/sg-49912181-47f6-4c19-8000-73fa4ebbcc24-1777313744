---
title: Financial Dashboard & Automated Spot Prices
status: todo
priority: high
type: feature
tags: [dashboard, charts, api]
---

## Notes
Intégration d'une API tierce pour l'automatisation des cours des métaux et refonte du tableau de bord avec les calculs P/L du PRD.

## Checklist
- [ ] Intégrer une API externe (ex: GoldAPI ou équivalent gratuit) pour récupérer automatiquement les cours des métaux à jour.
- [ ] Implémenter le moteur de calcul P/L Latent (Poids net * Spot price - Prix d'achat) basé sur les prix automatisés.
- [ ] Implémenter le moteur de calcul P/L Réalisé (Prix vente - Prix achat - Frais de port - Frais plateforme).
- [ ] Ajouter les cartes statistiques : "Total Investi", "Valeur Métal Actuelle", "P/L Latent", "P/L Réalisé".
- [ ] Intégrer la librairie Recharts : Graphique en ligne "Évolution de la Valeur" (Total Investi vs Valeur Métal).
- [ ] Intégrer Recharts : Graphique circulaire "Répartition par Métal".
- [ ] Intégrer Recharts : Graphique en barres "Ventes Mensuelles".

## Acceptance
- Les prix des métaux se mettent à jour sans saisie manuelle.
- Le Dashboard affiche les graphiques interactifs avec les bons calculs de rentabilité.