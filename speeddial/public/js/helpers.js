(function ($, SpeedDial, Handlebars) {
	'use strict';
	/* global SpeedDial */
	/* global Handlebars */

	Handlebars.registerHelper('toLocalUrl', function (prodUrl, postfix) {
		postfix = postfix || '.local';

		if (!prodUrl) return 'test';

		return prodUrl.replace('.com.au', postfix)
			.replace('.co.nz', postfix)
			.replace('.com', postfix)
			.replace('www.', '')
			.replace('.dev.isams.net', postfix)
			.replace('.uat.isams.net', postfix)
			.replace('.isams.net', postfix);

	});
	Handlebars.registerHelper('toHttps', function (prodUrl) {
		if (!prodUrl) return 'test';
		return prodUrl.replace(/^http:\/\/(.*)/, 'https://$1');
	});
	Handlebars.registerHelper('keepLanding', function (keepLanding) {
		return keepLanding ? 'data-keep-landing=true' : '';
	});
	Handlebars.registerHelper('isHidden', function (hidden) {
		return hidden ? 'style=display:none;' : '';
	});
	Handlebars.registerHelper('countVisibleBrands', function (data) {
		return data.brands.filter(function (brand) {return !brand.hidden;}).length;
	});
	Handlebars.registerHelper('log', function (obj) {
		console.log(obj);
	});
	Handlebars.registerHelper('partial', function(templateName,context, parent){
		// Save the parent context for use withing the child.
		if (parent) {
			context['parent'] = parent;
		}
		return new Handlebars.SafeString(SpeedDial.templates[templateName](context));
	});
	Handlebars.registerHelper('isEmpty', function (obj, options) {
		return !obj.length ? options.fn(this) : options.inverse(this);
	});
	Handlebars.registerHelper('isNotEmpty', function (obj, options) {
		return !!obj.length ? options.fn(this) : options.inverse(this);
	});
	Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

		switch (operator) {
			case '==':
				return (v1 == v2) ? options.fn(this) : options.inverse(this);
			case '===':
				return (v1 === v2) ? options.fn(this) : options.inverse(this);
			case '<':
				return (v1 < v2) ? options.fn(this) : options.inverse(this);
			case '<=':
				return (v1 <= v2) ? options.fn(this) : options.inverse(this);
			case '>':
				return (v1 > v2) ? options.fn(this) : options.inverse(this);
			case '>=':
				return (v1 >= v2) ? options.fn(this) : options.inverse(this);
			case '&&':
				return (v1 && v2) ? options.fn(this) : options.inverse(this);
			case '||':
				return (v1 || v2) ? options.fn(this) : options.inverse(this);
			default:
				return options.inverse(this);
		}
	});

})($, SpeedDial, Handlebars);