// This is a simplified version of the artifact registry type
// In a real implementation, this would be more complex

import { calendarArtifact } from '@/artifacts/calendar/server';

export interface ArtifactDefinition<T = any> {
  name: string;
  displayName: string;
  description: string;
  defaultMetadata: T;
  validateMetadata: (metadata: T) => T;

  // Additional methods can be added as needed
  [key: string]: any;
}

// Registry of all available artifacts
export const artifactRegistry: Record<string, ArtifactDefinition> = {
  text: {} as ArtifactDefinition, // Placeholder for the text artifact
  code: {} as ArtifactDefinition, // Placeholder for the code artifact
  image: {} as ArtifactDefinition, // Placeholder for the image artifact
  sheet: {} as ArtifactDefinition, // Placeholder for the sheet artifact
  calendar: calendarArtifact, // Our new calendar artifact
};

// List of registered artifact kinds
export const artifactKinds = [
  'text',
  'code',
  'image',
  'sheet',
  'calendar',
] as const;

// Type for artifact kinds
export type ArtifactKind = (typeof artifactKinds)[number];
