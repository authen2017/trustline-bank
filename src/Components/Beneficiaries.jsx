import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getCurrentUser, updateUser, generateId } from "../utils/storage";

function emptyForm() {
  return { name: "", accountNumber: "", bank: "", nickname: "" };
}

function Beneficiaries() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const current = await getCurrentUser();
        if (!isMounted) return;

        if (!current) {
          navigate("/login");
          return;
        }
        setUser(current);
      } catch (err) {
        console.error(err);
        navigate("/login");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadUser();
    return () => { isMounted = false; };
  }, [navigate]);

  if (loading) {
    return (
      <div className="content-page">
        <div className="content-inner wide">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const resetForm = () => { setForm(emptyForm()); setEditingId(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.accountNumber || !form.bank) {
      return setError("Name, account number and bank are required.");
    }

    setSubmitting(true);
    try {
      const updatedBeneficiaries = editingId
        ? (user.beneficiaries || []).map((b) => (b.id === editingId ? { ...b, ...form } : b))
        : [...(user.beneficiaries || []), { id: generateId("ben"), ...form }];

      const updatedUser = { ...user, beneficiaries: updatedBeneficiaries };
      await updateUser(updatedUser);
      setUser(updatedUser);
      resetForm();
    } catch (err) {
      console.error(err);
      setError("Something went wrong saving this beneficiary. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (b) => {
    setForm({ name: b.name, accountNumber: b.accountNumber, bank: b.bank, nickname: b.nickname || "" });
    setEditingId(b.id);
  };

  const handleDelete = async (id) => {
    try {
      const updatedUser = { ...user, beneficiaries: (user.beneficiaries || []).filter((b) => b.id !== id) };
      await updateUser(updatedUser);
      setUser(updatedUser);
      if (editingId === id) resetForm();
    } catch (err) {
      console.error(err);
      setError("Something went wrong deleting this beneficiary. Please try again.");
    }
  };

  return (
    <div className="content-page">
      <div className="content-inner wide">
        <h2>Beneficiaries</h2>

        <div className="content-card">
          <h3>{editingId ? "Edit beneficiary" : "Add a beneficiary"}</h3>
          {error && <div className="content-error">{error}</div>}
          <form onSubmit={handleSubmit} className="content-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Account Number</label>
              <input type="text" name="accountNumber" value={form.accountNumber} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Bank</label>
              <input type="text" name="bank" value={form.bank} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Nickname (optional)</label>
              <input type="text" name="nickname" value={form.nickname} onChange={handleChange} />
            </div>
            <div className="button-row">
              <button type="submit" className="content-button" disabled={submitting}>
                {submitting ? "Saving..." : editingId ? "Save changes" : "Add beneficiary"}
              </button>
              {editingId && <button type="button" className="content-button secondary" onClick={resetForm} disabled={submitting}>Cancel</button>}
            </div>
          </form>
        </div>

        <div className="content-card">
          <h3>Saved beneficiaries</h3>
          {(!user.beneficiaries || user.beneficiaries.length === 0) ? (
            <p className="simulation-note">No beneficiaries added yet.</p>
          ) : (
            <table className="beneficiary-table">
              <thead>
                <tr><th>Nickname</th><th>Name</th><th>Account Number</th><th>Bank</th><th></th></tr>
              </thead>
              <tbody>
                {(user.beneficiaries || []).map((b) => (
                  <tr key={b.id}>
                    <td>{b.nickname || "—"}</td>
                    <td>{b.name}</td>
                    <td>{b.accountNumber}</td>
                    <td>{b.bank}</td>
                    <td>
                      <button className="btn-link" onClick={() => handleEdit(b)}>Edit</button>{" "}
                      <button className="btn-link" onClick={() => handleDelete(b.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <Link to="/dashboard" className="back-link">← Back to dashboard</Link>
      </div>
    </div>
  );
}

export default Beneficiaries;
