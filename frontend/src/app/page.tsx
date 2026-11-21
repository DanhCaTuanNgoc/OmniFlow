import type { Metadata } from "next";
import MotionLanding from "@/components/landing/MotionLanding";

export const metadata: Metadata = {
  title: "OmniFlow | No-Code Cross-Chain Automation",
  description:
    "Build workflows that react to on-chain events with OmniFlow's visual pipeline builder, powered by Reactive Omni.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function Home() {
  return <MotionLanding />;
}
