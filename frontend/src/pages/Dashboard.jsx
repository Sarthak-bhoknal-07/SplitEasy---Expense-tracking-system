import React, {useEffect, useState} from "react";
import api from "../services/api";
import {Link} from "react-router-dom";

const Dashboard = () => {
  const [groups, setGroups] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDesc, setNewGroupDesc] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const response = await api.get("/groups");
      setGroups(response.data);
    } catch (error) {
      console.error("Error fetching groups", error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post("/groups", {
        name: newGroupName,
        description: newGroupDesc,
      });
      setMessage("Group created successfully!");
      setNewGroupName("");
      setNewGroupDesc("");
      fetchGroups();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to create group.");
    }
  };

  return (
    <div className="container py-4">
      <div className="mb-5">
        <h2 className="fw-bold">Hi, {currentUser?.name}! 👋</h2>
        <p className="text-muted">Manage your shared expenses and groups here.</p>
      </div>

      <div className="row">
        <div className="col-md-8">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold mb-0">Your Groups</h4>
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle">{groups.length} Groups</span>
          </div>

          {loading ? (
             <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
          ) : (
            <div className="row g-4">
              {groups.length === 0 && (
                <div className="col-12 text-center py-5 bg-white rounded shadow-sm">
                   <div className="display-1 text-light mb-3"><i className="bi bi-people"></i></div>
                   <h5>No groups found</h5>
                   <p className="text-muted">Create a group to start tracking expenses with friends.</p>
                </div>
              )}
              {groups.map((group) => (
                <div key={group.id} className="col-md-6">
                  <div className="card h-100 dashboard-card border-0 shadow-sm p-3">
                    <div className="card-body d-flex flex-column p-2">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="bg-primary-subtle text-primary rounded p-2 mb-2 d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px'}}>
                           <i className="bi bi-collection-fill"></i>
                        </div>
                        <div className="text-end">
                            <span className="badge bg-light text-muted border d-block mb-1">{group.members.length} members</span>
                            <div className={`badge rounded-pill ${group.userBalance >= 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                              {group.userBalance >= 0 ? 'You are owed' : 'You owe'}
                            </div>
                        </div>
                      </div>
                      <h5 className="fw-bold mb-1">{group.name}</h5>
                      <div className="mb-3">
                        <div className="small text-muted mb-1">Your Balance:</div>
                        <div className={`fw-bold h5 mb-0 ${group.userBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                          {group.userBalance >= 0 ? "+" : ""}₹{group.userBalance?.toFixed(2)}
                        </div>
                        <div className="small text-muted mt-2">Group Total: ₹{group.totalExpense?.toFixed(2)}</div>
                      </div>
                      <p className="text-muted small mb-4 flex-grow-1">{group.description || "No description provided."}</p>
                      <Link to={`/groups/${group.id}`} className="btn btn-primary w-100 py-2 mt-auto shadow-sm">
                        Open Group <i className="bi bi-arrow-right ms-2"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border-0 sticky-top" style={{top: '20px'}}>
            <div className="card-header bg-white border-0 py-3">
              <h5 className="fw-bold mb-0">Create New Group</h5>
            </div>
            <div className="card-body pt-0">
              <form onSubmit={createGroup}>
                <div className="form-group mb-3">
                  <label className="small fw-bold text-muted mb-1">Group Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Roommates, Goa Trip"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group mb-4">
                  <label className="small fw-bold text-muted mb-1">Description (Optional)</label>
                  <textarea
                    className="form-control"
                    placeholder="What is this group for?"
                    rows="3"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                  ></textarea>
                </div>
                <button className="btn btn-success w-100 py-2 fw-bold shadow-sm">
                   Create Group
                </button>
                {message && <div className="alert alert-info mt-3 small border-0 shadow-sm">{message}</div>}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
