import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

const keypair = Keypair.generate();
const privateKey = bs58.encode(keypair.secretKey);
const publicKey = keypair.publicKey.toBase58();

console.log("Public Key:", publicKey);
console.log("Private Key (save to .env):", privateKey); 