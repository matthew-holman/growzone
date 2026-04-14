// Integration tests — requires DATABASE_URL in .env pointing to a populated database.
// Ensure seed-postcodes.ts and seed-stations.ts have been run before executing these tests.
// Run with: npx vitest run src/services/stationLookup.test.ts

import "dotenv/config";
import {describe, it, expect} from "vitest";
import {
    findNearestStations,
    PostcodeNotFoundError,
} from "./stationLookup.js";

describe("findNearestStations", () => {
    describe("Stockholm — postcode 11346", () => {
        it("returns exactly 3 stations", async () => {
            const {stations} = await findNearestStations("11346");
            expect(stations).toHaveLength(3);
        });

        it("returns stations ordered by distance ascending", async () => {
            const {stations} = await findNearestStations("11346");
            for (let i = 1; i < stations.length; i++) {
                expect(stations[i].distanceKm).toBeGreaterThan(stations[i - 1].distanceKm);
            }
        });

        it("returns stations geographically near Stockholm", async () => {
            const {stations} = await findNearestStations("11346");
            // Stockholm is at ~59.3°N, 18.1°E — all 3 stations should be within 150 km
            const STOCKHOLM_LAT = 59.3;
            const STOCKHOLM_LNG = 18.1;
            for (const station of stations) {
                const latDiff = Math.abs(station.lat - STOCKHOLM_LAT);
                const lngDiff = Math.abs(station.lng - STOCKHOLM_LNG);
                // Rough bounding box check (1° lat ≈ 111 km, 1° lng ≈ 65 km at 59°N)
                expect(latDiff).toBeLessThan(1.5);
                expect(lngDiff).toBeLessThan(2.5);
                expect(station.distanceKm).toBeLessThan(150);
            }
        });

        it("returns stations with complete climate data", async () => {
            const {stations} = await findNearestStations("11346");
            for (const station of stations) {
                expect(station.lastFrostDoy).not.toBeNull();
            }
        });

        it("returns a location record with correct postcode", async () => {
            const {location} = await findNearestStations("11346");
            expect(location.postcode).toBe("11346");
        });
    });

    describe("Malmö — postcode 21141", () => {
        it("returns stations in southern Sweden", async () => {
            const {stations} = await findNearestStations("21141");
            for (const station of stations) {
                expect(station.lat).toBeLessThan(58.0);
            }
        });

        it("returns stations within 100 km of Malmö", async () => {
            const {stations} = await findNearestStations("21141");
            for (const station of stations) {
                expect(station.distanceKm).toBeLessThan(100);
            }
        });
    });

    describe("Kiruna — postcode 98138", () => {
        it("returns stations in northern Sweden", async () => {
            const {stations} = await findNearestStations("98138");
            for (const station of stations) {
                expect(station.lat).toBeGreaterThan(65.0);
            }
        });
    });

    describe("error cases", () => {
        it("throws PostcodeNotFoundError for unknown postcode", async () => {
            await expect(findNearestStations("00000")).rejects.toThrow(
                PostcodeNotFoundError
            );
        });

        it("throws PostcodeNotFoundError for non-Swedish postcode format", async () => {
            await expect(findNearestStations("SW1A 1AA")).rejects.toThrow(
                PostcodeNotFoundError
            );
        });
    });

    describe("Floda — postcode 44831", () => {
        it("returns stations in west Sweden", async () => {
            const {stations} = await findNearestStations("44831");
            for (const station of stations) {
                expect(station.lat).toBeLessThan(57.9);
            }
        });
    });
});
