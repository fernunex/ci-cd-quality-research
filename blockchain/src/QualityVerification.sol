// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract QualityVerification {
    error InvalidTotalLines();
    error CoveredLinesExceedTotal();

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

        bool noLintErrors = eslintErrors == 0;

        return enoughCoverage && noLintErrors;
    }
}

