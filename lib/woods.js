var fs = require('fs'),
	async = require('async'),
	path = require('path'),
	EventEmitter = require('events').EventEmitter,
	lessMiddleware = require('less-middleware'),
	express = require('express');

var fsUtil = require('./util/fs.js');

var woods = new EventEmitter();
woods.express = express();

woods.initialize = function (directory, port, watch, callback) {
	woods.export = !watch;
	var Site = require('./Site');

	port = port || 3000;
	woods.express.configure(function() {
		woods.express.use(lessMiddleware({
			src: directory,
			compress: true,
		}));
		woods.express.use(express.static(directory));
		woods.express.use('/static', express.static(directory + '/content/static'));
		woods.express.use(express.static(path.resolve(directory, 'content/topMostStatic')));
	});
	woods.express.listen(port);
	woods.url = 'http://localhost:' + port;
	var site = new Site(woods, directory, watch, callback);

	if (woods.export) {
		require('./siteSync');
	}
	return woods;
};

module.exports = woods;
