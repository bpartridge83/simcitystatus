var express = require('express'),
	app = express(),
	http = require('http'),
	argv = require('optimist').argv,
	server = http.createServer(app);

var cons = require('consolidate'),
	swig = require('swig'),
	Deferred = require('deferred'),
	Async = require('async');
	
swig.init({
    root: __dirname + '/../views',
    allowErrors: true // allows errors to be thrown and caught by express instead of suppressed by Swig,
});

app.configure(function () {

	app.use(express.favicon(__dirname + '/public/favicon.ico', {maxAge: 86400000}));
    app.use(express.static(__dirname + '/public'));
				
	app.engine('.html.twig', cons.swig);
	app.set('view engine', 'html.twig');
	app.set('views', __dirname + '/views');
    app.set("view options", { layout: false });

});
	
app.get('/', function (req, res) {
	
	http.request({
		host: 'worlds.simcity.com',
		path: '/parallelworlds.json'
	}, function (response) {
		
		var str = '';
		
		response.on('data', function (chunk) {
			str += chunk;
		});
		
		response.on('end', function () {
			
			res.render('index', {
				servers: JSON.parse(str).hosts,
				half: (JSON.parse(str).hosts.length / 2)
			});
		});
		
	}).end();
	
});

app.get('/source', function (req, res) {
	
	http.request({
		host: 'worlds.simcity.com',
		path: '/parallelworlds.json'
	}, function (response) {
		
		var str = '';
		
		response.on('data', function (chunk) {
			str += chunk;
		});
		
		response.on('end', function () {
			res.send(str);
		});
		
	}).end();
	
})

app.get('/status', function (req, res) {
	
	var pjson = require('./package.json');
	
	return res.send({
		status: 'running',
		environment: app.get('site'),
		version: pjson.version
	});
	
});
	
var port_range = [5000, 5009],
	portscanner = require('portscanner');

portscanner.findAPortNotInUse(port_range[0], port_range[1], 'localhost', function(error, _port) {

	var port = argv.port || process.env.PORT || _port;

	server.listen(port, function () {
		
		console.log('Listening on Port ' + port);
		
	});

});