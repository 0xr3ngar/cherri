const TIME_UNITS = {
    w: {
        milliseconds: 7 * 24 * 60 * 60 * 1000,
        singular: "week",
        plural: "weeks",
    },
    d: { milliseconds: 24 * 60 * 60 * 1000, singular: "day", plural: "days" },
    h: { milliseconds: 60 * 60 * 1000, singular: "hour", plural: "hours" },
    m: { milliseconds: 60 * 1000, singular: "minute", plural: "minutes" },
} as const;

export const parseTimePeriod = (
    period: string,
): { milliseconds: number; description: string } => {
    if (/^\d+$/.test(period)) {
        const months = Number.parseInt(period, 10);
        return {
            // ~30days
            milliseconds: months * 30 * 24 * 60 * 60 * 1000,
            description: `${months} month${months !== 1 ? "s" : ""}`,
        };
    }

    const timeParts = period.match(/(\d+[wdhm])/g) || [];

    const parsedParts = timeParts.map((part) => {
        const value = Number.parseInt(part.slice(0, -1), 10);
        const unit = part.slice(-1) as keyof typeof TIME_UNITS;

        if (!TIME_UNITS[unit]) {
            throw new Error(`Invalid time unit: ${unit}. Use w, d, h, or m.`);
        }

        const timeUnit = TIME_UNITS[unit];
        return {
            milliseconds: value * timeUnit.milliseconds,
            description: `${value} ${value === 1 ? timeUnit.singular : timeUnit.plural}`,
        };
    });

    const totalMs = parsedParts.reduce(
        (sum, part) => sum + part.milliseconds,
        0,
    );
    const description = parsedParts.map((part) => part.description).join(", ");

    return { milliseconds: totalMs, description };
};
