var favourites = (function ($, SpeedDial, Handlebars, Utils) {
	'use strict';
	/* global SpeedDial */
	/* global Handlebars */
	/* global Utils */
	/* global chrome */

	/**
	 * Stores current favourites, in the correct order to storage.
	 * @param page JQuery DOM element representing the context of the favourites page.
	 * @param settingsManager object to manage access to the settings storage.
	 */
	function saveFavourites(page, settingsManager) {
		var favourites = [];
		$('.site a.name', page).each(function (index, elem) {
			favourites.push($(elem).text().trim());
		});
		settingsManager.setSetting('favouritesList', favourites);
	}

	/**
	 * Extracts the data for the chosen favourites from the configuration file, this is because favourites are stored as
	 * a list of names.
	 * Note: Favourites data is returned in the same order as the list is stored to allow the user to rearrange the sites.
	 * @param settingsManager object to manage access to the settings storage.
	 * @param config file containing all of the site configuration.
	 */
	function getData(settingsManager, config) {
		var favouritesList = settingsManager.getSetting('favouritesList') || [];

		if (!favouritesList.length) return;

		var favouritesData = [];

		Utils.forEachSite(config, function (site, page) {

			var index = $.inArray(site.name, favouritesList);
			if (index > -1) {
				// We will need to manually calculate the image paths since the template will no longer have access to
				// the sites original parent brand/type.
				site['image-path-override'] = '/images/' + page.abr + '/' + site.name + '.jpg';
				if (site['mobile-image']) {
					site['mobile-image-path-override'] = '/images/' + page.abr + '/' + site['mobile-image'] + '.jpg';
				}
				favouritesData[index] = site;
			}
		});
		return favouritesData;
	}


	/**
	 * Binds handlers unique to the favourites page.
	 * @param page JQuery DOM element representing the context of the favourites page.
	 * @param settingsManager object to manage access to the settings storage.
	 */
	function setupFavouritesPage(page, settingsManager) {

		// Sortable.
		page.find('.site-container').sortable({
			delay: 50,
			stop: function () {
				var newOrder = [];
				$('.site', page).each(function (index, elem) {
					newOrder.push($(elem).data('name'));
				});
				saveFavourites(page, settingsManager);
			}
		}).disableSelection();
	}


	/**
	 * Binds to the favourite stars to add and remove items from favourites.
	 * Note: runs on teh favourites page as well as the rest.
	 * @param settingsManager object to manage access to the settings storage.
	 */
	function setupFavouriteStars (settingsManager){
		var favouritesList = settingsManager.getSetting('favouritesList') || [];

		// Mark sites that have been added to favourites.
		$.each(favouritesList, function (index, name) {
			$('.sites .' + name).addClass('favourite');
		});

		// Add / remove favourites.
		$('.favourite-icon').on('click', function (event) {
			var target = $(event.target),
				site = target.closest('.site'),
				name = site.data('name');

			if (site.hasClass('favourite')) {

				// Save new favourites list.
				var index = favouritesList.indexOf(name);
				favouritesList.splice(index, 1);
				settingsManager.setSetting('favouritesList', favouritesList);

				// Remove from display.
				if ($('.sites[data-type="favourites"]').length) {
					//var site = $('[data-name=' + name + ']');
					if (site.parent().is('[class^=brand-]')) {
						site.parent().remove();
					} else {
						site.remove();
					}

					// If there are no more favourites, show the 'no favourites' message'
					if (!favouritesList.length) {
						$('.site-container').append($('<p/>', {'class':'no-favourites-message', text: 'no favourites selected, click the star next to a site name to add'}));
					}
				} else {
					$('[data-name=' + name + ']').removeClass('favourite');
				}

			} else {
				// Add.
				favouritesList.push(name);
				site.addClass('favourite');
				settingsManager.setSetting('favouritesList', favouritesList);
			}

		});
	}

	return {
		getData: getData,
		setupFavouritesPage: setupFavouritesPage,
		setupFavouriteStars: setupFavouriteStars
	};

})($, SpeedDial, Handlebars, Utils);