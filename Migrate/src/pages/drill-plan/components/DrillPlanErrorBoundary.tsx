/**
 * DrillPlanErrorBoundary Component
 *
 * Error boundary to catch and display React errors in DrillPlan module
 */

import type { ReactNode } from "react";
import { HomeOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Space } from "antd";
import React, { Component } from "react";

interface Props {
	children: ReactNode
}

interface State {
	hasError: boolean
	error: Error | null
	errorInfo: React.ErrorInfo | null
}

export class DrillPlanErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): Partial<State> {
		console.error("[DrillPlanErrorBoundary] ❌ Error caught:", error);
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("[DrillPlanErrorBoundary] ❌ Error details:", {
			error,
			errorInfo,
			componentStack: errorInfo.componentStack,
		});

		this.setState({
			error,
			errorInfo,
		});
	}

	handleReload = () => {
		console.log("[DrillPlanErrorBoundary] Reloading page...");
		this.setState({ hasError: false, error: null, errorInfo: null });
		window.location.reload();
	};

	handleGoHome = () => {
		console.log("[DrillPlanErrorBoundary] Navigating to home...");
		window.location.href = "/";
	};

	render() {
		if (this.state.hasError) {
			const isDevelopment = import.meta.env.DEV;

			return (
				<div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
					<Alert
						message="Application Error"
						description={(
							<div>
								<p>The DrillPlan module encountered an error and cannot be displayed.</p>
								{isDevelopment && this.state.error && (
									<>
										<p>
											<strong>Error:</strong>
											{" "}
											{this.state.error.message}
										</p>
										{this.state.errorInfo?.componentStack && (
											<details style={{ marginTop: "12px" }}>
												<summary style={{ cursor: "pointer", fontWeight: "bold" }}>
													Component Stack
												</summary>
												<pre style={{
													marginTop: "8px",
													padding: "12px",
													background: "#f5f5f5",
													borderRadius: "4px",
													overflow: "auto",
													fontSize: "12px",
												}}
												>
													{this.state.errorInfo.componentStack}
												</pre>
											</details>
										)}
									</>
								)}
								<Space style={{ marginTop: "16px" }}>
									<Button
										type="primary"
										icon={<ReloadOutlined />}
										onClick={this.handleReload}
									>
										Reload Page
									</Button>
									<Button
										icon={<HomeOutlined />}
										onClick={this.handleGoHome}
									>
										Go to Home
									</Button>
								</Space>
							</div>
						)}
						type="error"
						showIcon
					/>
				</div>
			);
		}

		return this.props.children;
	}
}
