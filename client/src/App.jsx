import { useState } from "react";

import Arrivals from "./component/Arrivals";
import StopSearch from "./component/StopSearch";
// eslint-disable-next-line no-unused-vars
import { CookiesProvider, useCookies } from "react-cookie";

function App() {
	const [cookies, setCookies] = useCookies(["stop", "stopName"]);
	const [viewSelector, setViewSelector] = useState(false);

	// https://api-v3.mbta.com/predictions?filter[stop]=place-aqucl&filter%5Bdirection_id%5D=1

	// const data = async () => {
	// 	const res = await fetch("https://api-v3.mbta.com/data/{index}/attributes/arrival_time");
	// 	console.log(res);
	// https://api-v3.mbta.com/predictions?stop=70278&api_key=a10b9724298d437792e206da4f0ec606
	// };
	// data();

	const handleStopData = (stop, direction, stopName) => {
		const url = `https://api-v3.mbta.com/predictions?stop=${stop}&direction_id=${direction}&api_key=a10b9724298d437792e206da4f0ec606`;

		setCookies("stop", url, { path: "/" });
		setCookies("stopName", stopName, { path: "/" });
		setViewSelector(false);
	};

	return (
		<CookiesProvider>
			<div className="flex flex-col items-center justify-center min-h-screen text-2xl bg-slate-700">
				{!viewSelector && <h1 onClick={() => setViewSelector(true)}>Add a New Station</h1>}
				{viewSelector && <StopSearch handleStopData={handleStopData} />}
				{cookies.stop && <Arrivals url={cookies.stop} stopName={cookies.stopName} />}
			</div>
		</CookiesProvider>
	);
}

export default App;
