import { useEffect, useState } from "react";

import Arrivals from "./component/Arrivals";
import StopSearch from "./component/StopSearch";
import { CookiesProvider, useCookies } from "react-cookie";

function App() {
	const [cookies, setCookies, removeCookie] = useCookies([
		"stop",
		"stopName",
		"direction",
		"directionName",
		"line",
		"consent",
	]);
	const [viewSelector, setViewSelector] = useState(false);
	const [preselectedLine, setPreselectedLine] = useState("");

	const setSelectionCookies = (stop, direction, directionName, stopName, line) => {
		const today = new Date();
		const expireDate = new Date(today.setDate(today.getDate() + 30));
		setCookies("stop", stop, { path: "/", expires: expireDate });
		setCookies("stopName", stopName, { path: "/", expires: expireDate });
		setCookies("direction", direction, { path: "/", expires: expireDate });
		setCookies("directionName", directionName, { path: "/", expires: expireDate });
		setCookies("line", line, { path: "/", expires: expireDate });
	};

	const handleStopData = (stop, direction, directionName, stopName, line) => {
		setSelectionCookies(stop, direction, directionName, stopName, line);
		setPreselectedLine("");
		setViewSelector(false);
	};

	const handleInSessionSelectionChange = (selection) => {
		const { stop, direction, directionName, stopName, line } = selection;
		setSelectionCookies(stop, direction, directionName, stopName, line);
		setViewSelector(false);
	};

	const handleLineSwitchRequest = (nextLine) => {
		if (!nextLine || nextLine === cookies.line) return;

		const confirmed = window.confirm(
			"Switching lines clears your current stop and direction. Continue?",
		);
		if (!confirmed) return;

		const today = new Date();
		const expireDate = new Date(today.setDate(today.getDate() + 30));
		setCookies("line", nextLine, { path: "/", expires: expireDate });
		removeCookie("stop", { path: "/" });
		removeCookie("stopName", { path: "/" });
		removeCookie("direction", { path: "/" });
		removeCookie("directionName", { path: "/" });

		setPreselectedLine(nextLine);
		setViewSelector(true);
	};

	const handleConsent = () => {
		const today = new Date();
		const expireDate = new Date(today.setDate(today.getDate() + 90));
		setCookies("consent", "yes", { path: "/", expires: expireDate });
	};

	useEffect(() => {
		// Legacy migration: if an old session has a selected stop on plain "Green", force reselect branch.
		if (cookies.line !== "Green" || !cookies.stop) return;
		const today = new Date();
		const expireDate = new Date(today.setDate(today.getDate() + 30));
		setCookies("line", "Green", { path: "/", expires: expireDate });
		removeCookie("stop", { path: "/" });
		removeCookie("stopName", { path: "/" });
		removeCookie("direction", { path: "/" });
		removeCookie("directionName", { path: "/" });
		setPreselectedLine("Green");
		setViewSelector(true);
	}, [cookies.line, cookies.stop, removeCookie, setCookies]);

	return (
		<CookiesProvider>
			<div className="flex flex-col items-center justify-center min-h-screen text-2xl bg-slate-700 px-4">
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
				{!viewSelector && cookies.stop && (
					<Arrivals
						stop={cookies.stop}
						stopName={cookies.stopName}
						direction={cookies.direction}
						directionName={cookies.directionName}
						line={cookies.line}
						onSelectionChange={handleInSessionSelectionChange}
						onLineSwitchRequest={handleLineSwitchRequest}
					/>
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
					<p className="font-light text-xs mt-40 px-10 max-w-4xl fixed bottom-10 text-center">
						The MBTA StopWatch allows you to select a stop of your choice and will show
						you real time predictions on when the next train is arriving. This is in
						early development and not all times and alerts are 100% accurate. <br />
						<span className="font-semibold">
							This application is developed by a third party, not MassDOT or the MBTA.
						</span>
					</p>
				)}
				{viewSelector && (
					<StopSearch handleStopData={handleStopData} initialLine={preselectedLine} />
				)}
			</div>
		</CookiesProvider>
	);
}

export default App;
