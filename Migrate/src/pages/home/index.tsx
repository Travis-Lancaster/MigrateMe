import type { ColProps } from "antd";
import { useEffect } from "react";

const wrapperCol: ColProps = {
	xs: 24,
	sm: 24,
	md: 12,
	lg: 12,
	xl: 12,
	xxl: 12,
};
export default function Home() {
	useEffect(() => {
		console.log("🏠 [HOME] Home component mounted and rendering");
	}, []);

	return (
		<div style={{ padding: "20px" }}>
			<h1>🏠 Home Page</h1>
			<p>Hello - Home page is rendering</p>
		</div>
	);
}
