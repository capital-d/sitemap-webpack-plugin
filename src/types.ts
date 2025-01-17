import { SitemapItemLoose, EnumChangefreq } from "sitemap";
import { Source } from "webpack-sources";

export type SitemapPathOptions = Omit<
  SitemapItemLoose,
  "url" | "lastmod" | "changefreq"
> & {
  lastmod?: string | boolean;
  changefreq?: string | EnumChangefreq;
};

type PathOptions = SitemapPathOptions & {
  path: string;
};

export type Path = string | PathOptions;

export type ConfigurationOptions = SitemapPathOptions & {
  filename?: string;
  skipgzip?: boolean;
  frombuild?: boolean;
  formatter?: (code: string) => string;
};

export type Configuration = {
  base: string;
  paths: Array<Path>;
  options?: ConfigurationOptions;
};

export type Formatter = (code: string) => string;

export type FilePath = {
  path: string,
  name: string
}
export interface CompilationAssets {
	[index: string]: Source;
}