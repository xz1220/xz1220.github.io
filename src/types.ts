export interface SiteConfig {
	/** Author name in metadata (JSON-LD, meta author, RSS). */
	author: string;
	/** Author name shown on Chinese pages, where the English name does not appear. */
	byline: string;
	date: {
		locale: string | string[] | undefined;
		options: Intl.DateTimeFormatOptions;
	};
	description: string;
	lang: string;
	ogLocale: string;
	title: string;
	url: string;
}

export interface PaginationLink {
	srLabel?: string;
	text?: string;
	url: string;
}

export interface SiteMeta {
	articlePublishedDate?: string | undefined;
	articleModifiedDate?: string | undefined;
	articleSourceUrl?: string | undefined;
	description?: string | undefined;
	lang?: string | undefined;
	ogImage?: string | undefined;
	ogImageHeight?: number | undefined;
	ogImageWidth?: number | undefined;
	title: string;
}

export type AdmonitionType = "tip" | "note" | "important" | "caution" | "warning";
