import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import Textbox from "./Textbox";
import { getArrivalLabel, getArrivalSeconds } from "../helper/arrivalDisplay";

const SHOW_TRACKER_DEBUG = true;

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

// Apply incoming prediction to existing list
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

// makes sure that the predictions list is always an array
function extractPredictionsFromStream(payload) {
	if (Array.isArray(payload?.data)) return payload.data;
	if (Array.isArray(payload)) return payload;
	if (payload?.type === "prediction") return [payload];
	return [];
}

// extracts the vehicle data
function extractVehiclesMap(payload) {
	const map = {};
	const stopNamesById = {};
	(payload?.included ?? [])
		.filter((item) => item.type === "stop")
		.forEach((item) => {
			stopNamesById[item.id] = item.attributes?.name ?? null;
		});
	(payload?.included ?? [])
		.filter((item) => item.type === "vehicle")
		.forEach((item) => {
			const relatedStopId = item.relationships?.stop?.data?.id ?? null;
			map[item.id] = {
				...item.attributes,
				_related_stop_id: relatedStopId,
				_related_stop_name: relatedStopId ? stopNamesById[relatedStopId] ?? null : null,
			};
		});
	return map;
}

// returns attributes for that ID
function getVehicleForPrediction(prediction, vehiclesById) {
	const vehicleId = prediction?.relationships?.vehicle?.data?.id;
	if (!vehicleId) return undefined;
	return vehiclesById[vehicleId];
}

// determines where the tracker icon should be placed based on status and location
function getPlacementFromVehicle(
	prediction,
	vehicle,
	precedingStops,
	directionStops,
	currentStopIndex,
) {
	const toFiniteNumber = (value) => {
		if (value === null || value === undefined || value === "") return null;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : null;
	};

	// should this be current?
	const furthestPrecedingKey = precedingStops[0]?.id || "current";
	const outOfRangeResult = {
		slotKey: furthestPrecedingKey,
		isOutOfRange: true,
		offsetRight: false,
		placementSource: "unknown",
		stopsAway: Number.POSITIVE_INFINITY,
	};
	const currentResult = {
		slotKey: "current",
		isOutOfRange: false,
		offsetRight: false,
		placementSource: "at_or_past_current",
		stopsAway: 0,
	};
	const status = vehicle?.current_status;
	const isInTransit = status === "IN_TRANSIT_TO";
	const isIncomingAt = status === "INCOMING_AT";
	const isStoppedAt = status === "STOPPED_AT";
	const normalizeName = (name) => String(name ?? "").trim().toLowerCase();
	const getStopIndexByName = (name) => {
		const normalized = normalizeName(name);
		if (!normalized) return -1;
		return directionStops.findIndex(
			(routeStop) => normalizeName(routeStop?.attributes?.name) === normalized,
		);
	};
	const resolvePlacementFromStopsAway = (
		stopsAway,
		offsetRight = false,
		placementSource = "sequence",
	) => {
		if (!Number.isFinite(stopsAway)) return outOfRangeResult;
		// we should not see a train that is no longer there
		if (stopsAway <= 0) return currentResult;
		if (stopsAway > precedingStops.length) {
			return { ...outOfRangeResult, placementSource, stopsAway };
		}

		// precedingStops are ordered furthest -> nearest to current
		const precedingIndex = precedingStops.length - stopsAway;
		const slotKey = precedingStops[precedingIndex]?.id || furthestPrecedingKey;
		return {
			slotKey,
			isOutOfRange: false,
			offsetRight: offsetRight && slotKey !== "current",
			placementSource,
			stopsAway,
		};
	};

	// Primary: relationship stop id is the most reliable anchor.
	const relatedStopId = vehicle?._related_stop_id;
	if (relatedStopId && currentStopIndex >= 0) {
		const relatedStopIndex = directionStops.findIndex((routeStop) => routeStop.id === relatedStopId);
		if (relatedStopIndex >= 0) {
			const stopsAwayFromCurrent = currentStopIndex - relatedStopIndex;
			const shouldOffsetRight = isInTransit && !isIncomingAt && !isStoppedAt;
			return resolvePlacementFromStopsAway(
				stopsAwayFromCurrent,
				shouldOffsetRight,
				"related_stop_id",
			);
		}
		const relatedStopNameIndex = getStopIndexByName(vehicle?._related_stop_name);
		if (relatedStopNameIndex >= 0) {
			const stopsAwayFromCurrent = currentStopIndex - relatedStopNameIndex;
			const shouldOffsetRight = isInTransit && !isIncomingAt && !isStoppedAt;
			return resolvePlacementFromStopsAway(
				stopsAwayFromCurrent,
				shouldOffsetRight,
				"related_stop_name",
			);
		}
	}

	// Secondary: current_stop_id as backup anchor when relationship stop is unavailable.
	const currentStopId = vehicle?.current_stop_id;
	if (currentStopId && currentStopIndex >= 0) {
		const vehicleStopIndex = directionStops.findIndex((routeStop) => routeStop.id === currentStopId);
		if (vehicleStopIndex >= 0) {
			const stopsAwayFromCurrent = currentStopIndex - vehicleStopIndex;
			const shouldOffsetRight = isInTransit && !isIncomingAt && !isStoppedAt;
			return resolvePlacementFromStopsAway(
				stopsAwayFromCurrent,
				shouldOffsetRight,
				"current_stop_id",
			);
		}
	}

	// Fallback: use stop-sequence math when current_stop_id is unavailable.
	const predictionStopSequence = toFiniteNumber(prediction?.attributes?.stop_sequence);
	const vehicleStopSequence = toFiniteNumber(vehicle?.current_stop_sequence);
	if (predictionStopSequence !== null && vehicleStopSequence !== null) {
		const stopsAway = predictionStopSequence - vehicleStopSequence;
		return resolvePlacementFromStopsAway(stopsAway, isInTransit, "stop_sequence");
	}

	// Final fallback: unknown position -> out-of-range grouping.
	return outOfRangeResult;
}

function TrackerIcon({ tracker }) {
	const sizeClass = tracker.isDueCollapsed ? "scale-110" : "scale-100";
	const shiftClass = tracker.offsetRight ? "translate-x-16" : "";

	return (
		<div className={`relative flex flex-col items-center ${sizeClass} ${shiftClass} pb-2`}>
			<p
				className={`text-2xl leading-none mb-2 whitespace-nowrap ${tracker.isDueCollapsed ? "font-bold" : "font-normal"}`}
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
		debug: PropTypes.string,
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
	const [directionStops, setDirectionStops] = useState([
		{ id: stop, attributes: { name: stopName } },
	]);
	const [directionNames, setDirectionNames] = useState([directionName]);

	useEffect(() => {
		setPredictions([]);
		setVehiclesById({});
	}, [direction, line, stop]);

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
			"fields[vehicle]": "current_status,current_stop_sequence,current_stop_id",
			"page[limit]": "5",
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
					[payload.id]: {
						...(prev[payload.id] ?? {}),
						...payload.attributes,
						_related_stop_id: payload.relationships?.stop?.data?.id ?? null,
					},
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

		const controller = new AbortController();
		let cancelled = false;

		const fetchVehicles = async () => {
			try {
				const query = new URLSearchParams({
					"filter[id]": vehicleIds.join(","),
					"fields[vehicle]": "current_status,current_stop_id,current_stop_sequence",
					include: "stop",
					"fields[stop]": "name",
					"page[limit]": String(vehicleIds.length),
				});
				const response = await fetch(`https://api-v3.mbta.com/vehicles?${query.toString()}`, {
					signal: controller.signal,
				});
				if (!response.ok || cancelled) return;
				const payload = await response.json();
				if (cancelled) return;

				const stopNamesById = {};
				(payload?.included ?? [])
					.filter((item) => item.type === "stop")
					.forEach((item) => {
						stopNamesById[item.id] = item.attributes?.name ?? null;
					});

				const nextMap = {};
				(payload?.data ?? []).forEach((vehicle) => {
					const relatedStopId = vehicle.relationships?.stop?.data?.id ?? null;
					nextMap[vehicle.id] = {
						...vehicle.attributes,
						_related_stop_id: relatedStopId,
						_related_stop_name: relatedStopId ? stopNamesById[relatedStopId] ?? null : null,
					};
				});
				setVehiclesById((prev) => ({ ...prev, ...nextMap }));
			} catch (error) {
				if (error.name !== "AbortError" && !cancelled) {
					console.error("Failed to backfill vehicles", error);
				}
			}
		};

		fetchVehicles();
		const intervalId = setInterval(fetchVehicles, 10000);

		return () => {
			cancelled = true;
			clearInterval(intervalId);
			controller.abort();
		};
	}, [predictions]);

	const sortedPredictions = useMemo(() => {
		return [...predictions].sort((a, b) => getArrivalSeconds(a) - getArrivalSeconds(b));
	}, [predictions]);

	const nextThreeTrains = sortedPredictions.slice(0, 3);
	const incomingFivePredictions = sortedPredictions.slice(0, 5);

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

	const incomingFiveDebug = useMemo(() => {
		return incomingFivePredictions.map((prediction, index) => {
			const vehicleId = prediction?.relationships?.vehicle?.data?.id || "no-vehicle";
			const vehicle = vehicleId !== "no-vehicle" ? vehiclesById[vehicleId] : undefined;
			const predictionSequence = Number(prediction?.attributes?.stop_sequence);
			const vehicleSequence = Number(vehicle?.current_stop_sequence);
			const placement = getPlacementFromVehicle(
				prediction,
				vehicle,
				precedingStops,
				directionStops,
				currentStopIndex,
			);
			const stopsAway =
				Number.isFinite(predictionSequence) && Number.isFinite(vehicleSequence)
					? predictionSequence - vehicleSequence
					: null;
			return {
				index: index + 1,
				predictionId: prediction?.id ?? "n/a",
				label: getArrivalLabel(prediction),
				vehicleId,
				currentStatus: vehicle?.current_status ?? "n/a",
				relatedStopId: vehicle?._related_stop_id ?? "n/a",
				relatedStopName: vehicle?._related_stop_name ?? "n/a",
				currentStopId: vehicle?.current_stop_id ?? "n/a",
				currentStopSequence: Number.isFinite(vehicleSequence) ? vehicleSequence : "n/a",
				predictionStopSequence: Number.isFinite(predictionSequence)
					? predictionSequence
					: "n/a",
				stopsAway: stopsAway ?? "n/a",
				placementSource: placement.placementSource ?? "unknown",
			};
		});
	}, [incomingFivePredictions, vehiclesById, precedingStops, directionStops, currentStopIndex]);

	const trackersBySlot = useMemo(() => {
		const slots = {};
		staticStopSlots.forEach((slot) => {
			slots[slot.key] = [];
		});

		const dueTrains = [];
		const outOfRangePredictions = [];
		const furthestPrecedingKey = precedingStops[0]?.id || "current";
		const nearestPrecedingKey = precedingStops[precedingStops.length - 1]?.id;
		const trackedPredictions = nextThreeTrains;

		// in transit to OR stopped at
		trackedPredictions.forEach((prediction) => {
			const label = getArrivalLabel(prediction);
			const vehicle = getVehicleForPrediction(prediction, vehiclesById);
			const vehicleId = prediction?.relationships?.vehicle?.data?.id || "no-vehicle";
			const placement = getPlacementFromVehicle(
				prediction,
				vehicle,
				precedingStops,
				directionStops,
				currentStopIndex,
			);
			const isTransitAtCurrent =
				placement.slotKey === "current" && vehicle?.current_status === "IN_TRANSIT_TO";
			const isTransitFromNearestPreceding =
				placement.slotKey === nearestPrecedingKey && placement.offsetRight;
			const isOneStopAwayInTransit =
				placement.stopsAway === 1 && placement.offsetRight;

			if (
				label === "DUE" ||
				isTransitAtCurrent ||
				isTransitFromNearestPreceding ||
				isOneStopAwayInTransit
			) {
				dueTrains.push(prediction);
				return;
			}
			if (placement.isOutOfRange) {
				outOfRangePredictions.push(prediction);
				return;
			}

			slots[placement.slotKey].push({
				label,
				offsetRight: placement.offsetRight,
				isDueCollapsed: false,
				debug: `vid:${vehicleId}\nslot:${placement.slotKey}\nsource:${placement.placementSource || "unknown"}\nstatus:${vehicle?.current_status || "n/a"}\nrel:${vehicle?._related_stop_id || "n/a"}\noff:${placement.offsetRight ? "Y" : "N"}`,
			});
		});

		if (outOfRangePredictions.length > 0) {
			const lowestSeconds = outOfRangePredictions.reduce((minimum, prediction) => {
				const seconds = getArrivalSeconds(prediction);
				if (!Number.isFinite(seconds)) return minimum;
				return Math.min(minimum, seconds);
			}, Number.POSITIVE_INFINITY);

			slots[furthestPrecedingKey].push({
				label: Number.isFinite(lowestSeconds)
					? `>${Math.max(1, Math.floor(lowestSeconds / 60))} min`
					: "DELAYED, SEE ALERT",
				offsetRight: false,
				isDueCollapsed: false,
				debug: `group:out-of-range\ncount:${outOfRangePredictions.length}\nslot:${furthestPrecedingKey}`,
			});
		}

		if (dueTrains.length > 0) {
			slots.current = [
				{
					label: "DUE",
					offsetRight: false,
					isDueCollapsed: true,
					debug: `group:DUE\ncount:${dueTrains.length}\nslot:current`,
				},
			];
		}

		return slots;
	}, [
		currentStopIndex,
		directionStops,
		nextThreeTrains,
		precedingStops,
		staticStopSlots,
		vehiclesById,
	]);

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
	const getLastKnownStation = (train) => {
		const vehicleId = train?.relationships?.vehicle?.data?.id;
		if (!vehicleId) return "Last known station unavailable";
		const vehicle = vehiclesById[vehicleId];
		if (!vehicle) return "Last known station unavailable";
		if (vehicle._related_stop_name) return vehicle._related_stop_name;
		if (!vehicle._related_stop_id) return "Last known station unavailable";
		return (
			directionStops.find((routeStop) => routeStop.id === vehicle._related_stop_id)?.attributes
				?.name ?? "Last known station unavailable"
		);
	};

	return (
		<div className="w-full overflow-x-auto py-6">
			<div className="w-[1190px] h-[800px] max-w-none bg-[#d5d5d5] border-4 border-black mx-auto relative px-10">
				<div className="pt-8 px-2">
					<div className="relative h-[165px]">
						<div className="absolute left-0 right-0 top-[106px] border-t-4 border-black" />
						<div className="absolute right-0 top-[106px] -translate-y-1/2 w-12 flex flex-col items-center">
							<div className="w-12 h-12 rounded-full border-4 border-black bg-[#d5d5d5]" />
							<p className="absolute top-[58px] w-24 text-center text-[10px] leading-[12px]">
								{directionName || "Direction"}
							</p>
						</div>
						<div
							className="absolute left-0 top-[106px] -translate-y-1/2 flex items-center justify-between"
							style={{ width: "calc(50% - 170px)" }}
						>
							{leftSlots.map((slot) => (
								<div
									key={slot.key}
									className="relative w-12 flex flex-col items-center"
								>
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
									className="w-full text-center text-6xl leading-none bg-white border-2 border-black "
								>
									{directionStops.map((routeStop) => (
										<option value={routeStop.id} key={routeStop.id}>
											{routeStop.attributes.name}
										</option>
									))}
								</select>
							</div>
						</div>

					<div className="mt-4 flex items-center gap-2 text-2xl">
							<select value={line} onChange={(event) => onLineSwitchRequest(event.target.value)}>
								<option value="Red">Red line toward</option>
								<option value="Blue">Blue line toward</option>
								<option value="Orange">Orange line toward</option>
								<option value="Green">Green line toward</option>
							</select>
							<div className="flex items-center text-2xl px-3 py-1">
								<select
									value={String(direction)}
									onChange={handleDirectionSelect}
									className="text-2xl bg-transparent"
								>
									{directionNames.map((name, index) => (
										<option value={index} key={name}>
											{name}
										</option>
									))}
								</select>
							</div>
						</div>
					</div>
					{SHOW_TRACKER_DEBUG && (
						<div className="mt-4 w-[1120px] mx-auto border border-black bg-white p-3">
							<p className="text-sm font-semibold mb-2">Incoming 5 Predictions Debug</p>
							<div className="space-y-1">
									{incomingFiveDebug.map((item) => (
										<p key={item.predictionId} className="text-[11px] leading-[14px] font-mono">
											{`#${item.index} pred:${item.predictionId} label:${item.label} vid:${item.vehicleId} status:${item.currentStatus} relStop:${item.relatedStopId} relName:${item.relatedStopName} stop:${item.currentStopId} src:${item.placementSource} vSeq:${item.currentStopSequence} pSeq:${item.predictionStopSequence} away:${item.stopsAway}`}
										</p>
									))}
								{incomingFiveDebug.length === 0 && (
									<p className="text-[11px] leading-[14px] font-mono">
										No prediction debug data available.
									</p>
								)}
							</div>
						</div>
					)}

					<div className="w-[900px] border-t-4 border-black mx-auto mt-8" />

						<div className="w-[1120px] mx-auto mt-7 space-y-4">
							{nextThreeTrains.map((train, index) => (
								<Textbox
									key={train.id}
									train={train}
									index={index}
									lastKnownStopName={getLastKnownStation(train)}
								/>
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
