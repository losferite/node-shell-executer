require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000;
const execSync = require('child_process').execSync;

const execCommand = (command, cb) => execSync(command);

app.get('/branch', async (req, res) => {
  const branch = req.query.id;
  if (!branch) {
    res.send({ data: '', error: 'Branch name is required' });
  }

  const command = `cd ~/docker-c2m && sudo ./exec.sh -env=abataloff -build-version=${branch} -bwa && sudo ./exec.sh -env=dmarkov -build-version=${branch} -d -m`;

  try {
    const result = await execCommand(command);

    res.send({ data: result.toString() });
  } catch (e) {
    console.error({ e });
  }
});

app.get('/branches', async (req, res) => {
  const apiToken = process.env.GITLAB_API_TOKEN;
  const projectID = process.env.GITLAB_PROJECT_ID;
  const command = `curl --header "PRIVATE-TOKEN: ${apiToken}" "https://gitlab.com/api/v4/projects/${projectID}/repository/branches"`;

  try {
    const result = await execCommand(command, (data) => res.send({ data }));

    res.send({ data: JSON.parse(result.toString()) });
  } catch (e) {
    console.error({ e });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
