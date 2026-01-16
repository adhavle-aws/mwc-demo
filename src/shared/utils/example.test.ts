/**
 * Example test to verify Jest and fast-check are configured correctly
 */

import fc from 'fast-check';

describe('Test Infrastructure', () => {
  it('should run basic Jest tests', () => {
    expect(true).toBe(true);
  });

  it('should run property-based tests with fast-check', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a; // Commutative property
      }),
      { numRuns: 100 }
    );
  });
});
