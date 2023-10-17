import schema from "./types/OptionStormGenHTML.schem.json"
import MarkdownIt from "markdown-it";
import { minify } from "html-minifier-terser";

import { validate } from 'schema-utils';
import { format } from "node:util";
import { DEFAULT_OPTIONS } from "./types/OptionStormGenHTML";

import type { Compilation, Compiler } from "webpack";
import type { OptionStormGenHTML } from "./types/OptionStormGenHTML";
import type { DocumentContent, RegExpTag } from "./types/InternalTypes";


// (2h)     - ajouter projet github
// (2h)     - finir linkedin (écrire bio)
// (1h)     - finir cv (ajouté photo, qr code)
// (20 min) - finir lettre
// (20 min) - s'inscrire sur le site job it day

// TODO: 
// - créer les données d'article par du provider par default (method StormGenHTML.documentProviderDefault())

module.exports = class StormPlugin {
    private readonly options: OptionStormGenHTML;
    private readonly fnLazyLoadProviderContent: () => DocumentContent[];
    private documentContents: DocumentContent[] = [];

    public constructor(args: { options?: OptionStormGenHTML, fnCustomProviderContents?: () => DocumentContent[] } = {}) {
        // init array and add the validated args.options received use default
        this.options = args.options || DEFAULT_OPTIONS;
        validate(schema as any, this.options, { name: StormPlugin.PLUGIN_NAME });
        // init fn provider content with custom or default provider 
        this.fnLazyLoadProviderContent = args.fnCustomProviderContents || this.getAllDocumentsContentFromProvider;
    }

    /**
     * Plugins are instantiated objects with an apply method on their prototype. 
     * This apply method is called once by the webpack compiler while installing the plugin. 
     * The apply method is given a reference to the underlying webpack compiler, 
     * which grants access to compiler callbacks
     * 
     * see:
     * - {@link https://webpack.js.org/contribute/writing-a-plugin/} 
     * - {@link https://webpack.js.org/contribute/plugin-patterns/}
     * 
     * @param { Compiler } compiler - the webpack compiler
     * @returns { void } void
     */
    public apply(compiler: Compiler): void {
        //const LOGGER = compiler.getInfrastructureLogger(StormPlugin.PLUGIN_NAME) || console;
        compiler.hooks.thisCompilation.tap(StormPlugin.PLUGIN_NAME, compilation =>
            compilation.hooks.processAssets.tapPromise({ name: StormPlugin.PLUGIN_NAME, stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE }, assets => {

                // Check whether the template is present in the list of files after compilation
                let allAssetsInCurrentBuild = Object.keys(assets);
                if (!allAssetsInCurrentBuild.includes(this.options.template_file_name))
                    throw new Error(format(StormPlugin.PLUGIN_TEXT.error_no_found_template_html, this.options.template_file_name, allAssetsInCurrentBuild.map(v => ` - ${v}`).join('\n')));

                // try get the value of the template HTML   
                const RAW_TEMPLATE_HTML = assets[this.options.template_file_name].source();
                if (typeof (RAW_TEMPLATE_HTML) != "string")
                    throw new Error(format(StormPlugin.PLUGIN_TEXT.error_no_implemented, "buffer source"));

                return this.startGen(compiler, compilation, RAW_TEMPLATE_HTML);
            })
        );
    }

    private async startGen(compiler: Compiler, compilation: Compilation, rawTemplate: string): Promise<void> {
        this.documentContents = this.fnLazyLoadProviderContent();

        // Generate top menu and side menu  
        let htmlMenuTopNav = this.buildHtmlMenuTop();
        let htmlMenuSideNav = this.buildHtmlMenuSide();

        // pre-interpolate the template 
        const RAW_TEMPLATE_ENRICHED = StormPlugin.applyRegExpTags(rawTemplate,
            StormPlugin.buildRegExp("LANGUAGE", () => this.options.lang),
            StormPlugin.buildRegExp("VERSION", () => `version ${process.env.npm_package_version}`),
            StormPlugin.buildRegExp("TOP_MENU", () => htmlMenuTopNav),
            StormPlugin.buildRegExp("SIDE_MENU", () => htmlMenuSideNav),
            StormPlugin.buildRegExp("FOOTER", () => this.options.footer),
        );

        const { RawSource } = compiler.webpack.sources;

        // Adding new article asset to the compilation
        await Promise.all(this.documentContents.map(async v => {
            const PATH_ASSET = `${StormPlugin.sanitize(v.category)}/${StormPlugin.sanitize(v.title)}.html`;
            const ARTICLE_TITLE = `${v.title} - ${this.options.title}`;
            const ARTICLE_CONTENT = (this.options.document_contenr_use_markdown) ? new MarkdownIt().render(v.content) : v.content
            let templateWithArticle = StormPlugin.applyRegExpTags(RAW_TEMPLATE_ENRICHED,
                StormPlugin.buildRegExp("TITLE", () => ARTICLE_TITLE),
                StormPlugin.buildRegExp("ARTICLE", () => ARTICLE_CONTENT));

            if (this.options.document_contenr_use_minifier)
                templateWithArticle = await minify(templateWithArticle, this.options.minifier);
            compilation.emitAsset(PATH_ASSET, new RawSource(templateWithArticle));

            
        }));

        // Add home page content to index.html 
        compilation.updateAsset(this.options.template_file_name,
            new RawSource(StormPlugin.applyRegExpTags(RAW_TEMPLATE_ENRICHED,
                StormPlugin.buildRegExp("TITLE", () => this.options.title),
                StormPlugin.buildRegExp("ARTICLE", () => "home")
            ))
        );
    }

    private getAllDocumentsContentFromProvider(): DocumentContent[] {
        switch (this.options.document_content_provider) {
            case "github_gist":
                return StormPlugin.documentProviderGithubGist();
            case "default":
            default:
                return StormPlugin.documentProviderDefault();
        }
    }

    private buildHtmlMenuSide(): string {
        let linkGroupByCategory = new Map<string, string>();
        this.documentContents.forEach(v => {
            let currentLink = `<a class="sideNavigationLink" href="${StormPlugin.sanitize(v.category)}/${StormPlugin.sanitize(v.title)}.html" title="open ${v.title}">${v.title}</a>`;
            if (linkGroupByCategory.has(v.category))
                linkGroupByCategory.set(v.category, linkGroupByCategory.get(v.category) + currentLink);
            else
                linkGroupByCategory.set(v.category, currentLink);
        });

        let rawHTML = "";
        linkGroupByCategory.forEach((v, k) => rawHTML += `<section class="sideNavigationSection"><h2>${k}</h2>${v}</section>`);
        return rawHTML;
    }

    private buildHtmlMenuTop(): string {
        return this.options.links
            .map(v => `<a href="${v.url}" target="${(v.target || "")}" title="${(v.title || `open ${v.url}`)}" class="topNavigationSection">${v.text}</a>`)
            .join("");
    }

    /**
     * build a new regex for search {{ prefix.tag }} in string (html document)
     * 
     * Regex: `/{{(.*?STORM\.TAG)\D*?}}/gm`
     * - `{{` matches the characters `{{` literally (case sensitive).
     * - 1st Capturing Group `(.*?STORM\.)`
     * - `.` matches any character (except for line terminators)
     * - `*?` matches the previous token between zero and unlimited times, as few times as possible, expanding as needed (lazy)
     * - `STORM\.TAG` matches the characters `STORM.` literally (case sensitive) 
     * - `\D` matches any character that's not a digit (equivalent to [^0-9]).
     * - `*?` matches the previous token between zero and unlimited times, as few times as possible, expanding as needed (lazy).
     * - `}}` matches the characters `}}` literally (case sensitive).
     * 
     * Global pattern flags:
     * - `g` modifier: global. All matches (don't return after first match).
     * - `m` modifier: multi line. Causes ^ and $ to match the begin/end of each line (not only begin/end of string).
     * 
     * {@link https://regex101.com/}
     * 
     * @param { string } prefix - {{ prefix ... }} => {{ prefix.tag }}
     * @param { string } tag    - {{ ...... tag }} => {{ prefix.tag }}
     * @param { () => string } replacementFunction - "the remplace function for this regex"
     * @returns { RegExp } 
     */
    public static buildRegExp(suffix: string, fnReplacement: () => string): RegExpTag {
        return {
            regex: new RegExp(`{{(.*?STORM\\.${suffix})\\D*?}}`, "gm"),
            apply: fnReplacement
        }
    }

    private static applyRegExpTags(entry: string, ...regexExpressionTags: RegExpTag[]): string {
        regexExpressionTags.forEach(v => entry = entry.replace(v.regex, v.apply()));
        return entry;
    }

    private static sanitize(entry: string): string {
        return `${entry.replace(" ", '_').replace(/[^a-zA-Z0-9_-]/g, '')}`.toLocaleLowerCase();
    }

    // P R O V I D E R - B E L O W

    private static documentProviderGithubGist(): DocumentContent[] {
        throw new Error(format(StormPlugin.PLUGIN_TEXT.error_no_implemented, "provider github gist"));
        return [];
    }

    private static documentProviderDefault(): DocumentContent[] {
        return [
            {
                title: "Hello World 1",
                language: "javascript",
                category: "hello world",
                content: "# Hello world\n- document 1",
                snippets: [
                    "console.log('hello world 1');"
                ]
            },
            {
                title: "Hello World 2",
                language: "javascript",
                category: "hello world",
                content: "# Hello world\n- document 2",
                snippets: [
                    "console.log('hello world 2');"
                ]
            },
            {
                title: "Hello World 3",
                language: "javascript",
                category: "hello world",
                content: "# Hello world\n- document 3",
                snippets: [
                    "console.log('hello world 3');"
                ]
            },

            {
                title: "HTML Documents",
                language: "javascript",
                category: "HTML DOM",
                content: "# Hello world\n- HTML document",
                snippets: [
                    "console.log('hello world 3');"
                ]
            }
            ,

            {
                title: "HTML Events",
                language: "javascript",
                category: "HTML DOM",
                content: "# Hello world\n- HTML Events",
                snippets: [
                    "console.log('hello world 3');"
                ]
            }
            ,

            {
                title: "HTML Api",
                language: "javascript",
                category: "HTML DOM",
                content: "# Hello world\n- HTML document",
                snippets: [
                    "console.log('hello world 3');"
                ]
            }
        ];
    }

    // TEXT

    private static readonly PLUGIN_NAME = 'StormGenHTML';

    private static readonly PLUGIN_TEXT = {
        error_no_implemented: "not implemented support %s",

        error_no_found_template_html: "Aie! %s template file not present in assets build. Assets in current build:\n%s\nAt:"
    }

}; 