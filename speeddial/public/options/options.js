

(function (Utils) {
	'use strict';
	/* global Utils */
	/* global SpeedDial */

	var settings;

	//
	// Custom links.
	//

	/**
	 * Controls for custom links.
	 */

	/**
	 * Saves all links including their ordering to storage.
	 */
	function saveAllLinks () {
		var links = {};
		$('#custom-links table tbody tr').each(function (index, elem) {
			// Skip table headers
			if (index === 0) return;

			var name = $('td:first-child', elem).text().trim(),
				url = $('td:nth-child(2)', elem).text().trim();

			if (name && url) {
				links[name] = {'url': url, 'order': index};
			}
		});
		settings.setSetting('customLinks', links);
	}


	/**
	 * Handles saving either a new or edited custom link and refreshes the display.
	 * @param context row or rows to search for 'save buttons'.
	 */
	function bindCustomLinkSaveHandler (context) {

		$('.save-custom-link', context).on('click', function(event) {
			var target = $(event.target),
				row = target.closest('tr'),
				newName = row.find('td:nth-child(1) input').val(),
				newUrl = row.find('td:nth-child(2) input').val();

			// Ensure url prepended with http.
			if (newUrl && !/^https?:\/\//.test(newUrl)) {
				newUrl = 'http://' + newUrl;
			}

			// Remove previous validation.
			row.find('input').removeAttr('style');
			// Validation
			if (!newName) {row.find('td:nth-child(1) input').css({border: '1px solid red'});}
			if (!newUrl) {row.find('td:nth-child(2) input').css({border: '1px solid red'});}
			if (!newName || !newUrl) {return;}

			// Replace inputs with entered text.
			row.find('td:first-child').empty().text(newName.trim());
			row.find('td:nth-child(2)').empty().text(newUrl.trim());

			saveAllLinks();
			$('#custom-links table').nextAll().addBack().remove();
			setupCustomLinks();
		});
	}

	function bindCustomLinkHandlers () {

		$('.delete-custom-link').on('click', function (event) {
			var target = $(event.target),
				name = target.data('link-name');

			var customLinks = settings.getSetting('customLinks');
			delete customLinks[name];
			settings.setSetting('customLinks', customLinks);

			// Remove from display.
			target.closest('tr').fadeOut(400, 'swing', function() {target.closest('tr').remove();});
		});
		$('.edit-custom-link').on('click', function (event) {
			var target = $(event.target),
				name = target.data('link-name'),
				row = target.closest('tr'),
				url = row.find('td:nth-child(2)').text().trim();

			// Convert cells to input boxes and options to 'save'.
			row.find('td:first-child').empty().append($('<input/>', {
				value: name,
				type: 'text'
			}));
			row.find('td:nth-child(2)').empty().append($('<input/>', {
				value: url,
				type: 'text'
			}));
			row.find('td:nth-child(3)').empty().append($('<span/>', {
				'class': 'save-custom-link',
				'data-link-name': name,
				text: 'save'
			}));

			bindCustomLinkSaveHandler(row);
		});
		$('.add-custom-link').on('click', function(event) {

			// Add new row to fill in details.
			$('#custom-links table tbody').append(
				$('<tr/>').append(
					$('<td/>').append($('<input/>', {value: '',type: 'text', placeholder: 'name'}))
				).append(
					$('<td/>').append($('<input/>', {value: '',type: 'text', placeholder: 'http://'}))
				).append(
					$('<td/>').append($('<span/>', {'class': 'save-custom-link', 'data-link-name': name, text: 'save'}))
				)
			);
			bindCustomLinkSaveHandler($('#custom-links table tbody tr:last'));
		});
	}

	function setupCustomLinks() {
		var customLinks = settings.getSetting('customLinks');

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
		linksArray = linksArray.sort(function(a, b) {
				return a.order - b.order;
			});

		$('#custom-links').append(SpeedDial.templates['custom-links'](linksArray));

		bindCustomLinkHandlers();

		$('#custom-links table tbody').sortable({
			stop: function () {
				saveAllLinks();
			}
		}).disableSelection();
	}




	$(document).ready(function () {

		// Load settings.
		settings = Utils.SettingsManager.getInstance();
		settings.loadSettings(function() {
			Utils.setupDefaultOptions(settings);

			settings.loadSettings(function () {
				console.log(settings.settings);
				$.ajax({
					url: 'changelog.json', dataType: 'json', cache: true, success: function (changelog) {
						$.ajax({
							url: '../config.json', dataType: 'json', cache: true, success: function (config) {

								//
								// Changelog.
								//
								$('#changelog').append(SpeedDial.templates['changelog'](changelog));


								//
								// Saved pages.
								//
								var savedPages = settings.getSetting('savedPages'),
									data = [], site, brand, i, j, k;

								function saveSite(site) {
									if (site.placeholder) return;
									data.push({
										name: site.name,
										url: site.url,
										path: savedPages[site.url] || ''
									});
									if (site['mobile-url']) {
										data.push({
											name: site.name + '-mobile',
											url: site['mobile-url'],
											path: savedPages[site['mobile-url']] || ''
										});
									}
								}

								// Get list of sites from config file
								for (var page in config) {
									if (config.hasOwnProperty(page)) {
										if (config[page]['brands']) {
											for (i = 0; i < config[page]['brands'].length; i += 1) {
												brand = config[page]['brands'][i];
												for (j = 0; j < brand['sites'].length; j += 1) {
													site = brand.sites[j];
													saveSite(site);
												}
											}
										} else {
											for (k = 0; k < config[page]['sites'].length; k += 1) {
												site = config[page]['sites'][k];
												saveSite(site);
											}
										}
									}
								}
								data = data.sort(function (a, b) {
									if (a.name > b.name) {
										return 1;
									}
									if (a.name < b.name) {
										return -1;
									}
									return 0;
								});

								// Display on page.
								$('#saved-pages').append(SpeedDial.templates['saved-pages'](data));

								// Controls for saved pages.
								$('.delete-saved-path').on('click', function (event) {
									var target = $(event.target),
										url = target.data('site-url');

									var savedPages = settings.getSetting('savedPages');
									delete savedPages[url];
									settings.setSetting('savedPages', savedPages);

									// Remove from display.
									target.closest('tr').find('td:nth-child(2)').empty();
									target.remove();
								});

								setupCustomLinks();

								//
								// Options
								//
								$('input[type=checkbox]').each(function (index, elem) {

									if (settings.getSetting($(elem).data('storage'))) {
										$(elem).prop('checked', 'checked');
									}

								}).on('change', function (event) {

									var target = $(event.target);
									settings.setSetting($(target).data('storage'), !!target.is(':checked'));
								});

								$('input[type=radio]').each(function (index, elem) {

									if (settings.getSetting($(elem).data('storage')) === $(elem).val()) {
										$(elem).prop('checked', 'checked');
									}

								}).on('change', function (event) {

									var target = $(event.target);
									settings.setSetting($(target).data('storage'), target.val());
								});

								$('input[type=color]').each(function (index, elem) {

									$(elem).val(settings.getSetting($(elem).data('storage')));
								}).on('change', function (event) {

									var target = $(event.target);
									settings.setSetting($(target).data('storage'), target.val());
								});

								$('input[type=text]:not(.custom)').each(function (index, elem) {

									$(elem).val(settings.getSetting($(elem).data('storage')));

								}).on('keyup', function (event) {

									var target = $(event.target);
									settings.setSetting($(target).data('storage'), target.val());
								}).on('paste', function (event) {
									var target = $(event.target);
									// Wait for paste to complete.
									window.setTimeout(function () {

										settings.setSetting($(target).data('storage'), target.val());
									}, 500);
									target.trigger('focus');
								});

								$('option').each(function (index, elem) {

									if (settings.getSetting($(elem).closest('select').data('storage')) === $(elem).val()) {
										$(elem).prop('selected', 'selected');
									}

								});
								$('select').on('change', function (event) {

									var target = $(event.target);
									settings.setSetting($(target).data('storage'), target.val());
								});


								$('#clear-favourites').on('click', function () {
									settings.setSetting('favourites', '');
									settings.setSetting('favouritesList', []);
								});
								$('#clear-cache').on('click', function () {
									settings.setSetting('cache', {});
								});
								$('#clear-saved-pages').on('click', function () {
									settings.setSetting('savedPages', {});

									$('#saved-pages table td:not(:first-child)').empty();
								});
								$('#clear-settings').on('click', function () {
									settings.clearSettings();
								});

								$('[name="landing-page-custom"]').on('focus', function (event) {
									var target = $(event.currentTarget);
									target.closest('label').find('[type=radio]').prop('checked', 'checked').trigger('change');
								});


								//
								// Tabs.
								//
								$('.tab-content:not(.default)').hide();
								$('[data-tab-pane]').on('click', function (event) {
									var target = $(event.target),
										name = target.data('tab-pane');

									target.addClass('active').siblings().removeClass('active');

									$('#' + name).show().siblings('.tab-content').hide();
								});

							}
						});
					}
				});
			});
		});
	});

})(Utils);
