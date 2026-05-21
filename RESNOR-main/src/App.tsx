import { Hero } from './components/Hero';
import { StressMonitor } from './components/StressMonitor';
import { ProgressBanner } from './components/ProgressBanner';
import { AdaptiveLearning } from './components/AdaptiveLearning';
import { ChatCheckIn } from './components/ChatCheckIn';
import { RoutineGenerator } from './components/RoutineGenerator';
import { StressRelief } from './components/StressRelief';
import { Footer } from './components/Footer';

function App() {
  return (
    <>
      <main>
        <Hero />
        <ProgressBanner />
        <StressMonitor />
        <RoutineGenerator />
        <ChatCheckIn />
        <AdaptiveLearning />
        <StressRelief />
      </main>
      <Footer />
    </>
  );
}

export default App;
