import sortTime from "./sortTime";

export default function convertTime(trains, number) {
	// without this check it will break while loading / no trains
	if (trains.length === 0) return "Err";

	const sortData = sortTime(trains);

	const arrivals = [];

	for (let i = 0; i < number; i++) {
		if (!sortData[i].attributes.arrival_time) {
			return;
		}

		// handle for departure time?

		const predictDate = new Date(sortData[i].attributes.arrival_time);
		const currentTime = new Date();

		const milliseconds = predictDate - currentTime;

		const secondsUntilArrival = Math.floor(milliseconds / 1e3);

		arrivals.push(secondsUntilArrival);
	}

	return arrivals;
}
