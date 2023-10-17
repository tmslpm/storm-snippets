const APP = {
    /* html reference contains the identifier before bind, after bind contains the html reference */
    htmlReference: {
        ARTICLE: "article",
        SEARCH_BAR: "searchAnyInfo",
        EXPAND_TOP_MENU: "expandTopMenu",
        SWITCH_THEME_MODE: "switchThemeMode",
        MENU_TOP_NAV: "menuTopNavigation",
        BTN_BACK_TO_TOP: "btnBackToTop",
    },

    onBindFieldWithHTMLElement: function () {
        /* get all identifier in this.htmlReference and try get HTML element for store in this.htmlReference */
        Object.entries(this.htmlReference).forEach(([k, v]) => {
            let elementFoundByID = document.getElementById(v);
            if (!(elementFoundByID && elementFoundByID.id.includes(v)))
                throw new Error(`Aie error in app.js, not found html element ${v}`);
            this.htmlReference[k] = elementFoundByID;
        });

        this.onArticleNeedBtnBatckToTop();
        /* bind event, you can add other event or append your custom script.js in config.. */
        this.htmlReference.SEARCH_BAR.onkeyup = () => this.onSearchBar();
        this.htmlReference.SWITCH_THEME_MODE.onclick = () => this.onInitThemeMode(!this.isDarkThemeEnabled());
        this.htmlReference.EXPAND_TOP_MENU.onclick = () => this.onSwitchResponsiveMode(this.htmlReference.MENU_TOP_NAV);
        this.htmlReference.MENU_TOP_NAV.onmouseleave = () => this.onRemoveResponsiveMode(this.htmlReference.MENU_TOP_NAV);
    },

    onSearchBar: function () {
        console.log("search")
    },

    onSwitchResponsiveMode: function (target) {
        if (target.classList.contains("responsive"))
            target.classList.remove("responsive");
        else
            target.classList.add("responsive");
    },

    onRemoveResponsiveMode: function (target) {
        if (target.classList.contains("responsive"))
            target.classList.remove("responsive");
    },

    onInitThemeMode: function (isDark) {
        document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
        localStorage.setItem("KEY_STORE.DARK_THEME", isDark ? "true" : "false");
    },

    onArticleNeedBtnBatckToTop: function () {
        if (this.htmlReference.ARTICLE.parentElement) {
            let needButton = this.htmlReference.ARTICLE.scrollHeight > this.htmlReference.ARTICLE.parentElement.clientHeight;
            if (!needButton) {
                this.htmlReference.BTN_BACK_TO_TOP.style.display = "none";
            }
        }
    },

    isDarkThemeEnabled: function () {
        return "true" === localStorage.getItem("KEY_STORE.DARK_THEME");
    }

}

APP.onInitThemeMode(APP.isDarkThemeEnabled());
APP.onBindFieldWithHTMLElement(); 
