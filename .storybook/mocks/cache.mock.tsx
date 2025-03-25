// Create mocks for next/cache

// Create simple mock function
const createMockFn = () => {
  const fn = (...args: any[]) => {
    fn.calls.push(args);
    return fn.returnValue;
  };
  fn.calls = [] as any[][];
  fn.returnValue = undefined;
  fn.mockReturnValue = (value: any) => {
    fn.returnValue = value;
    return fn;
  };
  fn.mockClear = () => {
    fn.calls = [];
    return fn;
  };
  return fn;
};

// Export cache utilities
export const revalidatePath = createMockFn();
export const revalidateTag = createMockFn();
export const unstable_cache = createMockFn().mockReturnValue(
  createMockFn().mockReturnValue(Promise.resolve()),
);

// Helper to reset all mocks
export const resetMocks = () => {
  revalidatePath.mockClear();
  revalidateTag.mockClear();
  unstable_cache.mockClear();
};
