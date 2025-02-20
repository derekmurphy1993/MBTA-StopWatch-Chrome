import { useState } from "react";

import Arrivals from "./component/Arrivals";
import StopSearch from "./component/StopSearch";
import Clock from "./component/Clock";
import { CookiesProvider, useCookies } from "react-cookie";

function App() {
	const [cookies, setCookies] = useCookies([
		"stop",
		"stopName",
		"directionName",
		"line",
		"consent",
	]);
	const [viewSelector, setViewSelector] = useState(false);

	// https://api-v3.mbta.com/predictions?filter[stop]=place-aqucl&filter%5Bdirection_id%5D=1

	// const data = async () => {
	// 	const res = await fetch("https://api-v3.mbta.com/data/{index}/attributes/arrival_time");
	// 	console.log(res);
	// https://api-v3.mbta.com/predictions?stop=70278&api_key=a10b9724298d437792e206da4f0ec606
	// };
	// data();

	const handleStopData = (stop, direction, directionName, stopName, line) => {
		const url = `https://api-v3.mbta.com/predictions?stop=${stop}&direction_id=${direction}&route=${line}&api_key=a10b9724298d437792e206da4f0ec606`;
		const today = new Date();
		const expireDate = new Date(today.setDate(today.getDate() + 30));
		setCookies("stop", url, { path: "/", expires: expireDate });
		setCookies("stopName", stopName, { path: "/", expires: expireDate });
		setCookies("directionName", directionName, { path: "/", expires: expireDate });
		setCookies("line", line, { path: "/", expires: expireDate });

		setViewSelector(false);
	};

	const handleConsent = () => {
		const today = new Date();
		const expireDate = new Date(today.setDate(today.getDate() + 90));
		setCookies("consent", "yes", { path: "/", expires: expireDate });
	};

	return (
		<CookiesProvider>
			<div className="flex flex-col items-center justify-center min-h-screen text-2xl bg-slate-700">
				{!cookies.consent && (
					<div className=" w-full bg-slate-300 opacity-80 text-xs fixed top-0 flex flex-row items-center">
						<p className="mx-auto p-1">
							We only collect cookies to store essential data.
							<button
								className="ml-2 p-1 border-2 bg-white hover:bg-slate-600"
								onClick={handleConsent}
							>
								Dismiss
							</button>
						</p>
					</div>
				)}
				{!viewSelector && cookies.stop && <Clock />}
				{!viewSelector && cookies.stop && (
					<Arrivals
						url={cookies.stop}
						stopName={cookies.stopName}
						directionName={cookies.directionName}
						line={cookies.line}
					/>
				)}
				{!viewSelector && cookies.stop && (
					<h1
						className="bg-slate-400 hover:bg-slate-500 rounded-lg mt-5 p-2 text-slate-700"
						onClick={() => setViewSelector(true)}
					>
						Change Stop
					</h1>
				)}
				{!viewSelector && !cookies.stop && (
					<h1
						className="bg-slate-50 hover:bg-slate-500 rounded-lg mt-5 p-2 text-slate-700"
						onClick={() => setViewSelector(true)}
					>
						Select A Stop
					</h1>
				)}
				{!viewSelector && (
					<p className="font-light text-sm mt-10 px-10 max-w-3xl fixed bottom-10 text-center">
						{" "}
						The MBTA StopWatch allows you to select a stop of your choice and will show
						you real time predictions on when the next train is arriving. This is in
						early development and not all times and alerts are 100% accurate. <br />
						<span className="font-semibold">
							This application is developed by a third party, not MassDOT or the MBTA.{" "}
						</span>{" "}
					</p>
				)}
				{viewSelector && <StopSearch handleStopData={handleStopData} />}
			</div>
		</CookiesProvider>
	);
}

export default App;

// COOKIE CONSENT: Not required, cookies only for key functionality, but will make for example
