export default function sortTime(trains) {
	// Get the current time
	const now = new Date();

	// Sort the timestamps
	const sortedTrains = trains.sort((a, b) => {
		const dateA = new Date(a.attributes.arrival_time);
		const dateB = new Date(b.attributes.arrival_time);

		// Calculate the absolute difference from the current time
		const diffA = Math.abs(now - dateA);
		const diffB = Math.abs(now - dateB);

		// Sort by the difference (closest to furthest)
		return diffA - diffB;
	});

	return sortedTrains;
}
