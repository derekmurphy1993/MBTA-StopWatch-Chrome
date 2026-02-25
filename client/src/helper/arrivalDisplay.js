export function getArrivalLabel(train) {
	const status = (train?.attributes?.status || "").toLowerCase();
	const arrival = train?.attributes?.arrival_time || train?.attributes?.departure_time;

	if (status.includes("delayed") || status.includes("alert")) {
		return "DELAYED, SEE ALERT";
	}

	if (!arrival) return ">15 min";

	const seconds = Math.floor((new Date(arrival) - new Date()) / 1000);
	const minutes = Math.floor(seconds / 60);

	if (
		status.includes("due") ||
		status.includes("arriving") ||
		status.includes("now") ||
		seconds < 60
	) {
		return "DUE";
	}

	if (minutes > 15) return ">15 min";
	if (minutes < 1) return "DUE";
	return `${minutes} min`;
}

export function getArrivalSeconds(train) {
	const arrival = train?.attributes?.arrival_time || train?.attributes?.departure_time;
	if (!arrival) return Number.POSITIVE_INFINITY;
	return Math.floor((new Date(arrival) - new Date()) / 1000);
}
