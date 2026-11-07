import { Container, Nav, Navbar } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import { auth } from "../api/http.js";

export default function NavBar() {
  const navigate = useNavigate();
  const logout = () => {
    auth.clear();
    navigate("/login");
  };
  return (
    <Navbar bg="dark" data-bs-theme="dark" expand="md">
      <Container>
        <Navbar.Brand>Post Studio</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link as={NavLink} to="/" end>
            Dashboard
          </Nav.Link>
          <Nav.Link as={NavLink} to="/pages">
            Pages
          </Nav.Link>
          <Nav.Link as={NavLink} to="/review">
            Review Queue
          </Nav.Link>
          <Nav.Link as={NavLink} to="/agent">
            Agent
          </Nav.Link>
          <Nav.Link as={NavLink} to="/compose">
            Composer
          </Nav.Link>
          <Nav.Link as={NavLink} to="/posts">
            Posts
          </Nav.Link>
        </Nav>
        <button className="btn btn-outline-light btn-sm" onClick={logout}>
          Logout
        </button>
      </Container>
    </Navbar>
  );
}
