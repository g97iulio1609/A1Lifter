# T6: Refactor API Attempts - Implementation Summary

## Overview
**Status**: ✅ Complete  
**Branch**: `feature/p1-realtime-experience`  
**Commit**: `fe4c00d`  
**Issue**: #18

## Objectives
Refactor attempt-related API endpoints to use a service layer with proper validation, improving maintainability, type safety, and code organization.

## Implementation Details

### 1. Zod Validation Schemas (`src/lib/validations/attempts.ts`)
Created comprehensive validation schemas for all attempt operations:

#### `CreateAttemptSchema`
- Validates new attempt creation
- Required fields: userId, eventId, categoryId, registrationId, lift, attemptNumber, weight
- Optional fields: notes
- Ensures proper lift type (`SNATCH` | `CLEAN_AND_JERK`)

#### `UpdateAttemptSchema`
- Partial updates allowed
- Optional fields: weight, result, notes, videoUrl, judgeScores, judgedBy
- Result validation: `PENDING` | `GOOD` | `NO_LIFT` | `DISQUALIFIED`

#### `JudgeAttemptSchema`
- Specific validation for judging operations
- Required: result field
- Optional: judgeScores, notes, videoUrl, judgedBy

#### `AttemptQuerySchema`
- Validation for query parameters
- Supports filtering by: eventId, userId, lift
- Pagination: limit (default: 50), offset (default: 0)

### 2. Service Layer (`src/lib/services/attempt-service.ts`)
Implemented `AttemptService` class with the following methods:

#### `getAttempts(query)`
- Paginated attempt retrieval with filters
- Supports filtering by eventId, userId, lift
- Returns structured response with metadata (total, limit, offset, hasMore)
- Includes related data: user, event, category

#### `createAttempt(data)`
- Validates registration exists and is approved
- Checks event is in progress
- Prevents duplicate attempts (composite unique constraint)
- Auto-generates timestamp
- Returns created attempt with full relations

#### `updateAttempt(id, data)`
- Prevents modification of already-judged attempts
- Auto-tracks judging timestamp and judge
- Creates notifications for result changes
- Implements record tracking:
  - Personal Records (PR)
  - Event Records (ER)
- Handles both successful and failed lift notifications

#### `getCurrentAttempt(eventId)`
- Returns next pending attempt for an event
- Ordered by timestamp and attempt number
- Used for live judging interface

#### `getAthleteAttempts(userId, eventId)`
- Returns all attempts for an athlete in an event
- Calculates summary statistics:
  - Best snatch
  - Best clean & jerk
  - Total (best snatch + best clean & jerk)
  - Attempt counts per lift
- Filters only successful (GOOD) lifts for bests

### 3. Refactored API Routes

#### `POST /api/attempts`
- Uses `CreateAttemptSchema` for validation
- Delegates to `AttemptService.createAttempt()`
- Returns 201 on success
- Proper error handling: 400 for validation, 500 for server errors

#### `PATCH /api/attempts/[id]`
- Uses `UpdateAttemptSchema` for validation
- Delegates to `AttemptService.updateAttempt()`
- Returns 404 if attempt not found

#### `GET /api/attempts/[id]`
- Direct Prisma query for single attempt retrieval
- Includes full relations (user, event, category)

#### `PATCH /api/attempts/[id]/judge`
- Role-based access: JUDGE or ADMIN only
- Uses `JudgeAttemptSchema` for validation
- Delegates to `AttemptService.updateAttempt()`
- Automatically handles record creation and notifications

#### `GET /api/events/[id]/attempts`
- Lists all attempts for an event
- Supports query parameters: userId, lift, limit, offset
- Uses `AttemptService.getAttempts()`
- Returns paginated response with metadata

#### `GET /api/events/[id]/attempts/current`
- Gets current pending attempt for an event
- Uses `AttemptService.getCurrentAttempt()`
- Returns 404 if no pending attempts

#### `GET /api/athletes/[id]/stats`
- Enhanced with event-specific attempt data
- Uses `AttemptService.getAthleteAttempts()` when eventId provided
- Combines registration stats, record counts, and attempt performance

### 4. Test Suite (`src/__tests__/services/attempt-service.test.ts`)
Comprehensive test coverage with 16 tests:

#### getAttempts Tests (6 tests)
- Default pagination behavior
- Filtering by eventId, userId, lift
- Custom pagination
- hasMore flag calculation

#### createAttempt Tests (2 tests)
- Successful creation with validations
- Duplicate attempt prevention

#### updateAttempt Tests (3 tests)
- Successful update with result change
- Prevention of modifying judged attempts
- Notification creation on result change

#### getCurrentAttempt Tests (2 tests)
- Returns next pending attempt
- Handles no pending attempts

#### getAthleteAttempts Tests (3 tests)
- Returns attempts with summary
- Calculates best lifts correctly
- Handles zero successful lifts

All tests use comprehensive mocking of Prisma client.

## Benefits Achieved

1. **Type Safety**
   - Zod schemas ensure runtime type validation
   - Prevents invalid data from reaching the database
   - Clear error messages for validation failures

2. **Maintainability**
   - Business logic centralized in service layer
   - API routes simplified to input validation and delegation
   - Easier to modify business rules without touching multiple routes

3. **Consistency**
   - Uniform error handling across all attempt endpoints
   - Consistent response formats
   - Standardized validation patterns

4. **Testability**
   - Service layer easily mockable for route testing
   - Comprehensive unit tests for business logic
   - Clear separation of concerns

5. **Code Reuse**
   - Common attempt operations available to all routes
   - Shared validation logic
   - Reduced code duplication

## Enum Alignment
Properly aligned with Prisma schema enums:
- **AttemptResult**: `PENDING`, `GOOD`, `NO_LIFT`, `DISQUALIFIED`
- **NotificationType**: `RESULT_POSTED` (used instead of non-existent `ATTEMPT_JUDGED`)

## Files Modified
- `src/lib/validations/attempts.ts` (new)
- `src/lib/services/attempt-service.ts` (new)
- `src/__tests__/services/attempt-service.test.ts` (new)
- `src/app/api/attempts/route.ts` (refactored)
- `src/app/api/attempts/[id]/route.ts` (refactored)
- `src/app/api/attempts/[id]/judge/route.ts` (refactored)
- `src/app/api/events/[id]/attempts/route.ts` (refactored)
- `src/app/api/events/[id]/attempts/current/route.ts` (refactored)
- `src/app/api/athletes/[id]/stats/route.ts` (enhanced)

## Statistics
- **Lines Added**: 986
- **Lines Removed**: 363
- **Net Change**: +623 lines
- **New Files**: 3
- **Modified Files**: 8
- **Test Coverage**: 16 tests, all passing

## Next Steps
With T6 complete, the attempt API is now:
- Well-structured with service layer
- Fully validated with Zod
- Comprehensive test coverage
- Ready for frontend integration

This provides a solid foundation for:
- T7: Dashboard completion (can now reliably fetch attempt data)
- T8: Notification flow (notification creation already integrated)
- Future enhancements (easy to extend service layer)

## Dependencies
- ✅ Zod 4.1.11 (added)
- ✅ Prisma enums aligned
- ✅ Existing API patterns maintained
- ✅ NextAuth integration preserved

## Breaking Changes
None. All existing API contracts maintained with improved implementation.
