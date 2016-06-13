/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is the browser component of seb.
 *
 * The Initial Developer of the Original Code is Stefan Schneider <schneider@hrz.uni-marburg.de>.
 * Portions created by the Initial Developer are Copyright (C) 2005
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Stefan Schneider <schneider@hrz.uni-marburg.de>
 *   
 * ***** END LICENSE BLOCK ***** */

/* ***** GLOBAL seb SINGLETON *****

* *************************************/ 

/* 	for javascript module import
	see: https://developer.mozilla.org/en/Components.utils.import 
*/

this.EXPORTED_SYMBOLS = ["SebNet"];

/* Modules */
const 	{ classes: Cc, interfaces: Ci, results: Cr, utils: Cu } = Components,
	{ appinfo, prefs, scriptloader, io, obs, prompt } = Cu.import("resource://gre/modules/Services.jsm").Services;
Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
	
/* Services */

/* SebGlobals */
scriptloader.loadSubScript("resource://globals/prototypes.js");
scriptloader.loadSubScript("resource://globals/const.js");

/* SebModules */
XPCOMUtils.defineLazyModuleGetter(this,"sl","resource://modules/SebLog.jsm","SebLog");
XPCOMUtils.defineLazyModuleGetter(this,"su","resource://modules/SebUtils.jsm","SebUtils");
XPCOMUtils.defineLazyModuleGetter(this,"sw","resource://modules/SebWin.jsm","SebWin");
XPCOMUtils.defineLazyModuleGetter(this,"sb","resource://modules/SebBrowser.jsm","SebBrowser");
XPCOMUtils.defineLazyModuleGetter(this,"sh","resource://modules/SebHost.jsm","SebHost");

/* ModuleGlobals */
let 	seb = null,
	base = null,
	whiteListRegs =	[],
	blackListRegs = [],
	mimeTypesRegs = {
		flash : new RegExp(/^application\/x-shockwave-flash/),
		pdf : new RegExp(/^application\/(x-)?pdf/)
	},
	convertReg = /[-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g,
	wildcardReg = /\*/g,
	httpReg = new RegExp(/^http\:/i),
	sebFileReg = new RegExp(/.*?\.seb$/i),
	sebFileAttachmentReg = new RegExp(/.*?filename\=.*?\.seb/i),
	pdfFileAttachmentReg = new RegExp(/.*?filename\=.*?\.pdf/i),
	contentTypeReg = new RegExp(/content\-type/i),
	contentDispositionReg = new RegExp(/content\-disposition/i),
	sebMimetypeReg = new RegExp(SEB_MIME_TYPE,"i"),
	sendBrowserExamKey = null,
	reqHeader = "",
	reqKey = null,
	reqSalt = null,
	urlTrusted = true,
	pdfJsEnabled = false,
	blockObs = false,
	allowLoadSettings = false;

/* request Observer */

requestHeaderVisitor = function () {
        this._isSebRequest = false;
};

requestHeaderVisitor.prototype.visitHeader = function ( h, v ) {
	sl.info(h+" : "+v);
	if (contentTypeReg.test(h)) {
		if (sebMimetypeReg.test(v)) {
			this._isSebRequest = true;
		}
	}
};

requestHeaderVisitor.prototype.isSebRequest = function () {
	return this._isSebRequest;
};


requestObserver = function () {
        this.register();
        this.aborted = Cr.NS_BINDING_ABORTED;
        this.nsIHttpChannel = Ci.nsIHttpChannel;
        this.nsIChannel = Ci.nsIChannel;
        this.nsIRequest = Ci.nsIRequest;
};

requestObserver.prototype.observe = function ( subject, topic, data ) {
	if (blockObs) {
		return;
	}			
	var url, origUrl, aVisitor;
	if ( subject instanceof this.nsIHttpChannel ) {
		sl.info("");
		sl.info("-> http request modify: " + subject.name);
		origUrl = subject.URI.spec;
		url = origUrl.split("#"); // url fragment is not transmitted to the server!
		url = url[0];
		
		if (!urlTrusted) {
			if (!base.isValidUrl(url)) {
				subject.cancel( this.aborted );
				return;
			}
		}
		sl.info("request header:");
		sl.info("*****************");
		aVisitor = new requestHeaderVisitor();
		subject.visitRequestHeaders(aVisitor);
		sl.info("");
		if ( aVisitor.isSebRequest() && base.isValidUrl(subject.name) ) { // Check if RECONF_SUCCESS!
			sl.debug("abort seb request");
			if (seb.reconfState == RECONF_SUCCESS && !allowLoadSettings) {
				sl.debug("abort seb reconfigure request: Already reconfigured!");
				subject.cancel( this.aborted );
				//prompt.alert(seb.mainWin, su.getLocStr("seb.title"), su.getLocStr("seb.already.reconfigured"));
				return;
			}
			else {
				subject.cancel( this.aborted );
				seb.reconfState = RECONF_NO;
				sb.openSebFileDialog(subject.name);
				return;
			}
		}
		if (httpReg.test(url)) {
			if (base.blockHTTP) {
				sl.debug("block http request");
				subject.cancel( this.abort );
				return;
			}
			if (base.forceHTTPS) { // non common browser behaviour, experimental
				sl.debug("try redirecting request to https: " + origUrl);
				try {
					subject.redirectTo(io.newURI(origUrl.replace("http:","https:"),null,null));
				}
				catch(e) {
					sl.debug(e + "\nurl: " + url);
				}
			}
		}
	}
};

requestObserver.prototype.register = function ( ) {
        var observerService = Cc[ "@mozilla.org/observer-service;1" ].getService( Ci.nsIObserverService );
        observerService.addObserver(this, "http-on-modify-request", false);
};

requestObserver.prototype.unregister = function ( ) {
        var observerService = Cc[ "@mozilla.org/observer-service;1" ].getService( Ci.nsIObserverService );
        observerService.removeObserver( this, "http-on-modify-request" );
};

/* response Observer */

responseHeaderVisitor = function () {
        this._isSebResponse = false;
        this._isPdfResponse = false;
};

responseHeaderVisitor.prototype.visitHeader = function ( h, v ) {
	sl.info(h+" : "+v);
	if (contentTypeReg.test(h)) {
		if (sebMimetypeReg.test(v)) {
			this._isSebResponse = true;
			return;
		}
		if (mimeTypesRegs.pdf.test(v)) {
			this._isPdfResponse = true;
			return;
		}
	}
	if ( contentDispositionReg.test(h) ) {
		if ( sebFileAttachmentReg.test(v)) {
			this._isSebResponse = true;
			return;
		}
		if ( pdfFileAttachmentReg.test(v)) {
			this._isPdfResponse = true;
			return;
		}
	}
};

responseHeaderVisitor.prototype.isSebResponse = function () {
	return this._isSebResponse;
};

responseHeaderVisitor.prototype.isPdfResponse = function () {
	return this._isPdfResponse;
};

responseObserver = function () {
        this.register();
        this.aborted = Cr.NS_BINDING_ABORTED;
        this.nsIHttpChannel = Ci.nsIHttpChannel;
        this.nsIChannel = Ci.nsIChannel;
        this.nsIRequest = Ci.nsIRequest;
};

responseObserver.prototype.observe = function ( subject, topic, data ) {
	if (blockObs) {
		return;
	}
	var url, origUrl, aVisitor;
	if ( subject instanceof this.nsIHttpChannel ) {
		sl.info("");
		sl.info("<- http response examine: " + subject.name);
		origUrl = subject.URI.spec;
		url = origUrl.split("#"); // url fragment is not transmitted to the server!
		url = url[0];
		
		// check seb file if seb.reconfigState = RECONF_START
		if (seb.reconfState == RECONF_START) {
			if (sebFileReg.test(subject.name)) { // direct seb file
				sl.debug("abort seb response: direct seb file download");
				subject.cancel( this.aborted );
				base.downloadSebFile(url);
				return;
			}
			
			sl.info("response header:");
			sl.info("*****************");
			aVisitor = new responseHeaderVisitor();
			subject.visitResponseHeaders(aVisitor);
			sl.info("");
			if ( aVisitor.isSebResponse() ) {
				//uri = subject.URI;
				sl.debug("abort seb response: seb file attachment");
				subject.cancel( this.aborted );
				base.downloadSebFile(subject.name);
				return;
			}
		}
		if (pdfJsEnabled) {
			sl.info("response header:");
			sl.info("*****************");
			aVisitor = new responseHeaderVisitor();
			subject.visitResponseHeaders(aVisitor);
			sl.info("");
			if (aVisitor.isPdfResponse() && !/\.pdf$/i.test(subject.name)) {
				sl.debug("redirect pdf response mimetype");
				subject.cancel( this.aborted );
				sw.openPdfViewer(subject.name);
				return;
			}
		}
	}
};

responseObserver.prototype.register = function ( ) {
        var observerService = Cc[ "@mozilla.org/observer-service;1" ].getService( Ci.nsIObserverService );
        observerService.addObserver(this, "http-on-examine-response", false);
        observerService.addObserver(this, "http-on-examine-cached-response", false);
};

responseObserver.prototype.unregister = function ( ) {
        var observerService = Cc[ "@mozilla.org/observer-service;1" ].getService( Ci.nsIObserverService );
        observerService.removeObserver( this, "http-on-examine-response" );
        observerService.removeObserver(this, "http-on-examine-cached-response");
};


this.SebNet = {
	reqObs : null,
	respObs : null,
	forceHTTPS : false,
	blockHTTP : false,
	
	init : function(obj) {
		base = this;
		seb = obj;
		base.setListRegex();
		base.setReqHeader();
		base.setSSLSecurity();
		pdfJsEnabled = su.getConfig("sebPdfJsEnabled","boolean", true);
		allowLoadSettings = su.getConfig("loadURLAllowLoadingNewSettings", false);
		sl.debug("pdfJsEnabled:" + pdfJsEnabled);
		base.respObs = new responseObserver();
		base.reqObs = new requestObserver();
		sl.out("SebNet initialized: " + seb);
	},
	
	initProxies : function() {
		if (typeof seb.config["proxies"] != "object") { sl.debug("no proxies defined."); return; }
		let proxies = su.getConfig("proxies","object",null);
		let p = base.getProxyType(proxies);
		if (typeof p === "number") {
			prefs.setIntPref("network.proxy.type",p);
			sl.debug("network.proxy.type:"+p);
		}
		p = proxies["AutoConfigurationURL"];
		if (typeof p === "string" && p != "") {
			prefs.setCharPref("network.proxy.autoconfig_url",p);
			sl.debug("network.proxy.autoconfig_url:"+p);
		}
		p = proxies["HTTPProxy"];
		if (typeof p === "string" && p != "") {
			prefs.setCharPref("network.proxy.http",p);
			sl.debug("network.proxy.http:"+p);
		}
		p = proxies["HTTPPort"];
		if (typeof p === "number") {
			prefs.setIntPref("network.proxy.http_port",p);
			sl.debug("network.proxy.http_port:"+p);
		}
		p = proxies["HTTPSProxy"];
		if (typeof p === "string" && p != "") {
			prefs.setCharPref("network.proxy.ssl",p);
			sl.debug("network.proxy.ssl:"+p);
		}
		p = proxies["HTTPSPort"];
		if (typeof p === "number") {
			prefs.setIntPref("network.proxy.ssl_port",p);
			sl.debug("network.proxy.ssl_port:"+p);
		}
		p = proxies["FTPProxy"];
		if (typeof p === "string" && p != "") {
			prefs.setCharPref("network.proxy.ftp",p);
			sl.debug("network.proxy.ftp:"+p);
		}
		p = proxies["FTPPort"];
		if (typeof p === "number") {
			prefs.setIntPref("network.proxy.ftp_port",p);
			sl.debug("network.proxy.ftp_port:"+p);
		}
		p = proxies["SOCKSProxy"];
		if (typeof p === "string" && p != "") {
			prefs.setCharPref("network.proxy.socks",p);
			sl.debug("network.proxy.socks:"+p);
		}
		p = proxies["SOCKSPort"];
		if (typeof p === "number") {
			prefs.setIntPref("network.proxy.socks_port",p);
			sl.debug("network.proxy.socks_port:"+p);
		}
		p = proxies["ExceptionsList"];
		if (typeof p === "object" && p != null) {
			p = p.join(",") + ",localhost,127.0.0.1";
			prefs.setCharPref("network.proxy.no_proxies_on",p);
			sl.debug("network.proxy.no_proxies_on:"+p);
		}
	},
	
	getProxyType : function(proxies) {
		let p = proxies["AutoDiscoveryEnabled"];
		if ( (typeof p === "boolean") && p) {
			return 4;
		}
		p = proxies["AutoConfigurationEnabled"];
		// auto config url
		if ( (typeof p === "boolean") && p) {
			return 2;
		}
		// system proxy
		p = proxies["proxySettingsPolicy"];
		if ( (typeof p === "number") && p == 0) {
			return 5;
		}
		// http(s) proxy
		p = proxies["HTTPEnable"];
		let p2 = proxies["HTTPSEnable"];
		if ( (typeof p === "boolean" && p) || (typeof p2 === "boolean" && p2) ) {
			return 1;
		}
		return null;
	},
	
	setListRegex : function() { // for better performance compile RegExp objects and push them into arrays
		sl.debug("setListRegex"); 
		urlTrusted = su.getConfig("urlFilterTrustedContent","boolean",true);
		//sl.debug(typeof seb.config["urlFilterRegex"]);
		let is_regex = (typeof seb.config["urlFilterRegex"] === "boolean") ? seb.config["urlFilterRegex"] : false;
		sl.debug("urlFilterRegex: " + is_regex);
		
		let b = seb.config["blacklistURLFilter"];
		let w = seb.config["whitelistURLFilter"];
		
		switch (typeof b) {
			case "string" :
				if (b == "") {
					b = false;
				}
				else {
					b = b.split(";");
				}
			break;
			case "object" :
				// do nothing
			break;
			default :
				b = false;
		}
		
		switch (typeof w) {
			case "string" :
				if (w == "") {
					w = false;
				}
				else {
					w = w.split(";");
				}
			break;
			case "object" :
				// do nothing
			break;
			default :
				w = false;
		}
			
		if (b) {
			for (var i=0;i<b.length;i++) {
				sl.debug("Add blacklist pattern: " + b[i]);
				if (is_regex) {
					blackListRegs.push(new RegExp(b[i]));
				}
				else {
					blackListRegs.push(new RegExp(base.getRegex(b[i])));
				}
			}
		}
		if (w) {
			for (var i=0;i<w.length;i++) {
				sl.debug("Add whitelist pattern: " + w[i]);
				if (is_regex) {
					whiteListRegs.push(new RegExp(w[i]));
				}
				else {
					whiteListRegs.push(new RegExp(base.getRegex(w[i])));
				}
			}
		}
	},
	
	getRegex : function (p) {
		var reg = p.replace(convertReg, "\\$&");
		reg = reg.replace(wildcardReg,".*?");
		return reg;
	},
	
	isValidUrl : function (url) {
		if (whiteListRegs.length == 0 && blackListRegs.length == 0) return true;
		var m = false;
		var msg = "";		
		sl.debug("check url: " + url);
		msg = "NOT VALID: " + url + " is not allowed!";							
		for (var i=0;i<blackListRegs.length;i++) {
			if (blackListRegs[i].test(url)) {
				m = true;
				break;
			}
		}
		if (m) {
			sl.debug(msg);				
			return false; 
		}
		if (whiteListRegs.length == 0) {
			return true;
		}
		for (var i=0;i<whiteListRegs.length;i++) {
			if (whiteListRegs[i].test(url)) {
				m = true;
				break;
			}
		}
		if (!m) {								
			sl.debug(msg);
			return false;
		}
		return true;	
	},
	
	setReqHeader : function() {
		sl.debug("setReqHeader");
		sendBrowserExamKey = su.getConfig("sendBrowserExamKey","boolean",false);
		if (!sendBrowserExamKey) { return; }
		let rh = su.getConfig("sebBrowserRequestHeader","string","");
		let rk = su.getConfig("browserExamKey","string","");
		let rs = su.getConfig("browserURLSalt","boolean",true);
		
		if (rh != "" && rk != "") {
			reqHeader = rh;
			reqKey = rk;
			reqSalt = rs;
		}
	},
	
	getRequestValue : function (url,key) {
		return su.getHash(url+key);
	},
	
	setSSLSecurity : function () {
		base.forceHTTPS = (su.getConfig("sebSSLSecurityPolicy","number",SSL_SEC_BLOCK_MIXED_ACTIVE) == SSL_SEC_FORCE_HTTPS);
		base.blockHTTP = (su.getConfig("sebSSLSecurityPolicy","number",SSL_SEC_BLOCK_MIXED_ACTIVE) == SSL_SEC_BLOCK_HTTP);
		sl.debug("forceHTTPS: " + base.forceHTTPS);
		sl.debug("blockHTTP: " + base.blockHTTP);
	},
	
	downloadSebFile : function(url) {
		var xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
		sb.dialogHandler("seb file download");
		xhr.onload = function() {
			if (xhr.readyState === 4) {
				sl.debug("async get request done: " + xhr.status);
				if (xhr.status === 200) {
					sl.debug(xhr.response);
					var blob = xhr.response;
					sl.debug(blob.size);
					sb.dialogHandler("seb file downloaded: " + blob.size);
					sh.sendMessage(blob);
					blockObs = false;
				}
				else {
					sl.debug("could not load seb file url: " + "\status: " + xhr.status);
					sb.dialogHandler("could not load seb file: " + xhr.status);
					blockObs = false;
				}
			}
		}
		xhr.onerror = function() {
			blockObs = false;
		}
		xhr.responseType = "blob";
		xhr.open("GET", url, true);
		if (sendBrowserExamKey) {
			var k;
			if (reqSalt) {								
				k = base.getRequestValue(url, reqKey);
				sl.info("seb file download: get req value: " + url + " : " + reqKey + " = " + k);
			}
			else {
				k = reqKey;
			}
			xhr.setRequestHeader(reqHeader, k);
		}
		blockObs = true;
		xhr.send(null);
	}
	
}
