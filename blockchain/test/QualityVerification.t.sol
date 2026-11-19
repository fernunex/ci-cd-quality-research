// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {QualityVerification} from "../src/QualityVerification.sol";

contract QualityVerificationTest is Test {
    QualityVerification verifier;

    function setUp() public {
        verifier = new QualityVerification();
    }

    function test_Approved() public view {
        assertTrue(verifier.evaluate(90, 100, 0));
    }

    function test_RejectedByCoverage() public view {
        assertFalse(verifier.evaluate(70, 100, 0));
    }

    function test_RejectedByLintErrors() public view {
        assertFalse(verifier.evaluate(90, 100, 2));
    }

    function test_RejectedByBoth() public view {
        assertFalse(verifier.evaluate(70, 100, 2));
    }

    function test_ExactlyAtThreshold() public view {
        assertTrue(verifier.evaluate(80, 100, 0));
    }

    function test_BelowThreshold() public view {
        assertFalse(verifier.evaluate(79, 100, 0));
    }

    function test_InvalidTotalLines() public {
        vm.expectRevert(QualityVerification.InvalidTotalLines.selector);
        verifier.evaluate(0, 0, 0);
    }

    function test_CoveredLinesExceedTotal() public {
        vm.expectRevert(QualityVerification.CoveredLinesExceedTotal.selector);
        verifier.evaluate(101, 100, 0);
    }
}

