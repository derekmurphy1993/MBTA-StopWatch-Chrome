import { useState } from "react";
// import MBTA from "mbta-client";

// import Arrivals from "./component/Arrivals";
// import Test from "./component/Test";
import StopSearch from "./component/StopSearch";
import { CookiesProvider, useCookies } from "react-cookie";

function App() {
	const [cookies, setCookie] = useCookies("stop");
	const [viewSelector, setViewSelector] = useState(false);

	// const mbta = new MBTA("a10b9724298d437792e206da4f0ec606");

	// const data = async () => {
	// 	const res = await fetch("https://api-v3.mbta.com/data/{index}/attributes/arrival_time");
	// 	console.log(res);
	// };
	// data();
	return (
		<CookiesProvider>
			<div className="flex flex-col items-center justify-center min-h-screen text-2xl bg-slate-700">
				{/* <Arrivals
					stopName={"Placeholder Ave"}
					url={
						"https://api-v3.mbta.com/predictions?stop=42&api_key=a10b9724298d437792e206da4f0ec606"
					}
				/> */}
				{!viewSelector && <h1 onClick={() => setViewSelector(true)}>Add a New Station</h1>}
				{viewSelector && <StopSearch />}
			</div>
		</CookiesProvider>
	);
}

export default App;
