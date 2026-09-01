import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import TargetSection from './components/TargetSection'
import CampaignSection from './components/CampaignSection'
import Footer from './components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <TargetSection />
      <CampaignSection />
      <Footer />
    </>
  )
}
