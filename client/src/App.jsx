import { useState } from "react";

import Arrivals from "./component/Arrivals";
import StopSearch from "./component/StopSearch";
import { CookiesProvider, useCookies } from "react-cookie";

function App() {
	// const [cookies, setCookie] = useCookies("stop");
	const [viewSelector, setViewSelector] = useState(false);
	const [stopUrl, setStopUrl] = useState("");
	const [stopName, setStopName] = useState("");

	// https://api-v3.mbta.com/predictions?filter[stop]=place-aqucl&filter%5Bdirection_id%5D=1

	// const data = async () => {
	// 	const res = await fetch("https://api-v3.mbta.com/data/{index}/attributes/arrival_time");
	// 	console.log(res);
	// https://api-v3.mbta.com/predictions?stop=70278&api_key=a10b9724298d437792e206da4f0ec606
	// };
	// data();

	const handleStopData = (stop, direction, stopName) => {
		const url = `https://api-v3.mbta.com/predictions?stop=${stop}&direction_id=${direction}&api_key=a10b9724298d437792e206da4f0ec606`;
		console.log("URL " + url);
		console.log("dir " + direction);
		console.log("stop " + stopName);

		setStopUrl(url);
		setStopName(stopName);
		setViewSelector(false);
	};

	return (
		<CookiesProvider>
			<div className="flex flex-col items-center justify-center min-h-screen text-2xl bg-slate-700">
				{!viewSelector && <h1 onClick={() => setViewSelector(true)}>Add a New Station</h1>}
				{viewSelector && <StopSearch handleStopData={handleStopData} />}
				{stopUrl && <Arrivals url={stopUrl} stopName={stopName} />}
			</div>
		</CookiesProvider>
	);
}

export default App;
