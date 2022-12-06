const runOrWrapScript = require('../helpers/run-or-wrap-script')
const { log, logSplitter, logWideSplitter, yl } = require('../helpers/log')
const { readJSON } = require('../helpers/fs')
const { assert } = require('../helpers/assert')
const { readNetworkState, assertRequiredNetworkState } = require('../helpers/persisted-network-state')

const { APP_NAMES } = require('./constants')
const { hash: namehash } = require('eth-ens-namehash')
const { resolveEnsAddress } = require('../components/ens')
const { network } = require('hardhat')
const VALID_APP_NAMES = Object.entries(APP_NAMES).map((e) => e[1])
const APP = process.env.APP || ''
const BUMP = process.env.BUMP || 'major'
const REQUIRED_NET_STATE = [
  'ensAddress',
  'multisigAddress',
  'lidoBaseDeployTx',
  'oracleBaseDeployTx',
  'nodeOperatorsRegistryBaseDeployTx',
  'app:aragon-voting'
]

async function obtainInstance({ web3, artifacts, appName = APP }) {
  const netId = await web3.eth.net.getId()
  logWideSplitter()
  log(`Network ID:`, yl(netId))

  if (!appName || !VALID_APP_NAMES.includes(appName)) {
    throw new Error('Wrong app name')
  }

  const state = readNetworkState(network.name, netId)
  assertRequiredNetworkState(state, REQUIRED_NET_STATE)

  log(`Using ENS:`, yl(state.ensAddress))
  const ens = await artifacts.require('ENS').at(state.ensAddress)
  log.splitter()

  const appId = namehash(`${appName}.${state.lidoApmEnsName}`)
  const repoAddress = await resolveEnsAddress(artifacts, ens, appId)
  const repo = await artifacts.require('Repo').at(repoAddress)
  const { semanticVersion: currentVersion } = await repo.getLatest()
  switch (BUMP) {
    case 'patch':
      currentVersion[2] = currentVersion[2].addn(1)
      break
    case 'minor':
      currentVersion[1] = currentVersion[1].addn(1)
      break
    case 'major':
    default:
      currentVersion[0] = currentVersion[0].addn(1)
  }
  const versionTo = currentVersion.map((n) => n.toNumber())
  const newVersionDesc = versionTo.join('.')
  // eslint-disable-next-line no-template-curly-in-string
  const expected_data = await readJSON(`tx-upgrade-app-${appName}-to-${newVersionDesc}.json`)
  const appUpgradeTx = state.APPUpgradeTx
  const tx_data = await web3.eth.getTransaction(appUpgradeTx)
  assert.equal(tx_data.input, expected_data.data)

  const receipt = await web3.eth.getTransactionReceipt(appUpgradeTx)
  const voting = new web3.eth.Contract((await artifacts.readArtifact('Voting')).abi)
  const event_abi = voting.options.jsonInterface.filter((evt) => evt.name === 'StartVote')[0]
  const event = receipt.logs.filter((evt) => evt.topics[0] === event_abi.signature)[0]
  assert.exists(event, 'Voting event not found')
  const parsed = await web3.eth.abi.decodeLog(event_abi.inputs, event.data, event.topics.slice(1))
  logSplitter()
  log(`Voting contract:`, event.address)
  log(`Voting no:`, parsed.voteId)
  log(`Creator:`, parsed.creator)

  assert.equal(event.address, state['app:aragon-voting'].proxyAddress)
}

module.exports = runOrWrapScript(obtainInstance, module)
