import type { Metadata } from "next";
import { Roboto_Flex, Roboto_Slab, Roboto_Mono } from "next/font/google";
import "./globals.css";

const robotoFlex = Roboto_Flex({
	subsets: ["latin"],
	variable: "--loaded-font-sans",
	display: "swap",
});

const robotoSlab = Roboto_Slab({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--loaded-font-slab",
	display: "swap",
});

const robotoMono = Roboto_Mono({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--loaded-font-mono",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Form Editor",
	description: "Live editor for form schemas",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`h-full ${robotoFlex.variable} ${robotoSlab.variable} ${robotoMono.variable}`}>
		<head>
			<link rel="icon"
				type="image/png"
				href="https://housing.sfgov.org/assets/favicon-32x32-c7697ffee1e31d810b8063feaf8c67c7b2c906b489f13fabf69d59a386a9c9d0.png"
			/>
		</head>
		<body className="h-full">{children}</body>
		</html>
	);
}
