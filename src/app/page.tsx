import type { Metadata } from "next";
import { RefferqNav } from "@/components/marketing/refferq-nav";
import { PartnerHero } from "@/components/marketing/partner-hero";
import { RefferqFeatures } from "@/components/marketing/refferq-features";
import { RefferqHowItWorks } from "@/components/marketing/refferq-how-it-works";
import { RefferqComparison } from "@/components/marketing/refferq-comparison";
import { RefferqPricing } from "@/components/marketing/refferq-pricing";
import { RefferqTestimonials } from "@/components/marketing/refferq-testimonials";
import { RefferqCTA } from "@/components/marketing/refferq-cta";
import { RefferqFooter } from "@/components/marketing/refferq-footer";

export const metadata: Metadata = {
  title: "Партнёрская программа StudioSlow",
  description:
    "Запускайте партнёрский канал StudioSlow: регистрация партнёров, прозрачный учёт лидов и удобный личный кабинет.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden bg-black">
      <main className="min-h-screen relative overflow-hidden">
        <div className="relative z-10">
          <RefferqNav />
          <PartnerHero />
          <RefferqFeatures />
          <RefferqHowItWorks />
          <RefferqComparison />
          <RefferqPricing />
          <RefferqTestimonials />
          <RefferqCTA />
          <RefferqFooter />
        </div>
      </main>
    </div>
  );
}
