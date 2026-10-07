import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ASSETS, getAsset } from "@/lib/assets";
import { AssetView } from "./AssetView";

export function generateStaticParams() {
  return ASSETS.map((a) => ({ ticker: a.ticker }));
}

export async function generateMetadata({ params }: { params: Promise<{ ticker: string }> }): Promise<Metadata> {
  const { ticker } = await params;
  const asset = getAsset(ticker);
  return { title: asset ? `${asset.ticker} · ${asset.name}` : "Asset not found" };
}

export default async function AssetPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const asset = getAsset(ticker);
  if (!asset) notFound();
  return <AssetView ticker={asset.ticker} />;
}
