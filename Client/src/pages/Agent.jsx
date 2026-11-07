import { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
} from "react-bootstrap";
import { http } from "../api/http.js";

export default function Agent() {
  const [pages, setPages] = useState([]);
  const [niches, setNiches] = useState([]);
  const [pageId, setPageId] = useState("");
  const [auto, setAuto] = useState(false);
  const [niche, setNiche] = useState("");
  const [tz, setTz] = useState("America/New_York");
  const [slots, setSlots] = useState("09:30, 15:00, 20:30");
  const [extraInclude, setExtraInclude] = useState("");
  const [extraExclude, setExtraExclude] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    http("/pages").then(setPages);
    http("/agent/niches").then(setNiches);
  }, []);

  const split = (s) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  const loadProfile = async (id) => {
    setPageId(id);
    setPreview(null);
    setMsg(null);
    if (!id) return;
    const p = await http(`/agent/profile/${id}`);
    setAuto(!!p.auto);
    setNiche(p.niche || "");
    setTz(p.tz || "America/New_York");
    setSlots((p.slots || ["09:30", "15:00", "20:30"]).join(", "));
    setExtraInclude((p.extraInclude || []).join(", "));
    setExtraExclude((p.extraExclude || []).join(", "));
  };

  const save = async () => {
    setMsg(null);
    try {
      await http(`/agent/profile/${pageId}`, {
        method: "PUT",
        body: {
          auto,
          niche,
          tz,
          slots: split(slots),
          extraInclude: split(extraInclude),
          extraExclude: split(extraExclude),
        },
      });
      setMsg({ v: "success", t: "সংরক্ষিত হয়েছে" });
    } catch (e) {
      setMsg({ v: "danger", t: e.message });
    }
  };

  const run = async (dryRun) => {
    setBusy(true);
    setMsg(null);
    setPreview(null);
    try {
      const r = await http("/agent/run", {
        method: "POST",
        body: { pageId: Number(pageId), dryRun },
      });
      if (r.skipped) setMsg({ v: "warning", t: r.skipped });
      else {
        setPreview(r);
        if (!dryRun)
          setMsg({ v: "success", t: "শিডিউল তৈরি হয়েছে, Posts পেজে দেখুন" });
      }
    } catch (e) {
      setMsg({ v: "danger", t: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Alert variant="info" className="small">
        এজেন্ট আপনার জমানো approved ছবি থেকে নিশ অনুযায়ী ছবি বাছে, উৎসের তথ্য
        দিয়ে লেখা সাজায় এবং খালি স্লটে শিডিউল করে। প্রতি ঘণ্টায় নিজে থেকেও
        চলে। প্রথমে <b>প্রিভিউ</b> দেখে নিন।
      </Alert>
      {msg && <Alert variant={msg.v}>{msg.t}</Alert>}

      <Card body className="mb-4">
        <Row className="g-3">
          <Col md={4}>
            <Form.Label>পেজ</Form.Label>
            <Form.Select
              value={pageId}
              onChange={(e) => loadProfile(e.target.value)}
            >
              <option value="">বাছুন</option>
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Label>নিশ</Form.Label>
            <Form.Select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
            >
              <option value="">বাছুন</option>
              {niches.map((n) => (
                <option key={n.key} value={n.key}>
                  {n.label}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={4}>
            <Form.Label>টাইমজোন (দর্শকের)</Form.Label>
            <Form.Control value={tz} onChange={(e) => setTz(e.target.value)} />
          </Col>
          <Col md={12}>
            <Form.Label>
              পোস্টের সময় (দর্শকের সময় অনুযায়ী, কমা দিয়ে)
            </Form.Label>
            <Form.Control
              value={slots}
              onChange={(e) => setSlots(e.target.value)}
            />
          </Col>
          <Col md={6}>
            <Form.Label>অতিরিক্ত কিওয়ার্ড (যোগ করতে চান)</Form.Label>
            <Form.Control
              value={extraInclude}
              onChange={(e) => setExtraInclude(e.target.value)}
              placeholder="যেমন: bayonet, drum"
            />
          </Col>
          <Col md={6}>
            <Form.Label>বাদ দেওয়ার কিওয়ার্ড</Form.Label>
            <Form.Control
              value={extraExclude}
              onChange={(e) => setExtraExclude(e.target.value)}
              placeholder="যেমন: confederate flag"
            />
          </Col>
          <Col md={12}>
            <Form.Check
              type="switch"
              label="এজেন্ট স্বয়ংক্রিয়ভাবে চলুক"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
            />
          </Col>
          <Col md={12} className="d-flex gap-2 flex-wrap">
            <Button onClick={save} disabled={!pageId || !niche}>
              সংরক্ষণ
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => run(true)}
              disabled={!pageId || busy}
            >
              {busy ? <Spinner size="sm" /> : "প্রিভিউ (কিছু শিডিউল হবে না)"}
            </Button>
            <Button
              variant="outline-success"
              onClick={() => run(false)}
              disabled={!pageId || busy}
            >
              এখনই শিডিউল করুন
            </Button>
          </Col>
        </Row>
      </Card>

      {preview?.log?.length > 0 && (
        <Alert variant="secondary" className="small">
          {preview.log.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </Alert>
      )}
      {preview?.pages?.length === 0 && (
        <p className="text-muted">
          কিছু নেই। "এজেন্ট চলুক" চালু করে সংরক্ষণ করেছেন কি?
        </p>
      )}
      {preview?.pages?.map((p, i) => (
        <div key={i}>
          {p.planned.length === 0 && (
            <p className="text-muted">সব স্লট ইতিমধ্যে ভরা আছে।</p>
          )}
          {p.planned.map((x, j) => (
            <Card key={j} body className="mb-2">
              {x.error ? (
                <Alert variant="warning" className="mb-0">
                  {x.slot}: {x.error}
                </Alert>
              ) : (
                <>
                  <div className="mb-1">
                    <Badge bg="dark" className="me-2">
                      {x.format}
                    </Badge>
                    <strong>{x.asset}</strong>
                    <span className="text-muted small ms-2">
                      স্কোর {x.score} · {x.why} ·{" "}
                      {new Date(x.at).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap" }} className="small">
                    {x.text}
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      ))}
    </>
  );
}
