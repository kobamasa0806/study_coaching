import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import TargetSection from './components/TargetSection'
import CampaignSection from './components/CampaignSection'
import CTASection from './components/CTASection'
import Footer from './components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <TargetSection />
      <CampaignSection />
      <CTASection />
      <Footer />
    </>
  )
}
