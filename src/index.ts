import { JSONSchema7 } from "json-schema";
import { validate } from "schema-utils";
import { Compiler, Compilation, sources } from "webpack";
import { generateSitemaps } from "./generators";
import {
  RawSource,
  compilationEmitAsset,
  compilationPublicPath,
  gzip,
  assertValidChangefreq,
  sitemapFilename,
  compilationOutputPath
} from "./helpers";
import {
  Configuration,
  ConfigurationOptions,
  Formatter,
  Path,
  SitemapPathOptions,
  CompilationAssets
} from "./types";
import schema from "./schema.json";
import { readDirectory } from "./read-directory";
import { convertToSitemapPath } from "./convert-to-sitemap-path";
import { convertAssetToSitemapPath } from "./convert-asset-to-sitemap-path";

const PLUGIN_NAME = "sitemap-webpack-plugin"

export default class SitemapWebpackPlugin {
  private base: string;
  private paths: Array<Path>;
  private filename = "sitemap";
  private skipgzip = false;
  private frombuild = false;
  private formatter?: Formatter;
  private globalPathOptions: SitemapPathOptions;
  private assetsHTMLs: string[] = [];
  private cssReady = false;

  constructor(configuration: Configuration) {
    validate(schema as JSONSchema7, configuration, {
      name: "SitemapWebpackPlugin"
    });

    const { base, paths, options = {} as ConfigurationOptions } = configuration;

    // Set mandatory values
    this.base = base;
    this.paths = paths;
    this.cssReady = false;

    const {
      filename,
      skipgzip,
      formatter,
      lastmod,
      changefreq,
      frombuild,
      ...rest
    } = options;
    if (filename) {
      this.filename = filename.replace(/\.xml$/, "");
    }
    if (skipgzip) {
      this.skipgzip = skipgzip;
    }
    if (frombuild) {
      this.frombuild = frombuild;
    }
    this.formatter = formatter;

    const globalPathOptions: SitemapPathOptions = rest;
    if (lastmod) {
      if (typeof lastmod === "string") {
        globalPathOptions.lastmod = lastmod;
      } else {
        globalPathOptions.lastmod = new Date().toISOString().split("T")[0];
      }
    }
    if (changefreq) {
      assertValidChangefreq(changefreq);
      globalPathOptions.changefreq = changefreq;
    }

    this.globalPathOptions = globalPathOptions;
  }

  private async getDinamicPaths(dist: string, publicPath: string) {
    const htmls = await readDirectory(dist, 'html')
    const html = htmls.length === 0 ? [{ name: "index.html", path: '/' }] : htmls
    const paths = html.map(convertToSitemapPath({ dist, base: this.base, publicPath }))
    return paths
  }

  private getConvertedPath(publicPath: string) {

    return this.assetsHTMLs
      .map(convertAssetToSitemapPath({ base: this.base, publicPath }))
  }

  private async emitSitemaps(compilation: Compilation): Promise<Array<string>> {
    try {
      const publicPath = compilationPublicPath(compilation);

      if (this.frombuild) {
        const buildPath = compilationOutputPath(compilation)
        // this.paths = await this.getDinamicPaths(buildPath, publicPath)
        this.paths = this.getConvertedPath(publicPath)
      }

      const sitemaps = await generateSitemaps(
        this.paths,
        this.base,
        publicPath,
        this.filename,
        this.skipgzip,
        this.globalPathOptions,
        this.formatter
      );

      sitemaps.forEach((sitemap, idx) => {
        compilationEmitAsset(
          compilation,
          sitemapFilename(this.filename, "xml", idx),
          new RawSource(sitemap, false)
        );
      });

      return sitemaps;
    } catch (err: any) {
      compilation.errors.push(err.stack);

      return [];
    }
  }

  private async emitCompressedSitemaps(
    compilation: Compilation,
    sitemaps: Array<string>
  ): Promise<void> {
    for (let idx = 0; idx < sitemaps.length; idx++) {
      const sitemap = sitemaps[idx];
      try {
        const compressed = await gzip(sitemap);
        compilationEmitAsset(
          compilation,
          sitemapFilename(this.filename, "xml.gz", idx),
          new RawSource(compressed, false)
        );
      } catch (err: any) {
        compilation.errors.push(err.stack);
      }
    }
  }

  private async run(compilation: Compilation): Promise<void> {
    const sitemaps = await this.emitSitemaps(compilation);

    if (this.skipgzip !== true) {
      await this.emitCompressedSitemaps(compilation, sitemaps);
    }
  }

  private async resoveCompilation(compiler: Compiler): Promise<Compilation> {
    return new Promise(resolve => {
      compiler.hooks.compilation.tap("sitemap-webpack-plugin", compilation => {
        compilation.hooks.processAssets.tapPromise(
          {
            name: "sitemap-webpack-plugin",
            stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
          },
          async () => {
            resolve(compilation);
          }
        );
      });
    });

  }

  private async resoveDone(compiler: Compiler) {
    return new Promise(resolve => {
      compiler.hooks.done.tap("sitemap-webpack-plugin", stats => {
        resolve(stats);
      });
    });

  }

  apply(compiler: Compiler): void {
    if (compiler.webpack && compiler.webpack.version[0] == "5") {
      // webpack 5
      // const finish = Promise.all([this.resoveCompilation(compiler), this.resoveDone(compiler)])
      // .then(([compilation, done]) => {
      //   this.run(compilation)
      // })


      const onEnd = async (compilation: Compilation) => {

        // await this.run(compilation)
      };

      compiler.hooks.watchRun.tap(PLUGIN_NAME, () => {
        this.cssReady = false;
      });

      compiler.hooks.emit.tap(PLUGIN_NAME, (compilation) => {
        let assets = Object.entries(compilation.assets);
        this.assetsHTMLs = assets
          .map(([fileName]) => fileName)
          .filter(fileName => fileName.split(".").slice(-1)[0] === 'html')

          // this.run(compilation)
      });

      compiler.hooks.afterEmit.tapPromise(PLUGIN_NAME, onEnd);
      compiler.hooks.compilation.tap("sitemap-webpack-plugin", compilation => {
        // const {compilation} = stats

        compilation.hooks.needAdditionalPass.tap(PLUGIN_NAME, () => {

          if (!this.cssReady) {
            this.cssReady = true;
            return true;
          }
          return false
        });

        if (this.cssReady) {

          compilation.hooks.processAssets.tapPromise(
            {
              name: "sitemap-webpack-plugin",
              stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
            },
            async () => this.run(compilation)
          );
        }


      });
    } else if (compiler.hooks) {
      // webpack 4
      compiler.hooks.emit.tapPromise(
        "sitemap-webpack-plugin",
        async compilation => this.run(compilation)
      );
    } else {
      throw new Error("Unsupported webpack version; must be 4 or 5");
    }
  }
}
