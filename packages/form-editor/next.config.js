/** @type {import("next").NextConfig} */
export default {
	reactStrictMode: true,
	devIndicators: false,
	transpilePackages: ["form-engine"],

	async rewrites()
	{
		return [
			{
				source: "/api/:path*",
				destination: "https://housing.sfgov.org/api/:path*",
			},
		];
	},
};
