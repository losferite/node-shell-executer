const { execSync } = require('child_process');

const deployBranch = async (branch, envName) => {
  const command = `cd ~/docker-c2m && sudo ./exec.sh -env=abataloff -build-version=${branch} -bwa && sudo ./exec.sh -env=${envName} -build-version=${branch} -d -m`;
  try {
    const result = await execSync(command);

    return {
      message: result.toString(),
      error: null,
    }
  } catch (e) {
    return  {
      message: null,
      error: e.toString()
    }
  }
}

process.on('message', async (input) => {
  const [message, branch, envName] = input.split(';');
  if (message === 'START') {
    const data = await deployBranch(branch, envName);
    process.send(data)
  }
});
