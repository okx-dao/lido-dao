手动更新lido-APP（lido，oracle，node-operators-registry）：

在deployed-goerli.json部署中新增加"APPUpgradeTx": "升级第四步TX-ID"

步骤1:
APPS=node-operators-registry NETWORK_NAME=goerli NETWORK_STATE_FILE=deployed-goerli.json yarn hardhat --network goerli run ./scripts/multisig/1-publish-app-frontends.js

步骤2:
APP=node-operators-registry DEPLOYER=(部署账户) NETWORK_NAME=goerli NETWORK_STATE_FILE=deployed-goerli.json yarn hardhat --network goerli run ./scripts/multisig/2-deploy-new-app-instance.js
 yarn hardhat --network goerli tx --from (部署账户) --file ./tx-13-1-deploy-node-operators-registry-base.json
（更新deployed-goerli.json交易ID，命令行增加提示"nodeOperatorsRegistryBaseDeployTx"字段更新）

步骤3:
APP=node-operators-registry NETWORK_NAME=goerli NETWORK_STATE_FILE=deployed-goerli.json yarn hardhat --network goerli run ./scripts/multisig/3-obtain-deployed-new-app-instance.js

步骤4:
APP=node-operators-registry NETWORK_NAME=goerli NETWORK_STATE_FILE=deployed-goerli.json yarn hardhat --network goerli run ./scripts/multisig/4-upgrade-app.js
APP=node-operators-registry NETWORK_NAME=goerli NETWORK_STATE_FILE=deployed-goerli.json yarn hardhat --network goerli tx --from (部署账户) --file ./tx-upgrade-app-node-operators-registry-to-3.0.0.json

步骤5:
APP=node-operators-registry NEW_VERSION_DESC=3.0.0 NETWORK_NAME=goerli NETWORK_STATE_FILE=deployed-goerli.json yarn hardhat --network goerli run ./scripts/multisig/5-verify-vote-tx-app.js

步骤6:
APP=node-operators-registry NETWORK_NAME=goerli NETWORK_STATE_FILE=deployed-goerli.json yarn hardhat --network goerli run ./scripts/multisig/6-vote-and-enact.js

自动更新：（参数如下）
DEPLOYER=${DEPLOYER:=0x3A8592A239B06aF8e72F4E2cB9a83B0bFc4E284f}
NETWORK=${NETWORK:=goerli}
APP=${APP:=node-operators-registry}
NEW_VERSION_DESC=${NEW_VERSION_DESC:=4.0.0}
APPS=${APPS:=${APP}}

修改以上参数为自己的部署数据，运行：
./dao-goerli-update-app.sh
根据提示修改添加txid：
1、更新deployed-goerli.json交易ID，命令行增加提示"nodeOperatorsRegistryBaseDeployTx"字段更新）
2、在deployed-goerli.json部署中新增加的"APPUpgradeTx": "TX-ID"
