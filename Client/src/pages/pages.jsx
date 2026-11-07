import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Table,
} from "react-bootstrap";
import { http } from "../api/http.js";

const empty = { name: "", fbPageId: "", token: "", niche: "", dailyLimit: 3 };

export default function Pages() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  const load = () =>
    http("/pages")
      .then(setList)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const add = async () => {
    setError("");
    try {
      await http("/pages", { method: "POST", body: form });
      setForm(empty);
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const toggle = async (p) => {
    await http(`/pages/${p.id}/active`, {
      method: "PATCH",
      body: { active: !p.active },
    });
    load();
  };
  const remove = async (p) => {
    if (confirm(`"${p.name}" মুছবেন?`)) {
      await http(`/pages/${p.id}`, { method: "DELETE" });
      load();
    }
  };

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}
      <Card body className="mb-4">
        <h5>নতুন পেজ যোগ</h5>
        <Row className="g-2">
          <Col md={3}>
            <Form.Control
              placeholder="পেজের নাম"
              value={form.name}
              onChange={set("name")}
            />
          </Col>
          <Col md={3}>
            <Form.Control
              placeholder="Facebook Page ID"
              value={form.fbPageId}
              onChange={set("fbPageId")}
            />
          </Col>
          <Col md={3}>
            <Form.Control
              placeholder="নিস (যেমন Civil War)"
              value={form.niche}
              onChange={set("niche")}
            />
          </Col>
          <Col md={3}>
            <Form.Control
              type="number"
              min={1}
              max={10}
              placeholder="দৈনিক সীমা"
              value={form.dailyLimit}
              onChange={set("dailyLimit")}
            />
          </Col>
          <Col md={12}>
            <Form.Control
              type="password"
              placeholder="Page Access Token (সার্ভারে এনক্রিপ্ট হয়ে থাকবে)"
              value={form.token}
              onChange={set("token")}
            />
          </Col>
          <Col md={12}>
            <Button onClick={add}>যোগ করুন</Button>
          </Col>
        </Row>
      </Card>

      <Table striped responsive>
        <thead>
          <tr>
            <th>নাম</th>
            <th>Page ID</th>
            <th>নিস</th>
            <th>দৈনিক সীমা</th>
            <th>অবস্থা</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.fb_page_id}</td>
              <td>{p.niche}</td>
              <td>{p.daily_limit}</td>
              <td>
                <Badge bg={p.active ? "success" : "secondary"}>
                  {p.active ? "সক্রিয়" : "বন্ধ"}
                </Badge>
              </td>
              <td className="text-end">
                <Button
                  size="sm"
                  variant="outline-secondary"
                  className="me-2"
                  onClick={() => toggle(p)}
                >
                  {p.active ? "বন্ধ" : "চালু"}
                </Button>
                <Button
                  size="sm"
                  variant="outline-danger"
                  onClick={() => remove(p)}
                >
                  মুছুন
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
