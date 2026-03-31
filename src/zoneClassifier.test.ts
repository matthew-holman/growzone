import { describe, it, expect } from "vitest";
import { classifyZone } from "./zoneClassifier.js";

describe("classifyZone", () => {
  describe("known Swedish cities", () => {
    it("Malmö (Zone 1)", () => {
      expect(classifyZone(55.6050, 13.0038)).toBe(1);
    });

    it("Gothenburg (Zone 2)", () => {
      expect(classifyZone(57.7089, 11.9746)).toBe(2);
    });

    it("Stockholm (Zone 3)", () => {
      expect(classifyZone(59.3293, 18.0686)).toBe(3);
    });

    it("Sundsvall (Zone 4)", () => {
      expect(classifyZone(62.3908, 17.3069)).toBe(4);
    });

    it("Umeå (Zone 5)", () => {
      expect(classifyZone(63.8258, 20.2630)).toBe(5);
    });
  });

  describe("zone boundary conditions", () => {
    it("exactly at 57.0 is Zone 2", () => {
      expect(classifyZone(57.0, 15.0)).toBe(2);
    });

    it("just below 57.0 is Zone 1", () => {
      expect(classifyZone(56.999, 15.0)).toBe(1);
    });

    it("exactly at 58.5 is Zone 3", () => {
      expect(classifyZone(58.5, 15.0)).toBe(3);
    });

    it("exactly at 60.0 is Zone 4", () => {
      expect(classifyZone(60.0, 15.0)).toBe(4);
    });

    it("exactly at 62.5 is Zone 5", () => {
      expect(classifyZone(62.5, 15.0)).toBe(5);
    });
  });

  // The bounding box is a sanity check against clearly invalid inputs.
  // Nearby capitals (Oslo, Copenhagen, Helsinki) share lat/lng ranges with
  // Sweden — exclusion of those is handled upstream by the geocoder
  // (countrycodes=se), not by this pure function.
  describe("clearly invalid coordinates", () => {
    it("returns null for lat too far south", () => {
      expect(classifyZone(54.0, 15.0)).toBeNull();
    });

    it("returns null for lat too far north", () => {
      expect(classifyZone(70.0, 15.0)).toBeNull();
    });

    it("returns null for lng too far east", () => {
      expect(classifyZone(60.0, 26.0)).toBeNull();
    });

    it("returns null for lng too far west", () => {
      expect(classifyZone(60.0, 9.0)).toBeNull();
    });

    it("returns null for null island (0, 0)", () => {
      expect(classifyZone(0, 0)).toBeNull();
    });
  });
});
