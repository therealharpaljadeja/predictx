// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {MarketRegistry} from "../src/MarketRegistry.sol";
import {BettingPool} from "../src/BettingPool.sol";
import {MarketResolution} from "../src/MarketResolution.sol";

contract Deploy is Script {
    // Base Sepolia USDC
    address constant USDC = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() external {
        address keystoneForwarder = vm.envAddress("KEYSTONE_FORWARDER");
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy MarketRegistry
        MarketRegistry registry = new MarketRegistry();
        console.log("MarketRegistry:", address(registry));

        // 2. Deploy BettingPool
        BettingPool pool = new BettingPool(USDC, address(registry));
        console.log("BettingPool:", address(pool));

        // 3. Deploy MarketResolution
        MarketResolution resolution = new MarketResolution(keystoneForwarder, address(registry));
        console.log("MarketResolution:", address(resolution));

        // 4. Initialize registry with pool and resolution addresses
        registry.initialize(address(pool), address(resolution));
        console.log("Registry initialized");

        // 5. Set resolution on pool
        pool.setMarketResolution(address(resolution));
        console.log("Pool resolution set");

        vm.stopBroadcast();
    }
}
