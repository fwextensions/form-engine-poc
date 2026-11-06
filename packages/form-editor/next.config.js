/** @type {import("next").NextConfig} */
export default {
	reactStrictMode: true,
	devIndicators: false,
	transpilePackages: ["@fwextensions/form-engine", "@fwextensions/form-exporters"],
	agentRules: false,
};
