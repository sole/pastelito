var chalk = require('chalk');
var linuxUser = require('linux-user');

console.log(chalk.black(chalk.bgYellow('*** pastelito lazy installer FTW ***')));

addWheelGroup();


function addWheelGroup() {
	linuxUser.getGroups(function(err, info) {
		console.log(info);
	});
}
