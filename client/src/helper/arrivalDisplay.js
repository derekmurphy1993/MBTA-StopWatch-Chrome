function resolveSecondsUntilArrival(train) {
	const arrivalTime = train?.attributes?.arrival_time;
	const departureTime = train?.attributes?.departure_time;
	const now = Date.now();

	const arrivalSeconds = arrivalTime
		? Math.floor((new Date(arrivalTime).getTime() - now) / 1000)
		: Number.NaN;
	const departureSeconds = departureTime
		? Math.floor((new Date(departureTime).getTime() - now) / 1000)
		: Number.NaN;

	const candidates = [arrivalSeconds, departureSeconds].filter((value) =>
		Number.isFinite(value),
	);
	if (candidates.length === 0) return Number.POSITIVE_INFINITY;

	const futureCandidates = candidates.filter((value) => value >= 0);
	if (futureCandidates.length > 0) return Math.min(...futureCandidates);

	// If only stale timestamps remain, use the least-stale one.
	return Math.max(...candidates);
}

export function getArrivalLabel(train, options = {}) {
	const status = (train?.attributes?.status || "").toLowerCase();
	const hasAlert = Boolean(options?.hasAlert);

	if (hasAlert || status.includes("delayed") || status.includes("alert")) {
		return "DELAYED, SEE ALERT";
	}

	const seconds = resolveSecondsUntilArrival(train);
	if (!Number.isFinite(seconds)) return ">15 min";
	const minutes = Math.floor(seconds / 60);

	if (
		status.includes("due") ||
		status.includes("arriving") ||
		status.includes("now") ||
		(seconds >= 0 && seconds < 60)
	) {
		return "DUE";
	}

	if (seconds < 0) return ">15 min";
	if (minutes > 15) return ">15 min";
	if (minutes < 1) return "DUE";
	return `${minutes} min`;
}

export function getArrivalSeconds(train) {
	const seconds = resolveSecondsUntilArrival(train);
	if (!Number.isFinite(seconds) || seconds < 0) return Number.POSITIVE_INFINITY;
	return seconds;
}
