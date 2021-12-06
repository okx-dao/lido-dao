const path = require('path')
const fs = require('fs')
const namehash = require('eth-ens-namehash').hash

const { execLive } = require('./helpers/exec')
const { log, logHeader, yl, gr } = require('./helpers/log')
const { gitCloneRepo } = require('./helpers/git')
const { readJSON } = require('./helpers/fs')
const { readNetworkState } = require('./helpers/persisted-network-state')

const runOrWrapScript = require('./helpers/run-or-wrap-script')

const APPS = process.env.APPS || '*'
const APPS_DIR_PATH = process.env.APPS_DIR_PATH || path.resolve(__dirname, '..', 'apps')
const ARAGON_APPS_REPO = process.env.ARAGON_APPS_REPO || 'https://github.com/lidofinance/aragon-client'
const ARAGON_APPS_REPO_REF = process.env.ARAGON_APPS_REPO_REF || 'master'
const RUN_CMD = process.env.RUN_CMD || 'local'

const appsRepoPath = './aragon-client'

const CMD_LOCAL = 'local'
const CMD_MAINNET = 'mainnet'
const CMD_RINKEBY = 'rinkeby'
const CMD_STAGING = 'staging'
const CMD_ROPSTEN = 'ropsten'
const CMD_XDAI = 'xdai'
const AVAILIABLE_RUN_CMDS = [CMD_LOCAL, CMD_MAINNET, CMD_RINKEBY, CMD_STAGING, CMD_ROPSTEN, CMD_XDAI]

async function startAragonClient(
  aragonAppsRepo1 = 'test',
  aragonAppsRepoRef = ARAGON_APPS_REPO_REF,
  appsDirPath = APPS_DIR_PATH,
  appNames = APPS,
  runCmd = RUN_CMD
) {

  assertRequiredRunCmd(runCmd, AVAILIABLE_RUN_CMDS)

  const netId = await web3.eth.net.getId()
  const netState = readNetworkState(network.name, netId)

  let ensAddress = netState.ensAddress

  if (!ensAddress) {
    throw new Error("Can't find ensAddress")
  }

  logHeader(`Checking out aragon-client repo...`)
  await gitCloneRepo(appsRepoPath, ARAGON_APPS_REPO, aragonAppsRepoRef)

  await execLive('yarn', {
    cwd: appsRepoPath
  })

  if (appNames && appNames !== '*') {
    appNames = appNames.split(',')
  } else {
    appNames = fs.readdirSync(appsDirPath)
  }

  console.log(3)
  const appLocations = []
  let port = 3000
  for (const appName of appNames) {
    port++
    const appRootPath = path.resolve(appsDirPath, appName)
    const arappFile = `${appRootPath}/arapp.json`
    const arapp = await readJSON(arappFile)
    const appPackageJson = await readJSON(`${appRootPath}/app/package.json`)

    const res = appPackageJson.scripts.dev && appPackageJson.scripts.dev.match(/--port\s+(\d+)/)
    if (res) {
      port = res[1]
    }

    const network = 'mainnet'
    const appId = arapp.environments[network].appName
    const appHash = namehash(appId)
    const location = `${appHash}:http://localhost:${port}/`

    appLocations.push(location)

    log(`${yl(appId)}: ${location}`)
  }
  const appLocator = process.env.ARAGON_APP_LOCATOR || appLocations.join(',')

  const aragonEnv = {
    ...process.env,
    ARAGON_APP_LOCATOR: appLocator,
    ARAGON_ENS_REGISTRY_ADDRESS: ensAddress,
    ARAGON_DEFAULT_ETH_NODE: 'ws://localhost:8545',
    ARAGON_IPFS_GATEWAY: 'http://localhost:8080'
  }

  if (runCmd === CMD_MAINNET) {
    aragonEnv.ARAGON_ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
    aragonEnv.ARAGON_DEFAULT_ETH_NODE = 'ws://localhost:8545'
    aragonEnv.ARAGON_IPFS_GATEWAY = 'https://mainnet.lido.fi/ipfs'
  }

  await execLive('yarn', {
    args: [`start:${runCmd}`],
    cwd: appsRepoPath,
    env: aragonEnv
  })
}

function assertRequiredRunCmd(runCmd, availableCmd) {
  let state = availableCmd.filter((key) => runCmd == key)
  if (!state.length) {
    throw new Error(`Invalid RUN_CMD env, ` + `available options: ${availableCmd.join(', ')}`)
  }
}

module.exports = runOrWrapScript(startAragonClient, module)
