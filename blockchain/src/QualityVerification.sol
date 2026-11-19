// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract QualityVerification {
    error InvalidTotalLines();
    error CoveredLinesExceedTotal();
    error InvalidIdentifier();
    error EvaluationAlreadyExists();
    error EvaluationNotFound();
    error UnauthorizedEvaluator();

    struct Evaluation {
        bytes32 versionId;
        uint64 recordedAt;
        uint32 linesCovered;
        uint32 linesTotal;
        uint32 eslintErrors;
        bool approved;
        bool exists;
    }

    address public immutable authorizedEvaluator;

    mapping(bytes32 => Evaluation) private evaluations;

    event EvaluationRecorded(
        bytes32 indexed evaluationId,
        bytes32 indexed versionId,
        bool approved,
        uint32 linesCovered,
        uint32 linesTotal,
        uint32 eslintErrors
    );

    constructor() {
        authorizedEvaluator = msg.sender;
    }

    function evaluate(uint256 linesCovered, uint256 linesTotal, uint256 eslintErrors)
        public
        pure
        returns (bool approved)
    {
        if (linesTotal == 0) {
            revert InvalidTotalLines();
        }

        if (linesCovered > linesTotal) {
            revert CoveredLinesExceedTotal();
        }

        bool enoughCoverage = linesCovered >= linesTotal - (linesTotal / 5);

        return enoughCoverage && eslintErrors == 0;
    }

    function recordEvaluation(
        bytes32 evaluationId,
        bytes32 versionId,
        uint32 linesCovered,
        uint32 linesTotal,
        uint32 eslintErrors
    ) external returns (bool approved) {
        if (msg.sender != authorizedEvaluator) {
            revert UnauthorizedEvaluator();
        }

        if (evaluationId == bytes32(0) || versionId == bytes32(0)) {
            revert InvalidIdentifier();
        }

        if (evaluations[evaluationId].exists) {
            revert EvaluationAlreadyExists();
        }

        approved = evaluate(linesCovered, linesTotal, eslintErrors);

        evaluations[evaluationId] = Evaluation({
            versionId: versionId,
            recordedAt: uint64(block.timestamp),
            linesCovered: linesCovered,
            linesTotal: linesTotal,
            eslintErrors: eslintErrors,
            approved: approved,
            exists: true
        });

        emit EvaluationRecorded(evaluationId, versionId, approved, linesCovered, linesTotal, eslintErrors);
    }

    function getEvaluation(bytes32 evaluationId) external view returns (Evaluation memory) {
        Evaluation memory result = evaluations[evaluationId];

        if (!result.exists) {
            revert EvaluationNotFound();
        }

        return result;
    }
}

