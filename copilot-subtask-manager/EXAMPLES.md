# Copilot Subtask Manager - Examples

This document provides practical examples of how to use the Copilot Subtask Manager in different scenarios.

## Example 1: Simple Parallel Tasks (No Dependencies)

**Use Case**: Documentation updates that can be done independently.

### Parent Issue #100: Update Project Documentation

```markdown
# Update Project Documentation

We need to update various documentation files across the project.

## Subtasks
- [ ] #101 Update README.md
- [ ] #102 Update API documentation
- [ ] #103 Update contributing guidelines
- [ ] #104 Update deployment guide
```

### Subtask Issues

**Issue #101: Update README.md**
```markdown
Update the README with new features and installation instructions.

- Add new features section
- Update installation steps
- Add troubleshooting section
```

**Issue #102: Update API documentation**
```markdown
Update API docs to reflect new endpoints and parameters.

- Document new /auth endpoints
- Update examples
- Add error code reference
```

**Issue #103: Update contributing guidelines**
```markdown
Update CONTRIBUTING.md with new workflow.

- Add PR template requirements
- Update coding standards
- Add testing guidelines
```

**Issue #104: Update deployment guide**
```markdown
Update deployment documentation for new infrastructure.

- Update AWS setup steps
- Add Docker deployment option
- Update CI/CD pipeline docs
```

### Expected Behavior

**T0**: Assign Copilot to parent issue #100

✅ **All 4 subtasks assigned immediately** (no dependencies)
- #101 ← Copilot assigned
- #102 ← Copilot assigned
- #103 ← Copilot assigned
- #104 ← Copilot assigned

📝 **Status Comment Posted**:
```
## 🤖 Copilot Subtask Manager

Copilot has been assigned to this parent issue. Analyzing subtasks...

### ✅ Auto-assigned to Copilot (4)

- #101 - Update README.md
- #102 - Update API documentation
- #103 - Update contributing guidelines
- #104 - Update deployment guide

---
*Copilot will be automatically assigned to blocked subtasks once their dependencies are resolved.*
```

**Result**: All 4 PRs created in parallel, maximum efficiency! ⚡

---

## Example 2: Sequential Dependencies

**Use Case**: Backend feature with strict ordering requirements.

### Parent Issue #200: Add User Authentication

```markdown
# Add User Authentication System

Implement complete user authentication.

## Subtasks
- [ ] #201 Database schema for users
- [ ] #202 Backend authentication API
- [ ] #203 JWT token service
- [ ] #204 Authentication middleware
```

### Subtask Issues

**Issue #201: Database schema for users**
```markdown
Create database tables for user management.

Tables:
- users (id, email, password_hash, created_at, updated_at)
- sessions (id, user_id, token, expires_at)
- refresh_tokens (id, user_id, token, expires_at)
```

**Issue #202: Backend authentication API**
```markdown
Implement REST API endpoints for authentication.

Endpoints:
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- POST /api/auth/refresh

**Dependencies:**
- Depends on #201
```

**Issue #203: JWT token service**
```markdown
Implement JWT token generation and validation service.

Features:
- Generate access tokens
- Generate refresh tokens
- Validate tokens
- Token rotation

**Dependencies:**
- Depends on #202
```

**Issue #204: Authentication middleware**
```markdown
Create Express middleware for route protection.

Middleware:
- requireAuth
- optionalAuth
- requireRoles

**Dependencies:**
- Depends on #203
```

### Expected Behavior

**T0**: Assign Copilot to parent issue #200

✅ **Only #201 assigned** (no dependencies)
- #201 ← Copilot assigned ✅
- #202 ← Blocked (needs #201) ⏸️
- #203 ← Blocked (needs #202) ⏸️
- #204 ← Blocked (needs #203) ⏸️

**T1**: PR for #201 merged

✅ **#202 automatically assigned**
- #202 ← Copilot assigned ✅
- #203 ← Still blocked (needs #202) ⏸️
- #204 ← Still blocked (needs #203) ⏸️

**T2**: PR for #202 merged

✅ **#203 automatically assigned**
- #203 ← Copilot assigned ✅
- #204 ← Still blocked (needs #203) ⏸️

**T3**: PR for #203 merged

✅ **#204 automatically assigned**
- #204 ← Copilot assigned ✅

**T4**: PR for #204 merged

🎉 **All subtasks complete!**

---

## Example 3: Parallel Branches with Convergence

**Use Case**: Feature with independent frontend/backend that merge for testing.

### Parent Issue #300: Implement User Profile Management

```markdown
# Implement User Profile Management

Add complete profile management system.

## Subtasks
- [ ] #301 Database schema updates
- [ ] #302 Backend profile API
- [ ] #303 Frontend profile components
- [ ] #304 Profile image upload service
- [ ] #305 Integration tests
- [ ] #306 Documentation
```

### Subtask Issues

**Issue #301: Database schema updates**
```markdown
Add profile-related tables and fields.

- Add profile table (bio, avatar_url, location)
- Add user_preferences table
- Add profile_views table for analytics
```

**Issue #302: Backend profile API**
```markdown
Implement profile CRUD operations.

Endpoints:
- GET /api/profile/:id
- PUT /api/profile/:id
- DELETE /api/profile/:id
- GET /api/profile/:id/preferences

**Dependencies:**
- Depends on #301
```

**Issue #303: Frontend profile components**
```markdown
Create React components for profile pages.

Components:
- ProfileView
- ProfileEdit
- ProfileSettings
- ProfileAvatar
```

**Issue #304: Profile image upload service**
```markdown
Implement image upload and storage.

Features:
- Image validation
- Resize and optimize
- Upload to S3
- Generate thumbnails

**Dependencies:**
- Depends on #302
```

**Issue #305: Integration tests**
```markdown
Write end-to-end tests for profile workflows.

Test scenarios:
- Create/update/delete profile
- Upload profile image
- View other profiles
- Update preferences

**Dependencies:**
- Depends on #302
- Depends on #303
- Depends on #304
```

**Issue #306: Documentation**
```markdown
Document profile management features.

- API documentation
- User guide
- Admin guide

**Dependencies:**
- Depends on #305
```

### Expected Behavior

**T0**: Assign Copilot to parent issue #300

✅ **#301 and #303 assigned** (no dependencies)
- #301 ← Copilot assigned ✅ (Database)
- #302 ← Blocked (needs #301) ⏸️
- #303 ← Copilot assigned ✅ (Frontend)
- #304 ← Blocked (needs #302) ⏸️
- #305 ← Blocked (needs #302, #303, #304) ⏸️
- #306 ← Blocked (needs #305) ⏸️

📝 **Status Comment**:
```
### ✅ Auto-assigned to Copilot (2)
- #301 - Database schema updates
- #303 - Frontend profile components

### ⏸️ Blocked by dependencies (4)
- #302 - Backend profile API
  - Dependencies: #301
- #304 - Profile image upload service
  - Dependencies: #302
- #305 - Integration tests
  - Dependencies: #302, #303, #304
- #306 - Documentation
  - Dependencies: #305
```

**T1**: PR for #301 merged

✅ **#302 automatically assigned**
- #302 ← Copilot assigned ✅

**T2**: PR for #303 merged

⏸️ **#305 still blocked** (needs #302 and #304 too)

**T3**: PR for #302 merged

✅ **#304 automatically assigned**
- #304 ← Copilot assigned ✅

**T4**: PR for #304 merged

✅ **#305 automatically assigned** (all dependencies complete)
- #305 ← Copilot assigned ✅

**T5**: PR for #305 merged

✅ **#306 automatically assigned**
- #306 ← Copilot assigned ✅

**T6**: PR for #306 merged

🎉 **All subtasks complete!**

**Parallelization achieved**:
- T0-T1: #301 and #303 in parallel
- T1-T3: #302 completes
- T3-T4: #304 completes
- T4-T5: #305 completes
- T5-T6: #306 completes

---

## Example 4: Using AI-Powered Dependency Detection

**Use Case**: Complex feature where dependencies are implied in descriptions.

### Parent Issue #400: Payment Gateway Integration

```markdown
# Payment Gateway Integration

Integrate Stripe payment gateway into our platform.

## Subtasks
- [ ] #401 Stripe SDK setup
- [ ] #402 Payment models and database
- [ ] #403 Checkout flow implementation
- [ ] #404 Webhook handler for payment events
- [ ] #405 Payment dashboard UI
- [ ] #406 Refund processing
- [ ] #407 Email notifications
```

### Subtask Issues (Without Explicit Dependencies)

**Issue #401: Stripe SDK setup**
```markdown
Install and configure Stripe SDK.

- Add Stripe dependencies
- Set up API keys
- Create Stripe service class
- Add TypeScript types
```

**Issue #402: Payment models and database**
```markdown
Create database models for payments.

After setting up the Stripe SDK, we need to create models to store payment data.

Models:
- Payment
- PaymentMethod
- Transaction
- Refund
```

**Issue #403: Checkout flow implementation**
```markdown
Implement the checkout flow using Stripe.

This requires the Stripe SDK to be configured and payment models to be in place.

Features:
- Create payment intent
- Collect payment method
- Confirm payment
- Handle 3D Secure
```

**Issue #404: Webhook handler for payment events**
```markdown
Handle Stripe webhooks for payment lifecycle events.

Once the checkout flow is working, set up webhooks to handle async events.

Events:
- payment_intent.succeeded
- payment_intent.failed
- charge.refunded
```

**Issue #405: Payment dashboard UI**
```markdown
Create admin dashboard to view payments.

Build UI to display payment data from our database.

Features:
- List all payments
- Filter by status
- Search by customer
- View transaction details
```

**Issue #406: Refund processing**
```markdown
Implement refund functionality.

Needs the checkout flow to be complete and webhook handler to process refund events.

Features:
- Full refund
- Partial refund
- Refund validation
- Update database
```

**Issue #407: Email notifications**
```markdown
Send email notifications for payment events.

Should work with the webhook handler to send emails on payment success/failure.

Templates:
- Payment confirmation
- Payment failed
- Refund processed
```

### Expected Behavior with AI Analysis

**T0**: Assign Copilot to parent issue #400 (AI analysis enabled)

🤖 **AI analyzes subtask descriptions and determines:**
```
Dependencies detected:
- #401: None (Stripe SDK is the foundation)
- #402: Depends on #401 (mentions "After setting up the Stripe SDK")
- #403: Depends on #401, #402 (mentions "requires SDK and models")
- #404: Depends on #403 (mentions "Once checkout flow is working")
- #405: Depends on #402 (needs "payment data from database")
- #406: Depends on #403, #404 (mentions "checkout flow" and "webhook handler")
- #407: Depends on #404 (should "work with webhook handler")
```

✅ **Only #401 assigned** (root dependency)
- #401 ← Copilot assigned ✅
- All others blocked ⏸️

**T1**: PR for #401 merged

✅ **#402 automatically assigned** (AI detected dependency on #401)
- #402 ← Copilot assigned ✅

**T2**: PR for #402 merged

✅ **#403 and #405 automatically assigned** (both depend only on completed tasks)
- #403 ← Copilot assigned ✅
- #405 ← Copilot assigned ✅

**T3**: PR for #403 merged

✅ **#404 automatically assigned** (depends on #403)
- #404 ← Copilot assigned ✅

**T4**: PR for #405 merged

⏸️ **No change** (#406 and #407 still need #404)

**T5**: PR for #404 merged

✅ **#406 and #407 automatically assigned**
- #406 ← Copilot assigned ✅
- #407 ← Copilot assigned ✅

**T6**: PRs for #406 and #407 merged

🎉 **All subtasks complete!**

**AI advantage**: No need to manually label dependencies - the AI inferred them from natural language!

---

## Example 5: Handling Edge Cases

### Circular Dependency

**Subtask #501**: "Depends on #502"
**Subtask #502**: "Depends on #501"

🚫 **Result**: Action detects circular dependency and posts error comment:
```
## ⚠️ Circular Dependency Detected

Subtasks #501 and #502 have a circular dependency and cannot be assigned.
Please review and update the dependencies.
```

### Already Assigned Subtask

**Subtask #601**: Already assigned to `@developer`

⏭️ **Result**: Skipped with comment:
```
### ⏭️ Skipped (1)
- #601 - Feature X
  - Reason: Already assigned to: @developer
```

### Closed Subtask

**Subtask #701**: State is "closed"

⏭️ **Result**: Skipped automatically (not shown in comment)

### Failed Dependency

**Subtask #801**: Depends on #800
**Issue #800**: Closed without merging

⏸️ **Result**: Subtask remains blocked with warning:
```
### ⚠️ Dependency Issues
- #801 depends on #800, which was closed without merging
- Manual intervention required
```

---

## Tips for Creating Good Subtasks

### ✅ Good Practice

**Clear, atomic tasks**:
```markdown
#101: Create user database schema
#102: Implement user registration API
#103: Add email verification
```

**Explicit dependencies**:
```markdown
#102: Implement user registration API
Dependencies: Depends on #101
```

**Parent reference**:
```markdown
#102: Implement user registration API

Implements user registration for the authentication system.

**Parent Issue:** #100
**Dependencies:** Depends on #101
```

### ❌ Bad Practice

**Vague tasks**:
```markdown
#201: Do backend stuff
#202: Make frontend work
```

**Missing dependencies**:
```markdown
#302: Add authentication (but doesn't mention it needs #301 database schema)
```

**Too large**:
```markdown
#401: Implement entire payment system with Stripe, webhooks, UI, and notifications
(Should be broken into smaller subtasks)
```

---

## Monitoring Progress

Use the parent issue as your progress dashboard. The action will keep it updated with:

- ✅ Assigned subtasks (work in progress)
- ⏸️ Blocked subtasks (waiting on dependencies)
- ⏭️ Skipped subtasks (already assigned or closed)
- 🎉 Completed subtasks (PRs merged)

Example progress view:
```
## Subtasks
- [x] #301 Database schema updates ✅ (merged)
- [x] #303 Frontend profile components ✅ (merged)
- [ ] #302 Backend profile API 🔄 (Copilot working)
- [ ] #304 Profile image upload ⏸️ (blocked by #302)
- [ ] #305 Integration tests ⏸️ (blocked by #302, #303, #304)
```

---

## Summary

The Copilot Subtask Manager enables:

- 🚀 **Parallel execution** of independent tasks
- 🔄 **Automatic progression** through dependencies
- 🧠 **Intelligent dependency detection** (with AI)
- 📊 **Clear progress tracking** on parent issues
- ⚡ **Time savings** by eliminating manual coordination

Choose the example that matches your workflow and adapt it to your needs!
