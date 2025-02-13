import { useState, useEffect } from "react";

// eslint-disable-next-line react/prop-types
export default function StopSearch({ handleStopData }) {
	const [selectedLine, setSelectedLine] = useState(null);
	const [selectedDirection, setSelectedDirection] = useState(null);
	const [selectedStop, setSelectedStop] = useState("");
	const [selectedStopName, setSelectedStopName] = useState("");
	// choices
	const [stops, setStops] = useState(null);
	const [directions, setDirections] = useState(null);
	// views
	const [showLine, setShowLine] = useState(true);
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
		setShowLine(false);
		setSelectedLine(event.target.value);
		setShowStop(true);
		setLoading(false);
	}

	function handleSubmitStop(event) {
		event.preventDefault();
		event.target.value.split(",");
		const [stopId, stopName] = event.target.value.split(",");
		setLoading(true);
		setShowStop(false);
		setSelectedStop(stopId.replace(/\s/g, ""));
		setSelectedStopName(stopName.replace(/\s/g, " "));
		setShowDirection(true);
		setLoading(false);
	}

	function handleSubmitDir(event) {
		event.preventDefault();
		setLoading(true);
		setShowDirection(false);
		setShowSubmit(true);
		setSelectedDirection(event.target.value);
		setLoading(false);
	}

	function subNewStop() {
		setLoading(true);
		handleStopData(selectedStop, selectedDirection, selectedStopName);
		setShowSubmit(false);
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
									<option value={index} key={index}>
										{" "}
										{direction}{" "}
									</option>
								)
							)}
					</select>
				</form>
			)}
			{showSubmit && <p onClick={subNewStop}>Fin</p>}
		</>
	);
}
