import { useEffect, useState } from "react";
import { Alert, Badge, Button, Table } from "react-bootstrap";
import { http } from "../api/http.js";

const VARIANT = {
  scheduled: "info",
  posted: "success",
  failed: "danger",
  cancelled: "secondary",
};

export default function Posts() {
  const [list, setList] = useState([]);
  const [error, setError] = useState("");
  const load = () =>
    http("/posts")
      .then(setList)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    await http(`/posts/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}
      <Table striped responsive>
        <thead>
          <tr>
            <th>পেজ</th>
            <th>ছবি</th>
            <th>সময়</th>
            <th>অবস্থা</th>
            <th>ত্রুটি</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id}>
              <td>{p.page_name}</td>
              <td>{p.asset_title}</td>
              <td>{new Date(p.scheduled_at).toLocaleString()}</td>
              <td>
                <Badge bg={VARIANT[p.status]}>{p.status}</Badge>
              </td>
              <td className="small text-danger">{p.error}</td>
              <td>
                {p.status === "scheduled" && (
                  <Button
                    size="sm"
                    variant="outline-danger"
                    onClick={() => cancel(p.id)}
                  >
                    বাতিল
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
}
