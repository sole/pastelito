# pastelito

## megafast

Log into the account using the root account, or in Ubuntu desktop or with normal (sudoer) user

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
