// Mocks for next/navigation

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

// Mock router object with all required methods
const router = {
  back: createMockFn(),
  forward: createMockFn(),
  refresh: createMockFn(),
  push: createMockFn(),
  replace: createMockFn(),
  prefetch: createMockFn(),
  pathname: '/example',
  query: {},
  asPath: '/example',
  isFallback: false,
  basePath: '',
  locale: 'en',
  locales: ['en'],
  defaultLocale: 'en',
  isReady: true,
  isPreview: false,
  events: {
    on: createMockFn(),
    off: createMockFn(),
    emit: createMockFn(),
  },
};

// Export redirect function
export const redirect = createMockFn();

// Export useRouter hook mock
export const useRouter = createMockFn().mockReturnValue(router);

// Export getRouter function for testing
export const getRouter = () => router;

// Mock navigation functions
export const usePathname = createMockFn().mockReturnValue('/example');
export const useSearchParams = createMockFn().mockReturnValue(
  new URLSearchParams(),
);
export const useParams = createMockFn().mockReturnValue({});
