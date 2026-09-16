async function main() {
  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const Reputation = await ethers.getContractFactory("Reputation");

  const registry = await AgentRegistry.deploy();
  await registry.waitForDeployment();

  const reputation = await Reputation.deploy();
  await reputation.waitForDeployment();

  console.log("AgentRegistry deployed to:", await registry.getAddress());
  console.log("Reputation deployed to:", await reputation.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
