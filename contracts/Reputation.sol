// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Reputation {
    mapping(address => uint256) private completedJobs;
    mapping(address => uint256) private totalEarnings;
    mapping(address => uint256) private scoreByAgent;
    mapping(address => uint256[]) private ratings;

    event JobCompleted(address indexed agent, uint256 amount, uint256 rating, string feedback);
    event FeedbackLeft(address indexed agent, uint256 rating);

    function recordCompletedJob(
        address _agent,
        uint256 _amount,
        uint256 _rating,
        string memory _feedback
    ) external {
        require(_agent != address(0), "Invalid agent");
        require(_rating >= 1 && _rating <= 5, "Rating must be between 1 and 5");

        completedJobs[_agent] += 1;
        totalEarnings[_agent] += _amount;
        ratings[_agent].push(_rating);

        uint256 sum;
        for (uint256 i = 0; i < ratings[_agent].length; i++) {
            sum += ratings[_agent][i];
        }

        uint256 averageRating = (sum * 100) / ratings[_agent].length;
        uint256 baseScore = 100 + (completedJobs[_agent] * 10);
        uint256 weightedScore = (baseScore * averageRating) / 100;
        scoreByAgent[_agent] = weightedScore;

        emit JobCompleted(_agent, _amount, _rating, _feedback);
        emit FeedbackLeft(_agent, _rating);
    }

    function getCompletedJobs(address _agent) external view returns (uint256) {
        return completedJobs[_agent];
    }

    function getTotalEarnings(address _agent) external view returns (uint256) {
        return totalEarnings[_agent];
    }

    function getReputationScore(address _agent) external view returns (uint256) {
        return scoreByAgent[_agent] == 0 ? 100 : scoreByAgent[_agent];
    }

    function getAverageRating(address _agent) external view returns (uint256) {
        uint256 len = ratings[_agent].length;
        if (len == 0) return 0;

        uint256 sum;
        for (uint256 i = 0; i < len; i++) {
            sum += ratings[_agent][i];
        }

        return (sum * 100) / len;
    }
}
