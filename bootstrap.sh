# apt-get update -y && apt-get upgrade -y # commented out because it gets ubuntu desktop in a weird state
apt-get install git build-essential openssh-server -y && curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash - && apt-get install -y nodejs && git clone https://github.com/sole/pastelito.git && cd pastelito && npm install && npm run compile && npm run run
