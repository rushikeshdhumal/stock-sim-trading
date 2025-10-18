# Contributing to Stock Market Simulation

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/stock-sim-trading.git
   cd stock-sim-trading
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/stock-sim-trading.git
   ```
4. **Follow the setup guide** in [SETUP.md](SETUP.md)

## Development Workflow

### Branching Strategy

We use Git Flow:
- `main` - Production-ready code
- `dev` - Development branch (default)
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Creating a Feature Branch

```bash
git checkout dev
git pull upstream dev
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Write clean code** following the existing style
2. **Add comments** for complex logic
3. **Update documentation** if needed
4. **Write tests** for new features
5. **Run linters**:
   ```bash
   # Backend
   cd backend
   npm run lint

   # Frontend
   cd frontend
   npm run lint
   ```

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add trading analytics page
fix: resolve portfolio calculation bug
docs: update API documentation
refactor: simplify market data service
test: add portfolio service tests
chore: update dependencies
```

Examples:
- `feat: implement leaderboard ranking system`
- `fix: correct profit/loss calculation in dashboard`
- `docs: add API examples for trade endpoints`
- `refactor: extract common validation logic`
- `test: add unit tests for trade execution`

### Submitting a Pull Request

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

2. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request** on GitHub:
   - Target branch: `dev`
   - Provide clear title and description
   - Reference related issues
   - Add screenshots for UI changes

4. **Address review feedback** if needed

## Code Style Guidelines

### TypeScript/JavaScript

- Use **TypeScript** for all new code
- Enable strict mode
- Avoid `any` type (use `unknown` if needed)
- Use meaningful variable names
- Keep functions small and focused
- Use async/await over promises

### Backend

```typescript
// Good
async function getUserPortfolio(userId: string): Promise<Portfolio> {
  const portfolio = await prisma.portfolio.findFirst({
    where: { userId },
    include: { holdings: true },
  });

  if (!portfolio) {
    throw new AppError('Portfolio not found', 404);
  }

  return portfolio;
}

// Avoid
function getPortfolio(id: any) {
  return prisma.portfolio.findFirst({ where: { userId: id } });
}
```

### Frontend

```typescript
// Good - Typed props
interface DashboardProps {
  userId: string;
  onLogout: () => void;
}

export function Dashboard({ userId, onLogout }: DashboardProps) {
  // Component logic
}

// Avoid - Untyped props
export function Dashboard(props: any) {
  // Component logic
}
```

### React Components

- Use **functional components** with hooks
- Extract reusable logic into custom hooks
- Keep components small and focused
- Use meaningful component names
- Destructure props

### CSS/Tailwind

- Use **Tailwind utility classes** primarily
- Extract repeated patterns into components
- Follow responsive design patterns
- Maintain dark mode support

## Testing Guidelines

### Backend Tests

```typescript
describe('TradeService', () => {
  describe('executeTrade', () => {
    it('should execute buy order successfully', async () => {
      const result = await tradeService.executeTrade(
        portfolioId,
        userId,
        'AAPL',
        'STOCK',
        'BUY',
        10
      );

      expect(result.trade.symbol).toBe('AAPL');
      expect(result.trade.quantity).toBe(10);
    });

    it('should throw error for insufficient funds', async () => {
      await expect(
        tradeService.executeTrade(/* insufficient balance */)
      ).rejects.toThrow('Insufficient funds');
    });
  });
});
```

### Frontend Tests

```typescript
describe('Dashboard', () => {
  it('should display portfolio value', () => {
    render(<Dashboard />);
    expect(screen.getByText(/Total Value/i)).toBeInTheDocument();
  });
});
```

## Database Changes

### Creating Migrations

```bash
cd backend
npx prisma migrate dev --name descriptive_migration_name
```

### Migration Guidelines

- **Never edit** existing migrations
- **Test migrations** thoroughly
- **Update seed data** if schema changes
- **Document breaking changes**

Example:
```prisma
// Adding a new field
model User {
  id       String   @id @default(uuid())
  username String   @unique
  bio      String?  @db.Text  // New field
}
```

## API Changes

### Adding New Endpoints

1. **Define schema** in `src/types/index.ts`
2. **Create service** in `src/services/`
3. **Create controller** in `src/controllers/`
4. **Add routes** in `src/routes/`
5. **Update API.md** with documentation

### Breaking Changes

- Increment API version if needed
- Maintain backward compatibility
- Document migration path
- Announce in changelog

## Documentation

Update documentation for:
- **New features** - Add to README.md
- **API changes** - Update API.md
- **Setup changes** - Update SETUP.md
- **Architecture changes** - Add diagrams if helpful

## Issue Reporting

### Bug Reports

Include:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version, etc.)
- Error messages/logs
- Screenshots if applicable

Template:
```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**
- OS: Windows 11
- Node: v18.17.0
- Browser: Chrome 120

**Additional Context**
Any other relevant information.
```

### Feature Requests

Include:
- Clear description
- Use case/motivation
- Proposed solution
- Alternative solutions considered

## Code Review Process

### For Reviewers

- Be respectful and constructive
- Test the changes locally
- Check for:
  - Code quality
  - Test coverage
  - Documentation
  - Security issues
  - Performance impact

### For Contributors

- Respond to feedback promptly
- Don't take criticism personally
- Ask questions if unclear
- Update PR based on feedback

## Release Process

1. **Create release branch** from dev
2. **Update version** in package.json
3. **Update CHANGELOG.md**
4. **Run full test suite**
5. **Merge to main**
6. **Tag release** (`v1.0.0`)
7. **Deploy to production**
8. **Merge back to dev**

## Getting Help

- Check [README.md](README.md) and [SETUP.md](SETUP.md)
- Search existing issues
- Ask in discussions
- Reach out to maintainers

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Mentioned in documentation

Thank you for contributing! 🎉
