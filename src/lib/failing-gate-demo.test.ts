import { expect, it } from 'vitest';

// THROWAWAY: deliberately failing test used to demonstrate that failed validation blocks the pipeline.
it('fails on purpose', () => {
  expect(1).toBe(2);
});
