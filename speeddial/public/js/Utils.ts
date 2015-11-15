/// <reference path="libs/chrome.d.ts" />
/// <reference path="libs/jquery.d.ts" />
/// <reference path="libs/SettingsManager.ts" />

module Utils {

	/**
	 * Abstracts the non-flat structure of the config structure and allows iterating through the sites.
	 * @param config config file containing the sites
	 * @param callback called with the data for each site, return true to break from the loop early.
	 */
	export function forEachSite(config: any, callback:(site:any, page:any)=>boolean):void {
		var data = [], site, brand, i, j, k;
		for (var page in config) {
			if (config.hasOwnProperty(page)) {
				if (config[page]['brands']) {
					for (i = 0; i < config[page]['brands'].length; i += 1) {
						brand = config[page]['brands'][i];
						for (j = 0; j < brand['sites'].length; j += 1) {
							site = brand.sites[j];
							if (callback(site, config[page])) return;
						}
					}
				} else {
					for (k = 0; k < config[page]['sites'].length; k += 1) {
						site = config[page]['sites'][k];
						if (callback(site, config[page])) return;
					}
				}
			}
		}
	}

	function optionIsNotSet(option:any):boolean {
		return (typeof(option) === 'undefined' || option === null);
	}

	/**
	 * Sets the default options for first time users.
	 */
	export function setupDefaultOptions (settings:SettingsManager):void {
		if (!settings.getSetting('left-click')) {settings.setSetting('left-click', 'production');}
		if (!settings.getSetting('middle-click')) {settings.setSetting('middle-click', 'production');}
		if (!settings.getSetting('right-click')) {settings.setSetting('right-click', 'none');}

		if (optionIsNotSet(settings.getSetting('show-quick-landing'))) {settings.setSetting('show-quick-landing', true);}
		if (optionIsNotSet(settings.getSetting('new-admin'))) {settings.setSetting('new-admin', false);}
		if (optionIsNotSet(settings.getSetting('show-outlet'))) {settings.setSetting('show-outlet', true);}

		if (optionIsNotSet(settings.getSetting('default-page'))) {settings.setSetting('default-page', 'last-page');}
		if (optionIsNotSet(settings.getSetting('landing-page'))) {settings.setSetting('landing-page', '/default.aspx');}

		// Set defaults / instantiate options.
		if (!settings.getSetting('savedPages')) {
			settings.setSetting('savedPages', {});
		}

		if (!settings.getSetting('color-highlight-saved-pages')) {
			settings.setSetting('color-highlight-saved-pages', '#ff69b4');
		}
		if (!settings.getSetting('customLinks')) {
			settings.setSetting('customLinks', {
				'external-1': {url: 'http://external-site-1.abc', order: 1},
				'external-2': {url: 'http://external-site-2.abc', order: 2},
				'external-3': {url: 'http://external-site-3.abc', order: 3},
			});
		}
	}
}