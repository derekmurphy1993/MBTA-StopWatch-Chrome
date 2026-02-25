import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import Textbox from "./Textbox";
import { getArrivalLabel, getArrivalSeconds } from "../helper/arrivalDisplay";

function getLineColor(line) {
	switch (line) {
		case "Blue":
			return "bg-[#003DA5]";
		case "Red":
			return "bg-[#DA291C]";
		case "Green":
			return "bg-[#00843D]";
		case "Orange":
			return "bg-[#ED8B00]";
		default:
			return "bg-[#4f6f71]";
	}
}

function getClockString() {
	const now = new Date();
	const options = {
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	};
	return now.toLocaleTimeString("en-US", options);
}

function applyPredictionUpdate(prevPredictions, payload) {
	const next = [...prevPredictions];
	const index = next.findIndex((item) => item.id === payload.id);
	if (index === -1) {
		next.push(payload);
		return next;
	}
	next[index] = payload;
	return next;
}

function extractPredictionsFromStream(payload) {
	if (Array.isArray(payload?.data)) return payload.data;
	if (Array.isArray(payload)) return payload;
	if (payload?.type === "prediction") return [payload];
	return [];
}

function extractVehiclesMap(payload) {
	const map = {};
	(payload?.included ?? [])
		.filter((item) => item.type === "vehicle")
		.forEach((item) => {
			map[item.id] = item.attributes;
		});
	return map;
}

function getSlotKeyFromStopSequence(prediction, vehicle, precedingStops) {
	const furthestPrecedingKey = precedingStops[0]?.id || "current";
	const predictionStopSequence = Number(prediction?.attributes?.stop_sequence);
	const vehicleStopSequence = Number(vehicle?.current_stop_sequence);

	if (
		!Number.isFinite(predictionStopSequence) ||
		!Number.isFinite(vehicleStopSequence)
	) {
		return furthestPrecedingKey;
	}

	const stopsAway = predictionStopSequence - vehicleStopSequence;
	if (stopsAway <= 0) return "current";
	if (stopsAway > precedingStops.length) return furthestPrecedingKey;

	// precedingStops are ordered furthest -> nearest to current
	const precedingIndex = precedingStops.length - stopsAway;
	return precedingStops[precedingIndex]?.id || furthestPrecedingKey;
}

function TrackerIcon({ tracker }) {
	const sizeClass = tracker.isDueCollapsed ? "scale-110" : "scale-100";
	const shiftClass = tracker.offsetRight ? "translate-x-7" : "";

	return (
		<div className={`relative flex flex-col items-center ${sizeClass} ${shiftClass} pb-2`}>
			<p
				className={`text-2xl leading-none mb-2 ${tracker.isDueCollapsed ? "font-bold" : "font-normal"}`}
			>
				{tracker.label}
			</p>
			<div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[24px] border-t-red-700" />
		</div>
	);
}

TrackerIcon.propTypes = {
	tracker: PropTypes.shape({
		label: PropTypes.string.isRequired,
		offsetRight: PropTypes.bool,
		isDueCollapsed: PropTypes.bool,
	}).isRequired,
};

export default function Arrivals({
	stop,
	stopName,
	direction,
	directionName,
	line,
	onSelectionChange,
	onLineSwitchRequest,
}) {
	const [clock, setClock] = useState(getClockString());
	const [predictions, setPredictions] = useState([]);
	const [vehiclesById, setVehiclesById] = useState({});
	const [directionStops, setDirectionStops] = useState([]);
	const [directionNames, setDirectionNames] = useState([]);

	useEffect(() => {
		const id = setInterval(() => setClock(getClockString()), 1000);
		return () => clearInterval(id);
	}, []);

	useEffect(() => {
		if (!line) return;
		const controller = new AbortController();

		const fetchDirections = async () => {
			try {
				const query = new URLSearchParams({
					"fields[route]": "direction_destinations",
				});
				const response = await fetch(
					`https://api-v3.mbta.com/routes/${line}?${query.toString()}`,
					{ signal: controller.signal },
				);
				if (!response.ok) return;
				const data = await response.json();
				setDirectionNames(data?.data?.attributes?.direction_destinations ?? []);
			} catch (error) {
				if (error.name !== "AbortError") {
					console.error("Failed to fetch directions", error);
				}
			}
		};

		fetchDirections();

		return () => controller.abort();
	}, [line]);

	useEffect(() => {
		if (!line || direction === undefined || direction === null || direction === "") return;
		const controller = new AbortController();

		const fetchStops = async () => {
			try {
				const query = new URLSearchParams({
					"filter[route]": line,
					"filter[direction_id]": String(direction),
					"fields[stop]": "name",
					"page[limit]": "50",
				});
				const response = await fetch(`https://api-v3.mbta.com/stops?${query.toString()}`, {
					signal: controller.signal,
				});
				if (!response.ok) return;
				const data = await response.json();
				setDirectionStops(data?.data ?? []);
			} catch (error) {
				if (error.name !== "AbortError") {
					console.error("Failed to fetch stops", error);
				}
			}
		};

		fetchStops();

		return () => controller.abort();
	}, [line, direction]);

	useEffect(() => {
		if (!stop || !line || direction === undefined || direction === null || direction === "")
			return;

		const query = new URLSearchParams({
			"filter[stop]": stop,
			"filter[direction_id]": String(direction),
			"filter[route]": line,
			include: "vehicle",
			sort: "arrival_time",
			"fields[prediction]": "arrival_time,departure_time,status,stop_sequence",
			"fields[vehicle]": "current_status,current_stop_sequence",
			"page[limit]": "20",
			api_key: "a10b9724298d437792e206da4f0ec606",
		});

		const streamUrl = `https://api-v3.mbta.com/predictions?${query.toString()}`;
		const eventSource = new EventSource(streamUrl);

		const onReset = (event) => {
			const payload = JSON.parse(event.data);
			setPredictions(extractPredictionsFromStream(payload));
			setVehiclesById((prev) => ({
				...prev,
				...extractVehiclesMap(payload),
			}));
		};

		const onAddOrUpdate = (event) => {
			const payload = JSON.parse(event.data);

			if (payload?.type === "vehicle") {
				setVehiclesById((prev) => ({
					...prev,
					[payload.id]: payload.attributes,
				}));
				return;
			}

			if (payload?.type !== "prediction") return;
			setPredictions((prev) => applyPredictionUpdate(prev, payload));
		};

		const onRemove = (event) => {
			const payload = JSON.parse(event.data);

			if (payload?.type === "vehicle") {
				setVehiclesById((prev) => {
					const next = { ...prev };
					delete next[payload.id];
					return next;
				});
				return;
			}

			if (payload?.type !== "prediction") return;
			setPredictions((prev) => prev.filter((item) => item.id !== payload.id));
		};

		eventSource.addEventListener("reset", onReset);
		eventSource.addEventListener("add", onAddOrUpdate);
		eventSource.addEventListener("update", onAddOrUpdate);
		eventSource.addEventListener("remove", onRemove);

		return () => {
			eventSource.removeEventListener("reset", onReset);
			eventSource.removeEventListener("add", onAddOrUpdate);
			eventSource.removeEventListener("update", onAddOrUpdate);
			eventSource.removeEventListener("remove", onRemove);
			eventSource.close();
		};
	}, [stop, direction, line]);

	useEffect(() => {
		const vehicleIds = Array.from(
			new Set(
				predictions
					.map((prediction) => prediction?.relationships?.vehicle?.data?.id)
					.filter(Boolean),
			),
		);
		if (vehicleIds.length === 0) return;

		let cancelled = false;

		const refreshVehicles = async () => {
			const controller = new AbortController();
			try {
				const query = new URLSearchParams({
					"filter[id]": vehicleIds.join(","),
					"fields[vehicle]": "current_status,current_stop_sequence",
				});
				const response = await fetch(
					`https://api-v3.mbta.com/vehicles?${query.toString()}`,
					{
						signal: controller.signal,
					},
				);
				if (!response.ok || cancelled) return;
				const data = await response.json();
				if (cancelled) return;

				const nextMap = {};
				(data?.data ?? []).forEach((vehicle) => {
					nextMap[vehicle.id] = vehicle.attributes;
				});
				setVehiclesById((prev) => ({ ...prev, ...nextMap }));
			} catch (error) {
				if (error.name !== "AbortError" && !cancelled) {
					console.error("Failed to refresh vehicles", error);
				}
			}

			return () => controller.abort();
		};

		refreshVehicles();
		const intervalId = setInterval(refreshVehicles, 10000);

		return () => {
			cancelled = true;
			clearInterval(intervalId);
		};
	}, [predictions]);

	const sortedPredictions = useMemo(() => {
		return [...predictions].sort((a, b) => getArrivalSeconds(a) - getArrivalSeconds(b));
	}, [predictions]);

	const nextThreeTrains = sortedPredictions.slice(0, 3);

	const currentStopIndex = useMemo(() => {
		return directionStops.findIndex((routeStop) => routeStop.id === stop);
	}, [directionStops, stop]);

	const precedingStops = useMemo(() => {
		if (currentStopIndex < 0) return [];
		return directionStops.slice(Math.max(0, currentStopIndex - 3), currentStopIndex);
	}, [directionStops, currentStopIndex]);

	const staticStopSlots = useMemo(() => {
		const slots = [];
		precedingStops.forEach((routeStop) =>
			slots.push({ key: routeStop.id, name: routeStop.attributes.name }),
		);
		slots.push({ key: "current", name: stopName });
		return slots;
	}, [precedingStops, stopName]);

	const trackersBySlot = useMemo(() => {
		const slots = {};
		staticStopSlots.forEach((slot) => {
			slots[slot.key] = [];
		});

		const dueTrains = [];

		sortedPredictions.forEach((prediction) => {
			const label = getArrivalLabel(prediction);
			if (label === "DUE") {
				dueTrains.push(prediction);
				return;
			}

			const vehicleId = prediction?.relationships?.vehicle?.data?.id;
			const vehicle = vehicleId ? vehiclesById[vehicleId] : undefined;
			const slotKey = getSlotKeyFromStopSequence(prediction, vehicle, precedingStops);

			slots[slotKey].push({
				label,
				offsetRight: vehicle?.current_status === "IN_TRANSIT_TO",
				isDueCollapsed: false,
			});
		});

		if (dueTrains.length > 0) {
			slots.current = [
				{
					label: "DUE",
					offsetRight: false,
					isDueCollapsed: true,
				},
			];
		}

		return slots;
	}, [precedingStops, sortedPredictions, staticStopSlots, vehiclesById]);

	const handleStopSelect = (event) => {
		const nextStopId = event.target.value;
		const nextStop = directionStops.find((item) => item.id === nextStopId);
		if (!nextStop) return;
		onSelectionChange({
			stop: nextStop.id,
			stopName: nextStop.attributes.name,
			direction,
			directionName,
			line,
		});
	};

	const handleDirectionSelect = (event) => {
		const nextDirection = event.target.value;
		const nextDirectionName = directionNames[Number(nextDirection)] || directionName;
		onSelectionChange({
			stop,
			stopName,
			direction: nextDirection,
			directionName: nextDirectionName,
			line,
		});
	};

	const lineColor = getLineColor(line);
	const leftSlots = staticStopSlots.filter((slot) => slot.key !== "current");

	return (
		<div className="w-full overflow-x-auto py-6">
			<div className="w-[1190px] h-[800px] max-w-none bg-[#d5d5d5] border-4 border-black mx-auto relative px-10">
				<div className="pt-8 px-2">
					<div className="relative h-[165px]">
						<div
							className="absolute left-0 top-[106px] border-t-4 border-black"
							style={{ width: "calc(50% - 190px)" }}
						/>
							<div
								className="absolute right-0 top-[106px] border-t-4 border-black"
								style={{ left: "calc(50% + 190px)" }}
							/>
							<div className="absolute right-0 top-[106px] -translate-y-1/2 w-12 flex flex-col items-center">
								<div className="w-12 h-12 rounded-full border-4 border-black bg-[#d5d5d5]" />
								<p className="absolute top-[58px] w-24 text-center text-[10px] leading-[12px]">
									{directionName || "Direction"}
								</p>
							</div>
							<div
								className="absolute left-0 top-[106px] -translate-y-1/2 flex items-center justify-between"
								style={{ width: "calc(50% - 190px)" }}
							>
							{leftSlots.map((slot) => (
								<div key={slot.key} className="relative w-12 flex flex-col items-center">
									<div className="absolute left-1/2 -translate-x-1/2 -top-[80px]">
										{(trackersBySlot[slot.key] || [])
											.slice(0, 1)
											.map((tracker, index) => (
												<TrackerIcon
													key={`${slot.key}-${index}`}
													tracker={tracker}
												/>
											))}
									</div>
									<div className="w-12 h-12 rounded-full border-4 border-black bg-[#d5d5d5]" />
									<p className="absolute top-[58px] w-24 text-center text-[10px] leading-[12px]">
										{slot.name}
									</p>
								</div>
							))}
						</div>
						<div className="absolute left-1/2 -translate-x-1/2 top-10 flex flex-col items-center">
							<div className="h-7 w-14 rounded-t-full border-4 bg-white border-black border-b-0" />
							<div
								className={`w-[300px] h-[65px] ${lineColor} border-4 border-black flex items-center justify-center`}
							>
								<p className="text-4xl font-bold tracking-wide text-white [text-shadow:_-2px_-2px_0_#000,_2px_-2px_0_#000,_-2px_2px_0_#000,_2px_2px_0_#000]">
									{clock}
								</p>
							</div>
							<div className="absolute left-1/2 -translate-x-1/2 -top-[55px] animate-pulse">
								{(trackersBySlot.current || [])
									.slice(0, 1)
									.map((tracker, index) => (
										<TrackerIcon key={`current-${index}`} tracker={tracker} />
									))}
							</div>
						</div>
					</div>

					<div className="mt-2 flex flex-col items-center">
						<div className="flex items-center bg-[#f3ecee]/0 px-3 py-1">
							<div className="w-[540px]">
								<select
									value={stop}
									onChange={handleStopSelect}
									className="w-full text-center text-6xl leading-none bg-transparent"
								>
									{directionStops.map((routeStop) => (
										<option value={routeStop.id} key={routeStop.id}>
											{routeStop.attributes.name}
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="mt-4 flex items-center gap-2 text-5xl">
							<select
								value={line}
								onChange={(event) => onLineSwitchRequest(event.target.value)}
								className="text-2xl border-2 border-black bg-[#f3ecee] px-3 py-1"
							>
								<option value="Red">Red</option>
								<option value="Blue">Blue</option>
								<option value="Orange">Orange</option>
								<option value="Green">Green</option>
							</select>
							<p>toward</p>
							<div className="flex items-center bg-[#f3ecee] px-3 py-1 border-2 border-black">
								<select
									value={String(direction)}
									onChange={handleDirectionSelect}
									className="text-5xl bg-transparent"
								>
									{directionNames.map((name, index) => (
										<option value={index} key={name}>
											{name}
										</option>
									))}
								</select>
								<span className="ml-2 text-4xl leading-none">◀</span>
							</div>
						</div>
					</div>

					<div className="w-[900px] border-t-4 border-black mx-auto mt-8" />

					<div className="w-[1120px] mx-auto mt-7 space-y-4">
						{nextThreeTrains.map((train, index) => (
							<Textbox key={train.id} train={train} index={index} />
						))}
						{nextThreeTrains.length === 0 && (
							<div className="w-full h-[170px] border border-black bg-white flex items-center justify-center">
								<p className="text-5xl">No active predictions</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

Arrivals.propTypes = {
	stop: PropTypes.string.isRequired,
	stopName: PropTypes.string.isRequired,
	direction: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
	directionName: PropTypes.string.isRequired,
	line: PropTypes.string.isRequired,
	onSelectionChange: PropTypes.func.isRequired,
	onLineSwitchRequest: PropTypes.func.isRequired,
};
