import { Link } from "react-router-dom";
import { Container, Navbar, NavbarBrand } from "reactstrap";

export default function AppBar({ title }) {
  return (
    <Navbar>
      <Container>
        <NavbarBrand style={{ textDecoration: "none" }}>{title}</NavbarBrand>
      </Container>
    </Navbar>
  );
}
