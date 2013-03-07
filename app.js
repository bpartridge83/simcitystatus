var express = require('express'),
	app = express(),
	http = require('http'),
	argv = require('optimist').argv,
	server = http.createServer(app);

var port_range = [5000, 5009];
	
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
	
var portscanner = require('portscanner');

portscanner.findAPortNotInUse(port_range[0], port_range[1], 'localhost', function(error, _port) {

	var port = argv.port || process.env.PORT || _port;

	server.listen(port, function () {
		
		console.log('Listening on Port ' + port);
		
	});

});