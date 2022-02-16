require('dotenv').config();
const express = require('express');
const fs = require('fs');
const app = express();
const port = process.env.PORT;
const execSync = require('child_process').execSync;

const execCommand = (command, cb) => execSync(command);
const state = {
  isBranchDeploying: false,
};

app.get('/api/status', (req, res) => {
  res.send(state);
});

app.get('/api/branch', async (req, res) => {
  const branch = req.query.id;
  const envName = req.query.env;

  if (!branch) {
    res.status(400).send({ data: '', error: 'Branch name is required' });
  }

  const command = `cd ~/docker-c2m && sudo ./exec.sh -env=abataloff -build-version=${branch} -bwa && sudo ./exec.sh -env=${envName} -build-version=${branch} -d -m`;
  state.isBranchDeploying = true;
  try {
    const result = await execCommand(command);

    state.isBranchDeploying = false;
    res.send({ data: result.toString() });
  } catch (e) {
    state.isBranchDeploying = false;
    res.status(400).send({ e })
  }
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
    envs = envsList.map(name => ({
      name,
      branch: fs.existsSync('./runtime/builds/' + name) ? fs.readFileSync('./runtime/builds/' + name, 'utf8') : '-',
    }));
  } catch (err) {
    res.status(400);
    console.error(err);
  }
  res.send({ data: envs });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
