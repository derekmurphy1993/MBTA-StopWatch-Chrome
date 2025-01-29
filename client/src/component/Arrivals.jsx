export default function Arrivals(times) {
	console.log("arrival", times);

	return (
		<div className="text-4xl border-4 border-slate-500 bg-slate-600 rounded-lg min-w-lg max-w-xl min-h-60">
			<h1 className="text-center">Arrivals for Placeholder</h1>
			<div className="flex flex-col items-center justify-center text-slate-200">
				<div className="flex flex-row border-4 border-red-500 bg-red-800 my-2 h-20 w-full">
					<p className="flex-start ">Arriving in </p>
					<p className="flex-end"> {times.times[0]} Minutes</p>
				</div>
				<div className="border-4 border-red-500 bg-red-800 my-2 h-20 w-full">
					<p className="flex-start">Arriving in</p>
					<p className="flex-end">{times.times[1]} Minutes</p>
				</div>
			</div>
		</div>
	);
}
