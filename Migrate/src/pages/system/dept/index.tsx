import { BasicContent } from "#src/components";
import { useState } from "react";

export default function Dept() {
	const [count, setCount] = useState(0);

	return (
		<BasicContent>
			<h1></h1>
			<p>
				{count}
			</p>
			<div className="flex gap-5">
				<button onClick={() => setCount(count + 1)}>增加</button>
				<button onClick={() => setCount(count - 1)}>减少</button>
			</div>
		</BasicContent>
	);
}
