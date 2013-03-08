var express = require('express'),
	app = express(),
	http = require('http'),
	argv = require('optimist').argv,
	server = http.createServer(app);

var _ = require('underscore'),
	cons = require('consolidate'),
	swig = require('swig'),
	Deferred = require('deferred'),
	Async = require('async'),
	microtime = require('microtime');
	
var mongo = require('mongoskin'),
	db = mongo.db('mongodb://simcityserver:splines@ds043037.mongolab.com:43037/simcitystatus');
	
swig.init({
    root: __dirname + '/views',
    allowErrors: true
});

app.configure(function () {

	app.use(express.favicon(__dirname + '/public/favicon.ico', {maxAge: 86400000}));
    app.use(express.static(__dirname + '/public'));
				
	app.engine('.html.twig', cons.swig);
	app.set('view engine', 'html.twig');
	app.set('views', __dirname + '/views');
    app.set("view options", { layout: false });

});
	
app.get('/update', function (req, res) {

	console.log('in update');
	
	http.request({
		host: 'worlds.simcity.com',
		path: '/parallelworlds.json?t=' + microtime.now()
	}, function (response) {
		
		var str = '';
		
		response.on('data', function (chunk) {
			str += chunk;
			console.log('getting data');
		});
		
		response.on('end', function () {
			
			console.log(str);
			
			var hosts = JSON.parse(str).hosts,
				new_statuses = [];
	
			for (var i = 0; i < hosts.length; i++) {
				
				for (var j = 0; j < hosts[i].statuses.length; j++) {
					
					if (!hosts[i].status && hosts[i].statuses[j].status == 'busy') {
						hosts[i].status = 'busy';
						hosts[i].state = -1;
						hosts[i].icon = 'icon-refresh';
					}
					
					if (hosts[i].statuses[j].status == 'full') {
						hosts[i].status = 'full';
						hosts[i].state = -1;
						hosts[i].icon = 'icon-warning-sign';
					}
					
					if (hosts[i].statuses[j].status == 'hidden') {
						hosts[i].status = 'hidden';
						hosts[i].state = 0;
						hosts[i].icon = 'icon-eye-close';
					}
					
					if (hosts[i].statuses[j].status == 'available') {
						hosts[i].status = 'available';
						hosts[i].state = 1;
						hosts[i].icon = 'icon-ok-sign';
					}
					
				}
				
				new_statuses.push({
					server: hosts[i].name,
					status: hosts[i].status,
					state: hosts[i].state,
					datetime: microtime.nowStruct()[0]
				})
		
			};
			
			console.log(new_statuses);
			
			db.collection('status').insert(new_statuses, function (err, data) {
				res.send({
					status: true
				});
			});
			
		})
	
	}).end();
	
});
	
app.get('/', function (req, res) {
	
	http.request({
		host: 'worlds.simcity.com',
		path: '/parallelworlds.json?t=' + microtime.now()
	}, function (response) {
		
		var str = '';
		
		response.on('data', function (chunk) {
			str += chunk;
		});
		
		response.on('end', function () {
			
			var hosts = JSON.parse(str).hosts;
			
			for (var i = 0; i < hosts.length; i++) {
				
				for (var j = 0; j < hosts[i].statuses.length; j++) {
					
					if (!hosts[i].status && hosts[i].statuses[j].status == 'busy') {
						hosts[i].status = 'busy';
						hosts[i].state = 0;
						hosts[i].icon = 'icon-refresh';
					}
					
					if (hosts[i].statuses[j].status == 'full') {
						hosts[i].status = 'full';
						hosts[i].state = -1;
						hosts[i].icon = 'icon-warning-sign';
					}
					
					if (hosts[i].statuses[j].status == 'hidden') {
						hosts[i].status = 'hidden';
						hosts[i].state = 0;
						hosts[i].icon = 'icon-eye-close';
					}
					
					if (hosts[i].statuses[j].status == 'available') {
						hosts[i].status = 'available';
						hosts[i].state = 1;
						hosts[i].icon = 'icon-ok-sign';
					}
					
				}
				
			}
			
			db.collection('status').find({}, { limit: 720, sort: [[ 'datetime', -1 ]] }).toArray(function (err, data) {
			
				var chart_data = [];
				
				data = data.reverse();
				
				for (var i = 0; i < data.length; i++) {
					
					if (!chart_data[data[i].server]) {
						chart_data[data[i].server] = ''+data[i].state;
					} else {
						chart_data[data[i].server] += ','+data[i].state;
					}
					
				}
			
				var na_servers = [],
					eu_servers = [],
					oceania_servers = [];
			
				for (var i = 0; i < hosts.length; i++) {
				
					hosts[i].chart = chart_data[hosts[i].name];
				
					if (hosts[i].Desc.indexOf('North America') > -1) {
						na_servers.push(hosts[i]);
					}
				
					if (hosts[i].Desc.indexOf('Europe') > -1) {
						eu_servers.push(hosts[i]);
					}
				
					if (hosts[i].Desc.indexOf('Oceanic') > -1) {
						oceania_servers.push(hosts[i]);
					}
				
				}
			
				var servers = {
					north_america: {
						name: 'North America',
						servers: na_servers,
						half: Math.ceil(na_servers.length / 2)
					},
					europe: {
						name: 'Europe',
						servers: eu_servers,
						half: Math.ceil(eu_servers.length / 2)
					},
					oceania: {
						name: 'Oceanic',
						servers: oceania_servers,
						half: Math.ceil(oceania_servers.length / 2)
					}
				}
			
				res.render('index', {
					servers: servers
				});
				
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