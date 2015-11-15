(function ($, SpeedDial, Handlebars, Utils, favourites) {
	'use strict';
	/* global SpeedDial */
	/* global Handlebars */
	/* global Utils */
	/* global chrome */
	/* global favourites */
	/**
	 * group:
	 *   name:
	 *   abr:
	 *   logo:
	 * brand:
	 *   name:
	 *   hidden:
	 * site:
	 *   JSON properties
	 *   name:
	 *   url:
	 *   mobile-url:
	 *   mobile-image
	 *   local-postfix
	 *   no-admin
	 *   admin-link
	 *   admin-link-local
	 *   no-fetch
	 *   no-image
	 *   keep-landing
	 */

	var settingsManager;

	$.fn.isAfter = function(sel){
		return this.prevAll(sel).length !== 0;
	};
	$.fn.isBefore= function(sel){
		return this.nextAll(sel).length !== 0;
	};

	/**
	 * Sets up quick landing links at bottom of speed dial when activated in the admin.
	 */
	function setupQuickLanding () {
		$('body').append(SpeedDial.templates['display-quick-landing'](settingsManager.settings));

		// Bindings.
		$('#saved-pages').on('change', function (event) {

			var target = $(event.target);
			settingsManager.setSetting($(target).data('storage'), !!target.is(':checked'));

			// Highlight panes with saved paths.
			$('.page-saved').addClass('pulse');
			window.setTimeout(function() {
				$('.page-saved').removeClass('pulse');
			}, 1000);

		});

		$('.quick-landing input[type=radio]').on('change', function (event) {

			var target = $(event.target);
			settingsManager.setSetting($(target).data('storage'), target.val());
		});

		document.addEventListener('webkitvisibilitychange',function() {
			if (!document['webkitHidden']) {
				settingsManager.loadSettings(function () {
					$('input[value="' + settingsManager.getSetting('landing-page') + '"]').trigger('click');
					if (settingsManager.getSetting('nav-saved-pages')) {
						$('#saved-pages').prop('checked', true);
					} else {
						$('#saved-pages').prop('checked', false);
					}
				});
			}
		});

	}


	/**
	 * Highlight sites which have a last product saved.
	 */
	function highlightSavedPages () {
		var savedPages = settingsManager.getSetting('savedPages'),
			site;

		if (settingsManager.getSetting('extra-highlight-saved-pages')) {
			var color = settingsManager.getSetting('color-highlight-saved-pages');
			for (site in savedPages) {
				if (savedPages.hasOwnProperty(site)) {
					$('a[href="' + site + '"].tile').css ({
						'box-shadow': '0 0 10px ' + color,
						border: '1px solid ' + color

					});
				}
			}
		} else {
			for (site in savedPages) {
				if (savedPages.hasOwnProperty(site)) {
					$('a[href="' + site + '"].tile').addClass('page-saved');
				}
			}
		}

	}


	/**
	 * Determines the currently set landing page.
	 * Falls back to /default.aspx if one isn't provided.
	 */
	function getLandingPage() {
		var landingPage = settingsManager.getSetting('landing-page');
		if (landingPage === 'custom') {
			landingPage = settingsManager.getSetting('landing-page-custom');
		}
		return landingPage || '/default.aspx';
	}


	function setupPage() {

		// Mark sites with saved products.
		if (settingsManager.getSetting('highlight-saved-pages') || settingsManager.getSetting('extra-highlight-saved-pages')) {
			highlightSavedPages();
		}

		// Add/remove from favourites.
		if (!settingsManager.getSetting('disable-favourites')) {
			favourites.setupFavouriteStars(settingsManager);
		}

		// Replace admin link with that configured by the user, or remove if not configured.
		// Unfortunately, we need to do this post transform as handlebars has issues with variable scoping, making
		// it difficult to attach the settings object to the transform.
		var adminLink = settingsManager.getSetting('admin-link');
		if (!adminLink || !adminLink.length) {
			$('.admin').remove();
		} else {
			if (adminLink[0] !== '/') {
				adminLink = '/' + adminLink;
			}
			$('.admin').each(function() {
				$(this).attr('href', $(this).attr('href').replace('/admin', adminLink));
				$(this).attr('data-local-link', $(this).attr('data-local-link').replace('/admin', adminLink));
				$(this).attr('data-prod-link', $(this).attr('data-prod-link').replace('/admin', adminLink));
			});
		}


		// Navigation
		$('a[data-prod-link]').on('click contextmenu', function(event) {
			var target = $(event.currentTarget),
				destination,
				type,
				// Tracks if we haven't clicked an admin link, but user settings take click type to admin anyway.
				pseudoAdmin = false;

			switch(event.which) {
				case 1:
					type = settingsManager.getSetting('left-click');
					break;
				case 2:
					type = settingsManager.getSetting('middle-click');
					break;
				case 3:
					type = settingsManager.getSetting('right-click');
					break;
			}

			if (type === 'production') {
				destination = target.data('prod-link');
			} else if (type === 'local'){
				destination = target.data('local-link');
			} else if (type === 'production-admin') {
				destination = target.closest('.site').find('.admin').data('prod-link');
				pseudoAdmin = true;
			} else if (type === 'local-admin') {
				destination = target.closest('.site').find('.admin').data('local-link');
				pseudoAdmin = true;
			} else if (type === 'none'){

				// Cancel navigation.
				if (event.which === 1 || event.which === 2) {
					return false;
				}
				// If right click, we still want to show context menu.
				return true;
			}

			// Set landing page.
			if (!target.is('.admin') && !target.data('keep-landing') && !pseudoAdmin) {

				// Check if set to saved page, and saved page is available.
				if (settingsManager.getSetting('nav-saved-pages')) {
					var savedPages = settingsManager.getSetting('savedPages');

					if (savedPages && savedPages[target.attr('href')]) {
						destination += savedPages[target.attr('href')];
					} else {
						destination += getLandingPage();
					}
				} else {

					destination += getLandingPage();
				}
			}

			// Alter admin path if required.
			if (target.is('.admin') || pseudoAdmin) {
				if (settingsManager.getSetting('new-admin')) {
					destination += '/new';
				}
			}

			event.preventDefault();

			// Restore middle click functionality and support ctrl-right-click to open in a background tab.
			if ((event.which === 2 && !settingsManager.getSetting('trap-middle-click')) ||
				(event.ctrlKey && (event.which === 3 || event.which === 1))) {
				var a = $('<a/>', {href: destination})[0];
				var evt = document.createEvent('MouseEvents');
				//the tenth parameter of initMouseEvent sets ctrl key
				evt.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0,
					true, false, false, false, 0, null);
				a.dispatchEvent(evt);

				return false;
			}


			window.location.href = destination;
		});
	}


	function loadPage (name, data) {
		var container = $('.content'),
			transformData,
			layout,
			page;

		// Check if page exists in cache.
		var cache = settingsManager.getSetting('cache') || {};
		if (settingsManager.getSetting('enable-cache') && cache[name] && new Date().getTime() < cache[name].expires && cache[name].content) {
			page = cache[name].content;
		} else {
			switch (name) {
				case 'favourites':
					layout = 'favourites-layout';
					transformData = favourites.getData(settingsManager, data) || [];
					break;
				default:
					transformData = data[name];
					layout = transformData['layout'];
			}

			// Add settings to our transform data.
			//transformData['settings'] = settingsManager.settings;
			page = SpeedDial.templates[layout](transformData);

			// Save to cache.
			if (settingsManager.getSetting('enable-cache') && name !== 'favourites') {
				cache[name] = {
					expires: new Date().getTime() + 86400000, // + 1 day
					content: page
				};
				settingsManager.setSetting('cache', cache);

			}
		}

		// Display page.
		var newPage = container.append(page);

		$('h1').filter(function(){return $(this).text() === name;}).closest('li').addClass('active');
		setupPage();
		if (name === 'favourites') {
			favourites.setupFavouritesPage(newPage.find('.sites'), settingsManager);
		}
	}


	$(document).ready(function () {

		settingsManager = Utils.SettingsManager.getInstance();

		$.ajax({url: 'config.json', dataType: 'json', cache: true, success: function(config) {
			settingsManager.loadSettings(function () {

				// Remove link to favourites if disabled.
				if (settingsManager.getSetting('disable-favourites')) {
					$('.links li h1:contains("favourites")').parent('li').remove();
					$('body').addClass('favourites-disabled');
				}

				// Add quick access to landing page options.
				if (settingsManager.getSetting('show-quick-landing')) {
					setupQuickLanding();
				}

				// Show scrollbar if configured.
				if (settingsManager.getSetting('show-scrollbar')) {
					$('body').removeClass('hide-scroll');
				}

				// Load default landing page.
				var defaultPage = settingsManager.getSetting('default-page'),
					lastPage = settingsManager.getSetting('last-page');

				if (!defaultPage || defaultPage === 'last-page') {
					defaultPage = lastPage || 'sites-1';
				}
				if (settingsManager.getSetting('disable-favourites')) {
					if (defaultPage === 'favourites' || (defaultPage === 'last-page' && lastPage === 'favourites')) {
						defaultPage = 'sites-1';
					}
				}

				// Double check and lastPage and default page exist within allowed values, otherwise reset to 'sites-1'.
				// It is possible if a name is removed, we will get into a broken state.
				var validPages = ['favourites', 'sites-1', 'sites-2', 'sites-group-1'];
				if ($.inArray(defaultPage, validPages) < 0) { defaultPage = 'sites-1'; }
				if ($.inArray(lastPage, validPages) < 0) { lastPage = 'sites-1'; }

				loadPage(defaultPage, config);

				// Add custom links.
				if (settingsManager.getSetting('show-custom-links')) {
					var customLinks = settingsManager.getSetting('customLinks');

					// Convert data to array for display.
					var linksArray = [];
					for (var link in customLinks) {
						if (customLinks.hasOwnProperty(link)) {
							var obj = {
								name: link
							};
							linksArray.push($.extend(obj, customLinks[link]));
						}
					}
					// Sort.
					linksArray = linksArray.sort(function (a, b) {
						return a.order - b.order;
					});
					if (linksArray.length) {
						$('header:first').append(SpeedDial.templates['display-custom-links'](linksArray));
					}
				}

				// Add link to options page.
				if (!settingsManager.getSetting('hide-options-link')) {
					$('body').append($('<a/>', {
						href: chrome.extension.getURL('options/options.html'),
						text: 'options',
						'class': 'options'
					}));
				}

				// Header nav - slide between pages.
				$('ul.links li').on('click', function (event) {
					var target = $(event.currentTarget),
						name = target.find('h1').text();

					if (!target.hasClass('inactive') && !target.hasClass('active')) {

						settingsManager.setSetting('last-page', name);

						if (settingsManager.getSetting('no-slide')) {
							// No slide.
							$('.sites').remove();
							loadPage(name, config);

						} else {
							// Slide.

							var direction = target.isBefore('.active') ? 'left' : 'right';

							// Change link styling.
							$('ul.links li.active').removeClass('active');
							target.addClass('active');


							// If user clicks again before transition is finished, destroy old page.
							if ($('.sites').length > 1) {
								$('.sites').first().remove();
							}

							// Load page.
							loadPage(name, config);

							var previousPage = $('.sites').first(),
								newPage = $('.sites').last(),
								leftPosition = $('.content').offset().left;

							// Position new page ready to slide in.
							newPage.css({
								position: 'absolute',
								left: (direction === 'right' ? $(window).width() : -previousPage.width()),
								top: 0,
								width: previousPage.width()
							}).addClass('slider');

							window.setTimeout(function () {
								newPage.css({
									left: 0
								});
							}, 10);

							// Slide out previous page.
							previousPage.css({
								position: 'absolute',
								left: 0,
								top: 0,
								width: previousPage.width()
							}).addClass('slider');

							previousPage.css({
								left: (direction === 'right' ? -previousPage.width() : $(window).width())
							});

							// Remove previous from page once it has finished animating.
							var animationDuration = parseFloat($('.slider').css('transition-duration'), 10) * 1000;
							window.setTimeout(function () {
								previousPage.remove();

								// Remove animation properties so that we can return to being responsive.
								$('.sites').removeAttr('style');
							}, animationDuration);
						}

						// Change link styling.
						$('ul.links li.active').removeClass('active');
						target.addClass('active');
					}
				});

				Utils.setupDefaultOptions(settingsManager);
			});
		}});
	});


})($, SpeedDial, Handlebars, Utils, favourites);