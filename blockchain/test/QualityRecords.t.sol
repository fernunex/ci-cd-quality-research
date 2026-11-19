// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {QualityVerification} from "../src/QualityVerification.sol";

contract QualityRecordsTest is Test {
    QualityVerification verifier;

    bytes32 constant EVALUATION_ID = keccak256("E1-run1");
    bytes32 constant VERSION_ID = keccak256("commit-E1");

    function setUp() public {
        verifier = new QualityVerification();
    }

    function test_RegisterApprovedEvaluation() public {
        verifier.recordEvaluation(EVALUATION_ID, VERSION_ID, 90, 100, 0);

        QualityVerification.Evaluation memory record = verifier.getEvaluation(EVALUATION_ID);

        assertTrue(record.exists);
        assertTrue(record.approved);
        assertEq(record.versionId, VERSION_ID);
        assertEq(record.linesCovered, 90);
        assertEq(record.linesTotal, 100);
        assertEq(record.eslintErrors, 0);
        assertEq(record.recordedAt, block.timestamp);
    }

    function test_RegisterRejectedEvaluation() public {
        verifier.recordEvaluation(EVALUATION_ID, VERSION_ID, 70, 100, 2);

        QualityVerification.Evaluation memory record = verifier.getEvaluation(EVALUATION_ID);

        assertTrue(record.exists);
        assertFalse(record.approved);
        assertEq(record.eslintErrors, 2);
    }

    function test_PreventDuplicateEvaluations() public {
        verifier.recordEvaluation(EVALUATION_ID, VERSION_ID, 90, 100, 0);

        vm.expectRevert(QualityVerification.EvaluationAlreadyExists.selector);

        verifier.recordEvaluation(EVALUATION_ID, VERSION_ID, 90, 100, 0);
    }

    function test_UnauthorizedEvaluator() public {
        vm.startPrank(address(0xBEEF));

        vm.expectRevert(QualityVerification.UnauthorizedEvaluator.selector);

        verifier.recordEvaluation(EVALUATION_ID, VERSION_ID, 90, 100, 0);

        vm.stopPrank();
    }

    function test_InvalidIdentifier() public {
        vm.expectRevert(QualityVerification.InvalidIdentifier.selector);

        verifier.recordEvaluation(bytes32(0), VERSION_ID, 90, 100, 0);
    }

    function test_EvaluationNotFound() public {
        vm.expectRevert(QualityVerification.EvaluationNotFound.selector);

        verifier.getEvaluation(EVALUATION_ID);
    }

    function test_InvalidMetricsCannotBeRecorded() public {
        vm.expectRevert(QualityVerification.InvalidTotalLines.selector);

        verifier.recordEvaluation(EVALUATION_ID, VERSION_ID, 0, 0, 0);

        vm.expectRevert(QualityVerification.EvaluationNotFound.selector);

        verifier.getEvaluation(EVALUATION_ID);
    }
}

