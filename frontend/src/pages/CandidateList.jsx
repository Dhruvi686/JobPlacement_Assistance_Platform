import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const CandidateList = () => {
  const [applications, setApplications] = useState([]);
  const [editing, setEditing] = useState({});
  const [remarks, setRemarks] = useState({});
  const [selected, setSelected] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/jobs/applications`);
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        const data = await response.json();
        setApplications(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Handle status update
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/applications/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state
      setApplications(applications.map(app => 
        app._id === id ? { ...app, status: newStatus } : app
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle remarks edit
  const handleEdit = (id, currentRemarks) => {
    setEditing({ ...editing, [id]: true });
    setRemarks({ ...remarks, [id]: currentRemarks || '' });
  };

  // Save remarks
  const handleSaveRemarks = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/jobs/applications/${id}/remarks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: remarks[id] }),
      });

      if (!response.ok) {
        throw new Error('Failed to save remarks');
      }

      // Update local state
      setApplications(applications.map(app => 
        app._id === id ? { ...app, remarks: remarks[id] } : app
      ));
      setEditing({ ...editing, [id]: false });
    } catch (err) {
      setError(err.message);
    }
  };

  // Toggle selection for bulk actions
  const toggleSelect = (id) => {
    setSelected(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Select all/deselect all
  const selectAll = (checked) => {
    if (!checked) {
      setSelected({});
      return;
    }
    const all = {};
    applications.forEach(app => { all[app._id] = true; });
    setSelected(all);
  };

  // Open Gmail with selected recipients
  const openGmailWithRecipients = () => {
    const selectedEmails = applications
      .filter(app => selected[app._id])
      .map(app => app.email)
      .join(',');

    if (selectedEmails.length === 0) {
      alert('Please select at least one candidate.');
      return;
    }

    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedEmails)}`, '_blank');
  };

  // Count selected applications
  const selectedCount = Object.values(selected).filter(Boolean).length;

  // Loading and error states
  if (isLoading) return <div>Loading applications...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ 
      width: '100%', 
      minHeight: '100vh', 
      padding: '20px', 
      boxSizing: 'border-box',
      background: '#f5f5f5'
    }}>
      <div style={{ 
        width: '100%', 
        maxWidth: '100%', 
        margin: '0 auto', 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '8px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <h2 style={{ margin: 0 }}>Candidate List</h2>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {selectedCount > 0 && (
              <button
                onClick={openGmailWithRecipients}
                style={{ 
                  background: '#4CAF50', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>✉️</span>
                Email Selected ({selectedCount})
              </button>
            )}
            <button
              onClick={() => {
                localStorage.removeItem('isUser');
                window.location.href = '/admin-login';
              }}
              style={{ 
                background: '#f44336', 
                color: '#fff', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '4px', 
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <div style={{ 
          width: '100%', 
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            minWidth: '1200px'
          }}>
            <thead>
              <tr>
                <th style={{ 
                  width: '60px', 
                  padding: '12px', 
                  textAlign: 'left', 
                  borderBottom: '1px solid #e0e0e0' 
                }}>
                  <input
                    type="checkbox"
                    onChange={(e) => selectAll(e.target.checked)}
                    checked={applications.length > 0 && applications.every(a => selected[a._id])}
                  />
                </th>
                {[
                  'Name',
                  'Email',
                  'mobile',
                  'qualification',
                  'skills',
                  'Status',
                  'CV',
                  'Remarks',
                  'Actions'
                ].map((header) => (
                  <th 
                    key={header} 
                    style={{ 
                      padding: '12px', 
                      textAlign: 'left', 
                      borderBottom: '1px solid #e0e0e0',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id} style={{ 
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: app.status === 'rejected' ? '#fff5f5' : 
                                 app.status === 'accepted' ? '#f5fff5' : 'white'
                }}>
                  <td style={{ padding: '12px' }}>
                    <input
                      type="checkbox"
                      checked={!!selected[app._id]}
                      onChange={() => toggleSelect(app._id)}
                    />
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    maxWidth: '200px'
                  }}>
                    {app.name}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    whiteSpace: 'nowrap'
                  }}>
                    {app.email}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    whiteSpace: 'nowrap'
                  }}>
                    {app.mobile}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    whiteSpace: 'nowrap'
                  }}>
                    {app.qualification}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    whiteSpace: 'nowrap'
                  }}>
                    {app.skills}
                  </td>
                  <td style={{ 
                    padding: '12px', 
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: 
                        app.status === 'accepted' ? '#e8f5e9' :
                        app.status === 'rejected' ? '#ffebee' : '#e3f2fd',
                      color: 
                        app.status === 'accepted' ? '#2e7d32' :
                        app.status === 'rejected' ? '#c62828' : '#1565c0',
                      fontWeight: '500'
                    }}>
                      {app.status || 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {app.cvUrl ? (
                      <a
                        href={`${API_BASE_URL}/api/jobs/view/${app.cvUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ 
                          color: '#2196F3', 
                          textDecoration: 'none',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        View CV
                      </a>
                    ) : (
                      <span style={{ color: '#9e9e9e' }}>No CV</span>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {editing[app._id] ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          value={remarks[app._id] || ''}
                          onChange={(e) => setRemarks({ 
                            ...remarks, 
                            [app._id]: e.target.value 
                          })}
                          style={{ 
                            padding: '4px 8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            minWidth: '200px'
                          }}
                        />
                        <button
                          onClick={() => handleSaveRemarks(app._id)}
                          style={{ 
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 12px',
                            cursor: 'pointer'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditing({ ...editing, [app._id]: false })}
                          style={{ 
                            background: '#f5f5f5',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            padding: '4px 12px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '200px'
                        }}>
                          {app.remarks || '-'}
                        </span>
                        <button
                          onClick={() => handleEdit(app._id, app.remarks)}
                          style={{ 
                            background: 'none',
                            border: 'none',
                            color: '#2196F3',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Edit remarks"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={() => handleStatusUpdate(app._id, 'accepted')}
                        style={{
                          background: app.status === 'accepted' ? '#4CAF50' : '#e8f5e9',
                          color: app.status === 'accepted' ? 'white' : '#2e7d32',
                          border: '1px solid #c8e6c9',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontWeight: app.status === 'accepted' ? 'bold' : 'normal'
                        }}
                      >
                        {app.status === 'accepted' ? '✓ Accepted' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(app._id, 'rejected')}
                        style={{
                          background: app.status === 'rejected' ? '#f44336' : '#ffebee',
                          color: app.status === 'rejected' ? 'white' : '#c62828',
                          border: '1px solid #ffcdd2',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          fontWeight: app.status === 'rejected' ? 'bold' : 'normal'
                        }}
                      >
                        {app.status === 'rejected' ? '✗ Rejected' : 'Reject'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CandidateList;