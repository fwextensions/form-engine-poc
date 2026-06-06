import React from "react";

const EditorToolbar = () => {
	return (
		<header className="bg-white border-b border-slate-300 p-4 flex items-center gap-4 w-full">
			<a className="text-primary500 cursor-pointer no-underline flex items-center" href="https://www.sf.gov" target="_blank" rel="noopener noreferrer">
				<img alt="San Francisco city seal"
					loading="lazy"
					decoding="async"
					className="flex-shrink-0 mr-[6px] w-[37px] h-[37px]"
					style={{ color: "transparent" }}
					srcSet="https://www.sf.gov/_next/static/media/CCSF-seal-vector.f4f3942a.svg 1x, https://www.sf.gov/_next/static/media/CCSF-seal-vector.f4f3942a.svg 2x"
					src="https://www.sf.gov/_next/static/media/CCSF-seal-vector.f4f3942a.svg"
				/>
				<span className="font-slab text-heading-xl lg:text-desktop-heading-xl text-neutral900 mb-space-body !font-extrabold !mb-0 !text-[20px] lg:!text-[24px]">
					SF.gov
				</span>
			</a>
			<div className="w-[2px] h-[22px] bg-ink-200 shrink-0 inline-block" aria-hidden="true" />
			<div className="mt-[6px]  font-sans font-lg font-semibold text-md text-ink-800 whitespace-nowrap">
				Form Builder
			</div>
		</header>
	);
};

export default EditorToolbar;
