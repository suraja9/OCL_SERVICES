# Booking Flow Redesign Plan

## Overview
Redesign the mobile app booking flow to match the exact structure of BookNow.tsx from the web app, including adding a "normal" vs "fixed price" option after weight entry in Material Details.

## Current Mobile App Flow
1. serviceability-check.tsx - Step 1
2. sender-receiver.tsx - Step 2
3. sender-receiver-forms.tsx - Step 3
4. shipment-form.tsx - Step 4
5. parcel-details.tsx - Step 5 (not used)
6. invoice-information.tsx - Step 6
7. pricing-details.tsx - Step 6 (for fixed pricing)
8. party-details.tsx - Step 7
9. preview.tsx - Step 8
10. confirmation.tsx - Step 9

## Target BookNow.tsx Flow
1. Step 0: Serviceability Check
2. Step 1: Address (Origin & Destination with phone search)
3. Step 2: Shipment Details (Nature of Consignment, Insurance, Risk Coverage)
4. Step 3: Material Details (Package info, images, description, declared value, dimensions, weight) + **NEW: Normal/Fixed Price Option**
5. Step 4: Shipping & Pricing (Service Type, Mode, Automatic Price Calculation OR Fixed Price Form)
6. Step 5: Preview

## Key Changes Required

### 1. Material Details Step (Step 3)
- Add "Normal" vs "Fixed Price" radio buttons after weight is entered
- If "Normal" selected: Continue to automatic price calculation in Step 4
- If "Fixed" selected: Show fixed price form in Step 4 (like pricing-details.tsx)

### 2. Shipping & Pricing Step (Step 4)
- If "Normal" pricing: Show service type and mode selection with automatic price calculation
- If "Fixed" pricing: Show fixed price form with all charges (freight, AWB, local collection, door delivery, etc.)

### 3. Data Structure Updates
- Update bookingService to match BookNow.tsx data structure
- Add pricingType field: 'normal' | 'fixed'
- Update all API calls to match BookNow.tsx endpoints

### 4. Backend Mapping
- Ensure all data fields map correctly to database
- Match API payload structure with BookNow.tsx

## Implementation Priority
1. ✅ Create Material Details step with normal/fixed price option
2. ✅ Update Shipping & Pricing step to handle both normal and fixed pricing
3. ✅ Update bookingService data structure
4. ✅ Update all step navigation
5. ✅ Update backend API calls
6. ✅ Update preview step to show correct pricing

