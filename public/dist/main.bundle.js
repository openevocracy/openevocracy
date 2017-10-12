webpackJsonp(["main"],{

/***/ "../../../../../package.json":
/***/ (function(module, exports) {

module.exports = {"name":"openevocracy","version":"0.2.0","license":"MIT","scripts":{"ng":"ng","start":"ng serve --host 0.0.0.0 --disable-host-check -p 8081","build":"ng build","test":"ng test","lint":"ng lint","e2e":"ng e2e","extract":"ngx-translate-extract --input ./src --output ./src/assets/i18n/*.json --clean --sort --format namespaced-json"},"private":true,"dependencies":{"@angular/material":"*","@angular/cdk":"*","@angular/animations":"^4.2.4","@angular/common":"^4.2.4","@angular/compiler":"^4.2.4","@angular/core":"^4.2.4","@angular/forms":"^4.2.4","@angular/platform-browser":"^4.2.4","@angular/platform-browser-dynamic":"^4.2.4","@angular/router":"^4.2.4","@ngx-translate/core":"^8.0.0","@ngx-translate/http-loader":"^2.0.0","app-root-path":"*","async-lock":"^0.3.8","bcrypt":"^1.0.2","bluebird":"*","body-parser":"*","bootstrap-material-design":"^4.0.0-beta.3","buffer-crc32":"*","chance":"*","collections":"*","color":"^1.0.3","connect":"*","cookie":"*","cookie-parser":"*","cookie-session":"*","cookie-signature":"*","core-js":"^2.4.1","cron":"*","debug":"~2.6.4","ejs":"*","errorhandler":"*","express":"*","express-session":"*","font-awesome":"*","gulf":"^5","gulf-mongoskin":"0.2.3","hammerjs":"^2.0.8","i18next":"^7.2.3","i18next-express-middleware":"^1.0.2","i18next-node-fs-backend":"^0.1.2","jquery":"^3.2.1","jsdom":"9.12.0","json":"*","method-override":"*","methods":"*","mongodb":"~2.0","mongoskin":"*","morgan":"*","multer":"*","node-crontab":"*","nodemailer":"2.7.2","phantom-html2pdf":"*","popper.js":"^1.12.5","quill-delta-to-html":"^0.3.0","range-parser":"*","request":"*","request-promise":"*","rich-text":"*","rxjs":"^5.4.2","send":"*","serve-favicon":"*","socket.io":"2.0.2","stream-buffers":"^3.0.0","strformat":"0.0.7","underscore":"*","underscore.string":"*","validate.js":"*","zone.js":"^0.8.14"},"devDependencies":{"@angular/cli":"1.4.2","@angular/compiler-cli":"^4.2.4","@angular/language-service":"^4.2.4","@biesbjerg/ngx-translate-extract":"^2.3.2","@types/jasmine":"~2.5.53","@types/jasminewd2":"~2.0.2","@types/node":"~6.0.60","codelyzer":"~3.1.1","jasmine-core":"~2.6.2","jasmine-spec-reporter":"~4.1.0","karma":"~1.7.0","karma-chrome-launcher":"~2.1.1","karma-cli":"~1.0.1","karma-coverage-istanbul-reporter":"^1.2.1","karma-jasmine":"~1.1.0","karma-jasmine-html-reporter":"^0.2.2","protractor":"~5.1.2","ts-node":"~3.2.0","tslint":"~5.3.2","typescript":"~2.3.3"}}

/***/ }),

/***/ "../../../../../src/$$_gendir lazy recursive":
/***/ (function(module, exports) {

function webpackEmptyAsyncContext(req) {
	// Here Promise.resolve().then() is used instead of new Promise() to prevent
	// uncatched exception popping up in devtools
	return Promise.resolve().then(function() {
		throw new Error("Cannot find module '" + req + "'.");
	});
}
webpackEmptyAsyncContext.keys = function() { return []; };
webpackEmptyAsyncContext.resolve = webpackEmptyAsyncContext;
module.exports = webpackEmptyAsyncContext;
webpackEmptyAsyncContext.id = "../../../../../src/$$_gendir lazy recursive";

/***/ }),

/***/ "../../../../../src/app/app-routing/app-routing.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppRoutingModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_common__ = __webpack_require__("../../../common/@angular/common.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_router__ = __webpack_require__("../../../router/@angular/router.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__routes__ = __webpack_require__("../../../../../src/app/app-routing/routes.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};




var AppRoutingModule = (function () {
    function AppRoutingModule() {
    }
    return AppRoutingModule;
}());
AppRoutingModule = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["M" /* NgModule */])({
        imports: [
            __WEBPACK_IMPORTED_MODULE_1__angular_common__["b" /* CommonModule */],
            __WEBPACK_IMPORTED_MODULE_2__angular_router__["a" /* RouterModule */].forRoot(__WEBPACK_IMPORTED_MODULE_3__routes__["a" /* routes */])
        ],
        exports: [__WEBPACK_IMPORTED_MODULE_2__angular_router__["a" /* RouterModule */]],
        declarations: []
    })
], AppRoutingModule);

//# sourceMappingURL=app-routing.module.js.map

/***/ }),

/***/ "../../../../../src/app/app-routing/routes.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return routes; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__topics_topics_component__ = __webpack_require__("../../../../../src/app/topics/topics.component.ts");

var routes = [
    { path: 'topics', component: __WEBPACK_IMPORTED_MODULE_0__topics_topics_component__["a" /* TopicsComponent */] },
    //{ path: 'topic/:id', component: MenuComponent },
    { path: '', redirectTo: '/topics', pathMatch: 'full' }
];
//# sourceMappingURL=routes.js.map

/***/ }),

/***/ "../../../../../src/app/app.component.html":
/***/ (function(module, exports) {

module.exports = "<app-header></app-header>\n<div id=\"wrapper\" class=\"container\"><router-outlet></router-outlet></div>\n<app-footer></app-footer>\n"

/***/ }),

/***/ "../../../../../src/app/app.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/app.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__ngx_translate_core__ = __webpack_require__("../../../../@ngx-translate/core/index.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var AppComponent = (function () {
    function AppComponent(translate) {
        this.translate = translate;
        // this language will be used as a fallback when a translation isn't found in the current language
        translate.setDefaultLang('en');
        // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use('en');
    }
    AppComponent.prototype.setLanguage = function (key) {
        this.translate.use(key);
    };
    return AppComponent;
}());
AppComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'app-root',
        template: __webpack_require__("../../../../../src/app/app.component.html"),
        styles: [__webpack_require__("../../../../../src/app/app.component.scss")]
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__ngx_translate_core__["c" /* TranslateService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__ngx_translate_core__["c" /* TranslateService */]) === "function" && _a || Object])
], AppComponent);

var _a;
//# sourceMappingURL=app.component.js.map

/***/ }),

/***/ "../../../../../src/app/app.module.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* unused harmony export HttpLoaderFactory */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppModule; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__ = __webpack_require__("../../../platform-browser/@angular/platform-browser.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_animations__ = __webpack_require__("../../../platform-browser/@angular/platform-browser/animations.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_material__ = __webpack_require__("../../../material/@angular/material.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__angular_http__ = __webpack_require__("../../../http/@angular/http.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__angular_common_http__ = __webpack_require__("../../../common/@angular/common/http.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__ngx_translate_core__ = __webpack_require__("../../../../@ngx-translate/core/index.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__ngx_translate_http_loader__ = __webpack_require__("../../../../@ngx-translate/http-loader/index.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__app_routing_app_routing_module__ = __webpack_require__("../../../../../src/app/app-routing/app-routing.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__app_component__ = __webpack_require__("../../../../../src/app/app.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__header_header_component__ = __webpack_require__("../../../../../src/app/header/header.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__footer_footer_component__ = __webpack_require__("../../../../../src/app/footer/footer.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_12__topics_topics_component__ = __webpack_require__("../../../../../src/app/topics/topics.component.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_13__services_topics_list_service__ = __webpack_require__("../../../../../src/app/services/topics-list.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_14__services_http_manager_service__ = __webpack_require__("../../../../../src/app/services/http-manager.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_15__shared_config__ = __webpack_require__("../../../../../src/app/shared/config.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_16_hammerjs__ = __webpack_require__("../../../../hammerjs/hammer.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_16_hammerjs___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_16_hammerjs__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};

















// AoT requires an exported function for factories
function HttpLoaderFactory(http) {
    return new __WEBPACK_IMPORTED_MODULE_7__ngx_translate_http_loader__["a" /* TranslateHttpLoader */](http);
}
var AppModule = (function () {
    function AppModule() {
    }
    return AppModule;
}());
AppModule = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_3__angular_core__["M" /* NgModule */])({
        declarations: [
            __WEBPACK_IMPORTED_MODULE_9__app_component__["a" /* AppComponent */],
            __WEBPACK_IMPORTED_MODULE_10__header_header_component__["a" /* HeaderComponent */],
            __WEBPACK_IMPORTED_MODULE_11__footer_footer_component__["a" /* FooterComponent */],
            __WEBPACK_IMPORTED_MODULE_12__topics_topics_component__["a" /* TopicsComponent */]
        ],
        imports: [
            __WEBPACK_IMPORTED_MODULE_0__angular_platform_browser__["a" /* BrowserModule */],
            __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_animations__["a" /* BrowserAnimationsModule */],
            __WEBPACK_IMPORTED_MODULE_2__angular_material__["a" /* MaterialModule */],
            __WEBPACK_IMPORTED_MODULE_8__app_routing_app_routing_module__["a" /* AppRoutingModule */],
            __WEBPACK_IMPORTED_MODULE_4__angular_http__["b" /* HttpModule */],
            __WEBPACK_IMPORTED_MODULE_5__angular_common_http__["b" /* HttpClientModule */],
            __WEBPACK_IMPORTED_MODULE_6__ngx_translate_core__["b" /* TranslateModule */].forRoot({
                loader: {
                    provide: __WEBPACK_IMPORTED_MODULE_6__ngx_translate_core__["a" /* TranslateLoader */],
                    useFactory: HttpLoaderFactory,
                    deps: [__WEBPACK_IMPORTED_MODULE_5__angular_common_http__["a" /* HttpClient */]]
                }
            })
        ],
        providers: [
            __WEBPACK_IMPORTED_MODULE_14__services_http_manager_service__["a" /* HttpManagerService */],
            __WEBPACK_IMPORTED_MODULE_13__services_topics_list_service__["a" /* TopicsListService */],
            { provide: 'BaseURL', useValue: __WEBPACK_IMPORTED_MODULE_15__shared_config__["a" /* baseURL */] }
        ],
        bootstrap: [__WEBPACK_IMPORTED_MODULE_9__app_component__["a" /* AppComponent */]]
    })
], AppModule);

//# sourceMappingURL=app.module.js.map

/***/ }),

/***/ "../../../../../src/app/footer/footer.component.html":
/***/ (function(module, exports) {

module.exports = "<footer>\n\t<ul id=\"footmenu\" class=\"clearfix\">\n\t\t<li><a target=\"_blank\" href=\"http://openevocracy.org\">{{ 'FOOTER_MENU_ABOUT' | translate }}</a></li>\n\t\t<li><a target=\"_blank\" href=\"http://openevocracy.org\">{{ 'FOOTER_MENU_IMPRESS' | translate }}</a></li>\n\t\t<li><a target=\"_blank\" href=\"https://github.com/openevocracy/openevocracy\">Github</a></li>\n\t\t<li><a target=\"_blank\" href=\"https://twitter.com/openevocracy\">Twitter</a></li>\n\t</ul>\n\t<div class=\"evo-version\"><span>{{ 'FOOTER_MENU_VERSION' | translate }}</span>: <span>{{ version }}</span></div>\n</footer>\n"

/***/ }),

/***/ "../../../../../src/app/footer/footer.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "/* Import variables */\nfooter {\n  background-color: #009688;\n  padding: 10px 0 15px 0;\n  color: #FFFFFF;\n  font-size: 1.1rem;\n  text-align: center;\n  position: fixed;\n  right: 0;\n  left: 0;\n  bottom: 0;\n  z-index: 1000; }\n\nfooter ul {\n  display: inline-block;\n  margin: 0;\n  padding: 0; }\n\nfooter li {\n  list-style: none;\n  float: left; }\n\nfooter li a {\n  display: inline-block;\n  padding: 0 0.5em;\n  line-height: 2.5em;\n  color: #FFFFFF; }\n\nfooter li a:hover {\n  color: inherit; }\n\nfooter .evo-version {\n  opacity: 0.85; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/footer/footer.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return FooterComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};

var version = __webpack_require__("../../../../../package.json").version;
var FooterComponent = (function () {
    function FooterComponent() {
        this.version = version;
    }
    FooterComponent.prototype.ngOnInit = function () { };
    return FooterComponent;
}());
FooterComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'app-footer',
        template: __webpack_require__("../../../../../src/app/footer/footer.component.html"),
        styles: [__webpack_require__("../../../../../src/app/footer/footer.component.scss")]
    }),
    __metadata("design:paramtypes", [])
], FooterComponent);

//# sourceMappingURL=footer.component.js.map

/***/ }),

/***/ "../../../../../src/app/header/header.component.html":
/***/ (function(module, exports) {

module.exports = "<header>\n\t<div class=\"container clearfix\">\n\t\t<img class=\"pull-left\" src=\"../../assets/img/logo_white_32.png\" />\n\t\t<h1 class=\"pull-left\">OpenEvocracy</h1>\n\t\t<md-toolbar color=\"primary\">\n\t\t\t<md-nav-list>\n\t\t\t\t<a md-list-item routerLink=\"/\" routerLinkActive=\"active\">{{ 'HEADER_MAINMENU_TOPICLIST' | translate}}</a>\n\t\t\t\t<a md-list-item routerLink=\"/timeline\" routerLinkActive=\"active\">{{ 'HEADER_MAINMENU_TIMELINE' | translate}}</a>\n\t\t\t</md-nav-list>\n\t\t\t\n\t\t\t<span class=\"flex-spacer\"></span>\n\t\t\t\n\t\t\t<button md-icon-button [mdMenuTriggerFor]=\"lang\">\n\t\t\t\t<span class=\"fa fa-globe\"></span>\n\t\t\t</button>\n\t\t\t<md-menu #lang=\"mdMenu\" [overlapTrigger]=\"false\">\n\t\t\t\t<button md-menu-item (click)=\"setLanguage('en')\">\n\t\t\t\t\t<span>English</span>\n\t\t\t\t</button>\n\t\t\t\t<button md-menu-item (click)=\"setLanguage('de')\">\n\t\t\t\t\t<span>Deutsch</span>\n\t\t\t\t</button>\n\t\t\t</md-menu>\n\t\t\t\n\t\t\t<button md-icon-button [mdMenuTriggerFor]=\"settings\">\n\t\t\t\t<span class=\"fa fa-cogs\"></span>\n\t\t\t</button>\n\t\t\t<md-menu #settings=\"mdMenu\" [overlapTrigger]=\"false\">\n\t\t\t\t<button md-menu-item routerLink=\"/settings\">\n\t\t\t\t\t<span>{{ 'HEADER_MAINMENU_SETTINGS' | translate }}</span>\n\t\t\t\t</button>\n\t\t\t\t<button md-menu-item routerLink=\"/logout\">\n\t\t\t\t\t<span>{{ 'HEADER_MAINMENU_LOGOUT' | translate }}</span>\n\t\t\t\t</button>\n\t\t\t</md-menu>\n\n\t\t</md-toolbar>\n\t</div>\n</header>"

/***/ }),

/***/ "../../../../../src/app/header/header.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "/* Import variables */\n/* Add custom variables */\n/* Component Styles */\nheader {\n  background-color: #009688;\n  height: 64px;\n  color: #FFFFFF;\n  font-size: 1.2rem;\n  position: fixed;\n  right: 0;\n  left: 0;\n  top: 0;\n  z-index: 1000; }\n\nh1 {\n  font-size: 2rem;\n  font-weight: 300;\n  margin: 0;\n  line-height: 64px; }\n\nimg {\n  padding: 16px 1rem 16px 0; }\n\nmd-toolbar {\n  margin-left: 50px; }\n\n.mat-toolbar {\n  width: auto; }\n\nmd-nav-list {\n  padding: 0; }\n\n.mat-list-item {\n  float: left;\n  color: #FFFFFF;\n  font-weight: 300; }\n\n.mat-list-item.active {\n  background: rgba(0, 0, 0, 0.04); }\n\n/* Component Child Styles */\n:host::ng-deep .mat-nav-list .mat-list-item .mat-list-item-content {\n  height: 64px; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/header/header.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return HeaderComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__app_component__ = __webpack_require__("../../../../../src/app/app.component.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var HeaderComponent = (function () {
    function HeaderComponent(app) {
        this.app = app;
    }
    HeaderComponent.prototype.ngOnInit = function () {
    };
    HeaderComponent.prototype.setLanguage = function (key) {
        this.app.setLanguage(key);
    };
    return HeaderComponent;
}());
HeaderComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'app-header',
        template: __webpack_require__("../../../../../src/app/header/header.component.html"),
        styles: [__webpack_require__("../../../../../src/app/header/header.component.scss")]
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__app_component__["a" /* AppComponent */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__app_component__["a" /* AppComponent */]) === "function" && _a || Object])
], HeaderComponent);

var _a;
//# sourceMappingURL=header.component.js.map

/***/ }),

/***/ "../../../../../src/app/services/http-manager.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return HttpManagerService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rxjs_Observable__ = __webpack_require__("../../../../rxjs/Observable.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_rxjs_Observable___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1_rxjs_Observable__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__angular_http__ = __webpack_require__("../../../http/@angular/http.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_rxjs_add_observable_throw__ = __webpack_require__("../../../../rxjs/add/observable/throw.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_rxjs_add_observable_throw___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_3_rxjs_add_observable_throw__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};




var HttpManagerService = (function () {
    function HttpManagerService() {
    }
    HttpManagerService.prototype.extractData = function (res) {
        var body = res.json();
        console.log(body);
        return body || {};
    };
    HttpManagerService.prototype.handleError = function (error) {
        var errMsg;
        if (error instanceof __WEBPACK_IMPORTED_MODULE_2__angular_http__["c" /* Response */]) {
            var body = error.json() || '';
            var err = body.error || JSON.stringify(body);
            errMsg = error.status + " - " + (error.statusText || '') + " " + err;
        }
        else {
            errMsg = error.message ? error.message : error.toString();
        }
        return __WEBPACK_IMPORTED_MODULE_1_rxjs_Observable__["Observable"].throw(errMsg);
    };
    return HttpManagerService;
}());
HttpManagerService = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["C" /* Injectable */])(),
    __metadata("design:paramtypes", [])
], HttpManagerService);

//# sourceMappingURL=http-manager.service.js.map

/***/ }),

/***/ "../../../../../src/app/services/topics-list.service.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return TopicsListService; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_http__ = __webpack_require__("../../../http/@angular/http.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__shared_config__ = __webpack_require__("../../../../../src/app/shared/config.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__http_manager_service__ = __webpack_require__("../../../../../src/app/services/http-manager.service.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_rxjs_add_operator_catch__ = __webpack_require__("../../../../rxjs/add/operator/catch.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_rxjs_add_operator_catch___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_rxjs_add_operator_catch__);
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};





var TopicsListService = (function () {
    function TopicsListService(http, httpManagerService) {
        this.http = http;
        this.httpManagerService = httpManagerService;
    }
    TopicsListService.prototype.getTopicsList = function () {
        var _this = this;
        return this.http.get(__WEBPACK_IMPORTED_MODULE_2__shared_config__["a" /* baseURL */] + 'json/topics')
            .map(function (res) { return _this.httpManagerService.extractData(res); })
            .catch(function (error) { return _this.httpManagerService.handleError(error); });
    };
    return TopicsListService;
}());
TopicsListService = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["C" /* Injectable */])(),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__angular_http__["a" /* Http */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__angular_http__["a" /* Http */]) === "function" && _a || Object, typeof (_b = typeof __WEBPACK_IMPORTED_MODULE_3__http_manager_service__["a" /* HttpManagerService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_3__http_manager_service__["a" /* HttpManagerService */]) === "function" && _b || Object])
], TopicsListService);

var _a, _b;
//# sourceMappingURL=topics-list.service.js.map

/***/ }),

/***/ "../../../../../src/app/shared/config.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return baseURL; });
var baseURL = 'http://develop.openevocracy.org/';
//# sourceMappingURL=config.js.map

/***/ }),

/***/ "../../../../../src/app/topics/topics.component.html":
/***/ (function(module, exports) {

module.exports = "<md-grid-list cols=\"4\" rowHeight=\"200px\">\n\t<md-grid-tile *ngFor=\"let topic of topicsList\">\n\t\t<md-card md-ripple [ngClass]=\"'step'+topic.stage\">\n\t\t\t<md-card-content>\n\t\t\t\t<md-card-title>{{topic.name}}</md-card-title>\n\t\t\t\t<p *ngIf=\"topic.stage == -1\">{{topic.rejectedReason | translate}}</p>\n\t\t\t</md-card-content>\n\t\t\t<md-card-actions *ngIf=\"topic.stage == 0\">\n\t\t\t\t<button md-button><span class=\"fa fa-hand-paper-o\"></span></button>\n\t\t\t</md-card-actions>\n\t\t\t<md-card-footer>\n\t\t\t\t\n\t\t\t</md-card-footer>\n\t\t</md-card>\n\t</md-grid-tile>\n</md-grid-list>\n"

/***/ }),

/***/ "../../../../../src/app/topics/topics.component.scss":
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__("../../../../css-loader/lib/css-base.js")(false);
// imports


// module
exports.push([module.i, "/* Import variables */\n.mat-card {\n  width: 94%;\n  height: 94%;\n  cursor: pointer;\n  border-left: 5px solid #BDBDBD;\n  transition: background-color 400ms; }\n\n.mat-card.step-1 {\n  /* Default */ }\n\n.mat-card.step0 {\n  border-color: #42A5F5; }\n\n.mat-card.step1 {\n  border-color: #FFA726; }\n\n.mat-card.step2 {\n  border-color: #EF5350; }\n\n.mat-card.step3 {\n  border-color: #66BB6A; }\n\n.mat-card.step-1:hover, .mat-card.step-1:focus, .mat-card.step-1:active {\n  background-color: #F5F5F5; }\n\n.mat-card.step0:hover, .mat-card.step0:focus, .mat-card.step0:active {\n  background-color: #E3F2FD; }\n\n.mat-card.step1:hover, .mat-card.step1:focus, .mat-card.step1:active {\n  background-color: #FFF3E0; }\n\n.mat-card.step2:hover, .mat-card.step2:focus, .mat-card.step2:active {\n  background-color: #FFEBEE; }\n\n.mat-card.step3:hover, .mat-card.step3:focus, .mat-card.step3:active {\n  background-color: #E8F5E9; }\n", ""]);

// exports


/*** EXPORTS FROM exports-loader ***/
module.exports = module.exports.toString();

/***/ }),

/***/ "../../../../../src/app/topics/topics.component.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return TopicsComponent; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__services_topics_list_service__ = __webpack_require__("../../../../../src/app/services/topics-list.service.ts");
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};


var TopicsComponent = (function () {
    function TopicsComponent(topicsListService) {
        this.topicsListService = topicsListService;
    }
    TopicsComponent.prototype.ngOnInit = function () {
        var _this = this;
        this.topicsListService.getTopicsList().subscribe(function (res) { return _this.topicsList = res; });
    };
    return TopicsComponent;
}());
TopicsComponent = __decorate([
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["o" /* Component */])({
        selector: 'app-topics',
        template: __webpack_require__("../../../../../src/app/topics/topics.component.html"),
        styles: [__webpack_require__("../../../../../src/app/topics/topics.component.scss")]
    }),
    __metadata("design:paramtypes", [typeof (_a = typeof __WEBPACK_IMPORTED_MODULE_1__services_topics_list_service__["a" /* TopicsListService */] !== "undefined" && __WEBPACK_IMPORTED_MODULE_1__services_topics_list_service__["a" /* TopicsListService */]) === "function" && _a || Object])
], TopicsComponent);

var _a;
//# sourceMappingURL=topics.component.js.map

/***/ }),

/***/ "../../../../../src/environments/environment.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return environment; });
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.
// The file contents for the current environment will overwrite these during build.
var environment = {
    production: false
};
//# sourceMappingURL=environment.js.map

/***/ }),

/***/ "../../../../../src/main.ts":
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__angular_core__ = __webpack_require__("../../../core/@angular/core.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__ = __webpack_require__("../../../platform-browser-dynamic/@angular/platform-browser-dynamic.es5.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__app_app_module__ = __webpack_require__("../../../../../src/app/app.module.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__environments_environment__ = __webpack_require__("../../../../../src/environments/environment.ts");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_hammerjs__ = __webpack_require__("../../../../hammerjs/hammer.js");
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_hammerjs___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_4_hammerjs__);





if (__WEBPACK_IMPORTED_MODULE_3__environments_environment__["a" /* environment */].production) {
    Object(__WEBPACK_IMPORTED_MODULE_0__angular_core__["_23" /* enableProdMode */])();
}
Object(__WEBPACK_IMPORTED_MODULE_1__angular_platform_browser_dynamic__["a" /* platformBrowserDynamic */])().bootstrapModule(__WEBPACK_IMPORTED_MODULE_2__app_app_module__["a" /* AppModule */])
    .catch(function (err) { return console.log(err); });
//# sourceMappingURL=main.js.map

/***/ }),

/***/ 0:
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__("../../../../../src/main.ts");


/***/ })

},[0]);