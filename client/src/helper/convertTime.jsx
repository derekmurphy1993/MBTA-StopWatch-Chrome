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

		const predictDate = new Date(sortData[i].attributes.arrival_time);
		const currentTime = new Date();

		const milliseconds = predictDate - currentTime;

		// to make this more accurate set it to seconds and find the remainder then round
		const minUntilArrival = Math.floor(milliseconds / 60e3);

		arrivals.push(minUntilArrival);
	}

	return arrivals;
}
