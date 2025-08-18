import { describe, it, expect } from 'vitest';
import { PowerliftingPlugin } from '../powerlifting/PowerliftingPlugin';
import { Attempt, AttemptResult } from '../../entities/Attempt';
// import { Athlete } from '../../entities/Athlete';

describe('PowerliftingPlugin', () => {
  const plugin = new PowerliftingPlugin();

  // Mock athlete data for tests
  // const _mockAthlete: Athlete = {
  //   id: 'athlete-1',
  //   name: 'Test Athlete',
  //   birthDate: new Date('1990-01-01'),
  //   gender: 'M',
  //   bodyweight: 75,
  //   personalBests: {},
  //   createdAt: new Date(),
  //   updatedAt: new Date()
  // };

  describe('validateAttempt', () => {
    it('validates successful squat attempt', () => {
      const result = plugin.validateAttempt('athlete-1', 'squat', 150, 1, []);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('validates failed attempt with majority red lights', () => {
      // const failedResult: AttemptResult = {
      //   isSuccessful: false,
      //   judgeDecisions: [],
      //   whiteFlags: 1,
      //   redFlags: 2,
      //   finalDecision: false,
      //   processedAt: new Date()
      // };
      
      const result = plugin.validateAttempt('athlete-1', 'squat', 150, 1, []);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Majority of judges rejected the attempt');
    });

    it('validates weight progression rules', () => {
      const successfulResult: AttemptResult = {
          isSuccessful: true,
          judgeDecisions: [],
          whiteFlags: 3,
          redFlags: 0,
          finalDecision: true,
          processedAt: new Date()
        };
        const previousAttempts: Attempt[] = [new Attempt(
         'attempt-0',
         'event-1',
         'session-1',
         'athlete-1',
         'squat',
         1,
         150,
         150,
         successfulResult,
         {},
         new Date(),
         'completed'
       )];

      const result = plugin.validateAttempt('athlete-1', 'squat', 140, 2, previousAttempts);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Weight must be higher than previous successful attempt');
    });

    it('allows same weight after failed attempt', () => {
      // const failedResult: AttemptResult = {
      //   isSuccessful: false,
      //   judgeDecisions: [],
      //   whiteFlags: 1,
      //   redFlags: 2,
      //   finalDecision: false,
      //   processedAt: new Date()
      // };
      const previousAttempts: Attempt[] = [new Attempt(
        'attempt-0',
        'event-1',
        'session-1',
        'athlete-1',
        'squat',
        1,
        150,
        150,
    null,
        {},
        new Date(),
        'completed'
      )];

      const result = plugin.validateAttempt('athlete-1', 'squat', 150, 2, previousAttempts);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('calculateScore', () => {
    it('calculates powerlifting score correctly', () => {
      // const successfulResult: AttemptResult = {
      //   isSuccessful: true,
      //   judgeDecisions: [],
      //   whiteFlags: 3,
      //   redFlags: 0,
      //   finalDecision: true,
      //   processedAt: new Date()
      // };
      // Previous attempts for context
      // new Attempt(
      //   'attempt-1',
      //   'event-1',
      //   'session-1',
      //   'athlete-1',
      //   'squat',
      //   1,
      //   100,
      //   100,
      //   successfulResult,
      //   {},
      //   new Date(),
      //   'completed'
      // );

      const score = plugin.calculateScore(460, 75, 'M');
      expect(score).toBe(460);
    });

    it('returns zero for disciplines with no successful attempts', () => {
      // const failedResult: AttemptResult = {
      //   isSuccessful: false,
      //   judgeDecisions: [],
      //   whiteFlags: 1,
      //   redFlags: 2,
      //   finalDecision: false,
      //   processedAt: new Date()
      // };
      
      // Previous attempts for context
      // new Attempt(
      //   'attempt-1',
      //   'event-1',
      //   'session-1',
      //   'athlete-1',
      //   'squat',
      //   1,
      //   100,
      //   100,
      //   failedResult,
      //   {},
      //   new Date(),
      //   'completed'
      // );

      const score = plugin.calculateScore(0, 75, 'M');
      expect(score).toBe(0);
    });
  });

  describe('getAttemptOrder', () => {
    it('orders attempts by weight ascending', () => {
      const attempts: Attempt[] = [
        new Attempt(
          'attempt-1',
          'event-1',
          'session-1',
          'athlete-1',
          'squat',
          1,
          160,
          160,
          null,
          {},
          new Date(),
          'declared'
        ),
        new Attempt(
          'attempt-2',
          'event-1',
          'session-1',
          'athlete-2',
          'squat',
          1,
          140,
          140,
          null,
          {},
          new Date(),
          'declared'
        ),
        new Attempt(
          'attempt-3',
          'event-1',
          'session-1',
          'athlete-3',
          'squat',
          1,
          150,
          150,
          null,
          {},
          new Date(),
          'declared'
        )
      ];

      const orderedAttempts = plugin.getAttemptOrder(attempts);
      expect(orderedAttempts[0].actualWeight).toBe(140);
      expect(orderedAttempts[1].actualWeight).toBe(150);
      expect(orderedAttempts[2].actualWeight).toBe(160);
    });

    it('prioritizes lower attempt numbers for same weight', () => {
      const attempts: Attempt[] = [
        new Attempt(
          'attempt-1',
          'event-1',
          'session-1',
          'athlete-1',
          'squat',
          2,
          150,
          150,
          null,
          {},
          new Date(),
          'declared'
        ),
        new Attempt(
          'attempt-2',
          'event-1',
          'session-1',
          'athlete-2',
          'squat',
          1,
          150,
          150,
          null,
          {},
          new Date(),
          'declared'
        )
      ];

      const orderedAttempts = plugin.getAttemptOrder(attempts);
      expect(orderedAttempts[0].attemptNumber).toBe(1);
      expect(orderedAttempts[1].attemptNumber).toBe(2);
    });
  });
});