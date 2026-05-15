#!/bin/bash
# Restore all files to their pre-redesign state
echo "Restoring original files..."
cp .backup/index.css src/index.css
cp .backup/index.html index.html
cp .backup/App.tsx src/App.tsx
cp .backup/LandingPage.tsx src/components/LandingPage.tsx
cp .backup/Header.tsx src/components/Header.tsx
cp .backup/MenuGrid.tsx src/components/MenuGrid.tsx
cp .backup/DishCard.tsx src/components/DishCard.tsx
cp .backup/SuggestedDish.tsx src/components/SuggestedDish.tsx
cp .backup/CartModal.tsx src/components/CartModal.tsx
cp .backup/CafeNotFound.tsx src/components/CafeNotFound.tsx
cp .backup/OnboardingModal.tsx src/components/OnboardingModal.tsx
cp .backup/QRScanner.tsx src/components/QRScanner.tsx
cp .backup/AdminDashboard.tsx src/components/AdminDashboard.tsx
echo "✅ All files restored to original state."
