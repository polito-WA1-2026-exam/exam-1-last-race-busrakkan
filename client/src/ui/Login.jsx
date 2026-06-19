import { useState } from "react"
import { doLogin } from "../api/auth"
import { Form, Button, Container } from "react-bootstrap"

function LoginPage(props) {

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [errormsg, setErrormsg] = useState('')

    const doSubmit = async (ev) => {
        ev.preventDefault()
        setErrormsg('')

        try {
            const user = await doLogin(username, password)
            props.doLogin(user)
        } catch (ex) {
            setErrormsg(ex.message)
            setTimeout(() => setErrormsg(''), 3000)
        }
    }

    return (
        <Container className="mt-4">
            <h2>Login</h2>
            <Form onSubmit={doSubmit}>
                <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control type="text" placeholder="Enter username" value={username} onChange={(ev) => setUsername(ev.target.value)} />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Password" value={password} onChange={(ev) => setPassword(ev.target.value)} />
                </Form.Group>
                <Button variant="primary" type="submit">Log in</Button>
                {errormsg && <div className="text-danger mt-2">{errormsg}</div>}
            </Form>
        </Container>
    )
}

export default LoginPage