import 'babel-polyfill';

var promisify = require('promisify-node');
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var shelljs = require('shelljs');
var mkdirp = require('mkdirp-then');
var chownr = promisify('chownr');
var linuxUser = require('linux-user');

console.log(chownr);

console.log(chalk.black(chalk.bgYellow('*** pastelito lazy installer FTW ***')));

// '..' because we're running out of 'output' when compiled
var configPath = path.join(__dirname, '..', 'config_files');
var settings = require(path.join(configPath, 'settings'));

var groupName = settings.groupName;
var nonRootUser = settings.userName;
var sshKeyPath = path.join(configPath, 'default-ssh-key.pub');

main().then(function() {
	console.log(chalk.blue('fin'));
}).catch(function(e) {
	console.error(chalk.red('AAAH'), e);
});

// ---

async function main() {
	await addGroupIfNotExists(groupName);
	await makeSudoers(groupName);
	await addNonRootUser(nonRootUser, groupName);
	await setupSSH(sshKeyPath, nonRootUser);
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

async function addNonRootUser(userName, sudoersGroup) {
	var existing = await findUser(userName);
	if(existing) {
		console.log(userName, 'already exists');
	} else {
		await addUser(userName);
		console.log(userName, 'added');
	}

	await addUserToGroup(userName, sudoersGroup);

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

async function addUserToGroup(userName, groupName) {
	return new Promise((res, rej) => {
		linuxUser.addUserToGroup(userName, groupName, function(err) {
			if(err) {
				rej(err);
			} else {
				res();
			}
		});
	});
}

async function getUserInfo(userName) {
	return new Promise((res, rej) => {
		linuxUser.getUserInfo(userName, function(err, info) {
			if(err) {
				rej(err);
			} else {
				res(info);
			}
		});
	});
}

// Setup SSH

async function setupSSH(pathToKey, userName) {
	console.log('setup SSH');

	await installSSHKey(pathToKey, userName);
	// setupSSHD(pathToSSHDConfig);

	//return new Promise((res, rej) => {
		
	//});
}

async function installSSHKey(keyPath, userName) {

	var userInfo = await getUserInfo(userName);
	var homePath = userInfo.homedir;
	var dstKeyDir = path.join(homePath, '.ssh');
	var dstKeyPath = path.join(dstKeyDir, 'authorized_keys');

	// Copy contents of keyPath to homePath/.ssh/authorized_keys
	// We're assuming that this is a 'from scratch' installation
	// and so will mercilessly overwrite the file
	await mkdirp(dstKeyDir);

	var keyContents = fs.readFileSync(keyPath, 'utf-8');
	fs.writeFileSync(dstKeyPath, keyContents, 'utf-8');

	// chown -R bob:bob ~/.ssh
	await chownr(dstKeyDir, userInfo.uid, userInfo.gid);

	// chmod 700 ~/.ssh
	shelljs.chmod('700', dstKeyDir);

	// chmod 600 ~/.ssh/authorized_keys
	shelljs.chmod('600', dstKeyPath);

}
