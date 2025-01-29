import { useState, useEffect } from "react";

// eslint-disable-next-line react/prop-types
export default function StopSearch({ onSelect }) {
	const [line, setLine] = useState("");
	const [stop, setStop] = useState("");

	// useEffect(() => {
	// 	const url = `https://api-v3.mbta.com/lines`;
	// 	fetch(url).then((res) => {
	// 		const data = res.json();
	// 		console.log(data);
	// 		// setLine(res.data);
	// 	});
	// }, []);

	function handleSubmit(event) {
		event.preventDefault();
		onSelect({ stop });
	}

	// http://realtime.mbta.com/developer/api/v2/stopsbyroute?api_key={API_KEY}&route=Red&format=json

	return (
		<>
			<h1>Select a new Stop</h1>
			<form onSubmit={handleSubmit} className="flex flex-col items-center justify-center">
				<select className="border-2 mt-4 border-slate-500 bg-slate-200 rounded-lg h-12 w-64 p-2">
					<option selected disabled>
						Select which line
					</option>
					<option value="Red">Red</option>
					<option value="Blue">Blue</option>
					<option value="Orange">Orange</option>
					<option value="Green">Green</option>
				</select>
				<select className="border-2 mt-4 border-slate-500 bg-slate-200 rounded-lg h-12 w-64 p-2">
					<option selected disabled>
						Toward:
					</option>
					<option value="Alewife">Alewife</option>
				</select>
				<select className="border-2 mt-4 border-slate-500 bg-slate-200 rounded-lg h-12 w-64 p-2">
					<option selected disabled>
						Select your stop:
					</option>
					<option value="Alewife">Alewife</option>
				</select>
				{/* <label>
				Username:
				<input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
			</label>
			<br />
			<label>
				Password:
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
				/>
			</label>
			<br />
			<input type="submit" value="Submit" /> */}
			</form>
		</>
	);
}
