import { useEffect, useState } from "react";

// import URL from APP JSX
export default function Test() {
	const [message, setMessage] = useState();

	// "https://api-v3.mbta.com/predictions/?filter\\[route\\]=CR-Worcester&filter\\[stop\\]=place-sstat&stop_sequence=1"

	useEffect(() => {
		const eSource = new EventSource(
			"https://api-v3.mbta.com/predictions?stop=42&api_key=a10b9724298d437792e206da4f0ec606",
			{
				Headers: {
					Accept: "text/event-stream",
					"X-API-Key": "a10b9724298d437792e206da4f0ec606",
				},
			}
		);

		console.log("esource ", eSource);
		eSource.onmessage = (event) => {
			const data = JSON.parse(event.data);
			setMessage(data.message);
		};
		// should I close? idk
		return eSource.close();
	}, []);

	return (
		<div className="text-4xl border-4 border-slate-500 bg-slate-600 rounded-lg min-w-lg max-w-xl min-h-60">
			<h1 className="text-center">Arrivals for Placeholder</h1>
			<div className="flex flex-col items-center justify-center text-slate-200">
				<div className="flex flex-row border-4 align-middle border-red-500 bg-red-800 my-1 h-20 w-full rounded-lg px-3 py-4">
					<p className="text-left w-1/2">Arriving in </p>
					<p className="text-right w-1/2"> {message} </p>
				</div>
			</div>
		</div>
	);
}
