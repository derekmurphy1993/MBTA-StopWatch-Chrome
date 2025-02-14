export default function Textbox(data) {
	const seconds = data.data;
	const minUntilArrival = Math.floor(seconds / 60);

	return (
		<div className="my-2 flex flex-row bg-slate-700 h-16 shadow-xl px-3 py-4 rounded-xl">
			{minUntilArrival < 1 ? (
				<p className="text-4xl text-slate-50 mx-auto font-mono animate-pulse">
					{" "}
					Now Arriving{" "}
				</p>
			) : (
				<>
					<p className="text-2xl text-slate-50 font-mono text-left w-1/2">Arriving in </p>
					<p className="text-2xl text-slate-50 font-mono text-right w-1/2">
						{minUntilArrival} minutes
					</p>
				</>
			)}{" "}
		</div>
	);
}
