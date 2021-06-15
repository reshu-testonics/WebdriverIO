WebdriverIO Setup:
1. Intall Nodejs
2. Install Visual Studio Code
3. run npm init to create a package.json
4. run "npm install @wdio/cli --save-dev"
5. run "npx wdio config" to set up the framework. Give the answers to the questions as per your need

Framework Support
1. Jasmine Suport: npm install @wdio/jasmine-framework --save-dev
2. Mocha Support: npm install @wdio/mocha-framework --save-dev
3. Cucumber Support : npm install @wdio/cucumber-framework --save-dev
4. Change the "framework" option in wdio.conf.js to support respective framework and update the specs field

Framework Execution:
1. Package.json
2. launch.json (Debug Mode)

Docker Configuration:
1. Download docker desktop
//The Windows Subsystem for Linux (WSL) is a feature of Windows 10 that enables you to run native Linux command-line tools directly on Windows.
2. Set your WSL to WSL2 for docker "wsl --set-default-version 2"
3. Install your Linux distribution of choice. e.g. install ubuntu app from microsoft store
4. Build the image of your package
5. Run image through a container
6. Push your image on Doccker Hub
    docker build -t <image-name> .   //Builds the image on local
    docker run -dp 3000:3000 <image-name> //Runs the image through container on 3000 port
    docker login -u <DockerHubUser> //Logs in docker hub
    docker tag <image-name> <repository-name>/<image-name> //tags the local image on docker repository
    docker push <repository-name>/<image-name> //Uploads the image on docker hub repository

ESLint:
1. For syntactical validations

Userful Links:
https://webdriver.io/docs/docker/
https://webdriver.io/docs/wdio-docker-service/
https://docs.docker.com/get-started/

Notes:
🌐   modern web applications written in React, Vue, Angular, Svelte or other frontend frameworks
📱   hybrid or native mobile applications running in an emulator/simulator or on a real device
💻   native desktop applications (e.g. written with Electron.js)
