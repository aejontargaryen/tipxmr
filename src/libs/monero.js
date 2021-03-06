const monerojs = require("monero-javascript");
import sha256 from "crypto-js/sha256";
import Hex from "crypto-js/enc-hex";
import QRCode from "qrcode";

export async function createWallet(lang = "English") {
  console.log("Creating new wallet");
  let walletWasm = await monerojs.createWalletWasm({
    networkType: "stagenet",
    language: lang,
    password: "pass123",
    // serverUri: "http://192.168.0.119:38081",
    serverUri: "http://localhost:38081",
    serverUsername: "superuser",
    serverPassword: "abctesting123",
    rejectUnauthorized: false, // e.g. local development
  });
  return walletWasm;
}

export async function openWalletFromSeed(seed) {
  let walletWasm = await monerojs.createWalletWasm({
    networkType: "stagenet",
    mnemonic: seed,
    password: "pass123",
    //serverUri: "http://192.168.0.2:38081",
    // serverUri: "http://192.168.0.119:38081",
    serverUri: "http://localhost:38081",
    //serverUri: "http://stagenet.community.xmr.to:38081",
    serverUsername: "superuser",
    serverPassword: "abctesting123",
    rejectUnauthorized: false, // e.g. local development
  });
  return walletWasm;
}

export async function getPrimaryAddress(walletWasm) {
  return await walletWasm.getPrimaryAddress();
}

export async function createSubaddress(walletWasm) {
  const subadress = await walletWasm.createSubaddress(0, "");
  return await subadress.state.address;
}

export async function getSubaddress(walletWasm, index) {
  const subadress = await walletWasm.getSubaddress(0, index);
  return await subadress.state.address;
}

export async function getMnemonic(walletWasm) {
  return await walletWasm.getMnemonic();
}

export function getMnemonicHash(seed) {
  return Hex.stringify(sha256(seed));
}

export async function startSyncing(wallet, listeners, syncHeight) {
  await wallet.setSyncHeight(syncHeight); // start sync at block x

  listeners.forEach((listener) => {
    wallet.addListener(listener);
  });

  // await wallet.addListener(moneroWalletListener);
  await wallet.startSyncing();
}

export async function stopSyncing(wallet) {
  await wallet.stopSyncing();

  wallet.getListeners().forEach((listener) => {
    wallet.removeListener(listener);
  });

  // await wallet.removeListener(wallet.getListeners()[0]);
}

export async function getTxs(walletWasm) {
  const query = {
    // isConfirmed: true,
  };
  return await walletWasm.getTxs(query);
}

export async function generateQrCode(subaddress) {
  return await QRCode.toDataURL(subaddress, { errorCorrectionLevel: "L" });
}

export function isValidMnemoicLength(seed) {
  const words = seed.split(" ").filter((word) => word.length);
  return words.length === 25;
}

export default {
  createWallet,
  openWalletFromSeed,
  getPrimaryAddress,
  createSubaddress,
  getSubaddress,
  getMnemonic,
  getMnemonicHash,
  startSyncing,
  stopSyncing,
  getTxs,
  generateQrCode,
  isValidMnemoicLength,
};
