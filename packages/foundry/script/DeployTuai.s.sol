// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { console } from "forge-std/Script.sol";
import { ScaffoldETHDeploy } from "./DeployHelpers.s.sol";
import { MockIDRX } from "../contracts/MockIDRX.sol";
import { TuaiLite } from "../contracts/TuaiLite.sol";

/**
 * @notice Deploy MockIDRX + TuaiLite untuk demo Tuai Lite.
 * @dev Deployer adalah admin sekaligus gudang demo (T12: burner browser = deployer).
 *
 * Contoh:
 *   yarn deploy --file DeployTuai.s.sol --keystore scaffold-eth-default              # anvil
 *   yarn deploy --file DeployTuai.s.sol --network monad_testnet --keystore tuai-deployer
 */
contract DeployTuai is ScaffoldETHDeploy {
    function run() external ScaffoldEthDeployerRunner {
        MockIDRX idrx = new MockIDRX();
        TuaiLite tuai = new TuaiLite(address(idrx));

        // Deployer = admin (owner) + gudang yang boleh menerbitkan resi.
        tuai.setWarehouse(deployer, true);

        deployments.push(Deployment({ name: "MockIDRX", addr: address(idrx) }));
        deployments.push(Deployment({ name: "TuaiLite", addr: address(tuai) }));

        console.log("Deployer :", deployer);
        console.log("MockIDRX :", address(idrx));
        console.log("TuaiLite :", address(tuai));
        console.log("chainId  :", block.chainid);
    }
}
