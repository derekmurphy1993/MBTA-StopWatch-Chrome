import { useEffect, useState } from "react";

export default function Arrivals({ stopName, url }) {
	console.log("In Arrive ", stopName, url);
	const [nextTrains, setNextTrains] = useState([]);

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
			console.log("add ", data);
			setNextTrains((prev) => {
				return [...prev, data];
			});
		});

		eSource.addEventListener("remove", (event) => {
			const data = JSON.parse(event.data);
			console.log("rewmove id ", data);

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

	const getTimes = (trains, number) => {
		console.log(trains);
		// without this check it will break while loading / no trains
		if (trains.length === 0) return "No trains available";

		const arrivals = [];

		for (let i = 0; i < number; i++) {
			if (!trains[i].attributes.arrival_time) {
				return "No Data";
			}
			const predictDate = new Date(trains[i].attributes.arrival_time);
			const currentTime = new Date();

			const milliseconds = predictDate - currentTime;

			// console.log(predictDate);
			// to make this more accurate set it to seconds and find the remainder then round
			const minUntilArrival = Math.floor(milliseconds / 60e3);

			let message = "";
			if (minUntilArrival < 1) {
				message = "Arriving Soon";
			} else if (minUntilArrival === 1) {
				message = "1 min";
			} else {
				message = `${minUntilArrival} mins`;
			}

			arrivals.push(message);
		}

		return arrivals;
	};

	const processedData = getTimes(nextTrains, 2);

	return (
		<div className="text-4xl border-4 border-slate-500 bg-slate-600 rounded-lg min-w-lg max-w-xl min-h-60">
			<h1 className="text-center">Arrivals for {stopName}</h1>
			<div className="flex flex-col items-center justify-center text-slate-200">
				<div className="flex flex-row border-4 align-middle border-red-500 bg-red-800 my-1 h-20 w-full rounded-lg px-3 py-4">
					<p className="text-left w-1/2">Arriving in </p>
					<p className="text-right w-1/2"> {processedData && processedData[0]}</p>
				</div>
				<div className="flex flex-row border-4 align-middle border-red-500 bg-red-800 my-1 h-20 w-full rounded-lg px-3 py-4">
					<p className="text-left w-1/2">Arriving in </p>
					<p className="text-right w-1/2"> {processedData && processedData[1]}</p>
				</div>
			</div>
		</div>
	);
}
