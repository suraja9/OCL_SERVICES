# Booking Flow Restructure Plan

## Current Structure (Mobile App)
1. serviceability-check.tsx → Step 0
2. sender-receiver.tsx + sender-receiver-forms.tsx → Step 1
3. shipment-form.tsx → Combines Steps 2, 3, and parts of 4
4. invoice-information.tsx → Invoice details
5. pricing-details.tsx → Fixed pricing
6. party-details.tsx → Payment details
7. preview.tsx → Step 5

## Target Structure (Matching BookNow.tsx)
1. **Step 0: Serviceability** - serviceability-check.tsx (needs minor updates)
2. **Step 1: Address** - sender-receiver.tsx + sender-receiver-forms.tsx (needs updates)
3. **Step 2: Shipment Details** - NEW: shipment-details.tsx (nature, insurance, risk coverage ONLY)
4. **Step 3: Material Details** - shipment-form.tsx (package info, images, dimensions, weight, pricing type)
5. **Step 4: Shipping & Pricing** - NEW: shipping-pricing.tsx (service type, mode, price calculation)
6. **Step 5: Preview** - preview.tsx (needs updates)

## Implementation Steps

### Step 1: Create shipment-details.tsx (Step 2)
- Extract nature of consignment, insurance, risk coverage from shipment-form.tsx
- Remove service type and mode (move to Step 4)
- Navigation: sender-receiver-forms.tsx → shipment-details.tsx → shipment-form.tsx

### Step 2: Update shipment-form.tsx (Step 3)
- Remove nature, insurance, risk coverage (moved to Step 2)
- Remove service type and mode (move to Step 4)
- Keep: package info, images, dimensions, weight, pricing type
- Navigation: shipment-details.tsx → shipment-form.tsx → shipping-pricing.tsx

### Step 3: Create shipping-pricing.tsx (Step 4)
- Service type selection (Standard/Priority)
- Mode selection (Air/Surface/Train) - only for Standard
- Price calculation (automatic for normal pricing)
- Fixed price input (if pricing type is fixed)
- Navigation: shipment-form.tsx → shipping-pricing.tsx → preview.tsx

### Step 4: Update Navigation
- Update all router.push() calls to match new flow
- Update StepIndicator components
- Remove invoice-information.tsx from main flow (or integrate into Step 3)

### Step 5: Update preview.tsx
- Match BookNow.tsx preview structure
- Show all steps data
- Allow inline editing

## Data Flow
- All data saved to bookingService draft
- Each step validates before proceeding
- Preview shows all collected data

