import { isAddress, type Address } from 'viem';
import { CONTRACT_ADDRESSES } from './constants';

function selectionKey(owner: Address) {
  return `omniflow.vault.link.${owner.toLowerCase()}`;
}

export function getSavedVault(owner: Address): Address | null {
  try {
    const address = localStorage.getItem(selectionKey(owner));
    return address && isAddress(address) ? address : null;
  } catch {
    return null;
  }
}

export function getVaultManagerAddress(owner: Address) {
  return getSavedVault(owner) ?? CONTRACT_ADDRESSES.DEFAULT_ACTION_VAULT;
}

export function setSavedVault(owner: Address, vault: Address | null) {
  if (vault) localStorage.setItem(selectionKey(owner), vault);
  else localStorage.removeItem(selectionKey(owner));
}
