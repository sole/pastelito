# pastelito

> Quickstarting an Ubuntu system, in cloud slices etc

Log into the freshly installed machine using the root account, or in Ubuntu desktop or with normal (sudoer) user

```bash
sudo su -
```

Enter password. 

It is recommended to update the system before you install anything else:

```bash
apt-get update -y && apt-get upgrade -y
```

Then

```bash
curl -sL https://raw.githubusercontent.com/sole/pastelito/master/bootstrap.sh | bash -
```

When you get the error message re: missing settings file, make a copy of the default settings file and edit it to use your own values:

```bash
cp ./config_files/settings-default.js ./config_files/settings.js
vim ./config_files/settings.js
```

Then run the installer script again:

```bash
npm run run
```
