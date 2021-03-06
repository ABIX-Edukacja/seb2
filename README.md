Standalone Browser Component of Safe-Exam-Browser
=================================================

This is the core browser component for Safe-Exam-Browser.
For SEB binary releases please refer to http://www.safeexambrowser.org

Refactored seb:

* general code refactoring
* splitted seb.jsm into functional modules
* getting rid of xullib.jsm
* improved config mode
* improved nodejs based seb server with native html5 support without binaryjs and jquery

## OS Support ##

* Windows 32/64Bit
* Linux   32/64Bit
* OSX 10.x 64Bit

## Requirements ##

Cloning seb2 repo:

```
git clone https://github.com/eqsoft/seb2.git
```

### Firefox installation

Since Mozilla canceled the provisioning of xulrunner binaries, we restricted seb2 hosting to a native Firefox 52.x ESR.

* Download Firefox ESR binaries: https://www.mozilla.org/en-US/firefox/organizations/all/
* Proceed a **USER DEFINED(!)** installation setup to the prepared Firefox folders, otherwise your local Browser installation will be damaged!

```
./firefox/YOUR_OS/XXBit/
```

**!WARNING**: deny automatic (re)starting of Firefox after installation setup is finished, otherwise your local Firefox profile will be damaged!

* you may start the standalone Firefox for testing or upgrading the ESR Firefox binaries, so manually replacing 52.x ESR versions is not required:

```
./firefox/YOUR_OS/firefoxXXBit.bat (or firefoxXXBit.sh for linux and mac)
```

The start script populates the local profile folders:

```
./firefox/YOUR_OS/firefoxProfileXXBit/
```

## Quick Start

After cloning the repo and installation of a local Firefox 52.x ESR you can start seb2 with a default config:

```
./browser/bin/YOUR_OS/XXBit/start.sh
```

debug mode:

```
./browser/bin/YOUR_OS/XXBit/debug.sh
```

The debug mode creates a log file: ./browser/bin/YOUR_OS/sebProfileXXBit/seb.log.

You can increase the verbosity of the logfile in the debug.sh:

```
-debug 2
``` 

Closing seb2:

Right click on the taskbar icon to close the main browser window. The default password is: ```password```.

## Configuration ##

seb2 first loads a set of default configuration params in ```./browser/app/default.json``` and then looks for a runtime config in the commandline param ``` -config PARAM ```. 
The commandline parameter might be:
* any absolute path
* any url with file:// or http(s) protocol to a local or remote config json file. 
* the param can also be a stringified or a base64 encoded json object. A base64 encoded string param is used by windows SEB configuration of the embedded seb2
* just a filename p.e. ```config.dev.json``` placed in ```./browser/app/config.*.json```

The custom config object is merged into the default config object with the precedence of custom config params.

There are three kinds of configuration params:

* only used in standalone seb (prefixed with seb*)
* only used in embedded seb
* used in both modes  

The params are listed in alphabetical order:

#### Parameter

* type: datatype (default)
* description
* optional examples
* optional links to acssociated params

## seb2 (only standalone, not handled by Windows SEB) ##

#### sebAllCARootTrust ####

* type: boolean (true)
* All embedded ca certificates are treated as trusted root, so only the ca-signing cert of the requested server cert needs to be included. If set to **false** (experimental) the root cert and all intermediate certs must be embedded.
* see also: [embeddedCertificates](#embeddedcertificates)  

#### sebBrowserRequestHeader ####

* type: string ("X-SafeExamBrowser-RequestHash")
* If [sendBrowserExamKey](#sendbrowserexamkey) is **true** a custom request header field is added to each request. It is not recommanded to change the name of the header field for compatibility issues.
* The corresponding header key value is described in: [browserExamKey](#browserexamkey)

#### sebDisableOCSP ####

* type: boolean (true)
* Disables the browser requesting any OCSP Server (Online Certificate Status Protocol). Enabling is not recommanded, because seb might hang up if the ocsp server can not be reached caused by firewall rules, server down etc. The param is mapped to the native firefox pref "security.OCSP.enabled":0|1

#### sebErrorPage ####

* type: boolean (true)
* If **false** internal error page is disabled

#### sebMainBrowserWindowTitlebarEnabled ####

* type: boolean (false)
* Set or disables a titlebar frame around the main window. It is NOT recommanded to change this value because it is altered internally dependant on other parameter conditions.
* see also: [browserView](#browserview), [touchOptimized](#touchoptimized)

#### sebMainBrowserWindowMaximized ####

* type: boolean (true)
* Enables a maximized main window. It is NOT recommanded to change this value because it is altered internally dependant on other parameter conditions.
* see also: [browserView](#browserview), [touchOptimized](#touchoptimized)

#### sebNewBrowserWindowByLinkTitlebarEnabled ####

* type: boolean (true)
* Set or disables a titlebar frame around any new window. It is NOT recommanded to change this value because it is altered internally dependant on other parameter conditions.
* see also: [touchOptimized](#touchoptimized)

#### sebNewBrowserWindowMaximized ####

* type: boolean (false)
* Enables a maximized new window. It is NOT recommanded to change this value because it is altered internally dependant on other parameter conditions.
* see also: [touchOptimized](#touchoptimized)

#### sebPdfJsEnabled ####

* type: boolean (true)
* Use embedded pdfjs library for displaying inline PDF documents

#### sebPrefs ####

* type: object
* default:

```
"sebPrefs": {
	"network.proxy.type" 	: 0,
	"network.proxy.no_proxies_on" : "localhost,127.0.0.1",
	"layout.spellcheckDefault" : 2,
	"spellchecker.dictionary": "en-US",
	"extensions.ui.dictionary.hidden": false,
	"media.navigator.video.enabled" : false,
	"media.getusermedia.audiocapture.enabled" : false
},
```

* generic default firefox preferences, maybe overridden by other config params.
* see also:  [sebPrefsMap](#sebprefsmap)

#### sebPrefsMap ####

* type: object
* default:

```
"sebPrefsMap": {
	"browser.download.dir" 		: "downloadDirectoryWIN",
	"dom.disable_open_during_load" 	: "blockPopUpWindows",
	"javascript.enabled" 		: "enableJavaScript",
	"media.navigator.video.enabled" : "allowVideoCapture",
        "media.getusermedia.audiocapture.enabled" : "allowAudioCapture",
	"general.useragent.override" 	: { "cb" : "browserUserAgent"},
	"browser.zoom.full" 		: { "cb" : "browserZoomFull" },
	"zoom.maxPercent" 		: { "cb" : "zoomMaxPercent" },
	"zoom.minPercent" 		: { "cb" : "zoomMinPercent" },
	"plugin.state.flash"		: { "cb" : "pluginEnableFlash" },
	"plugin.state.java"		: { "cb" : "pluginEnableJava" },
	"layout.spellcheckDefault" 	: { "cb" : "spellcheckDefault" }
},
```

* Generic Firefox preferences values are dedicated to seb config params or callback functions for extended processing. They are iterated in ```app/modules/SebConfig.jsm```.

#### sebRebootKeyEnabled ####

* type: boolean (false)
* Key for reboot the OS (default: Ctrl-Alt-Shift-F10, see ```browser/app/chrome/content/seb/seb.xul```). Only used in Linux environments.

#### sebServer ####

* type: object
* default:

```
{
	"url"    : "https://www.simple.org:8442/websocket/index.html",
	"socket" : "wss://www.simple.org:8442"
},
```

* websocket server: Only used in Linux environments and development mode.

#### sebScreenshot (not used, experimental) ####

* type: boolean (false)

#### sebScreenshotImageType (not used, experimental) ####

* type: string ("image/jpeg")

#### sebScreenshotSound (not used, experimental) ####

* type: boolean (false)

#### SebServerEnabled ####

* type: boolean (false)
* see also: [sebServer](#sebserver)

#### sebSSlSecurityPolicy ####

* type: integer (1)

* **SSL_SEC_NONE = 0** : allow all http and https and mixed contents
* **SSL_SEC_BLOCK_MIXED_ACTIVE = 1** : default: block mixed active contents (scripts...), display contents are allowed (img, css...) = firefox default behaviour
* **SSL_SEC_BLOCK_MIXED_ALL = 2** : block all mixed contents
* **SSL_SEC_FORCE_HTTPS = 3** : try redirecting http to https. Beware! this is not a common browser behaviour! The web app should be fixed instead of rewriting the request on the client side!
* **SSL_SEC_BLOCK_HTTP = 4** : block all http requests

## SEB (handled by both: Windows SEB and embedded seb2 ) ##

#### additionalResources ####

* type: object ({})
* nested object tree with additional embedded ressources from different types.
* examples:

* An external ressource is triggered by another embedded link. 
The same external ressource can also be triggered by pressing Ctrl-L.

```
{
	"identifier": "0",
	"additionalResources": [],
	"active": true,
	"autoOpen": false,
	"title": "LinkURL",
	"url": "https://www.simple.org:8443/demo/index.html",
	"resourceDataFilename": "",
	"resourceDataLauncher": 0,
	"resourceData":"",
	"linkURL" : "https://www.simple.org:8443/linkurl",
	"refererFilter":"test.html",
	"resetSession":true,
	"allowLoadingNewSettings":false,
	"key":"L",
	"modifiers":"control",
	"confirm":true,
	"showButton":""
}

```

* In standalone mode ARS p.e. may be used to trigger a quitURL by an embedded link or system keys (here only keys Ctrl-Q):


```
{
	"identifier": "1",
	"additionalResources": [],
	"active": true,
	"autoOpen": false,
	"title": "quitURL",
	"url": "https://www.simple.org:8443/quit",
	"resourceDataFilename": "",
	"resourceDataLauncher": 0,
	"resourceData":"",
	"linkURL" : "",
	"refererFilter":"test.html",
	"resetSession":true,
	"allowLoadingNewSettings":false,
	"key":"Q",
	"modifiers":"control",
	"confirm":true,
	"showButton":""
}
```

* the example above should work in development mode. 
* The ARS are used in Windows SEB mainly for accessing embedded ressources or seb files for reconfiguration.

#### allowAudioCapture ####

* type: boolean (true)
* capturing system sound
* see also: [sebPrefsMap](#sebprefsmap)

#### allowBrowsingBackForward ####

* type: boolean (false)
* If true: shows navigation elements in browser toolbar of the main window (if [enableBrowserWindowToolbar](#enablebrowserwindowtoolbar) is generally enabled).

#### allowQuit ####

* type: boolean (true)
* If set to false, the quit function will be disabled. The param will be ignored if the the quit event is fired by the windows (hostForceQuit) host or a quitURL is detected.
The quit concepts are really complicated see: seb.jsm "quit: function"
* see also: [quitURL](#quiturl), [quitURLRefererFilter](#quiturlrefererfilter), [hashedQuitPassword](#hashedquitpassword)

#### allowSpellCheck ####

* type: boolean (false)
* allows spellchecking in input fields (<textarea>, <input type="text">, ...) 
* **false** is mapped to layout.spellcheckDefault:0, **true** is mapped layout.spellcheckDefault:2 (in multi and single line inputfields)
* see also: [sebPrefsMap](#sebprefsmap), http://kb.mozillazine.org/Layout.spellcheckDefault

#### allowSpellCheckDictionary (not in use?) ####

* type: string ("de-DE")

#### blacklistURLFilter ####

* type: string|array ([])
* array or semicolon seperated list of blocked url rules. The rules are processed before whitelistURLFilter. 
* see also: [whitelistURLFilter](whitelisturlfilter), [urlFilterRegex](#urlfilterregex), [urlFilterTrustedContent](#urlfiltertrustedcontent)

#### blockPopUpWindows (not implemented) ####

#### browserExamKey ####

* type: string ("SEBKEY")
* If [sendBrowserExamKey](#sendbrowserexamkey) is **true** each seb request adds a special key as request-header value of [sebBrowserRequestHeader](#sebbrowserrequestheader). If [browserURLSalt](#browserurlsalt) is **true**, the key value is prefixed by the requested url+key before hashing.

#### browserLanguage ####

* type: string ("en-US")
* set the default language of the browser gui (does not work on internal browser messages which depends on the language of the browser binary; needs additional spec)

#### browserMessagingPingTime (only used in embedded seb) ####

* type: number (120000)
* Every 2 minutes (120000 ms) a keepalive ping is sent from seb2 to windows host

#### browserMessagingSocket (only used in embedded seb) ####

* type: string (ws://www.simple.org:8706)
* websocket server connection for ipc communication with windows host

#### browserMessagingSocketEnabled ####

* type: boolean (embedded=true | standalone=false)
* enables messaging websocket server

#### browserScreenKeyboard (only used in embedded seb) ####

* type: boolean (false)
* If **true** creates eventhandler for input fields in html document for OnScreenKeyboard handling in windows touch devices.

#### browserURLSalt (only used in embedded seb) ####

* type: boolean (true)
* If true the browserExamKey is prefixed by the request url before hashing
* see also: [browserExamKey](#browserexamKey)
 
#### browserUserAgent ####

* type: string ("SEB 2.2")
* If not empty the browserUserAgent string is appended to the DEFAULT or CUSTOM UserAgent strings.
* see next params:

#### browserUserAgentWinDesktopMode (used if **touchOptimized=false**) ####

* type: number (0 default | 1) ? should 0 be the default value
* 0=BROWSER_UA_DESKTOP_DEFAULT : The default UserAgent string from the underlying firefox browser is detected, "seb" is replaced by "Firefox" and everything is suffixed with [browserUserAgent](#browserUserAgent)
* 1=BROWSER_UA_DESKTOP_CUSTOM : A custom UserAgent string from [browserUserAgentWinDesktopModeCustom](#browseruseragentwindesktopmodecustom) which is suffixed with [browserUserAgent](#browserUserAgent)

#### browserUserAgentWinTouchMode ####

* type: number (0 default | 1) ? should 0 be the default value
* 0=BROWSER_UA_TOUCH_DEFAULT : The default UserAgent string from the underlying firefox browser is detected, "seb" is replaced by "Firefox" and everything suffixed with ";Touch " and [browserUserAgent](#browserUserAgent)
* 1=BROWSER_UA_TOUCH_IPAD : A custom UserAgent string from [browserUserAgentWinTouchModeIPad](#browseruseragentwintouchmodeipad) which is suffixed with [browserUserAgent](#browseruseragent) 
* 2=BROWSER_UA_TOUCH_CUSTOM : A custom UserAgent string from [browserUserAgentWinTouchModeCustom](#browseruseragentwintouchmodecustom) which is suffixed with [browserUserAgent](#browseruseragent)

#### browserUserAgentWinDesktopModeCustom ####

* type: string ("")
* Custom UserAgent string in Windows Desktop Mode

#### browserUserAgentWinTouchModeIPad ####

* type: string ("")
* Custom UserAgent string in iPad Touch Mode

#### browserUserAgentWinTouchModeCustom ####

* type: string ("")
* Custom UserAgent string in Touch Mode

#### browserViewMode ####

* type: number (0|1 default)
* 0 = The main window is NOT maximized to fullscreen and the window can manually be resized by dragging the titlebar around the frame. Size and position settings are processed [mainBrowserWindowHeight](#mainbrowserwindowheight), [mainBrowserWindowPositioning](#mainbrowserwindowpositioning), [mainBrowserWindowWidth](#mainbrowserwindowwidth).
* 1 = The main window is maximized to fullscreen without any frame around it and any size and position settings (see above) are ignored.
* If [touchOptimized](#touchoptimized) is **true** the browserViewMode setting is ignored internally set to 1 (= maximized) for all windows

#### browserWindowAllowReload ####

* type: boolean (true)
* If true: allows to reload the main window, either with reload button or websocket event.
* See also: [enableBrowserWindowToolbar](#enablebrowserwindowtoolbar), [newBrowserWindowAllowReload](#enablebrowserwindowtoolbar)

#### browserWindowTitleSuffix ####

* type: string ("")
* If not empty the window title is suffixed with browserWindowTitleSuffix

#### downloadDirectoryWin (not implemented) ####

#### embeddedCertificates ####
* type: array of cert objects ([])
* cert objects: { ("certificateDataBase64"|"certificateDataWin") : base64string, "type": number (see TYPE_ENUM), "name": string (only mandatory on type:3(=CERT_SSL_DEBUG) }

TYPE_ENUM:

* CERT_SSL = **0**, normal SSL cert, needs anyway a trusted ca in the cert storage. Server certs actually not need to be embedded if a trusted ca is in the storage.
* CERT_USER = **1**, reserved to windows host, not implemented?
* CERT_CA = **2**, CA cert
* CERT_SSL_DEBUG = **3**, debug SSL cert, any untrusted, expired or self-signed cert will be registered for trusted accessing the given "name":"DOMAIN" attribute. Same effect if you add an cert exception by importing a server cert in the firefox cert manager, which in fact adds this exception rule to the cert_override.txt in memory. This is really helpful if you need to access self-signed or expired ssl certs. The CERT_SSL_DEBUG is only recommanded in case of emergency or debugging.

CA embedding example: ```./browser/app/config.dev.json``` with embedded root and signing ca certs from ```./pki/ca/(root|signing)-ca.crt``` 

#### enableBrowserWindowToolbar ####

* type: boolean (true)
* enables a browser toolbar in all windows
* **main window**: if at least one of the following configs is true: [allowBrowsingBackForward](#allowbrowsingbackforward) or [browserWindowAllowReload](#browserwindowallowreload)
* **popup window**: if at least one of the following configs is true: [allowBrowsingBackForward](#allowbrowsingbackforward) or [browserWindowAllowReload](#browserwindowallowreload) 

#### enableJava ####

* type: boolean (false)
* enables JavaPlugin

#### enableJavaScript (not implemented) ####

#### enablePlugIns ####

* type: boolean (false)
* enables FlashPlugin

#### enableZoomPage (bundled) ####
#### enableZoomText (bundled) ####

* type: boolean (true)
* if **false** zooming factor for both max and min is 100%=disabled
* see also [zoomMode](#zoommode)

#### hashedQuitPassword ####

* type: base64String ("5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8" = "password")
* If not empty a password dialog needs to be confirmed before browser quit (ignored on quitURL)

#### mainBrowserWindowHeight ####

* type: string|number ("NUMBER%"|"NUMBER"|NUMBER) 
* Setting the height of the main window either in "%" or pixel size. Do not append "px" to the numbers, because the setting is implicit treated as px data.
* On default the setting is ignored (see [browserViewMode](#browserviewmode) = 1)
* see also [touchOptimized](#touchoptimized)

#### mainBrowserWindowPositioning ####

* type: number (0=left|1=center (default)|2=right)
* On default the setting is ignored (see [browserViewMode](#browserviewmode) = 1)
* see also [touchOptimized](#touchoptimized)

#### mainBrowserWindowWidth ####

* type: string|number ("NUMBER%"|"NUMBER"|NUMBER) 
* Setting the width of the main window either in "%" or pixel size. Do not append "px" to the numbers, because the setting is implicit treated as px data.
* On default the setting is ignored (see [browserViewMode](#browserviewmode) = 1)
* see also [touchOptimized](#touchoptimized)


#### newBrowserWindowAllowReload ####

* type: boolean (true)
* If true: allows to reload popup windows, either with reload button or websocket event.
* See also: [browserWindowAllowReload](#browserwindowallowreload), [enableBrowserWindowToolbar](#enablebrowserwindowtoolbar)

#### newBrowserWindowByLinkBlockForeign ####

* not implemented

#### newBrowserWindowByLinkHeight ####

* type: string|number ("NUMBER%"|"NUMBER"|NUMBER) 
* Setting the height of any new window either in "%" or pixel size. Do not append "px" to the numbers, because the setting is implicit treated as px data.
* On [touchOptimized](#touchoptimized) = **true** the size settings will be ignored (all windows = maximized)

#### newBrowserWindowByLinkPolicy ####

* not implemented

#### newBrowserWindowByLinkPositioning ####

* type: number (0=left|1=center (default)|2=right)
* On [touchOptimized](#touchoptimized) = **true** the size settings will be ignored (all windows = maximized)

#### newBrowserWindowByLinkWidth ####

* type: string|number ("NUMBER%"|"NUMBER"|NUMBER) 
* Setting the width of any new window either in "%" or pixel size. Do not append "px" to the numbers, because the setting is implicit treated as px data.
* On [touchOptimized](#touchoptimized) = **true** the size settings will be ignored (all windows = maximized)

#### newBrowserWindowByScriptBlockForeign ####

* not implemented

#### newBrowserWindowByScriptPolicy ####

* not implemented

#### newBrowserWindowNavigation ####

* type: boolean (false)
* If true: shows navigation elements in browser toolbar in popup windows (if [enableBrowserWindowToolbar](#enablebrowserwindowtoolbar) is generally enabled).
* See also [browserWindowAllowReload](#browserwindowallowreload)

#### pinEmbeddedCertificates ####

* type: boolean (false)
* Setting to true will remove ALL trusted default certificates from mozilla cert storage. I don't think this setting is very usefull because in my opinion it is cleaner to restrict access to any sites with white- or blacklists (). The restriction / pinning to the embedded certs by removing all trusted root ca certs might lead to uncomely error messages (try: set pinEmbeddedCertificates:true and startURL:"https://www.google.com" :-|)

#### proxies ####

* type : object ({})
* example:

```
"proxies": {
		"ExceptionsList" : [
			"*.local",
			"169.254/16"
		],
		"HTTPProxy":"www.simple.org",
		"HTTPPort" : 8337,
		"HTTPEnable": true,
		"Auth":true,
		"AuthType": "basic",
		"Realm": "Basic Area",
		"User":"demo",
		"Password":"demo"
},
```

* the example above should work in development mode (see [Infos for Developer](#infos_for_developer)

#### proxySettingsPolicy ####

* type: integer (1)
* 0 = SEB Config Proxy Settings (not recommanded, should be tested on client and network infrastructure before!)
* 1 = System Proxy

#### quitURL ####

* type: string ("")
* A quitURL request will shutdown the browser. The quit
* See also  [quitURLRefererFilter](#quiturlrefererfilter), [additionalResources](#additionalresources)

#### quitURLRefererFilter ####

* type: string ("")
* If not empty the quitURL will only be executed if the current page url contains the quitURLRefererFilter string.

#### removeBrowserProfile ####

* type: boolean (false)
* Removes the content of the profile folder after quit.

#### restartExamPasswordProtected (not implemented) ####
#### restartExamText (not implemented) ####
#### restartExamURL (not implemented) ####
#### restartExamUseStartURL (not implemented) ####

#### sendBrowserExamKey ####

* type: boolean (true)
* if **true** a special request header is added to each request, so the server might block any invalid and unauthorized requests.
* see also: [sebBrowserRequestHeader](#sebbrowserrequestheader), [browserExamKey](#browserexamkey), [browserURLSalt](#browserurlsalt)

#### showReloadWarning ####

* type: boolean (false)
* If true shows a Reload Warning before reloading the page

#### showTaskBar ####

* type boolean (false)
* If **true** shows a taskbar around the window. It is not recommanded to set this parameter because the taskbar is handled by other params like [browserViewMode](#browserviewmode) and [touchOptimzed](#touchoptimzed)

#### startURL ####

* type: string ("https://github.com/eqsoft/seb2")
* The start url of the browser

#### taskBarHeight ####

* type: number (0)
* Sets the height of the taskbar. It is not recommanded to set this parameter because the taskbar is handled by other params like [browserViewMode](#browserviewmode) and [touchOptimzed](#touchoptimzed)

#### touchOptimized ####

* type: boolean (false)
* Optmizes some gui features in touch mode

#### urlFilterTrustedContent ####

* type: boolean (true)
* If set to **false** EVERY resource request (html, css, js, images ....) request is validated by the whitelistURLFilter and blacklistURLFilter. 
Invalid document requests are blocked with alert message, invalid embedded ressources are blocked silently. The default setting **true** only validates the document url and validation check is skipped for embedded ressources.

#### urlFilterRegex ####

* type: boolean (false)
* If set to **true** the filter rules are treated as regex patterns
* see also: [blacklistURLFilter](blacklisturlfilter), [whitelistURLFilter](whitelisturlfilter)

#### whitelistURLFilter ####

* type: string|array ([])
* array or semicolon seperated list of allowed url rules. The rules are processed after blacklistURLFilter.
* see also: [blacklistURLFilter](blacklisturlfilter), [urlFilterRegex](#urlfilterregex), [urlFilterTrustedContent](#urlfiltertrustedcontent)

#### zoomMode ####

* type: number (0)
* 0=browserZoomFull=true 1=browserZoomFull=false

## Websocket Handler ##

## Infos for Developer 
