import { useState } from "react";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { auth, http } from "../api/http.js";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const submit = async () => {
    setError("");
    try {
      const { token } = await http("/auth/login", {
        method: "POST",
        body: { username, password },
      });
      auth.set(token);
      navigate("/");
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 420, paddingTop: "14vh" }}>
      <Card body>
        <h4 className="mb-3">Post Studio</h4>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </Form.Group>
        <Button className="w-100" onClick={submit}>
          Login
        </Button>
      </Card>
    </div>
  );
}
