import { useState, useEffect } from "react";

// eslint-disable-next-line react/prop-types
export default function StopSearch({ handleStopData }) {
	const [selectedLine, setSelectedLine] = useState(null);
	const [selectedDirection, setSelectedDirection] = useState(null);
	const [selectedStop, setSelectedStop] = useState(null);
	const [selectedStopName, setSelectedStopName] = useState("");
	// choices
	const [stops, setStops] = useState(null);
	const [directions, setDirections] = useState(null);
	const [directionName, setDirectionName] = useState("");
	// views
	const [showDirection, setShowDirection] = useState(false);
	const [showStop, setShowStop] = useState(false);
	const [showSubmit, setShowSubmit] = useState(false);
	const [loading, setLoading] = useState(false);
	// const [error, setError] = useState(null);

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
		};

		fetchDirection();
	}, [selectedLine, selectedStop]);

	function handleSubmitLine(event) {
		event.preventDefault();
		setLoading(true);
		setSelectedStopName("");
		setSelectedStop(null);
		setSelectedDirection("");
		setDirectionName("");
		setDirections(null);
		setStops(null);

		setShowStop(false);
		setShowDirection(false);
		setSelectedLine(event.target.value);
		setShowStop(true);
		setLoading(false);
	}

	function handleSubmitStop(event) {
		event.preventDefault();
		event.target.value.split(",");
		const [stopId, stopName] = event.target.value.split(",");
		setLoading(true);
		setSelectedStop(stopId.replace(/\s/g, ""));
		setSelectedStopName(stopName.replace(/\s/g, " "));
		setShowDirection(true);
		setLoading(false);
	}

	function handleSubmitDir(event) {
		const [direction, index] = event.target.value.split(",");
		event.preventDefault();
		setLoading(true);
		setShowSubmit(true);
		setDirectionName(direction);
		setSelectedDirection(index);
		setLoading(false);
	}

	function subNewStop() {
		console.log(selectedDirection);
		setLoading(true);
		handleStopData(
			selectedStop,
			selectedDirection,
			directionName,
			selectedStopName,
			selectedLine
		);
		setShowSubmit(false);
		setLoading(false);
	}

	return (
		<>
			<h1 className="text-white"> Find A New Stop</h1>
			{loading && <p>Loading...</p>}
			{!loading && (
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
						<option disabled value="Green">
							Green coming soon!
						</option>
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
								<option
									value={[`${stop.id} , ${stop.attributes.name}`]}
									key={stop.id}
								>
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
							directions.data.attributes.direction_destinations.map(
								(direction, index) => (
									<option value={[direction, index]} key={index}>
										{" "}
										{direction}{" "}
									</option>
								)
							)}
					</select>
				</form>
			)}
			{showSubmit && (
				<p
					className="p-2 bg-white hover:bg-slate-400 border-2 cursor-default border-slate-500 mt-5 rounded-xl"
					onClick={subNewStop}
				>
					Submit
				</p>
			)}
		</>
	);
}
