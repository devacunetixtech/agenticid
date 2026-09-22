const fs = require("fs");
const path = require("path");

const WALLET_FILE = path.resolve(__dirname, "..", ".mainnet-interaction-wallets.json");
const REGISTRY_ADDRESS = "0x31CD496289C768aa32087871372BB5FCD29dD5b3";

function loadOrCreateWallets() {
  if (fs.existsSync(WALLET_FILE)) {
    const saved = JSON.parse(fs.readFileSync(WALLET_FILE, "utf8"));
    if (!Array.isArray(saved) || saved.length !== 5) {
      throw new Error(`${WALLET_FILE} must contain exactly five wallets.`);
    }
    return saved;
  }

  const wallets = Array.from({ length: 5 }, () => {
    const wallet = ethers.Wallet.createRandom();
    return { address: wallet.address, privateKey: wallet.privateKey };
  });

  fs.writeFileSync(WALLET_FILE, `${JSON.stringify(wallets, null, 2)}\n`, { mode: 0o600 });
  fs.chmodSync(WALLET_FILE, 0o600);
  return wallets;
}

async function main() {
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 677n) throw new Error(`Expected BOT Chain Mainnet (677), got ${network.chainId}.`);

  const [funder] = await ethers.getSigners();
  const registry = await ethers.getContractAt("AgentRegistry", REGISTRY_ADDRESS);
  const savedWallets = loadOrCreateWallets();
  const existing = new Set((await registry.getAllAgents()).map(address => address.toLowerCase()));
  const results = [];

  for (let index = 0; index < savedWallets.length; index += 1) {
    const saved = savedWallets[index];
    const wallet = new ethers.Wallet(saved.privateKey, ethers.provider);
    if (wallet.address !== ethers.getAddress(saved.address)) throw new Error(`Wallet ${index + 1} address does not match its key.`);

    if (existing.has(wallet.address.toLowerCase())) {
      results.push({ address: wallet.address, status: "already registered" });
      continue;
    }

    const name = String.fromCharCode(65 + index);
    const data = registry.interface.encodeFunctionData("registerAgent", [name, wallet.address, "", []]);
    const gasPrice = await ethers.provider.send("eth_gasPrice", []);
    const estimatedGas = await ethers.provider.estimateGas({ from: funder.address, to: REGISTRY_ADDRESS, data });
    const requiredBalance = estimatedGas * BigInt(gasPrice);
    const currentBalance = await ethers.provider.getBalance(wallet.address);

    if (currentBalance < requiredBalance) {
      const funding = await funder.sendTransaction({ to: wallet.address, value: requiredBalance - currentBalance, gasPrice });
      await funding.wait();
    }

    const transaction = await wallet.sendTransaction({
      to: REGISTRY_ADDRESS,
      data,
      gasLimit: estimatedGas,
      gasPrice,
    });
    const receipt = await transaction.wait();
    results.push({
      address: wallet.address,
      status: "registered",
      transactionHash: transaction.hash,
      gasUsed: receipt.gasUsed.toString(),
      gasPriceWei: gasPrice.toString(),
    });
  }

  console.log(JSON.stringify(results, null, 2));
  console.log(`Private keys saved locally with mode 0600 at ${WALLET_FILE}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
