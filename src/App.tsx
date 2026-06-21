import ApplicationStatusBar from './components/ApplicationStatusBar';
import TransactionEditionArea from './components/TransactionEditionArea';
import './App.css';
import { useState } from 'react';
import type { Recurring } from './types/recurring';

function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [recurrings, setRecurrings] = useState<Recurring[]>([]);

  return (
    <div className="app-container">
      <main className="app-main">
        <TransactionEditionArea
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          recurrings={recurrings}
          onRecurringsChange={setRecurrings}
        />
      </main>
      <ApplicationStatusBar activeTab={activeTab} recurrings={recurrings} />
    </div>
  )
}

export default App
