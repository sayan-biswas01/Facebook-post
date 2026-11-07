import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Form, Row } from "react-bootstrap";
import { http } from "../api/http.js";

const MIN = 80;

export default function Composer() {
  const [pages, setPages] = useState([]);
  const [assets, setAssets] = useState([]);
  const [pageId, setPageId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [text, setText] = useState("");
  const [when, setWhen] = useState("");
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    http("/pages").then(setPages);
    http("/assets?status=approved").then(setAssets);
  }, []);

  const asset = assets.find((a) => String(a.id) === String(assetId));

  const submit = async () => {
    setMsg(null);
    try {
      await http("/posts", {
        method: "POST",
        body: {
          pageId,
          assetId,
          scriptText: text,
          scheduledAt: new Date(when).toISOString(),
        },
      });
      setMsg({ v: "success", t: "শিডিউল হয়েছে" });
      setText("");
      setAssetId("");
      http("/assets?status=approved").then(setAssets);
    } catch (e) {
      setMsg({
        v: "danger",
        t: e.message.includes("Invalid time") ? "সময় বাছুন" : e.message,
      });
    }
  };

  return (
    <Row>
      <Col md={7}>
        {msg && <Alert variant={msg.v}>{msg.t}</Alert>}
        <Form.Group className="mb-3">
          <Form.Label>পেজ</Form.Label>
          <Form.Select
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
          >
            <option value="">বাছুন</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>ছবি (শুধু approved)</Form.Label>
          <Form.Select
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
          >
            <option value="">বাছুন</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title || a.source_id} ({a.source})
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>
            আপনার নিজের লেখা ({text.length}/{MIN}+)
          </Form.Label>
          <Form.Control
            as="textarea"
            rows={8}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="ছবির পেছনের গল্প নিজের ভাষায় লিখুন। অন্যের লেখা কপি করবেন না।"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>পোস্টের সময়</Form.Label>
          <Form.Control
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />
        </Form.Group>
        <Button
          onClick={submit}
          disabled={!pageId || !assetId || text.trim().length < MIN || !when}
        >
          শিডিউল করুন
        </Button>
      </Col>
      <Col md={5}>
        {asset && (
          <Card>
            <Card.Img variant="top" src={asset.image_url} />
            <Card.Body className="small">
              <strong>{asset.title}</strong>
              <br />
              {asset.creator} {asset.date_text && `· ${asset.date_text}`}
            </Card.Body>
          </Card>
        )}
      </Col>
    </Row>
  );
}
