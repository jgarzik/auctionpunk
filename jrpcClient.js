
var https = require('https');

var json_id = 1;

exports.call = function call(method, params, opts, callback)
{
	var jreq = {
		jsonrpc: "2.0",
		method: method,
		params: params,
		id: json_id++,
	};
	var jreqText = JSON.stringify(jreq);

	var httpOpts = {
		hostname: opts.hostname || 'localhost',
		port: opts.port || 12882,
		method: 'POST',
		path: '/v1/',
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': jreqText.length,
		},

		rejectUnauthorized: false,
	};

	var req = https.request(httpOpts, function(resp) {
		if (resp.statusCode != 200) {
			callback(new Error("bad http status"));
			return;
		}

		var body = '';
		resp.on('data', function(chunk) {
			if (body.length < (16 * 1024 * 1024))
				body += chunk;
		});
		resp.on('end', function() {
			try {
				var jres = JSON.parse(body);
				if (typeof jres == 'object')
					callback(jres.error, jres.result);
				else
					callback(new Error("Invalid JSON response"));
			} catch (e) {
				callback(e);
			}
		});
	});

	req.on('error', function(e) {
		callback(e);
	});

	req.write(jreqText);
	req.end();
};

