// Create a simple headers mock for Next.js

// Simple storage for headers
const headerStore = new Map<string, string>();

// Headers function implementation
const headersObj = {
  get: (name: string) => headerStore.get(name) || null,
  getAll: () => Array.from(headerStore.entries()),
  has: (name: string) => headerStore.has(name),
  set: (name: string, value: string) => {
    headerStore.set(name, value);
    return headersObj;
  },
  append: (name: string, value: string) => {
    const existingValue = headerStore.get(name);
    headerStore.set(name, existingValue ? `${existingValue}, ${value}` : value);
    return headersObj;
  },
  delete: (name: string) => {
    headerStore.delete(name);
    return headersObj;
  },
};

// Export headers function
export const headers = () => headersObj;

// Simple storage for cookies
const cookieStore = new Map<string, string>();

// Cookie object implementation
const cookiesObj = {
  get: (name: string) => {
    return cookieStore.get(name)
      ? { name, value: cookieStore.get(name) || '' }
      : null;
  },
  getAll: () =>
    Array.from(cookieStore.entries()).map(([name, value]) => ({ name, value })),
  set: (name: string, value: string) => {
    cookieStore.set(name, value);
    return cookiesObj;
  },
  delete: (name: string) => {
    cookieStore.delete(name);
    return cookiesObj;
  },
};

// Export cookies function
export const cookies = () => cookiesObj;

// Export draftMode function
export const draftMode = () => ({
  enabled: false,
});

// Reset all mocks (useful for testing)
export const resetMocks = () => {
  headerStore.clear();
  cookieStore.clear();
};
