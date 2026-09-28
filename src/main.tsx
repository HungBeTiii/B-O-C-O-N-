import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const root = document.getElementById('root')
if (!root) throw new Error('Không tìm thấy #root trong index.html')
ReactDOM.createRoot(root).render(<App/>)
