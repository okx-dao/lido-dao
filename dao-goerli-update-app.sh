#!/bin/bash
set -e +u
set -o pipefail

REPORT_GAS=true
# first local account by default
DEPLOYER=${DEPLOYER:=0x3A8592A239B06aF8e72F4E2cB9a83B0bFc4E284f}
NETWORK=${NETWORK:=goerli}
APP=${APP:=node-operators-registry}
NEW_VERSION_DESC=${NEW_VERSION_DESC:=4.0.0}
APPS=${APPS:=${APP}}


VOTE_ID=0

function msg() {
  MSG=$1
  if [ ! -z "$MSG" ]; then
    echo ">>> ============================="
    echo ">>> $MSG"
    echo ">>> ============================="
  fi
}

function pause() {
  MSG=$1
  msg "$1"
  read -s -n 1 -p "Press any key to continue . . ."
  echo ""
}



yarn install --immutable
yarn compile
APPS=$APPS yarn hardhat --network $NETWORK run ./scripts/multisig/1-publish-app-frontends.js
msg "app front published"


APP=$APP yarn hardhat --network $NETWORK run ./scripts/multisig/2-deploy-new-app-instance.js
yarn hardhat --network $NETWORK tx --from $DEPLOYER --file tx-13-1-deploy-node-operators-registry-base.json
pause "!!! Now set the ${APP}BaseDeployTx hash value in deployed-$NETWORK.json"

APP=$APP yarn hardhat --network $NETWORK run ./scripts/multisig/3-obtain-deployed-new-app-instance.js
msg "obtain deployed new app instance"

APP=$APP yarn hardhat --network  $NETWORK run ./scripts/multisig/4-upgrade-app.js
yarn hardhat --network $NETWORK tx --from $DEPLOYER --file tx-upgrade-app-${APP}-to-"${NEW_VERSION_DESC}".json
pause "!!! Now set the APPUpgradeTx hash value in deployed-$NETWORK.json"

APP=$APP yarn hardhat --network  $NETWORK run ./scripts/multisig/5-verify-vote-tx-app.js
msg "verify vote completed"
APP=$APP yarn hardhat --network  $NETWORK run ./scripts/multisig/6-vote-and-enact.js
pause "vote completed"
msg "Apps instances updated"

msg " completed! Cleaning up..."

rm tx-*.json
msg "Updated completed!"
