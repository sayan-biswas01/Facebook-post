import { useEffect, useState } from "react";
import { Alert, Badge, Button, Card, Col, Row, Table } from "react-bootstrap";
import { http } from "../api/http.js";

const Stat = ({ label, value, variant = "secondary" }) => (
  <Col xs={6} md={3} className="mb-3">
    <Card body className="text-center">
      <div className="fs-3">{value}</div>
      <Badge bg={variant}>{label}</Badge>
    </Card>
  </Col>
);

export default function Dashboard() {
  const [s, setS] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setS(await http("/system/status"));
      setLogs(await http("/system/logs"));
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const toggle = async () => {
    await http("/system/kill-switch", {
      method: "POST",
      body: { on: !s.killSwitch },
    });
    load();
  };

  const cleanNow = async () => {
    const r = await http("/system/cleanup", { method: "POST" });
    alert(
      `পরিষ্কার হয়েছে: ${r.freedMB} MB খালি | পোস্ট হওয়া ${r.postedFiles}, বাড়তি ${r.poolTrimmed}, এতিম ${r.orphans}`,
    );
    load();
  };

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!s) return <p>Loading...</p>;

  return (
    <>
      <Alert
        variant={s.killSwitch ? "danger" : "success"}
        className="d-flex justify-content-between align-items-center"
      >
        <span>
          {s.killSwitch
            ? "Kill switch চালু: কোনো পোস্ট যাবে না"
            : "পোস্টিং চালু আছে"}
        </span>
        <Button
          size="sm"
          variant={s.killSwitch ? "success" : "danger"}
          onClick={toggle}
        >
          {s.killSwitch ? "পোস্টিং চালু করুন" : "সব পোস্ট বন্ধ করুন"}
        </Button>
      </Alert>

      <Row>
        <Stat label="Pages" value={s.pages} />
        <Stat
          label="Approved ছবি"
          value={s.assets.approved}
          variant="success"
        />
        <Stat label="Review বাকি" value={s.assets.review} variant="warning" />
        <Stat label="Rejected" value={s.assets.rejected} variant="danger" />
        <Stat label="Scheduled" value={s.posts.scheduled} variant="info" />
        <Stat label="Posted" value={s.posts.posted} variant="success" />
        <Stat label="Failed" value={s.posts.failed} variant="danger" />
        <Stat label={`মিডিয়া MB (${s.media.files} ফাইল)`} value={s.media.mb} />
      </Row>
      <Button size="sm" variant="outline-secondary" onClick={cleanNow}>
        পুরোনো ফাইল এখনই মুছুন
      </Button>

      <h5 className="mt-3">সাম্প্রতিক লগ</h5>
      <Table size="sm" striped>
        <thead>
          <tr>
            <th>সময় (UTC)</th>
            <th>ঘটনা</th>
            <th>বিবরণ</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((l) => (
            <tr key={l.id}>
              <td>{l.time}</td>
              <td>{l.action}</td>
              <td className="text-break">{l.details}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
