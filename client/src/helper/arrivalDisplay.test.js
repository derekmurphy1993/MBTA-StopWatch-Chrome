import { getArrivalLabel, getArrivalSeconds } from "./arrivalDisplay";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

function makeTrain({ arrivalTime, departureTime, status = "" } = {}) {
	return {
		attributes: {
			arrival_time: arrivalTime ?? null,
			departure_time: departureTime ?? null,
			status,
		},
	};
}

describe("arrivalDisplay", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2026-03-24T12:00:00.000Z"));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns DUE when arrival is under 60 seconds", () => {
		const train = makeTrain({ arrivalTime: "2026-03-24T12:00:45.000Z" });
		expect(getArrivalLabel(train)).toBe("DUE");
		expect(getArrivalSeconds(train)).toBe(45);
	});

	it("returns exact minutes from 1 to 15", () => {
		const train = makeTrain({ arrivalTime: "2026-03-24T12:04:00.000Z" });
		expect(getArrivalLabel(train)).toBe("4 min");
		expect(getArrivalSeconds(train)).toBe(240);
	});

	it("returns >15 min when arrival is greater than 15 minutes", () => {
		const train = makeTrain({ arrivalTime: "2026-03-24T12:18:00.000Z" });
		expect(getArrivalLabel(train)).toBe(">15 min");
		expect(getArrivalSeconds(train)).toBe(1080);
	});

	it("returns delayed label when alert flag is true", () => {
		const train = makeTrain({ arrivalTime: "2026-03-24T12:04:00.000Z" });
		expect(getArrivalLabel(train, { hasAlert: true })).toBe("DELAYED, SEE ALERT");
	});

	it("returns delayed label when status indicates delayed/alert", () => {
		const delayed = makeTrain({ status: "Delayed" });
		const alert = makeTrain({ status: "Service Alert" });
		expect(getArrivalLabel(delayed)).toBe("DELAYED, SEE ALERT");
		expect(getArrivalLabel(alert)).toBe("DELAYED, SEE ALERT");
	});

	it("uses departure time when arrival time is missing", () => {
		const train = makeTrain({ departureTime: "2026-03-24T12:06:00.000Z" });
		expect(getArrivalLabel(train)).toBe("6 min");
		expect(getArrivalSeconds(train)).toBe(360);
	});

	it("returns Infinity seconds for stale-only timestamps", () => {
		const train = makeTrain({ arrivalTime: "2026-03-24T11:59:30.000Z" });
		expect(getArrivalLabel(train)).toBe(">15 min");
		expect(getArrivalSeconds(train)).toBe(Number.POSITIVE_INFINITY);
	});
});
