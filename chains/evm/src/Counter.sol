// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

/// @notice Minimal contract to verify EVM toolchain setup in Phase 2
contract Counter {
    uint256 public number;

    function setNumber(uint256 newNumber) public {
        number = newNumber;
    }

    function increment() public {
        number++;
    }
}

