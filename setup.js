import 'babel-polyfill';

var chalk = require('chalk');
var linuxUser = require('linux-user');

console.log(chalk.black(chalk.bgYellow('*** pastelito lazy installer FTW ***')));

addWheelGroup();


async function addWheelGroup() {
	//linuxUser.getGroups(function(err, info) {
	//	console.log(info);
	//});

	var groups = await getGroups();
	console.log(groups);
}

async function getGroups() {
	return new Promise(function(resolve, reject) {
		linuxUser.getGroups(function(err, info) {
			if(err) {
				reject(err);
			} else {
				resolve(info);
			}
		});
	});
}
