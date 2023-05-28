// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../contracts/SolJobs.sol";
// These files are created dynamically at test time
import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";

contract SolJobsTest {
  function testWriteValue() public {
    SolJobs solJobs = SolJobs(
      DeployedAddresses.SolJobs()
    );

  }
}
