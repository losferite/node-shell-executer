require('dotenv').config();
const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT;
const { fork, execSync } = require('child_process');

const execCommand = (command, cb) => execSync(command);
const state = {
  isBranchDeploying: false,
  lastDeploy: {
    result: null,
    branch: null,
    envName: null,
  },
};

const child = fork(__dirname + '/scripts/spawn-branch');

child.on('message', (message) => {
  state.isBranchDeploying = false;
  state.lastDeploy.result = message
});

app.get('/api/status', (req, res) => {
  res.send(state);
});

app.get('/api/branch', async (req, res) => {
  const branch = req.query.id;
  const envName = req.query.env;

  state.isBranchDeploying = true;
  state.lastDeploy = { branch, envName, result: null};
  child.send(`START;${branch};${envName}`);
  res.send({ result: true })
});

app.get('/api/branches', async (req, res) => {
  const apiToken = process.env.GITLAB_API_TOKEN;
  const projectID = process.env.GITLAB_PROJECT_ID;
  const term = req.query?.term;
  const command = `curl --header "PRIVATE-TOKEN: ${
    apiToken
  }" "https://gitlab.com/api/v4/projects/${projectID}/repository/branches${
    term ? `?search=${term}` : ''
  }"`;

  try {
    const result = await execCommand(command, (data) => res.send({ data }));

    res.send({ data: JSON.parse(result.toString()) });
  } catch (e) {
    res.status(400).send({ e })
  }
});


app.get('/api/envs', async (req, res) => {
  const envsList = (process.env.ENVS || '').split(';');
  let envs = [];

  try {
    envs = envsList.map(name => {
      const filePath = './runtime/builds/' + name;
      const fileExist = fs.existsSync(filePath);
      const stats = fileExist ? fs.statSync(filePath) : null

      return {
        name,
        branch: fileExist ? fs.readFileSync(filePath, 'utf8') : '-',
        changeTime: stats?.mtime,
      };
    });
  } catch (err) {
    res.status(400);
  }
  res.send({ data: envs });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
