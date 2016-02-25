# apt-get update -y && apt-get upgrade -y && 
apt-get install git build-essential -y && curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash - && apt-get install -y nodejs && git clone https://github.com/sole/pastelito.git && cd pastelito && npm install && node setup.js
