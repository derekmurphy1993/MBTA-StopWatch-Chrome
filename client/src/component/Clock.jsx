import { useEffect, useState } from "react";

export default function Clock() {
	const [time, setTime] = useState(new Date());

	useEffect(() => {
		const intervalId = setInterval(() => {
			setTime(new Date());
		}, 1000);

		return () => clearInterval(intervalId);
	}, []);

	function updateClock() {
		const now = new Date();
		let hours = now.getHours();
		let minutes = now.getMinutes();
		const ampm = hours >= 12 ? "PM" : "AM";

		hours = hours % 12;
		hours = hours ? hours : 12;
		hours = hours < 10 ? "0" + hours : hours;
		minutes = minutes < 10 ? "0" + minutes : minutes;

		const timeString = hours + ":" + minutes + " " + ampm;
		return timeString;
	}

	return (
		<div className="items-center justify-center flex flex-col relative shadow-xl">
			<div className="bg-gray-800 w-4 h-4 rounded-full absolute -top-2"></div>

			<div
				className={`bg-gray-800 p-2 py-2 rounded-lg shadow-2xl border-4 border-gray-700 relative overflow-hidden`}
			>
				<div className="bg-white px-3 font-semibold text-slate-700">
					{updateClock(time)}
				</div>

				{/* Corner decorations */}
				<div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-slate-50"></div>
				<div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-slate-50"></div>
				<div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-50"></div>
				<div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-50"></div>
			</div>
		</div>
	);
}
