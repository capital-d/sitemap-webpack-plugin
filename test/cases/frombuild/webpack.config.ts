import SitemapPlugin from "../../../src";

export default {
  entry: (): [] => [],
  output: {
    filename: "index.js",
    path: `${__dirname}/actual-output`,
    libraryTarget: "umd"
  },

  plugins: [
    new SitemapPlugin({
      base: "https://mysite.com",
      paths: ["/", "/about"],
      options: {
        frombuild: true
      }
    })
  ]
};
