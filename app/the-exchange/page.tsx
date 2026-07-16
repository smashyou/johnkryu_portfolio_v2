import { Metadata } from "next";
import TheExchangePage from "./TheExchangePage";

export const metadata: Metadata = {
  title: "The Exchange — John K. Ryu",
  description:
    "$RYU as a publicly traded asset: live ticker tape, a candlestick chart of fifteen years, skills as portfolio holdings, products as active deals.",
};

export default function Page() {
  return <TheExchangePage />;
}
