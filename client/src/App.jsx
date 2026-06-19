import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';
import './App.css';

import { useContext, useState, useEffect } from 'react';
import { Container } from 'react-bootstrap';
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router';

import AuthContext from './state/AuthContext.js';
import { checkSession, doLogout } from './api/auth.js';
import HomePage from './ui/Home.jsx';
import LoginPage from './ui/Login.jsx';
import InstructionsPage from './ui/Instructions.jsx';
import Header from './ui/Header.jsx';
import Footer from './ui/Footer.jsx';

function App() {
  const navigate = useNavigate()

  const [user, setUser] = useState({ id: undefined, username: undefined })

  useEffect(() => {
    checkSession().then(result => {
      if (result) {
        setUser({ id: result.id, username: result.username })
      }
    }).catch(() => {})
  }, [])

  const handleLogin = (newUser) => {
    setUser({ id: newUser.id, username: newUser.username })
    navigate('/')
  }

  const handleLogout = async () => {
    try { await doLogout() } catch {}
    setUser({ id: undefined, username: undefined })
    navigate('/instructions')
  }

  return (
    <AuthContext.Provider value={user}>
      <Container>
        <Routes>
          <Route path='/' element={<MainLayout doLogout={handleLogout} />}>
            <Route index element={<HomeView />} />
            <Route path='login' element={<LoginView doLogin={handleLogin} />} />
            <Route path='instructions' element={<InstructionsPage />} />
          </Route>
        </Routes>
      </Container>
    </AuthContext.Provider>
  )
}

function MainLayout(props) {
  return <div className="d-flex flex-column" style={{ minHeight: '100vh' }}>
    <Header doLogout={props.doLogout} />
    <div style={{ flex: '1 0 auto' }}>
      <Outlet />
    </div>
    <Footer />
  </div>
}

function HomeView() {
  const user = useContext(AuthContext)

  if (!user.id)
    return <Navigate to='/instructions' />

  return <HomePage />
}

function LoginView(props) {
  const user = useContext(AuthContext)

  if (user.id)
    return <Navigate to='/' />

  return <LoginPage doLogin={props.doLogin} />
}

export default App;