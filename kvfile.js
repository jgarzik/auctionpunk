
var fs = require('fs');

var reBlank = /^\s*$/;
var reComment = /^\s*#/;
var reKV = /^\s*(\w+)\s*=(.*)$/;

exports.readSync = function readSync(filename)
{
	var res = {};
	var lines = fs.readFileSync(filename).toString().split("\n");
	for (var i in lines) {
		var line = lines[i];

		if (reBlank.test(line) ||
		    reComment.test(line))
			continue;

		var matches = line.match(reKV);
		if (!matches)
			throw new Error("invalid key/value configuration line");

		res[matches[1]] = matches[2];
	}

	return res;
};
