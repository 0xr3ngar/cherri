import { describe, expect, test } from "bun:test";
import { parseTimePeriod } from "./parseTimePeriod";

describe("parseTimePeriod", () => {
    test("parses bare numbers as months", () => {
        const result = parseTimePeriod("2");

        expect(result.description).toBe("2 months");
        expect(result.milliseconds).toBe(2 * 30 * 24 * 60 * 60 * 1000);
    });

    test("parses single month", () => {
        const result = parseTimePeriod("1");

        expect(result.description).toBe("1 month");
        expect(result.milliseconds).toBe(30 * 24 * 60 * 60 * 1000);
    });

    test("parses weeks", () => {
        const result = parseTimePeriod("2w");

        expect(result.description).toBe("2 weeks");
        expect(result.milliseconds).toBe(2 * 7 * 24 * 60 * 60 * 1000);
    });

    test("parses days", () => {
        const result = parseTimePeriod("7d");

        expect(result.description).toBe("7 days");
        expect(result.milliseconds).toBe(7 * 24 * 60 * 60 * 1000);
    });

    test("parses hours", () => {
        const result = parseTimePeriod("12h");

        expect(result.description).toBe("12 hours");
        expect(result.milliseconds).toBe(12 * 60 * 60 * 1000);
    });

    test("parses minutes", () => {
        const result = parseTimePeriod("30m");

        expect(result.description).toBe("30 minutes");
        expect(result.milliseconds).toBe(30 * 60 * 1000);
    });

    test("parses complex period with multiple units", () => {
        const result = parseTimePeriod("1w3d4h");

        expect(result.description).toBe("1 week, 3 days, 4 hours");
        expect(result.milliseconds).toBe(
            (7 + 3) * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
        );
    });

    test("parses all units combined", () => {
        const result = parseTimePeriod("2w5d3h30m");

        expect(result.description).toBe("2 weeks, 5 days, 3 hours, 30 minutes");
        const expected =
            2 * 7 * 24 * 60 * 60 * 1000 +
            5 * 24 * 60 * 60 * 1000 +
            3 * 60 * 60 * 1000 +
            30 * 60 * 1000;
        expect(result.milliseconds).toBe(expected);
    });

    test("uses singular for 1 unit", () => {
        expect(parseTimePeriod("1w").description).toBe("1 week");
        expect(parseTimePeriod("1d").description).toBe("1 day");
        expect(parseTimePeriod("1h").description).toBe("1 hour");
        expect(parseTimePeriod("1m").description).toBe("1 minute");
    });

    test("uses plural for multiple units", () => {
        expect(parseTimePeriod("2w").description).toBe("2 weeks");
        expect(parseTimePeriod("3d").description).toBe("3 days");
        expect(parseTimePeriod("4h").description).toBe("4 hours");
        expect(parseTimePeriod("5m").description).toBe("5 minutes");
    });

    test("handles zero values", () => {
        const result = parseTimePeriod("0d");

        expect(result.description).toBe("0 days");
        expect(result.milliseconds).toBe(0);
    });

    test("handles invalid time unit gracefully", () => {
        const result = parseTimePeriod("5x");

        expect(result.milliseconds).toBe(0);
        expect(result.description).toBe("");
    });

    test("handles empty matches gracefully", () => {
        const result = parseTimePeriod("");

        expect(result.milliseconds).toBe(0);
        expect(result.description).toBe("");
    });

    test("example from README: 1w3d4h", () => {
        const result = parseTimePeriod("1w3d4h");

        expect(result.description).toBe("1 week, 3 days, 4 hours");
    });

    test("example from README: 2d12h", () => {
        const result = parseTimePeriod("2d12h");

        expect(result.description).toBe("2 days, 12 hours");
    });

    test("example from README: 30m", () => {
        const result = parseTimePeriod("30m");

        expect(result.description).toBe("30 minutes");
    });
});
