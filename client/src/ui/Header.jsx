import { useContext } from "react"
import { Button } from "react-bootstrap"
import { Link, useNavigate } from 'react-router'
import AuthContext from "../state/AuthContext"
import logo from "../assets/LAST RACE.png"
import train from "../assets/train.png"
import loginButtonImg from "../assets/login-button.png"

function Header(props) {
  const user = useContext(AuthContext)
  const dest = user.id ? '/' : '/instructions'

  return (
    <div className="banner-wrapper">
      <div className="banner">
        <Link to={dest}>
          <img src={train} alt="Train" className="banner-train" />
        </Link>
        <Link to={dest}>
          <img src={logo} alt="Last Race" className="banner-logo" />
        </Link>
        {user.id ? (
          <UserInfo username={user.username} doLogout={props.doLogout} />
        ) : (
          <LoginButton />
        )}
      </div>
    </div>
  )
}

function LoginButton() {
  const navigate = useNavigate()
  return (
    <button
      className="banner-login-btn"
      onClick={() => navigate('/login')}
      aria-label="Log in"
    >
      <img src={loginButtonImg} alt="Log In" />
    </button>
  )
}

function UserInfo(props) {
  return (
    <div className="banner-user-area">
      <span className="banner-username">{props.username}</span>
      <Button variant="outline-light" size="sm" onClick={props.doLogout}>Logout</Button>
    </div>
  )
}

export default Header