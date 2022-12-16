const { encodeCallScript } = require('@aragon/contract-helpers-test/src/aragon-os')

const runOrWrapScript = require('../helpers/run-or-wrap-script')
const { log, logSplitter, logWideSplitter, yl, gr } = require('../helpers/log')
const { saveCallTxData } = require('../helpers/tx-data')
const { readNetworkState, assertRequiredNetworkState, persistNetworkState } = require('../helpers/persisted-network-state')

// this is needed for the following `require`s to work, some kind of typescript path magic
require('@aragon/buidler-aragon/dist/bootstrap-paths')

const { APP_NAMES } = require('./constants')

const operatorName = process.env.OPERATOR_NAME
const operatorAddr = process.env.OPERATOR_ADDR

const DEPLOYER = process.env.DEPLOYER || ''

async function addNodeOperatorImpl({ web3, artifacts }){
  if(!operatorName || !operatorAddr) {
    throw new Error('undefine operator or operatorAddr')
  }
  
  const netId = await web3.eth.net.getId()

  logWideSplitter()
  log(`Network ID:`, yl(netId))

  const state = readNetworkState(network.name, netId)

  log.splitter()

  const votingAddress = state[`app:${APP_NAMES.ARAGON_VOTING}`].proxyAddress
  const tokenManagerAddress = state[`app:${APP_NAMES.ARAGON_TOKEN_MANAGER}`].proxyAddress
  const nosAddress = state[`app:${APP_NAMES.NODE_OPERATORS_REGISTRY}`].proxyAddress

  const nodeOperatorRegistry = await artifacts.require('NodeOperatorsRegistry').at(nosAddress)
  const voting = await artifacts.require('Voting').at(votingAddress)
  const tokenManager = await artifacts.require('TokenManager').at(tokenManagerAddress)

  log(`Using voting address:`, yl(votingAddress))
  log(`Using nodeOperatorRegistry proxy address:`, yl(nosAddress))
  log(`DEPLOYER:`, yl(DEPLOYER))
  log.splitter()

  const callData1 = encodeCallScript([
    {
      to: nosAddress,
      calldata: await nodeOperatorRegistry.contract.methods.addNodeOperator(operatorName, operatorAddr).encodeABI()
    }
  ])

  const callData2 = encodeCallScript([
    {
      to: votingAddress,
      calldata: await voting.contract.methods.forward(callData1).encodeABI()
    }
  ])

  // finally forwarding call from TokenManager app to Voting
  await saveCallTxData(`New voting: add node operator ${operatorName}`, tokenManager, 'forward', `tx-99-1-create-vote-add-node-operator-${operatorName}.json`, {
    arguments: [callData2],
    from: DEPLOYER
  })

  log.splitter()
  log(gr(`Before continuing the deployment, please send all transactions listed above.`))
  log(gr(`A new voting will be created to add a node operator "${operatorName}".`))
  log(gr(`You must complete it positively and execute before continuing with the deployment!`))
  log.splitter()
}

module.exports = runOrWrapScript(addNodeOperatorImpl, module)