import { getArrivalLabel } from "../helper/arrivalDisplay";

// eslint-disable-next-line react/prop-types
export default function Textbox({ train, index, lastKnownStopName }) {
	const label = getArrivalLabel(train);
	const lastKnownLabel = `Last known station: ${lastKnownStopName ?? "Unavailable"}`;
	const leftCopy =
		label === "DUE"
			? "NOW ARRIVING"
			: label === "DELAYED, SEE ALERT"
				? "SERVICE ALERT"
				: lastKnownLabel;

	return (
		<div className="w-full h-[100px] border border-black bg-white flex flex-row items-center px-16">
			<p className="text-4xl leading-tight w-1/2 text-center whitespace-pre-line">
				{index === 0 && label === "DUE" ? "NOW\nARRIVING" : leftCopy}
			</p>
			<p className="text-5xl w-1/2 text-center">
				{label === "DUE"
					? "NOW ARRIVING"
					: label === "DELAYED, SEE ALERT"
						? "DELAYED, SEE ALERT"
						: label.replace(" min", " minutes")}
			</p>
		</div>
	);
}
