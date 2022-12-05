# 1. 生成交易数据文件
APP=node-operators-registry yarn hardhat --network goerli run ./scripts/multisig/13-deploy-new-app-instance.js
# 2. 发送交易
yarn hardhat --network goerli tx --from [addr] --file ./tx-13-1-deploy-node-operators-registry-base.json
# 3. 更新deployed-goerli.json中nodeOperatorsRegistryBaseDeployTx
哈希值
# 4. 检验部署的合约
APP=node-operators-registry yarn hardhat --network goerli run ./scripts/multisig/14-obtain-deployed-new-app-instance.js
# 5. 新建升级投票
APP=node-operators-registry CONTENT_CID="QmQZz79WfMk736Y9gXfLPAJHom2qSdr7g4TteimVwM2zy2" yarn hardhat --network goerli run ./scripts/multisig/15-vote-new-node-operator-registry-impl.js
# 6. 发送交易
yarn hardhat --network goerli  tx --from 0x026Cc292d54Fa98F604F79EBa5ee6bCA46479944 --file tx-15-1-create-vote-new-node-operators-registry-version.json
# 7. 到Aragon Voting App确认投票