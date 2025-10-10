# Contributing to Refferq

Thank you for your interest in contributing to Refferq! This guide will help you get started.

---

## 📚 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](Code-of-Conduct). Please read it before contributing.

### Quick Summary

- **Be respectful** - Treat everyone with respect
- **Be constructive** - Provide helpful feedback
- **Be collaborative** - Work together toward common goals
- **Be inclusive** - Welcome diverse perspectives

---

## Ways to Contribute

### 🐛 Report Bugs

Found a bug? [Create an issue](https://github.com/refferq/refferq/issues/new?template=bug_report.md)

### ✨ Suggest Features

Have an idea? [Start a discussion](https://github.com/refferq/refferq/discussions/new)

### 📝 Improve Documentation

Documentation improvements are always welcome!

### 💻 Write Code

Pick an issue and submit a pull request.

### 🧪 Test

Help test new features and report issues.

### 🌍 Translate

Help make Refferq available in more languages.

### 💬 Help Others

Answer questions in GitHub Discussions.

---

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Git
- Code editor (VS Code recommended)

### Fork & Clone

1. **Fork the repository** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/refferq.git
   cd refferq
   ```

3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/refferq/refferq.git
   ```

### Install Dependencies

```bash
npm install
```

### Set Up Database

```bash
# Create database
createdb refferq_dev

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your settings

# Run migrations
npm run db:generate
npm run db:push
```

### Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

---

## Making Changes

### Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

**Branch Naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Tests
- `chore/` - Maintenance

### Make Your Changes

1. Write your code
2. Test your changes
3. Update documentation if needed
4. Ensure code style is consistent

### Test Your Changes

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Test email (if applicable)
npm run test:email test@example.com
```

---

## Coding Standards

### TypeScript

- **Use TypeScript** for all new code
- **Define types** explicitly
- **Avoid `any`** type when possible
- **Use interfaces** for object shapes

**Good:**
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function getUser(id: string): Promise<User> {
  // ...
}
```

**Bad:**
```typescript
function getUser(id: any): any {
  // ...
}
```

### React Components

- **Use functional components** with hooks
- **Extract reusable logic** into custom hooks
- **Keep components small** and focused
- **Use descriptive names**

**Good:**
```typescript
export default function UserProfile({ userId }: { userId: string }) {
  const { user, loading } = useUser(userId);
  
  if (loading) return <Spinner />;
  return <div>{user.name}</div>;
}
```

### API Routes

- **Validate input** with Zod or similar
- **Handle errors** consistently
- **Return proper status codes**
- **Document endpoints**

**Good:**
```typescript
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate
    if (!body.email) {
      return NextResponse.json(
        { success: false, message: 'Email required' },
        { status: 400 }
      );
    }
    
    // Process
    const result = await processData(body);
    
    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal error' },
      { status: 500 }
    );
  }
}
```

### Database Queries

- **Use Prisma** for all database operations
- **Avoid raw SQL** unless necessary
- **Use transactions** for related operations
- **Handle errors** gracefully

**Good:**
```typescript
const user = await prisma.user.create({
  data: {
    email: body.email,
    name: body.name,
    affiliate: {
      create: {
        referralCode: generateCode(),
      }
    }
  },
  include: {
    affiliate: true
  }
});
```

### Styling

- **Use Tailwind CSS** for styling
- **Follow existing patterns**
- **Keep styles consistent**
- **Use design tokens** for colors

**Good:**
```tsx
<button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
  Submit
</button>
```

---

## Commit Guidelines

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `test` - Tests
- `chore` - Maintenance

**Examples:**

```bash
feat(auth): add OTP verification

Implements email-based OTP verification for login.
Users receive a 6-digit code via email.

Closes #123
```

```bash
fix(api): handle missing user in referral endpoint

Fixes 500 error when user doesn't exist.
Now returns 404 with proper error message.
```

```bash
docs(wiki): add API overview page

Adds comprehensive API documentation including
authentication, endpoints, and examples.
```

### Commit Best Practices

- **One logical change per commit**
- **Write clear messages**
- **Reference issues** when applicable
- **Keep commits atomic**

---

## Pull Request Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] Commits are clean and logical
- [ ] Branch is up to date with main

### Update Your Branch

```bash
git fetch upstream
git rebase upstream/main
```

### Submit Pull Request

1. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub

3. **Fill in the template:**
   - Description of changes
   - Related issues
   - Testing performed
   - Screenshots (if UI changes)

4. **Wait for review**

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactoring

## Related Issues
Closes #123

## Testing
- [ ] Tested locally
- [ ] Tests added/updated
- [ ] Documentation updated

## Screenshots (if applicable)
[Add screenshots]

## Checklist
- [ ] Code follows style guide
- [ ] Self-reviewed code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
```

### Code Review

Your PR will be reviewed by maintainers. They may:
- Request changes
- Ask questions
- Approve and merge

**Be patient and responsive** to feedback.

---

## Reporting Bugs

### Before Reporting

1. **Search existing issues**
2. **Try latest version**
3. **Check documentation**

### Bug Report Template

```markdown
**Describe the bug**
Clear description of the issue

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Actual behavior**
What actually happens

**Screenshots**
If applicable

**Environment:**
- OS: [e.g. macOS 14]
- Browser: [e.g. Chrome 120]
- Refferq version: [e.g. 1.0.0]
- Node version: [e.g. 20.10]

**Additional context**
Any other relevant information
```

---

## Suggesting Features

### Feature Request Template

```markdown
**Is your feature related to a problem?**
Describe the problem

**Describe the solution**
What would you like to happen?

**Describe alternatives**
Other solutions you've considered

**Additional context**
Mockups, examples, etc.

**Would you like to implement this?**
- [ ] Yes, I can work on this
- [ ] No, just suggesting
```

---

## Documentation

### Documentation Standards

- **Clear and concise** writing
- **Examples** for complex concepts
- **Up-to-date** information
- **Proper formatting** (Markdown)

### Types of Documentation

1. **Wiki Pages** - User guides and tutorials
2. **Code Comments** - Inline documentation
3. **JSDoc** - Function documentation
4. **README** - Project overview
5. **API Docs** - Endpoint reference

### Documentation Contributions

Documentation improvements are always welcome:

- Fix typos
- Improve clarity
- Add examples
- Update outdated info
- Translate content

---

## Community

### Getting Help

- **[GitHub Discussions](https://github.com/refferq/refferq/discussions)** - Ask questions
- **[GitHub Issues](https://github.com/refferq/refferq/issues)** - Report bugs
- **Email** - hello@refferq.com

### Communication Guidelines

- **Be respectful** and professional
- **Be clear** and specific
- **Be patient** with responses
- **Search first** before asking
- **Help others** when you can

### Recognition

Contributors are recognized in:
- GitHub Contributors page
- Release notes
- Project README
- Changelog

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Questions?

- Read the [Development Setup](Development-Setup) guide
- Check the [FAQ](FAQ)
- Ask in [GitHub Discussions](https://github.com/refferq/refferq/discussions)

---

<p align="center">
  <strong>Thank you for contributing to Refferq!</strong><br>
  Together we're building something amazing 🚀
</p>
