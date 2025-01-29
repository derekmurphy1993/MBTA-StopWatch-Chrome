import { useState } from "react";
import MBTA from "mbta-client";
import Arrivals from "./component/Arrivals";
import Test from "./component/Test";
import StopSearch from "./component/StopSearch";
import { CookiesProvider, useCookies } from "react-cookie";

function App() {
	const [cookies, setCookie] = useCookies("stop");
	const [viewSelector, setViewSelector] = useState(false);
	const [times, setTimes] = useState([]);

	const mbta = new MBTA("a10b9724298d437792e206da4f0ec606");

	const getPredictions = async () => {
		const predictions = await mbta.fetchPredictions({ stop: 42 });
		const predictionTime1 = await getTimes(predictions, 0);
		const predictionTime2 = await getTimes(predictions, 1);

		console.log(predictionTime1, predictionTime2);
		console.log(times);
		return;
	};
	const getTimes = async (predictions, index) => {
		const predictDate = new Date(predictions.data[index].attributes.arrival_time);
		const currentTime = new Date();

		const milliseconds = predictDate - currentTime;

		// console.log(predictDate);
		// to make this more accurate set it to seconds and find the remainder then round
		let minUntilArrival = Math.floor(milliseconds / 60e3);
		// const secUntilArrival = Math.floor(milliseconds / 1e3);
		// console.log(minUntilArrival);
		setTimes((prevTime) => [...prevTime, minUntilArrival]);
		return minUntilArrival;
	};

	function handleSelect(stop) {
		setCookie("stop", stop, { path: "/" });
	}

	// const data = async () => {
	// 	const res = await fetch("https://api-v3.mbta.com/data/{index}/attributes/arrival_time");
	// 	console.log(res);
	// };
	// data();
	return (
		<CookiesProvider>
			<div className="flex flex-col items-center justify-center min-h-screen text-2xl bg-slate-700">
				<div className="font-2xl" onClick={() => getPredictions()}>
					TESTING
				</div>
				<Test />
				{/* {times ? <Arrivals times={times} /> : "NoStopsFound"}
				{!viewSelector && <h1 onClick={() => setViewSelector(true)}>Add a New Station</h1>}
				{viewSelector && <StopSearch onSelect={handleSelect} />} */}
			</div>
		</CookiesProvider>
	);
}

export default App;

// curl -sN -H "accept: text/event-stream" -H "x-api-key: a10b9724298d437792e206da4f0ec606"
// "https://api-v3.mbta.com/predictions/?filter\\[route\\]=CR-Worcester&filter\\[stop\\]=place-sstat&stop_sequence=1"

// "https://api-v3.mbta.com/predictions?filter%5Bstop%5D=70020"
