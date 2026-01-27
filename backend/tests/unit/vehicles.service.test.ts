import { describe, it, expect } from 'vitest';
import { validateVehicleYear } from '../../src/services/vehicles.service.js';

describe('Vehicle Service', () => {
  describe('validateVehicleYear', () => {
    it('should accept year 2000 (minimum valid year)', () => {
      expect(validateVehicleYear(2000)).toBe(true);
    });

    it('should accept year 2024 (recent year)', () => {
      expect(validateVehicleYear(2024)).toBe(true);
    });

    it('should accept year 2025 (future year)', () => {
      expect(validateVehicleYear(2025)).toBe(true);
    });

    it('should reject year 1999 (one year before minimum)', () => {
      expect(validateVehicleYear(1999)).toBe(false);
    });

    it('should reject year 1990', () => {
      expect(validateVehicleYear(1990)).toBe(false);
    });

    it('should reject year 1950', () => {
      expect(validateVehicleYear(1950)).toBe(false);
    });

    it('should reject year 0', () => {
      expect(validateVehicleYear(0)).toBe(false);
    });

    it('should reject negative years', () => {
      expect(validateVehicleYear(-1)).toBe(false);
      expect(validateVehicleYear(-2000)).toBe(false);
    });
  });

  describe('Vehicle year boundary cases', () => {
    const MIN_YEAR = 2000;

    it(`year ${MIN_YEAR - 1} is invalid (boundary)`, () => {
      expect(validateVehicleYear(MIN_YEAR - 1)).toBe(false);
    });

    it(`year ${MIN_YEAR} is valid (boundary)`, () => {
      expect(validateVehicleYear(MIN_YEAR)).toBe(true);
    });

    it(`year ${MIN_YEAR + 1} is valid`, () => {
      expect(validateVehicleYear(MIN_YEAR + 1)).toBe(true);
    });
  });
});
