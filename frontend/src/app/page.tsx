import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";
import LandingRuntime from "@/components/landing/LandingRuntime";
import "@/components/landing/landing.css";

export const metadata: Metadata = {
  title: "OmniFlow · The Zapier of Web3",
  description:
    "No-Code Cross-Chain Automation Powered by Reactive Omni. Build autonomous event-driven triggers on Base Sepolia, execute on Lasna, and trigger non-custodial ActionVault execution with zero off-chain keepers.",
};

export const viewport = { width: "device-width" };

export default function Home() {
  return (
    <>
      <Landing />
      <LandingRuntime />
    </>
  );
}
