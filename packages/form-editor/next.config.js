/** @type {import("next").NextConfig} */
export default {
	reactStrictMode: true,

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
