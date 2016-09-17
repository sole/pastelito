import 'babel-polyfill';

var fs = require('fs');
var path = require('path');
var promisify = require('promisify-node');
var chalk = require('chalk');
var shelljs = require('shelljs');
var mkdirp = require('mkdirp-then');
var chownr = promisify('chownr');
var linuxUser = promisify('linux-user');

console.log(chalk.black(chalk.bgYellow('*** pastelito lazy installer FTW ***')));

// '..' because we're running out of 'output' when compiled
var configPath = path.join(__dirname, '..', 'config_files');
var settingsPath = path.join(configPath, 'settings.js');

if(!fs.existsSync(settingsPath)) {
	console.log(chalk.red(settingsPath, 'not found. Use ./config_files/settings-default.js as a guide to create your own settings.js file.'));
	process.exit(-1);
}

var settings = require(settingsPath);

var groupName = settings.groupName;
var nonRootUser = settings.userName;
var sshKeyPath = path.join(configPath, 'default-ssh-key.pub');
var sshConfigPath = path.join(configPath, 'sshd_config');
var ipTablesConfigPath = path.join(configPath, 'iptables.conf');
var ipTablesStartScript = path.join(configPath, 'iptables-start.sh');

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
	await setupSSH(sshKeyPath, nonRootUser, sshConfigPath);
	await setupIpTables(ipTablesConfigPath, ipTablesStartScript);
}

// Add new group for sudoers

async function addGroupIfNotExists(name) {
	console.log('add group', name);
	var groupInfo = await linuxUser.getGroupInfo(name);
	if(groupInfo === null) {
		await linuxUser.addGroup(name);
	} else {
		console.log(name, 'already exists');
	}
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
	var existing = await linuxUser.getUserInfo(userName);
	
	if(existing) {
		console.log(userName, 'already exists');
	} else {
		await linuxUser.addUser(userName);
		console.log(userName, 'added');
	}

	await linuxUser.addUserToGroup(userName, sudoersGroup);

	// Set user's shell to bash
	shelljs.exec('chsh -s /bin/bash ' + userName);
}

// Setup SSH

async function setupSSH(pathToKey, userName, pathToSSHDConfig) {
	console.log('setup SSH');

	await installSSHKey(pathToKey, userName);
	setupSSHD(pathToSSHDConfig);
	shelljs.exec('service sshd restart');
}

async function installSSHKey(keyPath, userName) {

	var userInfo = await linuxUser.getUserInfo(userName);
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

function setupSSHD(pathToSSHDConfig) {
	console.log('setupSSHD', pathToSSHDConfig);

	var pathToConfig = '/etc/ssh/sshd_config';
	backupFile(pathToConfig);

	shelljs.cp(pathToSSHDConfig, pathToConfig);
}

// Setup iptables

function setupIpTables(pathToConfig, pathToStartScript) {
	console.log('setting up firewall');
	
	var configFile = '/etc/iptables.up.rules';
	var startScript = '/etc/network/if-pre-up.d/iptables';
	
	backupFile(configFile);
	shelljs.cp(pathToConfig, configFile);
	shelljs.exec('/sbin/iptables-restore < /etc/iptables.up.rules');

	// set to start automatically
	shelljs.cp(pathToStartScript, startScript);
	shelljs.chmod('+x', startScript);
}

function backupFile(pathToFile) {
	var pathToBackup = pathToFile + '.backup';

	if(fs.existsSync(pathToFile) && !fs.existsSync(pathToBackup)) {
		console.log('backing up', pathToFile, '=>', pathToBackup);
		shelljs.cp(pathToFile, pathToBackup);
	}
}
