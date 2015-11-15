'use strict';

var casper = require('casper').create({
	//verbose: true,
	logLevel: 'debug'
});
var config = require('../speeddial/public/config.json');
require('utils');//.dump(config);

var saveDir = 'screenshots';
var limitToBrand = '';

casper.start();

/**
 * Abstracts the non-flat structure of the config structure and allows iterating through the sites.
 * @param config config file containing the sites
 * @param callback called with the data for each site, returns true to break from the loop early.
 */
function forEachSite(config, callback) {
	var data = [], site, brand, i, j, k;
	for (var page in config) {
		if (config.hasOwnProperty(page)) {
			if (config[page]['brands']) {
				for (i = 0; i < config[page]['brands'].length; i += 1) {
					brand = config[page]['brands'][i];
					for (j = 0; j < brand['sites'].length; j += 1) {
						site = brand.sites[j];
						if (callback(site, config[page]['abr'])) return;
					}
				}
			} else {
				for (k = 0; k < config[page]['sites'].length; k += 1) {
					site = config[page]['sites'][k];
					if (callback(site, 'pdt')) return;
				}
			}
		}
	}
}

function captureSite (context, url, filename) {
	casper.thenOpen(url, function() {

		// Try to close any stupid modals/popups.
		if (context.exists('a.ui-dialog-titlebar-close'))
			context.click('a.ui-dialog-titlebar-close');

		if (context.exists('button#agegatesubmit'))
			context.click('button#agegatesubmit');

		context.captureSelector(filename, 'body');
		context.echo('captured ' + filename);
	});
}


casper.then(function() {
	this.viewport(1600, 1080);
	var that = this;

	forEachSite(config, function(site, brandAbbreviation) {
		if (site['no-fetch'] || site['no-image'] || site['placeholder']) {return;}
		if (limitToBrand && brandAbbreviation !== limitToBrand) {return;}

		var location = saveDir + '/' + brandAbbreviation + '/' + site['name'] + '.png';
		var url = site['url'].replace(/#.*/, '');

		console.log(site.url);
		captureSite(that, url, location, false);

	});
});

casper.then(function() {
	this.viewport(400, 800);
 	var that = this;

	 forEachSite(config, function(site, brandAbbreviation) {
		if (site['no-fetch'] || site['no-image'] || site['placeholder']) {return;}
		 if (limitToBrand && brandAbbreviation !== limitToBrand) {return;}
		 if (site['mobile-url']) {

			var location = saveDir + '/' + brandAbbreviation + '/' + site['mobile-image'] + '.png';
			var url = site['mobile-url'].replace(/#.*/, '');

			captureSite(that, url, location, true);
		}

	 });
});

casper.run(function() {
    this.echo('Finished capturing.').exit();
});

//"C:\Program Files (x86)\IrfanView\i_view32.exe" "C:\workspace\extensions\speed-new\scripts\screenshots\pdt\*.png" "C:\workspace\extensions\speed-new\scripts\screenshots\pdt\converted\$N.jpg"