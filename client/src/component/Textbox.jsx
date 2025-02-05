export default function Textbox(processedData, index) {
	console.log("PDAT ", processedData);
	console.log("indi ", index);

	return (
		<div className="flex flex-row border-4 align-middle border-red-500 bg-red-800 my-1 h-20 w-full rounded-lg px-3 py-4">
			<p className="text-left w-1/2">Arriving in </p>
			<p className="text-right w-1/2">
				{" "}
				{processedData ? processedData[index].processedData : "No Data"}
			</p>
		</div>
	);
}
