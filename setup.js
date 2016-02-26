import 'babel-polyfill';

var chalk = require('chalk');
var linuxUser = require('linux-user');

console.log(chalk.black(chalk.bgYellow('*** pastelito lazy installer FTW ***')));

addWheelGroup();


async function addWheelGroup() {
	var groups = await getGroups();
	var name = 'wheel';
	if(findGroup(groups, name) === undefined) {
		console.log('didnt find', name, 'adding');
		await addGroup(name);
	} else {
		console.log(name, 'already exists');
	}
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

function findGroup(groups, name) {
	var group = groups.find((el) => {
		return el.groupname === name;
	});
	return group;
}

async function addGroup(name) {
	return new Promise(function(resolve, reject) {
		linuxUser.addGroup(name, function(err, info) {
			if(err) {
				reject(err);
			} else {
				resolve(info);
			}
		});
	});
}
