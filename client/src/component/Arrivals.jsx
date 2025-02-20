import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import convertTime from "../helper/convertTime";
import Textbox from "./Textbox";

export default function Arrivals({ stopName, directionName, url, line }) {
	const [nextTrains, setNextTrains] = useState([]);

	// const [alerts, setAlerts] = useState([]);
	// will need to set up a check on alerts search by route
	// https://api-v3.mbta.com/alerts?filter[route]=Red

	Arrivals.propTypes = {
		stopName: PropTypes.string.isRequired,
		url: PropTypes.string.isRequired,
		line: PropTypes.string.isRequired,
		directionName: PropTypes.string.isRequired,
	};

	useEffect(() => {
		const urlKey = url;

		const eSource = new EventSource(urlKey, {
			Headers: {
				Accept: "text/event-stream",
			},
		});

		eSource.addEventListener("reset", (event) => {
			const data = JSON.parse(event.data);
			setNextTrains(data);
			// console.log("reset", nextTrains);
		});

		eSource.addEventListener("update", (event) => {
			const data = JSON.parse(event.data);

			setNextTrains((prev) => {
				const newTrain = [...prev];
				const index = newTrain.findIndex((x) => x.id === data.id);
				if (index !== -1) {
					newTrain[index] = data;
				}
				return newTrain;
			});
		});

		eSource.addEventListener("add", (event) => {
			const data = JSON.parse(event.data);
			// console.log("add ", data);
			setNextTrains((prev) => {
				return [...prev, data];
			});
		});

		eSource.addEventListener("remove", (event) => {
			const data = JSON.parse(event.data);
			// console.log("rewmove id ", data);

			setNextTrains((prev) => {
				const newTrain = [...prev];
				const index = newTrain.findIndex((x) => x.id === data.id);
				if (index > -1) {
					newTrain.splice(index, 1);
				}
				return newTrain;
			});
		});

		// return eSource.close();
	}, [url]);

	let lineColor = "";

	switch (line) {
		case "Blue":
			lineColor = "bg-[#003DA5]";
			break;
		case "Red":
			lineColor = "bg-[#DA291C]";
			break;
		case "Green":
			lineColor = "bg-[#00843D]";
			break;
		case "Orange":
			lineColor = "bg-[#ED8B00]";
			break;
		default:
			lineColor = "bg-yellow-500";
	}

	const convertedData = convertTime(nextTrains, 3);
	const processedData = Array.prototype.slice.call(convertedData);

	return (
		<div
			className={`bg-gray-800 p-8 mt-2 rounded-lg shadow-2xl border-4 border-gray-700 ${lineColor} relative overflow-hidden`}
		>
			<div
				className={`absolute inset-0 border-2 rounded-lg m-2 ${lineColor} pointer-events-none`}
			></div>
			<div
				className={`absolute inset-0 border-2 border-slate-50 ${lineColor} rounded-lg m-4 pointer-events-none`}
			></div>
			<div className="text-center relative z-10  min-w-md max-w-2xl min-h-60">
				<h1 className="text-4xl font-bold text-slate-50 font-serif">{stopName}</h1>
				<h3 className="text-xl font-semibold text-slate-50 font-serif mt-2">
					{" "}
					Toward {directionName}
				</h3>
				<div className={`my-6 h-1 bg-white w-full mx-auto mb-6`}></div>

				{/* <div className="flex justify-center space-x-4 mb-4">
					<div className={`w-2 h-2 bg-slate-50 rounded-full`}></div>
					<div className={`w-2 h-2 bg-slate-50 rounded-full`}></div>
					<div className={`w-2 h-2 bg-slate-50 rounded-full`}></div>
				</div> */}

				{processedData &&
					processedData.length > 0 &&
					processedData.map((data, index) => <Textbox key={index} data={data} />)}
			</div>
			{/* Corner decorations */}
			<div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-slate-50"></div>
			<div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-slate-50"></div>
			<div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-slate-50"></div>
			<div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-slate-50"></div>
		</div>
	);
}
