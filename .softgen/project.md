---
title: NumiVault V2
---

## Vision
Transformer NumiVault d'un outil de gestion personnel nécessitant des saisies manuelles en une plateforme SaaS automatisée de référence pour les numismates. Le cœur du système repose sur un catalogue mondial mutualisé (Numista) et un calcul en temps réel de la valeur de la collection (Spot Prices).

## Design
--primary: 220 90% 56% (bleu vif)
--background: 0 0% 100% (blanc pur)
--foreground: 222 47% 11% (ardoise sombre)
--accent: 210 40% 96% (gris très clair)
--muted: 210 40% 96% (gris très clair)
Headings: Inter ou Geist Sans
Body: Inter ou Geist Sans
Style direction: SaaS moderne, orienté data et finance. Cartes visuelles pour la collection (Mode Galerie), tableaux denses pour les investisseurs (Mode Liste). Graphiques interactifs pour le Dashboard.

## Features
- **Catalogue Mutualisé (Lazy Loading) :** Recherche locale + fallback automatique sur l'API Numista pour enrichir la base globale (`master_coins`).
- **Dashboard Financier :** Calcul automatique du P/L latent (Valeur Spot Actuelle - Prix d'achat) et P/L réalisé. Graphiques d'évolution (Recharts).
- **CRM Vendeur :** Profils acheteurs détaillés, rentabilité par canal de vente, déduction des frais de port et de plateforme pour obtenir la marge nette réelle.
- **Flux de Vente Fluide :** Checkout modale lors du passage d'une pièce en "Vendu" pour lier un acheteur et déduire les frais.