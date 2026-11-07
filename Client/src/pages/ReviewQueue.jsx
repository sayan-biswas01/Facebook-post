import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Card,
  Col,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import { http } from "../api/http.js";

const VARIANT = { approved: "success", review: "warning", rejected: "danger" };

export default function ReviewQueue() {
  const [status, setStatus] = useState("review");
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("civil war");
  const [limit, setLimit] = useState(10);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const load = () =>
    http(`/assets?status=${status}`)
      .then(setItems)
      .catch((e) => setMsg({ v: "danger", t: e.message }));
  useEffect(() => {
    load();
  }, [status]);

  const fetchNew = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await http("/assets/fetch", {
        method: "POST",
        body: { source: "met", query, limit },
      });
      setMsg({
        v: "info",
        t: `যাচাই: ${r.checked} | approved: ${r.approved} | review: ${r.review} | rejected: ${r.rejected} | ডুপ্লিকেট: ${r.duplicates} | ত্রুটি: ${r.errors}`,
      });
      load();
    } catch (e) {
      setMsg({ v: "danger", t: e.message });
    } finally {
      setBusy(false);
    }
  };

  const decide = async (id, action) => {
    try {
      await http(`/assets/${id}/review`, { method: "PATCH", body: { action } });
      load();
    } catch (e) {
      setMsg({ v: "danger", t: e.message });
    }
  };

  return (
    <>
      <Card body className="mb-3">
        <Row className="g-2 align-items-center">
          <Col md={5}>
            <Form.Control
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="সার্চ (ইংরেজিতে)"
            />
          </Col>
          <Col md={2}>
            <Form.Control
              type="number"
              min={1}
              max={30}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </Col>
          <Col md={5}>
            <Button onClick={fetchNew} disabled={busy}>
              {busy ? <Spinner size="sm" /> : "Met Museum থেকে ছবি আনুন"}
            </Button>
          </Col>
        </Row>
      </Card>

      {msg && <Alert variant={msg.v}>{msg.t}</Alert>}

      <ButtonGroup className="mb-3">
        {["review", "approved", "rejected"].map((s) => (
          <Button
            key={s}
            variant={status === s ? "dark" : "outline-dark"}
            onClick={() => setStatus(s)}
          >
            {s}
          </Button>
        ))}
      </ButtonGroup>

      <Row xs={1} md={3} className="g-3">
        {items.map((a) => (
          <Col key={a.id}>
            <Card className="h-100">
              <Card.Img
                variant="top"
                src={a.image_url}
                style={{ height: 220, objectFit: "cover" }}
                loading="lazy"
              />
              <Card.Body>
                <Card.Title className="fs-6">
                  {a.title || "(শিরোনাম নেই)"}
                </Card.Title>
                <div className="small text-muted">
                  {a.creator} {a.date_text && `· ${a.date_text}`}
                </div>
                <div className="small mt-1">
                  <Badge bg={VARIANT[a.license_status]}>
                    {a.license_status}
                  </Badge>{" "}
                  <code>
                    {a.license_field}={a.license_value}
                  </code>
                </div>
                {a.reject_reason && (
                  <div className="small text-muted mt-1">{a.reject_reason}</div>
                )}
                <a
                  href={a.page_url}
                  target="_blank"
                  rel="noreferrer"
                  className="small"
                >
                  উৎস দেখুন
                </a>
              </Card.Body>
              {a.license_status === "review" && (
                <Card.Footer className="d-flex gap-2">
                  <Button
                    size="sm"
                    variant="success"
                    onClick={() => decide(a.id, "approve")}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => decide(a.id, "reject")}
                  >
                    Reject
                  </Button>
                </Card.Footer>
              )}
            </Card>
          </Col>
        ))}
      </Row>
      {!items.length && <p className="text-muted">এই তালিকায় কিছু নেই।</p>}
    </>
  );
}
