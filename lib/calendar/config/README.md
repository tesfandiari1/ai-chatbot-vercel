# Calendar Configuration

This directory contains configuration files for the calendar feature. By separating configuration from components, we achieve a cleaner separation of concerns and improve maintainability.

## Structure

- **components.ts**: Maps booking steps to their corresponding UI components
- **steps.ts**: Contains configuration for each booking step (context, props, instructions)
- **index.ts**: Exports all configuration

## Usage

### In Components

```tsx
import { 
  getStepComponent, 
  getStepContext,
  getStepInstructions,
  getStepProps
} from '@/lib/calendar/config';

// Get the component for a step
const StepComponent = getStepComponent('date');

// Get context for a step
const contextData = getStepContext('date', data);

// Get instructions for a step
const instructions = getStepInstructions('date');

// Get props for a component
const componentProps = getStepProps('date', data, chatFunctions);
```

### Adding New Steps

To add a new step to the booking flow:

1. Add the step type to `BookingStep` in `lib/calendar/types.ts`
2. Create a component for the step in `components/calendar/`
3. Add the component to the mapping in `components.ts`
4. Add context generation function in `steps.ts`
5. Add props generation function in `steps.ts`
6. Add instructions text in `steps.ts`

## Design Principles

1. **Separation of concerns**: Configuration is separate from components
2. **Single responsibility**: Each file handles one aspect of configuration
3. **Extensibility**: Easy to add new steps or modify existing ones
4. **Type safety**: All configuration is properly typed

## Relationship to Other Modules

- **UI Components**: Configuration is consumed by UI components
- **Context Layer**: Configuration provides context initialization data
- **Utils Layer**: Configuration uses utilities for business logic 