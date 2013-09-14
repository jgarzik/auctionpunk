
var https = require('https');

exports.ok = function jrpc_ok(req, result)
{
	var obj = {
		jsonrpc: "2.0",
		result: result,
	};
	if (req.id)
		obj.id = req.id;

	return obj;
}

exports.err = function jrpc_err(req, code, message)
{
	var obj = {
		jsonrpc: "2.0",
		error: {
			code:		code,
			message:	message,
		},
	};
	if (req.id)
		obj.id = req.id;

	return obj;
}

function http_resp_plain(resp, status, text)
{
	text += "\n";

	resp.writeHead(status, {
		'Content-Length': text.length,
		'Content-Type': 'text/plain'});
	resp.write(text);
	resp.end();
}

function handle_post(req, resp, body, jrpc_callback)
{
	var obj = undefined;
	try {
		obj = JSON.parse(body);
	} catch(e) {
		http_resp_plain(resp, 400, 'invalid JSON');
		return;
	}

	if ((typeof obj != 'object') ||
	    (typeof obj.method != 'string') ||
	    (!Array.isArray(obj.params))) {
		http_resp_plain(resp, 400, 'invalid JSON-RPC');
		return;
	}

	var objResp = jrpc_callback(obj);

	var respText = JSON.stringify(objResp);

	resp.writeHead(200, {
		'Content-Length': respText.length,
		'Content-Type': 'application/json'});
	resp.write(respText);
	resp.end();
}

function http_request(req, resp, jrpc_callback, logger, logname)
{
	var url = require('url').parse(req.url);

	logger.info(logname + ' request', {
		method: req.method,
		pathname: url.pathname,
		headers: req.headers,
		remote: req.socket.remoteAddress,
	});

	if (url.pathname != '/v1/' || req.method != 'POST') {
		http_resp_plain(resp, 404, 'not found');
		return;
	}

	var body = '';
	req.on('data', function(data) {
		body += data;
		if (body.length > (16 * 1024 * 1024))
			req.connection.destroy();
	});
	req.on('end', function() {
		handle_post(req, resp, body, jrpc_callback);
	});
}

exports.create = function create(httpsOpts, jrpc_callback, logger, logname)
{
	var httpsrv = https.createServer(httpsOpts, function (req, resp) {
		http_request(req, resp, jrpc_callback, logger, logname);
	});

	var port = httpsOpts.port || 12882;
	httpsrv.listen(port);

	return httpsrv;
};

