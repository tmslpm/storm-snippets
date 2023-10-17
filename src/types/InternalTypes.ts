export type DocumentContent = {
    title: string,
    category: string,
    language: string,
    content: string,
    snippets: string[]
}

export type RegExpTag = {
    regex: RegExp,
    apply: () => string
}

 
