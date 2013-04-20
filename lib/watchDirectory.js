module.exports = watchDirectory;

var util = require('./fs-util'),
	watch = require('node-watch'),
	path = require('path'),
	liveReload = require('./live-reload.js'),
	fs = require('fs'),
	thumbnails = require('./thumbnails'),
	woods = require('./woods');

function watchDirectory(site) {
	var options = { recursive: true, followSymLinks: true },
		changes = [],
		timeoutId;

	var changed = function(uri, removed) {
		// ignore hidden files
		if ((/^\./).test(path.basename(uri)))
			return;
		woods.emit('changed', site, uri, removed);
		site.emit('changed', uri, removed);

		if ((/\/(assets)\//).test(uri))
			return liveReload.changedFile(uri);

		if ((/\/(content)\//).test(uri))
			site.dirty = true;

		if (timeoutId)
			clearTimeout(timeoutId);

		changes.push(uri);

		// Make the timeout longer by the amount of filesystem changes:
		var timeoutTime = 10 * changes.length + 30;

		timeoutId = setTimeout(function() {
			var then = new Date();
			// TODO: go through changes array instead and apply individual changes
			// instead of rebuilding the whole site?
			if (site.dirty) {
				site.build(function(err) {
					if (err)
						console.log(err);
					console.log('Rebuilt', site.pageCount, 'pages in', new Date() - then);
					liveReload.changed();
					site.dirty = false;
				});
			}
			changes.length = 0;
		}, timeoutTime);
	};
	watch(site.getUri(), options, function(uri) {
		fs.exists(uri, function(exists) {
			changed(uri, !exists);
		});
	});
}