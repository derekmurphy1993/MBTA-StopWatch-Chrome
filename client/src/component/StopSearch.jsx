import { useState, useEffect } from "react";

export default function StopSearch({ onSelect }) {
	const [selectedLine, setSelectedLine] = useState(null);
	const [selectedDirection, setSelectedDirection] = useState("");
	const [selectedStop, setSelectedStop] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const [directions, setDirections] = useState(null);
	const [stops, setStops] = useState(null);

	const [showLine, setShowLine] = useState(true);
	const [showDirection, setShowDirection] = useState(false);
	const [showStop, setShowStop] = useState(false);

	useEffect(() => {
		if (!selectedLine) return;
		const fetchData = async () => {
			const url = `https://api-v3.mbta.com/stops?filter[route]=` + selectedLine;
			const stops = await fetch(url);
			const data = await stops.json();
			setStops(data);
		};

		fetchData();

		if (!selectedStop) return;

		const fetchDirection = async () => {
			const url = `https://api-v3.mbta.com/routes/` + selectedLine;
			const directions = await fetch(url);
			const data = await directions.json();
			setDirections(data);
			console.log("directions ", directions);
		};

		fetchDirection();
	}, [selectedLine, selectedStop]);

	function handleSubmitLine(event) {
		event.preventDefault();
		setLoading(true);
		setShowLine(false);
		setSelectedLine(event.target.value);
		setShowStop(true);
		setLoading(false);
	}

	function handleSubmitStop(event) {
		event.preventDefault();
		setLoading(true);
		setShowStop(false);
		setSelectedStop(event.target.value);
		setShowDirection(true);
		setLoading(false);
	}

	function handleSubmitDir(event) {
		event.preventDefault();
		setLoading(true);
		setShowDirection(false);
		setSelectedDirection(event.target.value);
		setLoading(false);
	}

	return (
		<>
			<h1>Create a new watch</h1>
			{loading && <p>Loading...</p>}
			{!loading && showLine && (
				<form
					onChange={handleSubmitLine}
					className="flex flex-col items-center justify-center"
				>
					<select className="border-2 mt-4 border-slate-500 bg-slate-200 rounded-lg h-12 w-64 p-2">
						<option selected disabled className="text-slate-200">
							Select A Line
						</option>
						<option value="Red">Red</option>
						<option value="Blue">Blue</option>
						<option value="Orange">Orange</option>
						<option value="Green">Green</option>
					</select>
				</form>
			)}
			{!loading && showStop && (
				<form
					onChange={handleSubmitStop}
					className="flex flex-col items-center justify-center"
				>
					<select className="border-2 mt-4 border-slate-500 bg-slate-200 rounded-lg h-12 w-64 p-2">
						<option
							selected
							defaultValue={"Select A Line"}
							disabled
							className="text-slate-200"
						>
							Select A Stop
						</option>
						{stops &&
							stops.data.map((stop) => (
								<option value={stop.id} key={stop.id}>
									{" "}
									{stop.attributes.name}{" "}
								</option>
							))}
					</select>
				</form>
			)}
			{!loading && showDirection && (
				<form
					onChange={handleSubmitDir}
					className="flex flex-col items-center justify-center"
				>
					<select className="border-2 mt-4 border-slate-500 bg-slate-200 rounded-lg h-12 w-64 p-2">
						<option
							selected
							defaultValue={"Select a direction"}
							disabled
							className="text-slate-200"
						>
							Select A Direction
						</option>
						{directions &&
							directions.data.attributes.direction_destinations.map((direction) => (
								<option value={direction} key={direction}>
									{" "}
									{direction}{" "}
								</option>
							))}
					</select>
				</form>
			)}
		</>
	);
}

// https://api-v3.mbta.com/stops?filter[direction_destinations]=alewife

// https://api-v3.mbta.com/stops?filter[route]=Red

// const url = `https://api-v3.mbta.com/routes/` + selectedLine;

//  Limited sparse fieldset for names
// https://api-v3.mbta.com/routes/?fields%5Broute%5D=short_name,long_name

// ("https://api-v3.mbta.com/predictions?stop=42&api_key=a10b9724298d437792e206da4f0ec606");
// http://realtime.mbta.com/developer/api/v2/stopsbyroute?api_key={API_KEY}&route=Red&format=json
