import 'babel-polyfill';

var fs = require('fs');
var chalk = require('chalk');
var shelljs = require('shelljs');
var linuxUser = require('linux-user');

console.log(chalk.black(chalk.bgYellow('*** pastelito lazy installer FTW ***')));

var groupName = 'wheel';
var nonRootUser = 'fulanito';

main().then(function() {
	console.log(chalk.blue('fin'));
}).catch(function(e) {
	console.error(chalk.red('AAAH'), e);
});

// ---

async function main() {
	await addGroupIfNotExists(groupName);
	await makeSudoers(groupName);
	await addNonRootUser(nonRootUser);
}

// Add wheel group

async function addGroupIfNotExists(name) {
	console.log('add group', name);
	var groups = await getGroups();
	if(findGroup(groups, name) === undefined) {
		console.log('didnt find', name, 'adding');
		await addGroup(name);
	} else {
		console.log(name, 'already exists');
	}
	return true;
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

// Edit sudoers

async function makeSudoers(groupName) {
	return new Promise(function(res, rej) {
		console.log('make sudoers', groupName);
		var file = '/etc/sudoers';
		var str = '%' + groupName + ' ALL=(ALL) NOPASSWD:ALL';
		var fileContents = fs.readFileSync(file);

		var position = fileContents.indexOf(str);
		
		if(position === -1) {
			console.log('adding', str, 'to', file);
			fs.appendFileSync(file, '\n' + str + '\n', 'utf8');
		} else {
			console.log(groupName, 'is already a sudoer');
		}

		res();
	});
}


// Add non root user

async function addNonRootUser(userName) {
	var existing = await findUser(userName);
	if(existing) {
		console.log(userName, 'already exists');
	} else {
		await addUser(userName);
		console.log(userName, 'added');
	}
}

async function findUser(userName) {
	return new Promise(function(res, rej) {
		linuxUser.getUserInfo(userName, function(err, user) {
			if(err) {
				rej(err);
			} else {
				res(user);
			}
		});
	});
}

async function addUser(userName) {
	return new Promise(function(res, rej) {
		linuxUser.addUser(userName, function(err, user) {
			if(err) {
				rej(err);
			} else {
				res(user);
			}
		});
	});
}
