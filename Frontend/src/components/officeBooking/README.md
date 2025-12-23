# Office Booking Panel

A modular, maintainable booking panel component for office users.

## Folder Structure

```
officeBooking/
├── hooks/           # Custom React hooks for state management
├── shared/          # Reusable UI components (FloatingInput, Stepper, etc.)
├── steps/           # Individual step components (Origin, Destination, etc.)
├── types/           # TypeScript type definitions
├── utils/           # Utility functions and helpers
└── OfficeBookingPanel.tsx  # Main component
```

## Architecture

This booking panel is built with a modular architecture to avoid the 5000+ line monolith issue:

- **Separation of Concerns**: Each step is its own component
- **Reusable Components**: Shared UI components in `shared/`
- **Custom Hooks**: State management logic extracted to hooks
- **Type Safety**: Centralized type definitions
- **Utilities**: Helper functions separated from UI logic

## Development Guidelines

1. **Keep components small**: Each step component should be 200-400 lines max
2. **Extract reusable logic**: Use custom hooks for complex state management
3. **Type everything**: Use TypeScript types from `types/index.ts`
4. **Follow naming conventions**: 
   - Components: PascalCase (e.g., `OriginStep.tsx`)
   - Hooks: camelCase with `use` prefix (e.g., `useBookingState.ts`)
   - Types: PascalCase interfaces/types

## Steps

1. Origin - Collect origin address and contact information
2. Destination - Collect destination address and contact information
3. Shipment Details - Package dimensions, weight, nature, mode
4. Upload - Package images and documents
5. Bill - Billing information
6. Details - Charges and pricing details
7. Mode of Payment - Payment method selection
8. Successful - Booking confirmation

