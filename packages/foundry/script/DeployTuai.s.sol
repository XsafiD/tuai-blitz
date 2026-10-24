// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { console } from "forge-std/Script.sol";
import { ScaffoldETHDeploy } from "./DeployHelpers.s.sol";
import { MockIDRX } from "../contracts/MockIDRX.sol";
import { TuaiBlitz } from "../contracts/TuaiBlitz.sol";

/**
 * @notice Deploy MockIDRX + TuaiBlitz untuk demo Tuai Blitz.
 * @dev Deployer adalah admin sekaligus gudang demo (T12: burner browser = deployer).
 *
 * Multi-deployer setup:
 *   Setiap developer punya keystore sendiri, semua bisa deploy.
 *   Pastikan DEPLOYER_PRIVATE_KEY di .env atau gunakan --account.
 *
 * Contoh:
 *   yarn deploy --file DeployTuai.s.sol --keystore scaffold-eth-default              # anvil
 *   yarn deploy --file DeployTuai.s.sol --network monad_testnet --keystore tuai-deployer
 *   forge script script/DeployTuai.s.sol --rpc-url $RPC --private-key $PK --broadcast  # alternatif
 */
contract DeployTuai is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        MockIDRX idrx = new MockIDRX();
        TuaiBlitz tuai = new TuaiBlitz(address(idrx));

        // Deployer = admin (owner) + gudang yang boleh menerbitkan resi.
        tuai.setWarehouse(deployer, true);

        deployments.push(Deployment({ name: "MockIDRX", addr: address(idrx) }));
        deployments.push(Deployment({ name: "TuaiBlitz", addr: address(tuai) }));

        console.log("Deployer :", deployer);
        console.log("MockIDRX :", address(idrx));
        console.log("TuaiBlitz :", address(tuai));
        console.log("chainId  :", block.chainid);
    }
}
