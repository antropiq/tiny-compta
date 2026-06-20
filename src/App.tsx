import ApplicationStatusBar from './components/ApplicationStatusBar';
import TransactionEditionArea from './components/TransactionEditionArea';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <main className="app-main">
        <TransactionEditionArea />
      </main>
      <ApplicationStatusBar />
    </div>
  )
}

export default App
