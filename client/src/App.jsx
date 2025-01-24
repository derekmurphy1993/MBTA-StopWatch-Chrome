import { useState } from "react";
import Arrivals from "./component/Arrivals";
import StopSearch from "./component/StopSearch";
import { CookiesProvider, useCookies } from "react-cookie";

function App() {
	const [cookies, setCookie] = useCookies(["stop"]);
	const [viewSelector, setViewSelector] = useState(false);

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
				{cookies.stop ? <Arrivals stop={cookies.stop} /> : "NoStopsFound"}
				{!viewSelector && <h1 onClick={() => setViewSelector(true)}>Add a New Station</h1>}
				{viewSelector && <StopSearch onSelect={handleSelect} />}
			</div>
		</CookiesProvider>
	);
}

export default App;

// curl -sN -H "accept: text/event-stream" -H "x-api-key: a10b9724298d437792e206da4f0ec606"
// "https://api-v3.mbta.com/predictions/?filter\\[route\\]=CR-Worcester&filter\\[stop\\]=place-sstat&stop_sequence=1"

// "https://api-v3.mbta.com/predictions?filter%5Bstop%5D=70020"
