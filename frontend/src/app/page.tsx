import type { Metadata } from "next";
import MotionLanding from "@/components/landing/MotionLanding";

export const metadata: Metadata = {
  title: "Intelligence Designed To Evolve",
  description:
    "Build applications that reason, adapt and collaborate using a modular AI platform designed for production.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function Home() {
  return <MotionLanding />;
}
