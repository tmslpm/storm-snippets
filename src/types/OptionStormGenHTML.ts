
// ====================> R E A D M E <=======================
// If  the type change (edit, rename etc...), A update is required of the validation schema!
// Manually or run the `npm run schem` task for generate the new schema
// ====================> R E A D M E <=======================

export type DocumentProvider = "default" | "github_gist"

export type OptionStormGenHTML = {
    dev_mode: boolean,
    document_contenr_use_markdown: boolean,
    document_contenr_use_minifier: boolean,
    document_content_provider: DocumentProvider,
    template_file_name: string,
    lang: string,
    title: string,
    footer: string,
    links: {
        url: string,
        text: string,
        target?: "_blank" | "_self" | "_parent" | "_top",
        title?: string
    }[],
    minifier: {}
};

export const DEFAULT_OPTIONS: OptionStormGenHTML = {
    dev_mode: true,
    document_contenr_use_markdown: true,
    document_contenr_use_minifier: true,
    document_content_provider: "default",
    lang: "en",
    template_file_name: "index.html",
    title: `${process.env.npm_package_name}`,
    footer: `${process.env.npm_package_name} - ${new Date().getFullYear()}`,
    links: [
        { url: "./", text: "🌀 Storm Snippets", title: "Back to home page" },
        { url: "https://github.com/tmslpm/storm-snippets", text: "🚀 Github", title: "See project on Github", target: "_blank" },
        { url: "https://github.com/tmslpm/storm-snippets", text: "📃 Docs", title: "See docs on Github", target: "_blank" },
        { url: "https://www.google.com/intl/fr/gmail/about/", text: "💌 Contact", title: "Contact me", target: "_blank" }
    ],
    minifier: {
        collapseWhitespace: true,
        html5: true,
        decodeEntities: true,
        minifyCSS: true,
        minifyJS: true,
        removeComments: true,
        removeEmptyAttributes: true,
        removeAttributeQuotes: true,
        removeRedundantAttributes: true,
        removeTagWhitespace: true,
        sortAttributes: true,
        sortClassName: true,
    }
};

// ====================> R E A D M E <=======================
// If  the type change (edit, rename etc...), A update is required of the validation schema!
// Manually or run the `npm run schem` task for generate the new schema
// ====================> R E A D M E <=======================
