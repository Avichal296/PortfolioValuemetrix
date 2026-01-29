# Fix Signup and Login Errors - Todo List

## Tasks
- [x] 1. Update login page to display success message when registered=1
- [x] 2. Fix type safety issues in lib/auth.ts session callback
- [ ] 3. Test the changes

## Details
### Issue 1: No success message on login page (COMPLETED)
- Signup redirects to `/login?registered=1` but no success message is displayed
- Fix: Add success message display when registered query param is present

### Issue 2: Type safety issues in auth.ts (COMPLETED)
- Session callback assigns potentially null values to typed properties
- Fix: Properly handle null values with type assertions or default values

