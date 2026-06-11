import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Search, UserCheck, UserPlus, UserX, Clock, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const Networking = () => {
  const [users, setUsers] = useState([]);
  const [pendingIncoming, setPendingIncoming] = useState([]);
  const [pendingOutgoing, setPendingOutgoing] = useState([]);
  const [connectionStatuses, setConnectionStatuses] = useState({}); // userId -> { status, connectionId, isRequester }
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionLoading, setActionLoading] = useState({});

  const fetchData = async () => {
    try {
      const usersData = await api.users.getAll(search, page);
      setUsers(usersData.users);
      setTotalPages(usersData.pages);

      const pendingData = await api.connections.getPending();
      setPendingIncoming(pendingData.incoming);
      setPendingOutgoing(pendingData.outgoing);

      // Fetch connection status for visible users
      const statuses = {};
      await Promise.all(
        usersData.users.map(async (u) => {
          const res = await api.connections.getStatus(u._id);
          statuses[u._id] = res;
        })
      );
      setConnectionStatuses(statuses);
    } catch (err) {
      toast.error(err.message || 'Failed to load directory');
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    load();
  }, [search, page]);

  const handleSendRequest = async (userId) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await api.connections.sendRequest(userId);
      toast.success('Connection request sent!');
      setConnectionStatuses(prev => ({
        ...prev,
        [userId]: { status: 'pending', connectionId: res._id, isRequester: true }
      }));
      // Refresh outgoing
      const pendingData = await api.connections.getPending();
      setPendingOutgoing(pendingData.outgoing);
    } catch (err) {
      toast.error(err.message || 'Failed to send request');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleAcceptRequest = async (connectionId, requesterId) => {
    setActionLoading(prev => ({ ...prev, [requesterId]: true }));
    try {
      await api.connections.accept(connectionId);
      toast.success('Connection request accepted!');
      setConnectionStatuses(prev => ({
        ...prev,
        [requesterId]: { status: 'accepted', connectionId, isRequester: false }
      }));
      // Refresh requests & list
      const pendingData = await api.connections.getPending();
      setPendingIncoming(pendingData.incoming);
    } catch (err) {
      toast.error(err.message || 'Failed to accept request');
    } finally {
      setActionLoading(prev => ({ ...prev, [requesterId]: false }));
    }
  };

  const handleRejectRequest = async (connectionId, requesterId) => {
    setActionLoading(prev => ({ ...prev, [requesterId]: true }));
    try {
      await api.connections.reject(connectionId);
      toast.success('Connection request rejected');
      setConnectionStatuses(prev => ({
        ...prev,
        [requesterId]: { status: 'none', connectionId: null, isRequester: false }
      }));
      // Refresh requests
      const pendingData = await api.connections.getPending();
      setPendingIncoming(pendingData.incoming);
    } catch (err) {
      toast.error(err.message || 'Failed to reject request');
    } finally {
      setActionLoading(prev => ({ ...prev, [requesterId]: false }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight m-0 bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
          Professional Networking
        </h1>
        <p className="text-gray-400 mt-1">Connect with professional attendees and expand your network.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left 3 Cols: Directory */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search by name, profession or company..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="glass-input pl-10 pr-4 py-3 rounded-xl w-full text-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Spinner size="lg" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-2xl p-8 border border-white/5">
              <Users className="w-16 h-16 text-indigo-500/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Users Found</h3>
              <p className="text-gray-400 max-w-sm mx-auto">
                No attendees match your search query. Try typing another name or profession.
              </p>
            </div>
          ) : (
            <>
              {/* Users Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.map((u) => {
                  const connInfo = connectionStatuses[u._id] || { status: 'none' };
                  const isActionLoading = actionLoading[u._id];

                  return (
                    <Card key={u._id} hoverEffect={true} className="p-5 flex flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {u.profilePicture ? (
                          <img
                            src={u.profilePicture}
                            alt={u.name}
                            className="w-12 h-12 rounded-full object-cover shrink-0 border border-white/10"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <Link
                            to={`/user/${u._id}`}
                            className="text-base font-bold text-white hover:text-indigo-400 transition truncate block"
                          >
                            {u.name}
                          </Link>
                          {u.profession && (
                            <p className="text-xs text-gray-400 truncate mt-0.5">
                              {u.profession} at {u.company}
                            </p>
                          )}
                          {u.lookingFor && u.lookingFor.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-2">
                              {u.lookingFor.slice(0, 2).map((interest, idx) => (
                                <span key={idx} className="text-[10px] bg-indigo-500/10 border border-indigo-500/10 text-indigo-300 rounded px-1.5 py-0.5">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Connection Actions */}
                      <div className="shrink-0">
                        {connInfo.status === 'accepted' ? (
                          <span className="text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-lg px-3 py-1.5 font-bold flex items-center gap-1">
                            <UserCheck size={14} />
                            <span>Connected</span>
                          </span>
                        ) : connInfo.status === 'pending' ? (
                          connInfo.isRequester ? (
                            <span className="text-xs text-gray-400 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 font-bold flex items-center gap-1">
                              <Clock size={14} />
                              <span>Sent</span>
                            </span>
                          ) : (
                            <div className="flex gap-1.5">
                              <Button
                                variant="primary"
                                size="sm"
                                className="px-2.5 py-1.5 text-xs font-bold"
                                onClick={() => handleAcceptRequest(connInfo.connectionId, u._id)}
                                loading={isActionLoading}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="px-2.5 py-1.5 text-xs font-bold"
                                onClick={() => handleRejectRequest(connInfo.connectionId, u._id)}
                                loading={isActionLoading}
                              >
                                Ignore
                              </Button>
                            </div>
                          )
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs font-bold py-1.5 px-3 flex items-center gap-1.5"
                            onClick={() => handleSendRequest(u._id)}
                            loading={isActionLoading}
                          >
                            <UserPlus size={14} />
                            <span>Connect</span>
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-semibold text-gray-300">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="secondary"
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right 1 Col: Pending Invitations List */}
        <div className="space-y-6">
          <Card hoverEffect={false} className="p-5">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-white/10 pb-2 flex items-center gap-1.5">
              <span>Invitations</span>
              {pendingIncoming.length > 0 && (
                <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingIncoming.length}
                </span>
              )}
            </h3>

            {pendingIncoming.length === 0 ? (
              <p className="text-xs text-gray-400">No pending invitations.</p>
            ) : (
              <div className="space-y-3">
                {pendingIncoming.map((req) => (
                  <div key={req._id} className="p-3 bg-white/5 border border-white/5 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      {req.requester.profilePicture ? (
                        <img
                          src={req.requester.profilePicture}
                          alt={req.requester.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm">
                          {req.requester.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link to={`/user/${req.requester._id}`} className="text-xs font-bold text-white hover:text-indigo-400 transition truncate block">
                          {req.requester.name}
                        </Link>
                        <p className="text-[10px] text-gray-400 truncate">{req.requester.profession}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleAcceptRequest(req._id, req.requester._id)}
                        className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req._id, req.requester._id)}
                        className="text-[10px] font-bold text-rose-400 hover:text-rose-300 transition"
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Networking;
