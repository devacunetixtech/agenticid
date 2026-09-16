// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract AgentRegistry {
    struct Agent {
        string name;
        address wallet;
        string description;
        string[] services;
        uint256 registrationDate;
        uint256 jobsCompleted;
        uint256 reputationScore;
        uint256 totalEarnings;
        bool exists;
    }

    mapping(address => Agent) private agents;
    address[] private agentAddresses;

    event AgentRegistered(
        address indexed wallet,
        string name,
        uint256 registrationDate
    );

    event JobRecorded(address indexed wallet, uint256 jobsCompleted);
    event ReputationUpdated(address indexed wallet, uint256 reputationScore);

    function registerAgent(
        string memory _name,
        address _wallet,
        string memory _description,
        string[] memory _services
    ) external {
        require(bytes(_name).length > 0, "Name is required");
        require(!agents[_wallet].exists, "Agent already registered");

        agents[_wallet] = Agent({
            name: _name,
            wallet: _wallet,
            description: _description,
            services: _services,
            registrationDate: block.timestamp,
            jobsCompleted: 0,
            reputationScore: 100,
            totalEarnings: 0,
            exists: true
        });

        agentAddresses.push(_wallet);

        emit AgentRegistered(_wallet, _name, block.timestamp);
    }

    function recordJob(address _wallet, uint256 _amount, uint256 _score) external {
        require(agents[_wallet].exists, "Agent not found");

        agents[_wallet].jobsCompleted += 1;
        agents[_wallet].totalEarnings += _amount;
        agents[_wallet].reputationScore = _score > 0 ? _score : agents[_wallet].reputationScore;

        emit JobRecorded(_wallet, agents[_wallet].jobsCompleted);
        emit ReputationUpdated(_wallet, agents[_wallet].reputationScore);
    }

    function getAgent(address _wallet) external view returns (Agent memory) {
        require(agents[_wallet].exists, "Agent not found");
        return agents[_wallet];
    }

    function getAllAgents() external view returns (address[] memory) {
        return agentAddresses;
    }

    function getAgentCount() external view returns (uint256) {
        return agentAddresses.length;
    }

    function getLeaderboard() external view returns (address[] memory) {
        return agentAddresses;
    }
}
