const { expect } = require("chai");

describe("AgenticID Contracts", function () {
  let AgentRegistry;
  let Reputation;
  let registry;
  let reputation;

  beforeEach(async function () {
    AgentRegistry = await ethers.getContractFactory("AgentRegistry");
    Reputation = await ethers.getContractFactory("Reputation");
    registry = await AgentRegistry.deploy();
    reputation = await Reputation.deploy();
  });

  it("registers an agent profile", async function () {
    const services = ["chatbot-ops", "onchain-analysis"];

    await registry.registerAgent(
      "NeoAgent",
      "0x1111111111111111111111111111111111111111",
      "AI operations specialist",
      services
    );

    const agent = await registry.getAgent("0x1111111111111111111111111111111111111111");
    expect(agent.name).to.equal("NeoAgent");
    expect(agent.description).to.equal("AI operations specialist");
    expect(agent.jobsCompleted).to.equal(0);
  });

  it("records completed jobs and computes reputation score", async function () {
    await reputation.recordCompletedJob(
      "0x2222222222222222222222222222222222222222",
      ethers.parseEther("125"),
      5,
      "Fast and reliable"
    );

    await reputation.recordCompletedJob(
      "0x2222222222222222222222222222222222222222",
      ethers.parseEther("250"),
      4,
      "Excellent communication"
    );

    expect(await reputation.getCompletedJobs("0x2222222222222222222222222222222222222222")).to.equal(2);
    expect(await reputation.getTotalEarnings("0x2222222222222222222222222222222222222222")).to.equal(ethers.parseEther("375"));
    expect(await reputation.getReputationScore("0x2222222222222222222222222222222222222222")).to.be.greaterThan(0);
  });
});
