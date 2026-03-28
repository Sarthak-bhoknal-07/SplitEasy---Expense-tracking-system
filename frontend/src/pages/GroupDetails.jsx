import React, {useEffect, useState} from "react";
import {useParams} from "react-router-dom";
import api from "../services/api";
import {Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend} from 'chart.js';
import {Bar} from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const GroupDetails = () => {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [debts, setDebts] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [newExpense, setNewExpense] = useState({ title: "", amount: "", currency: "INR", paidBy: { id: "" } });
  const [customSplits, setCustomSplits] = useState([]);
  const [isCustomSplit, setIsCustomSplit] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [settlementData, setSettlementData] = useState({ from: "", to: "", amount: "" });
  const [message, setMessage] = useState("");
  const [chartData, setChartData] = useState(null);

  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchGroup();
    fetchExpenses();
    fetchBalances();
    fetchDebts();
    fetchSettlements();
    fetchAnalytics();
    fetchSummary();
  }, [id]);

  const fetchSummary = async () => {
    try {
      const response = await api.get(`/analytics/group/${id}/summary`);
      setSummary(response.data);
    } catch (error) {
      console.error("Error fetching summary", error);
    }
  };

  const fetchGroup = async () => {
    try {
      const response = await api.get(`/groups/${id}`);
      setGroup(response.data);
      const initialSplits = response.data.members.map(m => ({ user: m, amount: 0 }));
      setCustomSplits(initialSplits);
      if (response.data.members.length > 0) {
          setNewExpense(prev => ({ ...prev, paidBy: { id: response.data.members[0].id } }));
      }
    } catch (error) {
      console.error("Error fetching group", error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await api.get(`/expenses/group/${id}`);
      setExpenses(response.data);
    } catch (error) {
      console.error("Error fetching expenses", error);
    }
  };

  const fetchBalances = async () => {
    try {
      const response = await api.get(`/groups/${id}/balances`);
      setBalances(response.data);
    } catch (error) {
      console.error("Error fetching balances", error);
    }
  };

  const fetchDebts = async () => {
    try {
      const response = await api.get(`/groups/${id}/debts`);
      setDebts(response.data);
    } catch (error) {
      console.error("Error fetching debts", error);
    }
  };

  const fetchSettlements = async () => {
    try {
      const response = await api.get(`/settlements/group/${id}`);
      setSettlements(response.data);
    } catch (error) {
      console.error("Error fetching settlements", error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get(`/analytics/group/${id}/monthly`);
      const data = response.data;
      setChartData({
        labels: Object.keys(data),
        datasets: [{
          label: 'Monthly Expenses (INR)',
          data: Object.values(data),
          backgroundColor: 'rgba(24, 119, 242, 0.6)',
          borderColor: '#1877f2',
          borderWidth: 1,
          borderRadius: 4,
        }]
      });
    } catch (error) {
      console.error("Error fetching analytics", error);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post(`/groups/${id}/members`, { email: newMemberEmail });
      setMessage("Member added!");
      setNewMemberEmail("");
      fetchGroup();
      fetchBalances();
      fetchDebts();
    } catch (error) {
      setMessage("Failed to add member: " + (error.response?.data?.message || "User not found"));
    }
  };

  const addExpense = async (e) => {
    e.preventDefault();
    const expenseData = {
      ...newExpense,
      amount: parseFloat(newExpense.amount),
      paidBy: { id: parseInt(newExpense.paidBy.id) },
      splits: isCustomSplit ? customSplits.filter(s => s.amount > 0) : []
    };
    
    if (isNaN(expenseData.amount) || expenseData.amount <= 0) {
       setMessage("Please enter a valid amount");
       return;
    }

    try {
      await api.post(`/expenses/group/${id}`, expenseData);
      setMessage("Expense added!");
      setNewExpense({ ...newExpense, title: "", amount: "" });
      setIsCustomSplit(false);
      fetchExpenses();
      fetchBalances();
      fetchDebts();
      fetchAnalytics();
      fetchSummary();
    } catch (error) {
      setMessage("Failed: " + (error.response?.data?.message || error.message));
    }
  };

  const removeMember = async (userId) => {
    if(!window.confirm("Remove this member?")) return;
    try {
        await api.delete(`/groups/${id}/members/${userId}`);
        fetchGroup();
        fetchBalances();
        fetchDebts();
        fetchSummary();
    } catch (error) {
        alert(error.response?.data?.message || "Failed to remove member");
    }
  };

  const handleSettlement = async (e) => {
    e.preventDefault();
    if (!settlementData.from || !settlementData.to || !settlementData.amount) {
       setMessage("Please fill all settlement fields");
       return;
    }
    if (settlementData.from === settlementData.to) {
       setMessage("Cannot record settlement between the same person");
       return;
    }
    const amount = parseFloat(settlementData.amount);
    if (isNaN(amount) || amount <= 0) {
       setMessage("Please enter a valid amount");
       return;
    }
    
    try {
      const data = {
        from: { id: parseInt(settlementData.from) },
        to: { id: parseInt(settlementData.to) },
        amount: amount
      };
      await api.post(`/settlements/group/${id}`, data);
      setMessage("Settlement recorded successfully!");
      setSettlementData({ from: "", to: "", amount: "" });
      fetchBalances();
      fetchDebts();
      fetchSettlements();
      fetchSummary();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("Failed to record settlement: " + (error.response?.data?.message || "Unknown error"));
    }
  };

  const deleteExpense = async (expenseId) => {
    if(!window.confirm("Delete this expense?")) return;
    try {
        await api.delete(`/expenses/${expenseId}`);
        fetchExpenses();
        fetchBalances();
        fetchDebts();
        fetchAnalytics();
        fetchSummary();
    } catch (error) {
        alert(error.response?.data?.message || "Failed to delete expense");
    }
  };

  const exportCSV = async () => {
    try {
      const response = await api.get(`/expenses/group/${id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${group.name}_expenses.csv`);
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error("Error exporting CSV", error);
    }
  };

  const updateCustomSplit = (userId, amount) => {
    const updated = customSplits.map(s => s.user.id === userId ? { ...s, amount: parseFloat(amount) || 0 } : s);
    setCustomSplits(updated);
  };

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const myBalance = balances.find(b => b.user.email === currentUser?.email)?.balance || 0;

  if (!group) return <div className="d-flex justify-content-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2">
        <div>
          <h2 className="fw-bold mb-1">{group.name}</h2>
          <p className="text-muted small mb-0"><i className="bi bi-info-circle me-1"></i>{group.description || "Share expenses easily"}</p>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <button onClick={exportCSV} className="btn btn-outline-primary btn-sm shadow-sm">
             <i className="bi bi-download me-1"></i> Export CSV
          </button>
        </div>
      </div>

      <div className="row mb-4 g-3">
          <div className="col-md-3">
              <div className="card h-100 border-0 shadow-sm summary-card">
                  <div className="card-body">
                      <h6 className="text-muted small fw-bold text-uppercase mb-2">Total Expenses</h6>
                      <h3 className="mb-0 fw-bold">{summary?.totalExpense?.toFixed(2) || "0.00"} <small className="text-muted" style={{fontSize: '0.9rem'}}>INR</small></h3>
                      <div className="text-muted small mt-1">≈ ${(summary?.totalExpense / 83.20).toFixed(2)}</div>
                  </div>
              </div>
          </div>
          <div className="col-md-3">
              <div className="card h-100 border-0 shadow-sm summary-card">
                  <div className="card-body">
                      <h6 className="text-muted small fw-bold text-uppercase mb-2">You Paid</h6>
                      <h3 className="mb-0 fw-bold">{summary?.userPaid?.toFixed(2) || "0.00"} <small className="text-muted" style={{fontSize: '0.9rem'}}>INR</small></h3>
                      <div className="text-muted small mt-1">≈ ${(summary?.userPaid / 83.20).toFixed(2)}</div>
                  </div>
              </div>
          </div>
          <div className="col-md-3">
              <div className="card h-100 border-0 shadow-sm summary-card">
                  <div className="card-body">
                      <h6 className="text-muted small fw-bold text-uppercase mb-2">Your Share</h6>
                      <h3 className="mb-0 fw-bold">{summary?.userShare?.toFixed(2) || "0.00"} <small className="text-muted" style={{fontSize: '0.9rem'}}>INR</small></h3>
                      <div className="text-muted small mt-1">≈ ${(summary?.userShare / 83.20).toFixed(2)}</div>
                  </div>
              </div>
          </div>
          <div className="col-md-3">
              <div className={`card h-100 border-0 shadow-sm summary-card ${myBalance >= 0 ? 'positive' : 'negative'}`}>
                  <div className="card-body">
                      <h6 className="text-muted small fw-bold text-uppercase mb-2">Net Balance</h6>
                      <h3 className={`mb-0 fw-bold ${myBalance >= 0 ? 'text-success' : 'text-danger'}`}>
                        {myBalance >= 0 ? "+" : ""}{myBalance.toFixed(2)} <small style={{fontSize: '0.9rem'}}>INR</small>
                      </h3>
                      <div className="text-muted small mt-1">≈ {myBalance >= 0 ? "+" : "-"}${(Math.abs(myBalance) / 83.20).toFixed(2)}</div>
                  </div>
              </div>
          </div>
      </div>
      
      <div className="row">
        {/* Sidebar */}
        <div className="col-md-4">
          <div className="card shadow-sm mb-4">
            <div className="card-header border-0 bg-white fw-bold py-3"><i className="bi bi-arrow-repeat me-2 text-primary"></i>Simplified Debts</div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {debts.length === 0 && <li className="list-group-item text-center py-4 text-muted small">All balances are settled!</li>}
                {debts.map((d, i) => (
                  <li key={i} className="list-group-item small py-3">
                    <div className="d-flex align-items-center mb-1">
                        <span className="text-danger fw-bold">{d.from.name}</span>
                        <span className="mx-2 text-muted">owes</span>
                        <span className="text-success fw-bold">{d.to.name}</span>
                    </div>
                    <div className="h5 mb-0 fw-bold text-dark">
                      ₹{d.amount.toFixed(2)}
                    </div>
                    {d.originalCurrency !== 'INR' && (
                      <div className="text-muted small">
                        (≈ {d.originalAmount?.toFixed(2)} {d.originalCurrency})
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header border-0 bg-white fw-bold py-3"><i className="bi bi-people me-2 text-primary"></i>Members</div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {balances.map((b) => (
                  <li key={b.user.id} className="list-group-item py-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                            <div className="avatar me-3 bg-light text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{width: '32px', height: '32px', fontSize: '0.8rem'}}>
                                {b.user.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="fw-bold small">{b.user.name} {b.user.email === currentUser?.email && "(You)"}</div>
                                {group.owner.id === b.user.id && <span className="text-muted" style={{fontSize: '0.65rem'}}>Group Owner</span>}
                            </div>
                        </div>
                        <div className="text-end">
                            <div className={`small fw-bold ${b.balance >= 0 ? "text-success" : "text-danger"}`}>
                              {b.balance >= 0 ? "+" : ""}₹{b.balance.toFixed(2)}
                            </div>
                            {group.owner.email === currentUser?.email && group.owner.id !== b.user.id && (
                                <button onClick={() => removeMember(b.user.id)} className="btn btn-link btn-sm text-danger text-decoration-none p-0 mt-1" style={{fontSize: '0.65rem'}}>Remove</button>
                            )}
                        </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header border-0 bg-white fw-bold py-3">Invite Member</div>
            <div className="card-body">
              <form onSubmit={addMember}>
                <div className="input-group input-group-sm">
                    <input
                      type="email"
                      placeholder="friend@email.com"
                      className="form-control"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      required
                    />
                    <button className="btn btn-primary px-3">Add</button>
                </div>
              </form>
            </div>
          </div>

          <div className="card shadow-sm mb-4">
            <div className="card-header border-0 bg-white fw-bold py-3">Record Settlement</div>
            <div className="card-body">
              <form onSubmit={handleSettlement}>
                <select className="form-select form-select-sm mb-2" value={settlementData.from} onChange={(e) => setSettlementData({...settlementData, from: e.target.value})} required>
                   <option value="">Who paid?</option>
                   {group.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <select className="form-select form-select-sm mb-2" value={settlementData.to} onChange={(e) => setSettlementData({...settlementData, to: e.target.value})} required>
                   <option value="">Paid to whom?</option>
                   {group.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <div className="input-group input-group-sm mb-3">
                    <span className="input-group-text">INR</span>
                    <input type="number" step="0.01" className="form-control" placeholder="0.00" value={settlementData.amount} onChange={(e) => setSettlementData({...settlementData, amount: e.target.value})} required />
                </div>
                <button className="btn btn-success btn-sm w-100 fw-bold">Record Payment</button>
              </form>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-md-8">
          <div className="card shadow-sm mb-4">
            <div className="card-header border-0 bg-white fw-bold py-3"><i className="bi bi-plus-circle me-2 text-primary"></i>Add New Expense</div>
            <div className="card-body">
              <form onSubmit={addExpense}>
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="small fw-bold text-muted mb-1">Paid By</label>
                    <select className="form-select" value={newExpense.paidBy.id} onChange={(e) => setNewExpense({ ...newExpense, paidBy: { id: e.target.value } })} required>
                       {group.members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="small fw-bold text-muted mb-1">Description</label>
                    <input type="text" className="form-control" placeholder="e.g. Dinner, Grocery..." value={newExpense.title} onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })} required />
                  </div>
                  <div className="col-md-3">
                    <label className="small fw-bold text-muted mb-1">Amount</label>
                    <input type="number" step="0.01" className="form-control" placeholder="0.00" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} required />
                  </div>
                  <div className="col-md-3">
                    <label className="small fw-bold text-muted mb-1">Currency</label>
                    <select className="form-select" value={newExpense.currency} onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}>
                       <option value="INR">INR</option>
                       <option value="USD">USD</option>
                       <option value="EUR">EUR</option>
                       <option value="GBP">GBP</option>
                       <option value="CAD">CAD</option>
                       <option value="AUD">AUD</option>
                       <option value="JPY">JPY</option>
                       <option value="CHF">CHF</option>
                       <option value="CNY">CNY</option>
                       <option value="SGD">SGD</option>
                       <option value="HKD">HKD</option>
                       <option value="NZD">NZD</option>
                       <option value="SEK">SEK</option>
                       <option value="NOK">NOK</option>
                       <option value="DKK">DKK</option>
                       <option value="AED">AED</option>
                       <option value="SAR">SAR</option>
                       <option value="ZAR">ZAR</option>
                       <option value="THB">THB</option>
                    </select>
                  </div>
                </div>
                <div className="text-muted" style={{fontSize: '0.65rem', marginTop: '5px'}}>
                  * All balances are calculated in INR using live exchange rates
                </div>

                <div className="form-check mt-3 mb-3">
                  <input className="form-check-input" type="checkbox" checked={isCustomSplit} onChange={(e) => setIsCustomSplit(e.target.checked)} id="customSplitCheck" />
                  <label className="form-check-label small fw-bold" htmlFor="customSplitCheck">Split unequally</label>
                </div>

                {isCustomSplit && (
                  <div className="mt-2 border-0 p-3 rounded bg-light shadow-sm">
                    <h6 className="small fw-bold mb-3">Custom Splits ({newExpense.currency})</h6>
                    {customSplits.map(s => (
                      <div key={s.user.id} className="d-flex align-items-center mb-2">
                        <span className="flex-grow-1 small">{s.user.name}</span>
                        <div className="input-group input-group-sm w-50">
                            <input type="number" step="0.01" className="form-control" placeholder="0" value={s.amount} onChange={(e) => updateCustomSplit(s.user.id, e.target.value)} />
                            <span className="input-group-text">{newExpense.currency}</span>
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 small text-end pt-2 border-top">
                       Total Split: <span className={Math.abs(customSplits.reduce((sum, s) => sum + s.amount, 0) - parseFloat(newExpense.amount || 0)) < 0.01 ? "text-success fw-bold" : "text-danger fw-bold"}>
                           {customSplits.reduce((sum, s) => sum + s.amount, 0).toFixed(2)}
                       </span> / {newExpense.amount || 0}
                    </div>
                  </div>
                )}

                <button className="btn btn-primary mt-3 w-100 py-2 fw-bold shadow-sm">Save Expense</button>
              </form>
              {message && <div className={`alert mt-3 small shadow-sm border-0 ${message.includes('Failed') || message.includes('Please') ? 'alert-danger' : 'alert-success'}`}>{message}</div>}
            </div>
          </div>

          {chartData && (
            <div className="card shadow-sm mb-4">
              <div className="card-header border-0 bg-white fw-bold py-3">Spending Trends</div>
              <div className="card-body">
                <Bar data={chartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
              </div>
            </div>
          )}

          <div className="card shadow-sm mb-4">
            <div className="card-header border-0 bg-white fw-bold py-3"><i className="bi bi-list-ul me-2 text-primary"></i>Recent Activity</div>
            <div className="card-body p-0">
                <ul className="list-group list-group-flush">
                  {expenses.length === 0 && <li className="list-group-item text-center py-5 text-muted small">No expenses yet. Start by adding one!</li>}
                  {[...expenses].reverse().map((expense) => (
                    <li key={expense.id} className="list-group-item py-3 expense-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1 fw-bold">{expense.title}</h6>
                          <div className="small text-muted mb-2">
                            Paid by <span className="fw-bold text-dark">{expense.paidBy.name}</span> on {expense.date}
                          </div>
                          <div className="d-flex flex-wrap gap-2 mt-1">
                            {expense.splits.map(s => (
                               <span key={s.id} className="text-muted" style={{fontSize: '0.75rem'}}>
                                 <i className="bi bi-person me-1"></i>
                                 {s.user.name}: <strong>₹{s.amount?.toFixed(2)}</strong>
                                 {expense.originalCurrency !== 'INR' && (
                                   <span className="ms-1 text-muted" style={{fontSize: '0.65rem'}}>
                                     (≈ {s.originalAmount?.toFixed(2)} {expense.originalCurrency})
                                   </span>
                                 )}
                               </span>
                            ))}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="h5 mb-0 fw-bold text-primary">
                            ₹{expense.amount.toFixed(2)}
                          </div>
                          {expense.originalCurrency !== 'INR' && (
                              <div className="text-muted" style={{fontSize: '0.75rem'}}>
                                (≈ {expense.originalAmount.toFixed(2)} {expense.originalCurrency})
                              </div>
                          )}
                          <div className="mt-2">
                            <button onClick={() => deleteExpense(expense.id)} className="btn btn-link btn-sm text-danger text-decoration-none p-0" style={{fontSize: '0.7rem'}}>
                                <i className="bi bi-trash me-1"></i>Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
            </div>
          </div>
          
          <div className="card shadow-sm mb-4">
            <div className="card-header border-0 bg-white fw-bold py-3">Settlement History</div>
            <div className="card-body p-0">
                <ul className="list-group list-group-flush">
                  {settlements.length === 0 && <li className="list-group-item text-center py-4 text-muted small">No settlements recorded yet.</li>}
                  {[...settlements].reverse().map((s) => (
                    <li key={s.id} className="list-group-item py-2 small border-0">
                      <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-success-subtle p-1 me-2 d-flex align-items-center justify-content-center" style={{width: '24px', height: '24px'}}>
                            <i className="bi bi-check text-success" style={{fontSize: '0.8rem'}}></i>
                          </div>
                          <span className="flex-grow-1"><strong>{s.from.name}</strong> paid <strong>{s.to.name}</strong> <span className="fw-bold text-success">{s.amount.toFixed(2)} INR</span></span>
                          <span className="text-muted" style={{fontSize: '0.65rem'}}>{s.date}</span>
                      </div>
                    </li>
                  ))}
                </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;

