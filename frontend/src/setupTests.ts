import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import matchers from '@testing-library/jest-dom/matchers';

// Rozszerzamy expect o matchery z @testing-library/jest-dom
expect.extend(matchers);

// Czyścimy po każdym teście
afterEach(() => {
  cleanup();
}); 