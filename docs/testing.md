# Testing Guide

## Introduction

This guide covers testing practices for the Saturday League Football Frontend application. We use **Vitest** with **React Testing Library** as our testing framework and aim for **80% code coverage** as a baseline. However, coverage is a tool to find gaps, not the only measure of test quality.

### Why Testing Matters

- **Confidence**: Tests give us confidence that our code works as expected
- **Documentation**: Tests serve as living documentation of how the code behaves
- **Refactoring Safety**: Good tests allow us to refactor with confidence
- **Bug Prevention**: Tests catch bugs before they reach production
- **UI Regression Prevention**: Tests catch visual and functional regressions

### Coverage Goals

Our target is **80% code coverage**, but remember:
- **80% is a starting point**, not an end goal
- **Coverage shows what's NOT tested**, not what IS tested well
- **Prioritize critical paths** over achieving 100% coverage
- **Test behavior, not implementation** - high coverage with poor tests is worse than lower coverage with good tests

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests once (CI mode)
npm test -- --run

# Run specific file
npm test -- src/components/Button.test.tsx

# Run tests matching a pattern
npm test -- --grep "Button"

# Run with UI (interactive)
npm test -- --ui
```

### Coverage Commands

```bash
# Run tests with coverage
npm test -- --coverage

# Run with coverage and watch
npm test -- --coverage --watch

# Run with specific coverage reporter
npm test -- --coverage --reporter=html
```

## Coverage Reports

### Generating Coverage Reports

Coverage is automatically generated when running tests with the `--coverage` flag:

```bash
npm test -- --coverage
```

### Viewing Coverage Reports

After generating coverage, open the HTML report:

```bash
# Open HTML coverage report
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
```

### Understanding Coverage Reports

The coverage report shows:
- **Line Coverage**: Percentage of lines executed
- **Function Coverage**: Percentage of functions called
- **Branch Coverage**: Percentage of branches (if/else, ternary) executed
- **Statement Coverage**: Percentage of statements executed
- **File-by-file breakdown**: See which files need more tests

### Coverage Thresholds

Our coverage configuration enforces:
- **Minimum 80% overall coverage** (lines, functions, branches, statements)
- Tests will fail if coverage falls below these thresholds

## Writing Tests

### Test Structure

Tests are located alongside components in `__tests__` directories or with `.test.tsx` suffix:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Component } from '../Component';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Component Tests

Test React components for:
- **Rendering**: Components render without errors
- **User interactions**: Clicks, form submissions, input changes
- **Props**: Different prop combinations
- **State**: State changes and side effects
- **Accessibility**: ARIA attributes, keyboard navigation

Example:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing with React Router

When testing components that use React Router, wrap them in a Router:

```typescript
import { BrowserRouter } from 'react-router-dom';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Navbar', () => {
  it('provides navigation links', () => {
    renderWithRouter(<Navbar />);
    
    const link = screen.getByRole('link', { name: /peladas/i });
    expect(link).toHaveAttribute('href', '/championships');
  });
});
```

### Testing Forms

Test form components for:
- **Input handling**: Text input, validation
- **Form submission**: Submit handlers, validation errors
- **User interactions**: Typing, selecting, clicking

Example:

```typescript
describe('CreatePlayerModal', () => {
  it('trims whitespace before creating a new player', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);
    
    render(
      <CreatePlayerModal
        isOpen={true}
        onClose={vi.fn()}
        onCreate={onCreate}
        championshipId={1}
      />
    );
    
    const input = screen.getByPlaceholderText('Busque jogadores ou crie um novo');
    await user.type(input, '   Novo Jogador  ');
    
    const submitButton = screen.getByRole('button', { name: 'Criar Jogador' });
    await user.click(submitButton);
    
    expect(onCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Novo Jogador' })
    );
  });
});
```

### Testing Hooks

Test custom hooks using `renderHook`:

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useApi } from '../useApi';

describe('useApi', () => {
  it('should handle successful API call', async () => {
    const apiFunction = vi.fn().mockResolvedValue({
      success: true,
      data: { id: 1 },
    });

    const { result } = renderHook(() => useApi(apiFunction));

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ id: 1 });
      expect(result.current.loading).toBe(false);
    });
  });
});
```

### Mocking

#### Mocking Modules

Use `vi.mock()` to mock modules:

```typescript
import { vi } from 'vitest';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));
```

#### Mocking API Calls

Mock API calls in component tests:

```typescript
import { vi } from 'vitest';

const mockList = vi.fn();
const mockAddToRound = vi.fn();

vi.mock('@/states/api/playerRepository', () => ({
  list: mockList,
  addToRound: mockAddToRound,
}));
```

#### Mocking with vi.hoisted

For mocks that need to be shared:

```typescript
const { mockList, mockAddToRound } = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockAddToRound: vi.fn(),
}));

vi.mock('@/states/api/playerRepository', () => ({
  list: mockList,
  addToRound: mockAddToRound,
}));
```

### Testing Async Behavior

Use `waitFor` for async operations:

```typescript
import { waitFor } from '@testing-library/react';

it('should load data asynchronously', async () => {
  render(<Component />);
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Testing with User Events

Use `@testing-library/user-event` for realistic user interactions:

```typescript
import userEvent from '@testing-library/user-event';

it('should handle user input', async () => {
  const user = userEvent.setup();
  render(<InputComponent />);
  
  const input = screen.getByRole('textbox');
  await user.type(input, 'Hello World');
  
  expect(input).toHaveValue('Hello World');
});
```

## Best Practices

### 1. Test Behavior, Not Implementation

**Bad:**
```typescript
it('should call setState', () => {
  const setState = vi.fn();
  // test implementation
});
```

**Good:**
```typescript
it('should update the input value when user types', async () => {
  const user = userEvent.setup();
  render(<InputComponent />);
  
  const input = screen.getByRole('textbox');
  await user.type(input, 'Hello');
  
  expect(input).toHaveValue('Hello');
});
```

### 2. Use Descriptive Test Names

**Bad:**
```typescript
it('works', () => {});
```

**Good:**
```typescript
it('trims whitespace before creating a new player', async () => {});
```

### 3. Test User Interactions, Not Internal State

**Bad:**
```typescript
it('should set loading to true', () => {
  // accessing internal state
});
```

**Good:**
```typescript
it('should show loading spinner when submitting', async () => {
  render(<FormComponent />);
  // interact as user would
  const submitButton = screen.getByRole('button', { name: 'Submit' });
  await user.click(submitButton);
  
  expect(screen.getByRole('status')).toHaveTextContent('Loading...');
});
```

### 4. Use Accessible Queries

Prefer queries that reflect how users interact with the UI:

1. **getByRole** - Most preferred
2. **getByLabelText** - For form inputs
3. **getByPlaceholderText** - For inputs without labels
4. **getByText** - For text content
5. **getByTestId** - Last resort

Example:

```typescript
// Good
const button = screen.getByRole('button', { name: /submit/i });
const input = screen.getByLabelText('Player Name');

// Avoid
const button = screen.getByTestId('submit-button');
```

### 5. Test Edge Cases

Always test:
- **Empty/null values**
- **Boundary conditions**
- **Invalid inputs**
- **Error conditions**
- **Loading states**

Example:

```typescript
describe('edge cases', () => {
  it('handles empty player list', () => {
    render(<PlayerList players={[]} />);
    expect(screen.getByText('No players found')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockList.mockRejectedValueOnce(new Error('API Error'));
    render(<PlayerList />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading players')).toBeInTheDocument();
    });
  });
});
```

### 6. Keep Tests Independent

Each test should be able to run in isolation:
- Use `beforeEach` for setup, not shared state
- Clean up mocks after tests
- Don't rely on test execution order

### 7. Focus on Critical Paths

Prioritize testing:
- **User-facing features**: Forms, navigation, data display
- **Business-critical functionality**: Player creation, match management
- **Error-prone areas**: Form validation, API error handling
- **Complex interactions**: Multi-step flows, conditional rendering

## Coverage Best Practices

Based on [Google's Code Coverage Best Practices](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html):

1. **Use coverage to find gaps**: Coverage tells you what's NOT tested, not what IS tested well
2. **Don't chase 100%**: Some code (like error handlers, edge cases) may not need full coverage
3. **Focus on meaningful coverage**: Test critical paths and user interactions
4. **Avoid testing implementation details**: Test behavior, not how it's implemented
5. **Use coverage as a guide**: It's one metric among many

## CI Integration

### GitHub Actions

Coverage is automatically generated in CI. The workflow:
1. Sets up Node.js
2. Installs dependencies
3. Runs tests with coverage
4. Uploads coverage artifacts

### Viewing CI Coverage

Coverage reports are available as CI artifacts. Download and open `coverage/index.html` to view the report.

## Troubleshooting

### Tests Fail with Coverage Below 80%

1. Check which files have low coverage
2. Review the coverage report: `open coverage/index.html`
3. Add tests for uncovered code
4. Consider if the code should be excluded (add to coverage excludes in `vitest.config.ts`)

### Module Resolution Issues

Ensure TypeScript paths are correctly configured in `tsconfig.json` and `vitest.config.ts`:

```typescript
// vitest.config.ts
resolve: {
  alias: {
    '@': resolve(__dirname, 'src'),
  },
}
```

### Mock Issues

- Ensure mocks are defined before imports
- Use `vi.hoisted()` for mocks that need to be shared
- Clear mocks in `beforeEach` if needed

### Async Test Issues

- Use `waitFor` for async operations
- Use `userEvent` which is async by default
- Ensure proper `await` usage

### Coverage Not Generating

- Verify coverage flags are set: `npm test -- --coverage`
- Check that `coverage/` directory is not in `.gitignore` (it should be)
- Ensure `@vitest/coverage-v8` is installed

### Framer Motion Mocking

Framer Motion components need to be mocked in tests:

```typescript
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));
```

## Application-Specific Testing

### Testing Modal Components

When testing modals:
- Test open/close behavior
- Test form submission
- Test validation
- Mock the BaseModal if needed

### Testing API Integration

When testing components that use API:
- Mock API repositories
- Test loading states
- Test error states
- Test success states

### Testing Forms

When testing forms:
- Test input validation
- Test form submission
- Test error messages
- Test disabled states

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library User Event](https://testing-library.com/docs/user-event/intro)
- [Vitest Mocking Guide](https://vitest.dev/guide/mocking.html)
- [Google Testing Blog - Code Coverage Best Practices](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html)

## Questions?

If you have questions about testing or need help writing tests, reach out to the team or check the existing test files for examples.

